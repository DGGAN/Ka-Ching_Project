// Import mongoose to define the database schema
const mongoose = require("mongoose");

// Define the Transaction collection schema, 100% strictly aligned with Table 4.2 specification
const transactionSchema = new mongoose.Schema(
  {
    // Reference to the unique user identifier in the Users collection (Foreign Key)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Numerical transaction cost value stored up to two decimal places (Not Null)
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    // Direction flow tracking parameter: INCOME or EXPENSE
    type: {
      type: String,
      enum: ["INCOME", "EXPENSE"],
      required: true,
    },
    // Fixed category choice enum values (5 INCOME categories + 8 EXPENSE categories)
    category: {
      type: String,
      enum: [
        // Allowed values for INCOME
        "SALARY",
        "ALLOWANCE",
        "INVESTMENT",
        "GIFT",
        "OTHER_INCOME",
        // Allowed values for EXPENSE
        "FOOD_AND_BEVERAGE",
        "TRANSPORT",
        "SHOPPING",
        "LEISURE_AND_ENTERTAINMENT",
        "BILLS_AND_UTILITIES",
        "HEALTH_AND_EDUCATION",
        "SAVINGS_AND_INVESTMENT",
        "OTHER_EXPENSE",
      ],
      required: true,
    },
    // Identified retail store name or recipient business entity
    merchantName: {
      type: String,
      required: true,
      trim: true,
    },
    // Optional text area where users can type extra custom notes (Nullable)
    description: {
      type: String,
      default: null,
      trim: true,
    },
    // True historical calendar day when the transaction actually took place
    date: {
      type: Date,
      default: Date.now,
      required: true,
    },
    // Ingestion pathway channel: MANUAL, NOTIFICATION, or OCR
    source: {
      type: String,
      enum: ["MANUAL", "NOTIFICATION", "OCR"],
      default: "MANUAL",
      required: true,
    },
    // System state flag for verification flow: PENDING_VERIFICATION or VERIFIED
    status: {
      type: String,
      enum: ["PENDING_VERIFICATION", "VERIFIED"],
      default: "VERIFIED",
      required: true,
    },
    // Optical recognition reliability rating between 0.0 and 1.0 (Defaults to 1.0)
    confidenceScore: {
      type: Number,
      default: 1.0,
      min: 0.0,
      max: 1.0,
    },
  },
  { timestamps: true },
);

// Create compound index on userId (asc) and date (desc) to speed up multi-user queries
transactionSchema.index({ userId: 1, date: -1 });

// Export the Transaction model for controller use
module.exports = mongoose.model("Transaction", transactionSchema);
