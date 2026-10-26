// Import the Budget model and the intelligent financial analytics engine
const Budget = require("../models/Budget");
const { runAnalyticsEngine } = require("./analyticsController");

// 1. Create or update a user's monthly spending limit and savings target (POST /api/budgets)
exports.setBudget = async (req, res) => {
  try {
    // Destructure budget parameters from request body
    const { userId, monthlyLimit, savingsTarget, month, year } = req.body;

    // Validate required fields and numeric validity
    if (!userId || monthlyLimit === undefined) {
      return res.status(400).json({
        message: "userId and monthlyLimit are required fields.",
      });
    }

    const parsedLimit = Number(monthlyLimit);
    const parsedSavings = savingsTarget !== undefined ? Number(savingsTarget) : 0;

    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      return res.status(400).json({
        message: "Monthly spending limit must be a valid number greater than RM 0.",
      });
    }
    if (isNaN(parsedSavings) || parsedSavings < 0) {
      return res.status(400).json({
        message: "Monthly savings target cannot be negative.",
      });
    }

    const now = new Date();
    const targetMonth = month !== undefined ? Number(month) : now.getMonth() + 1;
    const targetYear = year !== undefined ? Number(year) : now.getFullYear();

    // Find existing budget for the user and month/year; update if found, create if not (Upsert)
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

    // Trigger AI analytics engine after budget update to re-evaluate overspending risk
    try {
      await runAnalyticsEngine(userId);
    } catch (analyticsErr) {
      console.log("Background analytics update warning:", analyticsErr.message);
    }

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
    const { userId } = req.params;

    const budget = await Budget.findOne({ userId }).sort({ updatedAt: -1 });

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
