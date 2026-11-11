/**
 * @file backend/models/Budget.js
 * @layer Backend Mongoose Schema
 * @description Stores per-month budget setup (year, month, monthlyLimit, savingsTarget, and exact preset allocation ratios).
 */

const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    month: {
      type: Number,
      default: () => new Date().getMonth() + 1,
    },
    year: {
      type: Number,
      default: () => new Date().getFullYear(),
    },
    monthlyLimit: {
      type: Number,
      required: true,
    },
    savingsTarget: {
      type: Number,
      default: 0,
    },
    presetId: {
      type: String,
      default: "50_30_20",
    },
    presetName: {
      type: String,
      default: "Balanced",
    },
    needsPct: {
      type: Number,
      default: 50,
    },
    wantsPct: {
      type: Number,
      default: 30,
    },
    savingsPct: {
      type: Number,
      default: 20,
    },
    alertThreshold: {
      type: Number,
      default: 0.8,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Budget", budgetSchema);
