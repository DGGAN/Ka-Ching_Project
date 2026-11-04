// Import Express router and the budget controller
const express = require("express");
const router = express.Router();
const budgetController = require("../controllers/budgetController");

// Route to create or update a monthly budget
router.post("/", budgetController.setOrUpdateBudget);

// Route to get the active budget for a specific user
router.get("/:userId", budgetController.getUserBudget);

// Export the router module
module.exports = router;
