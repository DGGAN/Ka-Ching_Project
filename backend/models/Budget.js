// Import mongoose to define the database schema
const mongoose = require("mongoose");

// Define the Budget collection schema, aligned with the Budgets specification in the proposal report
const budgetSchema = new mongoose.Schema(
  {
    // Reference to the unique user identifier in the Users collection (Foreign Key)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Monthly spending limit amount in RM
    monthlyLimit: {
      type: Number,
      required: true,
      min: 0,
    },
    // Monthly target savings amount in RM
    savingsTarget: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Budget period type (defaults to MONTHLY, aligned with Budget Period in Screen 6)
    period: {
      type: String,
      enum: ["MONTHLY", "WEEKLY"],
      default: "MONTHLY",
    },
    // Target calendar month for the budget (1 - 12)
    month: {
      type: Number,
      default: () => new Date().getMonth() + 1,
    },
    // Target calendar year for the budget (e.g., 2026)
    year: {
      type: Number,
      default: () => new Date().getFullYear(),
    },
  },
  { timestamps: true },
);

// Create index on userId to speed up budget lookup
budgetSchema.index({ userId: 1 });

// Export the Budget model for controller use
module.exports = mongoose.model("Budget", budgetSchema);
