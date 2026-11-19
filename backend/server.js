/**
 * @file backend/server.js
 * @layer Backend Application Entry & Express REST API Server
 * @description Initializes the Express application, configures global CORS and 15MB JSON body limits for base64 receipt images, connects to MongoDB Atlas, mounts all REST API routes, serves static legal pages, and starts the HTTP server with Render Keep-Alive ping.
 */

// Import core dependencies and environment configuration
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const cors = require("cors");
const https = require("https");
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

// 5. Serve public legal pages (index.html, privacy.html, terms.html) for Google OAuth verification
app.use(express.static(path.join(__dirname, "public")));
app.get("/privacy", (req, res) => res.sendFile(path.join(__dirname, "public", "privacy.html")));
app.get("/terms", (req, res) => res.sendFile(path.join(__dirname, "public", "terms.html")));

// 6. Health check & Home Page endpoint
app.get("/", (req, res) => {
  const acceptsHtml = req.headers.accept && req.headers.accept.includes("text/html");
  if (acceptsHtml) {
    return res.sendFile(path.join(__dirname, "public", "index.html"));
  }
  return res.status(200).json({
    name: "Ka-Ching! Personal Finance Manager",
    message: "Ka-Ching! Backend API is running.",
    environment: logger.env,
  });
});

// 7. Start listening on configured port + Auto Keep-Alive Ping on Render (prevents 50s free-tier cold start!)
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  logger.info(
    "SERVER",
    `Listening on http://0.0.0.0:${PORT} | Environment: ${logger.env.toUpperCase()} | Debug Logs: ${logger.isDebugEnabled() ? "ENABLED" : "DISABLED"}`,
  );

  // Ping public Render URL every 13 minutes so the free instance stays warm for instant Auto-Capture
  const renderExternalUrl = process.env.RENDER_EXTERNAL_URL || "https://kaching-backend-27o2.onrender.com";

  if (logger.isProd || process.env.RENDER) {
    setInterval(
      () => {
        https
          .get(`${renderExternalUrl}/`, (res) => {
            logger.debug("KEEP_ALIVE", `Self-ping status: ${res.statusCode}`);
          })
          .on("error", () => {});
      },
      13 * 60 * 1000,
    );
  }
});
