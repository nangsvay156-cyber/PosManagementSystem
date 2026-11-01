require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const path = require("path");

const apiRoutes = require("./routes");
const { errorHandler, notFound } = require("./middleware/errorHandler");

const app = express();

const CLIENT_URL =
  process.env.CLIENT_URL || "http://localhost:5173";

// ===============================
// Security
// ===============================

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

// ===============================
// Body Parser
// ===============================

app.use(express.json({ limit: "10mb" }));

app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(cookieParser());

// ===============================
// Logger
// ===============================

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}
app.use(morgan("dev"));

// ===============================
// Rate Limiting
// ===============================

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    success: false,
    statusCode: 429,
    message: "Too many requests. Please try again later.",
  },
});

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/refresh", authLimiter);

// ===============================
// Static Files
// ===============================

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

// ===============================
// Health Check
// ===============================

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    statusCode: 200,
    message: "API is running successfully.",
    timestamp: new Date().toISOString(),
  });
});

// ===============================
// API Routes
// ===============================

app.use("/api", apiRoutes);

// ===============================
// 404
// ===============================

app.use(notFound);

// ===============================
// Global Error Handler
// ===============================

app.use(errorHandler);

module.exports = app;