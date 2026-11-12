// Import the mongoose core library
const mongoose = require("mongoose");

// 1. Unified Category Configuration (Exact match with Frontend CATEGORY_CONFIG)
const CATEGORY_CONFIG = {
  EXPENSE: [
    { key: "FOOD_AND_BEVERAGE", name: "Food & Beverage", budgetType: "NEEDS" },
    { key: "GROCERIES", name: "Groceries", budgetType: "NEEDS" },
    { key: "TRANSPORT", name: "Transportation", budgetType: "NEEDS" },
    { key: "HOUSING", name: "Housing", budgetType: "NEEDS" },
    { key: "BILLS_AND_UTILITIES", name: "Bills & Utilities", budgetType: "NEEDS" },
    { key: "HEALTH_AND_WELLNESS", name: "Health & Wellness", budgetType: "NEEDS" },
    { key: "EDUCATION", name: "Education", budgetType: "NEEDS" },
    { key: "SHOPPING", name: "Shopping", budgetType: "WANTS" },
    { key: "LEISURE_AND_ENTERTAINMENT", name: "Leisure & Entertainment", budgetType: "WANTS" },
    { key: "OTHER_EXPENSE", name: "Other Expenses", budgetType: "WANTS" },
  ],
  INCOME: [
    { key: "SALARY", name: "Salary" },
    { key: "ALLOWANCE", name: "Allowance" },
    { key: "FREELANCE", name: "Freelance" },
    { key: "INVESTMENT_RETURN", name: "Investment Returns" },
    { key: "GIFT", name: "Gifts" },
    { key: "OTHER_INCOME", name: "Other Income" },
  ],
};

// 2. Extract strict enum key lists and budgetType lookup map
const EXPENSE_CATEGORIES = CATEGORY_CONFIG.EXPENSE.map((c) => c.key);
const INCOME_CATEGORIES = CATEGORY_CONFIG.INCOME.map((c) => c.key);
const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

const BUDGET_TYPE_MAP = {};
CATEGORY_CONFIG.EXPENSE.forEach((c) => {
  BUDGET_TYPE_MAP[c.key] = c.budgetType;
});

// 3. Define the Transaction schema
const transactionSchema = new mongoose.Schema(
  {
    // Foreign Key referencing the Users collection
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Monetary value in RM
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    // Transaction flow direction
    type: {
      type: String,
      required: true,
      enum: ["EXPENSE", "INCOME"],
    },
    // Strict 16-category enum
    category: {
      type: String,
      required: true,
      enum: ALL_CATEGORIES,
    },
    // Budget bucket ("NEEDS" or "WANTS" for expenses, "NONE" for income)
    budgetType: {
      type: String,
      enum: ["NEEDS", "WANTS", "NONE"],
      default: "NONE",
    },
    // Store or income source name
    merchantName: {
      type: String,
      default: "General",
    },
    // Optional user notes
    description: {
      type: String,
      default: null,
    },
    // Date of the transaction
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    // Entry origin: Manual form vs OCR receipt scanner vs Notification Auto-Capture
    source: {
      type: String,
      required: true,
      enum: ["MANUAL", "OCR", "NOTIFICATION"],
      default: "MANUAL",
    },
    // Verification state
    status: {
      type: String,
      required: true,
      enum: ["VERIFIED", "PENDING_VERIFICATION"],
      default: "VERIFIED",
    },
    // OCR / Auto-capture confidence score (0.0 to 1.0)
    confidenceScore: {
      type: Number,
      default: 1.0,
    },
  },
  {
    timestamps: true,
  },
);

// 4. Synchronous pre-validate hook WITHOUT `next` parameter (100% compatible with Mongoose 8/9 & Node v24)
transactionSchema.pre("validate", function () {
  if (this.type === "EXPENSE") {
    this.budgetType = BUDGET_TYPE_MAP[this.category] || "WANTS";
  } else {
    this.budgetType = "NONE";
  }
});

const TransactionModel = mongoose.model("Transaction", transactionSchema);

TransactionModel.CATEGORY_CONFIG = CATEGORY_CONFIG;
TransactionModel.EXPENSE_CATEGORIES = EXPENSE_CATEGORIES;
TransactionModel.INCOME_CATEGORIES = INCOME_CATEGORIES;
TransactionModel.ALL_CATEGORIES = ALL_CATEGORIES;
TransactionModel.BUDGET_TYPE_MAP = BUDGET_TYPE_MAP;

module.exports = TransactionModel;
