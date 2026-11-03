// Import express and cors
const express = require("express");
const cors = require("cors");

// Import mongoose to connect to the MongoDB database
const mongoose = require("mongoose");

// Import dotenv to read hidden variables in the .env file
require("dotenv").config();

const app = express();
const PORT = 5000;

app.use(cors());

app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));

// Get the database connection string from the .env file
const mongoURI = process.env.MONGO_URI;

// Connect to the MongoDB database
mongoose
  .connect(mongoURI)
  .then(() => {
    console.log("MongoDB connected successfully!");
  })
  .catch((err) => {
    console.log("Database connection failed:", err);
  });

// Import routes
const transactionRoutes = require("./routes/transactionRoutes");
app.use("/api/transactions", transactionRoutes);

const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

const budgetRoutes = require("./routes/budgetRoutes");
app.use("/api/budgets", budgetRoutes);

const analyticsRoutes = require("./routes/analyticsRoutes");
app.use("/api/analytics", analyticsRoutes);

const ocrRoutes = require("./routes/ocrRoutes");
app.use("/api/ocr", ocrRoutes);

app.get("/", (req, res) => {
  res.send("Ka-Ching! Backend is running!");
});

app.listen(PORT, () => {
  console.log(`Server is running and listening on port: http://localhost:${PORT}`);
});
