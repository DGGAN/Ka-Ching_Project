// Import the Budget model, AI analytics engine, and notification trigger helper
const Budget = require("../models/Budget");
const { runAnalyticsEngine } = require("./analyticsController");
const { triggerBudgetGoalNotification } = require("./notificationController");

// 1. Create or update the current month's spending limit and savings target (POST /api/budgets)
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

    // Step 3: Lock budget modifications strictly to the current calendar month and year
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const targetMonth = month !== undefined ? Number(month) : currentMonth;
    const targetYear = year !== undefined ? Number(year) : currentYear;

    // Validation 4: Prevent users from modifying historical past-month budgets
    if (targetYear !== currentYear || targetMonth !== currentMonth) {
      return res.status(403).json({
        message: "Past month budgets are locked for historical accuracy. You can only edit the current month's budget.",
      });
    }

    // Step 4: Upsert the budget specifically for (userId + currentMonth + currentYear)
    let budget = await Budget.findOne({
      userId,
      month: currentMonth,
      year: currentYear,
    });

    if (!budget) {
      // Also check if a legacy budget record without month/year exists for this user
      const legacyBudget = await Budget.findOne({
        userId,
        month: { $exists: false },
      });
      if (legacyBudget) {
        budget = legacyBudget;
      }
    }

    if (budget) {
      budget.monthlyLimit = Number(parsedLimit.toFixed(2));
      budget.savingsTarget = Number(parsedSavings.toFixed(2));
      budget.month = currentMonth;
      budget.year = currentYear;
      await budget.save();
    } else {
      budget = await Budget.create({
        userId,
        monthlyLimit: Number(parsedLimit.toFixed(2)),
        savingsTarget: Number(parsedSavings.toFixed(2)),
        month: currentMonth,
        year: currentYear,
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

// 2. Get the current budget configuration and historical budgets for a user (GET /api/budgets/:userId)
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

    // Step 2: Query all budget documents for this user sorted newest first
    const allBudgets = await Budget.find({ userId }).sort({
      year: -1,
      month: -1,
      updatedAt: -1,
    });

    const latestBudget = allBudgets.length > 0 ? allBudgets[0] : null;

    // Step 3: Return both the latest active budget (data) and the full monthly history array
    res.status(200).json({
      message: "Budget fetched successfully.",
      data: latestBudget,
      history: allBudgets,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch budget.",
      error: error.message,
    });
  }
};

// Export compatibility aliases
exports.setOrUpdateBudget = exports.setBudget;
exports.createOrUpdateBudget = exports.setBudget;
exports.getUserBudget = exports.getBudget;
exports.getBudgetByUser = exports.getBudget;
