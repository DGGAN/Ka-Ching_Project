// Import Express router and the transaction controller
const express = require("express");
const router = express.Router();
const transactionController = require("../controllers/transactionController");

// 1. Route to create a new transaction (POST /api/transactions)
router.post("/", transactionController.createTransaction);

// 2. Smart Auto-Capture Routes
router.get("/auto-capture-status/:userId", transactionController.getAutoCaptureStatus);
router.put("/auto-capture-toggle/:userId", transactionController.toggleAutoCaptureSetting);
router.post("/auto-capture", transactionController.autoCaptureNotification);

// 3. Route to fetch transactions for a user (GET /api/transactions/:userId)
router.get("/:userId", transactionController.getTransactions);

// 4. Route to update an existing transaction by ID (PUT /api/transactions/:id)
router.put("/:id", transactionController.updateTransaction);

// 5. Route to delete a transaction by ID (DELETE /api/transactions/:id)
router.delete("/:id", transactionController.deleteTransaction);

// Export the router module
module.exports = router;
