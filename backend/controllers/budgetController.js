// Import the Budget model, AI analytics engine, and notification trigger helper
const Budget = require("../models/Budget");
const { runAnalyticsEngine } = require("./analyticsController");
const { triggerBudgetGoalNotification } = require("./notificationController");

// 1. Create or update a user's monthly spending limit and savings target (POST /api/budgets)
exports.setBudget = async (req, res) => {
  try {
    // Step 1: Destructure budget parameters from request body
    const { userId, monthlyLimit, savingsTarget, month, year } = req.body;

    // Validation 1: Check required fields (userId and monthlyLimit must be provided)
    if (!userId || monthlyLimit === undefined) {
      return res.status(400).json({
        message: "userId and monthlyLimit are required fields.",
      });
    }

    // Step 2: Parse numeric values for limit and savings target
    const parsedLimit = Number(monthlyLimit);
    const parsedSavings = savingsTarget !== undefined ? Number(savingsTarget) : 0;

    // Validation 2: Ensure monthly spending limit is a valid number greater than RM 0
    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      return res.status(400).json({
        message: "Monthly spending limit must be a valid number greater than RM 0.",
      });
    }

    // Validation 3: Ensure monthly savings target is a valid non-negative number
    if (isNaN(parsedSavings) || parsedSavings < 0) {
      return res.status(400).json({
        message: "Monthly savings target cannot be negative.",
      });
    }

    // Step 3: Determine target month and year (defaults to current system month and year)
    const now = new Date();
    const targetMonth = month !== undefined ? Number(month) : now.getMonth() + 1;
    const targetYear = year !== undefined ? Number(year) : now.getFullYear();

    // Step 4: Find existing budget for the user; update if found, create if not (Upsert)
    let budget = await Budget.findOne({ userId });

    if (budget) {
      budget.monthlyLimit = Number(parsedLimit.toFixed(2));
      budget.savingsTarget = Number(parsedSavings.toFixed(2));
      if (budget.month !== undefined) budget.month = targetMonth;
      if (budget.year !== undefined) budget.year = targetYear;
      await budget.save();
    } else {
      budget = await Budget.create({
        userId,
        monthlyLimit: Number(parsedLimit.toFixed(2)),
        savingsTarget: Number(parsedSavings.toFixed(2)),
        month: targetMonth,
        year: targetYear,
      });
    }

    // Step 5: Trigger AI analytics engine after budget update to re-evaluate overspending risk
    try {
      await runAnalyticsEngine(userId);
    } catch (analyticsErr) {
      console.log("Background analytics update warning:", analyticsErr.message);
    }

    // Step 6: Trigger automatic GOAL notification for the Notification Center
    try {
      await triggerBudgetGoalNotification(userId, budget.monthlyLimit, budget.savingsTarget);
    } catch (notifyErr) {
      console.log("Background notification trigger warning:", notifyErr.message);
    }

    // Step 7: Return success response with saved budget document
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

// 2. Get the current budget configuration for a specific user (GET /api/budgets/:userId)
exports.getBudget = async (req, res) => {
  try {
    // Step 1: Extract userId from route parameters
    const { userId } = req.params;

    // Validation 1: Ensure userId parameter is present
    if (!userId) {
      return res.status(400).json({
        message: "userId parameter is required.",
      });
    }

    // Step 2: Query the latest budget document for this user
    const budget = await Budget.findOne({ userId }).sort({ updatedAt: -1 });

    // Step 3: Return the fetched budget (or null if not set yet)
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

// Export compatibility aliases so any route file naming works seamlessly
exports.setOrUpdateBudget = exports.setBudget;
exports.createOrUpdateBudget = exports.setBudget;
exports.getUserBudget = exports.getBudget;
exports.getBudgetByUser = exports.getBudget;
