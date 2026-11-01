require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");

const app = require("./app");
const { testConnection } = require("./config/database");

const server = http.createServer(app);

const CLIENT_URL =
  process.env.CLIENT_URL || "http://localhost:5173";

// ===============================
// Socket.IO
// ===============================

const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Make Socket.IO available in controllers
app.set("io", io);

// ===============================
// Start Server
// ===============================

const PORT = process.env.PORT || 5001;

const start = async () => {
  try {
    await testConnection();

    server.listen(PORT, () => {
      console.log(
        `🚀 Server running on http://localhost:${PORT}`
      );

      console.log("📡 Socket.IO ready");

      console.log(
        `🌐 Allowed client origin: ${CLIENT_URL}`
      );
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

start();

module.exports = {
  app,
  server,
  io,
};