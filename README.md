# Article Management System

This is an Article Management System built with Node.js, Express, PostgreSQL, and Redis. The system allows users to create articles, like and view articles, and receive notifications when their articles are liked.

## Features

- Create, view, like, and view articles.
- Track articles liked and viewed by users.
- Caching mechanism to keep track of views and likes for popular articles in memory using Redis.
- Notification system that sends notifications to users once their article is liked and stores notifications in a PostgreSQL table.

## Project Structure

To Start project: node index.js
