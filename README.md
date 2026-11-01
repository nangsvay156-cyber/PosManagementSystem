# PosManagementSystem

A Point of Sale (POS) management system for handling sales, products, inventory, customers, and sales reports.

## Features

- Product and category management
- Sales and billing
- Inventory tracking
- Customer management
- Sales reports

## Tech Stack

- Frontend: Client (npm)
- Backend: Server (Node.js, Express, MySQL, Redis, JWT)

## Project Structure

```
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
```

## Getting Started

### Requirements

- [Node.js](https://nodejs.org/) v18 or newer
- [MySQL](https://www.mysql.com/)
- [Redis](https://redis.io/)
- [Git](https://git-scm.com/)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/nangsvay156-cyber/PosManagementSystem.git
   cd PosManagementSystem
   ```

2. Install dependencies:

   ```bash
   cd Server
   npm install
   cd ../Client
   npm install
   ```

3. Create the file `Server/.env`:

   ```env
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=pos_db
   REDIS_URL=redis://localhost:6379
   JWT_SECRET=change_this_to_a_long_random_text
   ```

## Running the Project

Open **two terminals**.

Terminal 1 (server):

```bash
cd Server
npm run dev
```

Terminal 2 (client):

```bash
cd Client
npm run dev
```

## License

MIT
