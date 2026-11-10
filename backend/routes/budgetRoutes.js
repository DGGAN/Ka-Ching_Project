/**
 * @file backend/routes/budgetRoutes.js
 * @layer Backend Route (Express Router)
 * @description Maps HTTP POST and GET endpoints under /api/budgets to budgetController methods.
 * @exports default router
 */

// Import Express router and the budget controller
const express = require("express");
const router = express.Router();
const budgetController = require("../controllers/budgetController");

// 1. Route to create or update a user's monthly budget (POST /api/budgets)
router.post("/", budgetController.setBudget);

// 2. Route to get the active or historical budget for a user (GET /api/budgets/:userId)
router.get("/:userId", budgetController.getBudget);

// Export the router module
module.exports = router;
