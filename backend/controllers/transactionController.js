// Import the Transaction model
const Transaction = require("../models/Transaction");
// Import the analytics engine to implement the Write-Trigger mechanism
const { runAnalyticsEngine } = require("./analyticsController");

// Function to handle the "add new transaction" request
exports.createTransaction = async (req, res) => {
  try {
    // Extract data: added source, status, and confidenceScore to support OCR and Notifications
    const { userId, amount, type, category, merchantName, description, date, source, status, confidenceScore } = req.body;

    // Create a new transaction record object
    const newTransaction = new Transaction({
      userId,
      amount,
      type,
      category,
      merchantName,
      description,
      date: date || Date.now(), // Use current time if not provided

      // Flexible source: use provided source, or default to MANUAL
      source: source || "MANUAL",

      // Flexible status: use provided status, or default to VERIFIED
      status: status || "VERIFIED",

      // Handle OCR confidence score: default to 1.0 (100% accurate) if not provided
      confidenceScore: confidenceScore || 1.0,
    });

    // 交易保存后自动在后台运行财务分析更新预测与通知
    // Automatically run financial analytics in the background after saving transaction
    await runAnalyticsEngine(userId);

    // Officially save this record into the MongoDB database
    const savedTransaction = await newTransaction.save();

    // On success, return a success message and the saved data to the frontend
    res.status(201).json({
      message: "Transaction saved successfully!",
      data: savedTransaction,
    });
  } catch (error) {
    // If an error occurs, return an error message to the frontend
    res.status(500).json({
      message: "Failed to save transaction.",
      error: error.message,
    });
  }
};

// Get all transaction records for a specific user
exports.getTransactions = async (req, res) => {
  try {
    // Extract userId from the URL path (Example /api/transactions/65f1a2b3c4d5e6f7a8b9c0d1)
    const { userId } = req.params;

    // Find all records belonging to this userId and sort by date descending (-1)
    const transactions = await Transaction.find({ userId }).sort({ date: -1 });

    // Return the found data to the frontend
    res.status(200).json({
      message: "Transactions fetched successfully!",
      count: transactions.length, // Tell frontend how many records were found
      data: transactions,
    });
  } catch (error) {
    // If an error occurs, return an error message to the frontend
    res.status(500).json({
      message: "Failed to fetch transactions.",
      error: error.message,
    });
  }
};
