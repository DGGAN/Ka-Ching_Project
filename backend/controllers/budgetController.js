// Import the Budget model
const Budget = require("../models/Budget");

// 1. Create or update the budget for the month
exports.setBudget = async (req, res) => {
  try {
    const { userId, limitAmount, savingsTarget, period, startDate, endDate } = req.body;

    // Check if the user already has a budget set for this period (e.g., "2026-10")
    let budget = await Budget.findOne({ userId, period });

    if (budget) {
      // If it already exists, update the budget
      budget.limitAmount = limitAmount;
      budget.savingsTarget = savingsTarget;
      budget.startDate = startDate;
      budget.endDate = endDate;
      await budget.save();
      return res.status(200).json({ message: "Budget updated successfully.", data: budget });
    }

    // If it doesn't exist, create a new budget
    const newBudget = new Budget({
      userId,
      limitAmount,
      savingsTarget,
      period,
      startDate,
      endDate,
    });

    const savedBudget = await newBudget.save();
    res.status(201).json({ message: "Budget created successfully.", data: savedBudget });
  } catch (error) {
    res.status(500).json({ message: "Failed to set budget.", error: error.message });
  }
};

// 2. Get the current budget for a specific user
exports.getBudget = async (req, res) => {
  try {
    const { userId, period } = req.params;

    const budget = await Budget.findOne({ userId, period });
    if (!budget) {
      return res.status(404).json({ message: "No budget found for this period." });
    }

    res.status(200).json({ message: "Budget fetched successfully.", data: budget });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch budget.", error: error.message });
  }
};
