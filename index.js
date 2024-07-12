const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const Redis = require('redis');

const app = express();
app.use(bodyParser.json());

// Postgres setup
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'article_management',
  password: 'root',
  port: 5432,
});

// Redis setup
const redisClient = Redis.createClient();

redisClient.on('error', (err) => {
  console.log('Redis error: ', err);
});

// Middleware to check if article views/likes are cached
const checkCache = async (req, res, next) => {
  const { articleId } = req.params;

  redisClient.hgetall(articleId, (err, data) => {
    if (err) throw err;

    if (data !== null) {
      res.send(data);
    } else {
      next();
    }
  });
};

// Routes
app.post('/articles', async (req, res) => {
    const { title, author, body } = req.body;
  
    if (!title || !author || !body) {
      return res.status(400).json({ error: 'Title, author, and body are required' });
    }
  
    try {
      const newArticle = await pool.query(
        'INSERT INTO articles (title, author, body) VALUES ($1, $2, $3) RETURNING *',
        [title, author, body]
      );
  
      res.status(201).json(newArticle.rows[0]);
    } catch (err) {
      console.error('Error creating article:', err);
      res.status(500).send('Server Error');
    }
  });

app.post('/users', async (req, res) => {
  const { name } = req.body;

  const newUser = await pool.query(
    'INSERT INTO users (name) VALUES ($1) RETURNING *',
    [name]
  );

  res.status(201).send(newUser.rows[0]);
});

app.post('/articles/:articleId/like', async (req, res) => {
  const { articleId } = req.params;
  const { userId } = req.body;

  await pool.query(
    'INSERT INTO article_likes (user_id, article_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [userId, articleId]
  );

  const updatedArticle = await pool.query(
    'UPDATE articles SET likes = likes + 1 WHERE id = $1 RETURNING *',
    [articleId]
  );

  // Add notification
  const authorId = await pool.query(
    'SELECT id FROM users WHERE name = (SELECT author FROM articles WHERE id = $1)',
    [articleId]
  );

  if (authorId.rows.length > 0) {
    await pool.query(
      'INSERT INTO notifications (user_id, article_id, message) VALUES ($1, $2, $3)',
      [authorId.rows[0].id, articleId, 'Your article has been liked!']
    );
  }

  // Update Redis cache
  redisClient.hSet(articleId, 'likes', updatedArticle.rows[0].likes);

  res.send(updatedArticle.rows[0]);
});

  
app.post('/articles/:articleId/view', async (req, res) => {
  const { articleId } = req.params;
  const { userId } = req.body;

  await pool.query(
    'INSERT INTO article_views (user_id, article_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [userId, articleId]
  );

  const updatedArticle = await pool.query(
    'UPDATE articles SET views = views + 1 WHERE id = $1 RETURNING *',
    [articleId]
  );

  // Update Redis cache
  redisClient.hSet(articleId, 'views', updatedArticle.rows[0].views);

  res.send(updatedArticle.rows[0]);
});

app.get('/articles/:articleId', checkCache, async (req, res) => {
  const { articleId } = req.params;

  const article = await pool.query(
    'SELECT * FROM articles WHERE id = $1',
    [articleId]
  );

  if (article.rows.length === 0) {
    return res.status(404).send('Article not found');
  }

  const result = article.rows[0];

  redisClient.hSet(articleId, {
    'title': result.title,
    'author': result.author,
    'body': result.body,
    'likes': result.likes,
    'views': result.views
  });

  res.send(result);
});

// Notifications route
app.get('/users/:userId/notifications', async (req, res) => {
  const { userId } = req.params;

  const notifications = await pool.query(
    'SELECT * FROM notifications WHERE user_id = $1',
    [userId]
  );

  res.send(notifications.rows);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
