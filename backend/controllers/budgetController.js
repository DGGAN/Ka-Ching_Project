/**
 * @file backend/controllers/budgetController.js
 * @layer Backend Controller (REST API Handler)
 * @description Handles creating/updating current-month budgets and fetching historical monthly budget records.
 * @exports setBudget, getBudget
 */

// Import the Budget model, AI analytics engine, and notification trigger helper
const Budget = require("../models/Budget");
const { runAnalyticsEngine } = require("./analyticsController");
const { triggerBudgetGoalNotification } = require("./notificationController");

// 1. Create or update a user's monthly spending limit and savings target (POST /api/budgets)
exports.setBudget = async (req, res) => {
  try {
    // Step 1: Destructure budget parameters from request body
    const { userId, monthlyLimit, savingsTarget, month, year } = req.body;

    // Validation 1: Check required fields
    if (!userId || monthlyLimit === undefined) {
      return res.status(400).json({
        message: "userId and monthlyLimit are required fields.",
      });
    }

    // Step 2: Parse numeric values
    const parsedLimit = Number(monthlyLimit);
    const parsedSavings = savingsTarget !== undefined ? Number(savingsTarget) : 0;

    // Validation 2: Ensure monthly spending limit > RM 0
    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      return res.status(400).json({
        message: "Monthly spending limit must be a valid number greater than RM 0.",
      });
    }

    // Validation 3: Ensure monthly savings target >= RM 0
    if (isNaN(parsedSavings) || parsedSavings < 0) {
      return res.status(400).json({
        message: "Monthly savings target cannot be negative.",
      });
    }

    // Validation 4: Prevent modifying past months (only current month is editable)
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const targetMonth = month !== undefined ? Number(month) : currentMonth;
    const targetYear = year !== undefined ? Number(year) : currentYear;

    if (targetYear !== currentYear || targetMonth !== currentMonth) {
      return res.status(403).json({
        message: "Past month budgets are locked and read-only.",
      });
    }

    // Step 3: Upsert budget for current month and year
    const budget = await Budget.findOneAndUpdate(
      { userId, month: targetMonth, year: targetYear },
      {
        userId,
        monthlyLimit: Number(parsedLimit.toFixed(2)),
        savingsTarget: Number(parsedSavings.toFixed(2)),
        month: targetMonth,
        year: targetYear,
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );

    // Step 4: Trigger background analytics engine and GOAL notification
    try {
      await runAnalyticsEngine(userId);
      await triggerBudgetGoalNotification(userId, budget.monthlyLimit, budget.savingsTarget);
    } catch (bgErr) {
      console.log("Background budget sync warning:", bgErr.message);
    }

    // Step 5: Return saved budget document
    res.status(200).json({
      message: "Budget saved successfully.",
      data: budget,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to save budget.",
      error: error.message,
    });
  }
};

// 2. Get the active or historical budget configuration for a user (GET /api/budgets/:userId)
exports.getBudget = async (req, res) => {
  try {
    // Step 1: Extract userId and query flags
    const { userId } = req.params;
    const { all, month, year } = req.query;

    // Validation 1: Ensure userId parameter is provided
    if (!userId) {
      return res.status(400).json({
        message: "userId parameter is required.",
      });
    }

    // Step 2: Return all historical budgets if ?all=true is requested
    if (all === "true") {
      const budgets = await Budget.find({ userId }).sort({
        year: -1,
        month: -1,
        updatedAt: -1,
      });
      return res.status(200).json({
        message: "All user budgets fetched successfully.",
        data: budgets,
      });
    }

    // Step 3: Return specific month/year budget or latest budget
    const filter = { userId };
    if (month && year) {
      filter.month = Number(month);
      filter.year = Number(year);
    }

    const budget = await Budget.findOne(filter).sort({ updatedAt: -1 });

    res.status(200).json({
      message: "Budget fetched successfully.",
      data: budget || null,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch budget.",
      error: error.message,
    });
  }
};
