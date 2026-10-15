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
app.use(express.json());

// Get the database connection string from the .env file
const mongoURI = process.env.MONGO_URI;

// Connect to the MongoDB database
mongoose
  .connect(mongoURI)
  .then(() => {
    // If the connection is successful, print a success message in the terminal
    console.log("MongoDB connected successfully!");
  })
  .catch((err) => {
    // If the connection fails, print the error reason
    console.log("Database connection failed:", err);
  });

// Import the transaction routes
const transactionRoutes = require("./routes/transactionRoutes");
app.use("/api/transactions", transactionRoutes);

// Import the auth routes
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

// Import the budget routes
const budgetRoutes = require("./routes/budgetRoutes");
app.use("/api/budgets", budgetRoutes);

// Import the analytics routes
const analyticsRoutes = require("./routes/analyticsRoutes");
app.use("/api/analytics", analyticsRoutes);

app.get("/", (req, res) => {
  res.send("Ka-Ching! Backend is running!");
});

app.listen(PORT, () => {
  console.log(`Server is running and listening on port: http://localhost:${PORT}`);
});
