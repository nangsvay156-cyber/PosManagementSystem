PosManagementSystem

A full-stack Point of Sale (POS) management system for handling sales, products, inventory, customers, and sales reports. It has a REST API backend (Server) and a web frontend (Client).

Table of Contents
Overview
Features
Tech Stack
Project Structure
Getting Started
Environment Variables
Backend Code Explained
API Endpoints
Authentication and Roles
Git Workflow
Security Notes
License
Overview

PosManagementSystem helps small shops and stores manage their daily sales. Staff log in, add items to a sale, print or view a bill, and managers can track stock and view sales reports.

Features
Authentication: login with username and password, JWT tokens, logout
Roles: Admin (full access) and Cashier (sales only)
Products and categories: add, edit, delete, search
Sales and billing: create sales, calculate totals and discounts, view receipts
Inventory: stock is reduced automatically after each sale, low-stock alerts
Customers: store customer information and purchase history
Reports: daily, weekly, and monthly sales reports
Tech Stack

Backend (Server)

Package	Purpose
express	Build the REST API
mysql2	Connect to the MySQL database
redis	Caching and session/token storage
bcryptjs	Hash passwords securely
jsonwebtoken	Create tokens that protect routes
cors	Allow the Client to send requests to the Server
dotenv	Load values from the .env file
nodemon	Auto-restart the server while developing

Frontend (Client)

Started with npm run dev
Project Structure
POS/
├── Server/
│   ├── config/
│   │   ├── db.js          # MySQL connection pool
│   │   └── redis.js       # Redis client
│   ├── server.js          # Express app entry point
│   ├── .env               # Secret settings (never upload)
│   └── package.json
├── Client/
│   └── package.json
├── .gitignore
└── README.md
Getting Started
Requirements
Node.js v18 or newer
MySQL
Redis
Git
1. Clone the repository
bash
git clone https://github.com/nangsvay156-cyber/PosManagementSystem.git
cd PosManagementSystem
2. Install dependencies
bash
cd Server
npm install
cd ../Client
npm install
3. Create the database

Open MySQL and run:

sql
CREATE DATABASE pos_db;
4. Create the .env file

Create Server/.env (see Environment Variables).

5. Run the project

Open two terminals.

Terminal 1 (backend):

bash
cd Server
npm run dev

Terminal 2 (frontend):

bash
cd Client
npm run dev

Open the backend root route (/) in your browser to check that the server is running.

Environment Variables

Create Server/.env:

env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=pos_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=change_this_to_a_long_random_text

Never commit the .env file to GitHub.

Backend Code Explained
package.json

Stores the project name, the scripts, and the list of dependencies.

json
{
  "name": "pos-server",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "jsonwebtoken": "^9.0.2",
    "mysql2": "^3.9.7",
    "redis": "^4.6.13"
  },
  "devDependencies": {
    "nodemon": "^3.1.0"
  }
}
config/db.js (MySQL connection)

Uses mysql2/promise to create a connection pool, which manages many database connections efficiently. It also tests the connection when the server starts.

js
const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log("MySQL connected");
    conn.release();
  } catch (err) {
    console.error("MySQL connection failed:", err.message);
  }
}

module.exports = { pool, testConnection };
config/redis.js (Redis caching)

Creates a client that connects to the Redis server. Redis is used to store sessions or cache tokens and frequent queries for fast responses.

js
const { createClient } = require("redis");
require("dotenv").config();

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.on("error", (err) => console.error("Redis error:", err.message));

async function connectRedis() {
  await redisClient.connect();
  console.log("Redis connected");
}

module.exports = { redisClient, connectRedis };
server.js (entry point)

The main file that starts the Express app. It enables two important middlewares:

cors(): lets the Client send requests to the Server safely
express.json(): lets the Server read JSON data sent by the Client

It also has a root route (/) to check that the server is running.

js
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { testConnection } = require("./config/db");
const { connectRedis } = require("./config/redis");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "POS Management System API is running" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await testConnection();
  try {
    await connectRedis();
  } catch (err) {
    console.error("Redis not available:", err.message);
  }
});
API Endpoints

Planned endpoints. Update this list to match your real routes.

Method	Endpoint	Description	Access
POST	/api/auth/login	Log in and get a token	Public
GET	/api/products	List products	Logged in
POST	/api/products	Add a product	Admin
PUT	/api/products/:id	Update a product	Admin
DELETE	/api/products/:id	Delete a product	Admin
POST	/api/sales	Create a sale	Cashier, Admin
GET	/api/sales	List sales	Admin
GET	/api/customers	List customers	Logged in
GET	/api/reports/daily	Daily sales report	Admin
Authentication and Roles
The user enters a username and password on the login page.
The Client sends them to POST /api/auth/login.
The Server compares the password with the stored hash (bcryptjs).
If correct, the Server returns a JWT token.
The Client sends the token in the Authorization: Bearer <token> header with every later request.
The Server checks the token and the user's role before allowing the action.
Git Workflow

First time:

bash
git init
git branch -M main
git remote add origin https://github.com/nangsvay156-cyber/PosManagementSystem.git
git add .
git commit -m "Initial commit"
git push -u origin main

Every time after that:

bash
git add .
git commit -m "Describe what you changed"
git push

Make sure .gitignore contains:

node_modules/
.env
dist/
Security Notes
Never store passwords as plain text. Always hash them with bcryptjs.
Never upload .env or real passwords to GitHub.
Check user roles on the server, not only in the Client.
Use a long, random JWT_SECRET.
Change any default admin password after the first login.
License

MIT
