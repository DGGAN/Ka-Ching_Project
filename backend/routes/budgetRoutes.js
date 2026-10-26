// Import express Router and budget controller
const express = require("express");
const router = express.Router();
const budgetController = require("../controllers/budgetController");

// Endpoint to set or update monthly budget and savings target
router.post("/", budgetController.setBudget);

// Endpoint to get user budget progress and AI Auto-Recommendation
router.get("/:userId", budgetController.getBudget);

// Export router module
module.exports = router;
