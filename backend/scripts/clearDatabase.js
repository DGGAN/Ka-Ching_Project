/**
 * @file backend/scripts/clearDatabase.js
 * @description Completely wipes all documents from all 5 collections: Users, Transactions, Budgets, Notifications, and AllInsightsPredictions.
 *
 * Usage (run from backend directory):
 *   node scripts/clearDatabase.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const Budget = require("../models/Budget");
const Notification = require("../models/Notification");
const AllInsightsPrediction = require("../models/AllInsightsPrediction");

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/kaching";

async function clearAllCollections() {
  try {
    console.log("[INFO] Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("[OK] Connected to MongoDB.\n");

    const [userDel, txDel, budgetDel, notifDel, insightDel] = await Promise.all([
      User.deleteMany({}),
      Transaction.deleteMany({}),
      Budget.deleteMany({}),
      Notification.deleteMany({}),
      AllInsightsPrediction.deleteMany({}),
    ]);

    console.log("ALL 5 COLLECTIONS CLEARED:");
    console.log(`  1. Users deleted                  : ${userDel.deletedCount}`);
    console.log(`  2. Transactions deleted           : ${txDel.deletedCount}`);
    console.log(`  3. Budgets deleted                : ${budgetDel.deletedCount}`);
    console.log(`  4. Notifications deleted          : ${notifDel.deletedCount}`);
    console.log(`  5. AllInsightsPredictions deleted : ${insightDel.deletedCount}`);
    console.log("\n[OK] Database is now 100% clean.\n");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("[ERROR] Failed to clear database:", error.message);
    process.exit(1);
  }
}

clearAllCollections();
