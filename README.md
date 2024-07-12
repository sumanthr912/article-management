# Article Management System

This is an Article Management System built with Node.js, Express, PostgreSQL, and Redis. The system allows users to create articles, like and view articles, and receive notifications when their articles are liked.

## Features

- Create, view, like, and view articles.
- Track articles liked and viewed by users.
- Caching mechanism to keep track of views and likes for popular articles in memory using Redis.
- Notification system that sends notifications to users once their article is liked and stores notifications in a PostgreSQL table.

## Project Structure

To Start project: node index.js

## Setup Instructions

### Prerequisites

- Node.js installed (version 14.x or later)
- PostgreSQL installed and running
- Redis installed and running
- pgAdmin or any other PostgreSQL client for managing your database

- **Setup PostgreSQL**

    - Create a database in PostgreSQL.

    - Update the `config/db.js` file with your PostgreSQL database credentials.

    - Run the SQL script to create necessary tables:

      ```sql
      -- Create articles table
      CREATE TABLE articles (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        author VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        likes INTEGER DEFAULT 0,
        views INTEGER DEFAULT 0
      );

      -- Create users table
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL
      );

      -- Create article_likes table
      CREATE TABLE article_likes (
        user_id INTEGER,
        article_id INTEGER,
        PRIMARY KEY (user_id, article_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (article_id) REFERENCES articles(id)
      );

      -- Create article_views table
      CREATE TABLE article_views (
        user_id INTEGER,
        article_id INTEGER,
        PRIMARY KEY (user_id, article_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (article_id) REFERENCES articles(id)
      );

      -- Create notifications table
      CREATE TABLE notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        article_id INTEGER,
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (article_id) REFERENCES articles(id)
      );
      ```

4. **Run the server**

    ```bash
    node index.js
    ```

    The server will start on `http://localhost:3000`.

### API Endpoints

- **Create an article**

    ```http
    POST /articles
    Content-Type: application/json

    {
      "title": "Article Title",
      "author": "Author Name",
      "body": "Article Body"
    }
    ```

- **Create a user**

    ```http
    POST /users
    Content-Type: application/json

    {
      "name": "User Name"
    }
    ```

- **Like an article**

    ```http
    POST /articles/:articleId/like
    Content-Type: application/json

    {
      "userId": 1
    }
    ```

- **View an article**

    ```http
    POST /articles/:articleId/view
    Content-Type: application/json

    {
      "userId": 1
    }
    ```

- **Get article details**

    ```http
    GET /articles/:articleId
    ```

- **Get notifications for a user**

    ```http
    GET /users/:userId/notifications
    ```
