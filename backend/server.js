/**
 * @file backend/server.js
 * @layer Backend Application Entry & Express REST API Server
 * @description Initializes the Express application, configures global CORS and 15MB JSON body limits for base64 receipt images, connects to MongoDB Atlas, mounts all REST API routes, and starts the HTTP server with environment-aware logging.
 */

// Import core dependencies and environment configuration
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const logger = require("./utils/logger");

// 1. Initialize Express application
const app = express();

// 2. Configure global middleware (CORS and 15MB JSON body limit for base64 receipt images)
app.use(cors());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// 3. Connect to MongoDB database
const MONGO_URI = process.env.MONGO_URI;
mongoose
  .connect(MONGO_URI)
  .then(() => logger.info("DATABASE", "MongoDB connected successfully."))
  .catch((err) => logger.error("DATABASE", "MongoDB connection error", err));

// 4. Mount all application REST API routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/transactions", require("./routes/transactionRoutes"));
app.use("/api/budgets", require("./routes/budgetRoutes"));
app.use("/api/analytics", require("./routes/analyticsRoutes"));
app.use("/api/ocr", require("./routes/ocrRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));

// 5. Health check endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Ka-Ching! Backend API is running.",
    environment: logger.env,
  });
});

// 6. Start listening on configured port
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  logger.info(
    "SERVER",
    `Listening on http://0.0.0.0:${PORT} | Environment: ${logger.env.toUpperCase()} | Debug Logs: ${logger.isDebugEnabled() ? "ENABLED" : "DISABLED"}`,
  );
});
