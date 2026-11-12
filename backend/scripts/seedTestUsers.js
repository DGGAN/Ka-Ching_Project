/**
 * @file backend/scripts/seedTestUsers.js
 * @description Seeds all 5 MongoDB collections (User, Transaction, Budget, Notification, AllInsightsPrediction) across 4 test user personas using native bcrypt hashing ("password123") so every persona works with BOTH Email/Password login and Google OAuth login.
 *
 * Usage (run from backend directory):
 *   node scripts/seedTestUsers.js
 */

require("dotenv").config();
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const Budget = require("../models/Budget");
const Notification = require("../models/Notification");
const AllInsightsPrediction = require("../models/AllInsightsPrediction");

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/kaching";

// Helper to build a specific Date relative to the current month
// monthOffset = 0 (Current Month), -1 (Last Month), -2 (Two Months Ago)
const makeDate = (monthOffset, dayOfMonth, hour = 13, minute = 30) => {
  const now = new Date();
  const targetYear = now.getFullYear();
  const targetMonth = now.getMonth() + monthOffset;
  const maxDayInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  const safeDay = Math.min(dayOfMonth, maxDayInMonth);
  return new Date(targetYear, targetMonth, safeDay, hour, minute, 0);
};

// Helper to normalize transaction objects with exact budgetType ("NEEDS" | "WANTS" | "NONE")
const buildTxDoc = (doc) => {
  const now = new Date();
  const txType = doc.type || "EXPENSE";
  const txCategory = doc.category || "OTHER_EXPENSE";
  const budgetType = txType === "EXPENSE" ? Transaction.BUDGET_TYPE_MAP?.[txCategory] || "WANTS" : "NONE";

  return {
    type: txType,
    category: txCategory,
    budgetType,
    description: null,
    source: "MANUAL",
    status: "VERIFIED",
    confidenceScore: doc.source === "OCR" ? 0.94 : doc.source === "NOTIFICATION" ? 0.98 : 1.0,
    createdAt: doc.date || now,
    updatedAt: now,
    ...doc,
  };
};

async function seedDatabase() {
  try {
    console.log("[INFO] Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("[OK] Connected to MongoDB.\n");

    // Step 1: Clear all 5 collections first
    await Promise.all([
      User.deleteMany({}),
      Transaction.deleteMany({}),
      Budget.deleteMany({}),
      Notification.deleteMany({}),
      AllInsightsPrediction.deleteMany({}),
    ]);
    console.log("[INFO] Cleared all 5 collections. Seeding 4 test personas...\n");

    const now = new Date();
    const curYear = now.getFullYear();
    const curMonthNum = now.getMonth() + 1;

    const prev1Date = new Date(curYear, now.getMonth() - 1, 1);
    const prev1Year = prev1Date.getFullYear();
    const prev1MonthNum = prev1Date.getMonth() + 1;

    // Encrypt "password123" using bcrypt so exports.login (bcrypt.compare) succeeds 100%
    const salt = await bcrypt.genSalt(10);
    const sharedPasswordHash = await bcrypt.hash("password123", salt);

    // =========================================================================
    // 1. COLLECTION 1: USERS (4 Personas — valid bcrypt passwordHash + oauthId)
    // =========================================================================
    const darrenId = new mongoose.Types.ObjectId();
    const zhunyinId = new mongoose.Types.ObjectId();
    const aimanId = new mongoose.Types.ObjectId();
    const chloeId = new mongoose.Types.ObjectId();

    const userDocs = [
      {
        _id: darrenId,
        username: "Darren Google",
        email: "darren.google@gmail.com",
        passwordHash: sharedPasswordHash,
        oauthProvider: "GOOGLE",
        oauthId: "109283746554321098765",
        isNotificationEnabled: true,
        autoCaptureEnabled: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        _id: zhunyinId,
        username: "Gan Zhun Yin",
        email: "ganzhunyin@gmail.com",
        passwordHash: sharedPasswordHash,
        oauthProvider: "GOOGLE",
        oauthId: "109283746554321098888",
        isNotificationEnabled: true,
        autoCaptureEnabled: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        _id: aimanId,
        username: "Aiman Saver",
        email: "aiman.saver@gmail.com",
        passwordHash: sharedPasswordHash,
        oauthProvider: "GOOGLE",
        oauthId: "109283746554321098777",
        isNotificationEnabled: true,
        autoCaptureEnabled: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        _id: chloeId,
        username: "Chloe Fresh",
        email: "chloe.fresh@gmail.com",
        passwordHash: sharedPasswordHash,
        oauthProvider: "GOOGLE",
        oauthId: "109283746554321098666",
        isNotificationEnabled: true,
        autoCaptureEnabled: false,
        createdAt: now,
        updatedAt: now,
      },
    ];

    await User.collection.insertMany(userDocs);

    // =========================================================================
    // 2. COLLECTION 2: BUDGETS (Per-Month Setups)
    // =========================================================================
    const budgetDocs = [
      // Darren: Last Month (60/25/15) + Current Month (50/30/20)
      {
        userId: darrenId,
        year: prev1Year,
        month: prev1MonthNum,
        monthlyLimit: 2200,
        savingsTarget: 400,
        presetId: "60_25_15",
        presetName: "Student-Friendly",
        needsPct: 60,
        wantsPct: 25,
        savingsPct: 15,
        alertThreshold: 0.8,
        createdAt: now,
        updatedAt: now,
      },
      {
        userId: darrenId,
        year: curYear,
        month: curMonthNum,
        monthlyLimit: 2400,
        savingsTarget: 600,
        presetId: "50_30_20",
        presetName: "Balanced",
        needsPct: 50,
        wantsPct: 30,
        savingsPct: 20,
        alertThreshold: 0.8,
        createdAt: now,
        updatedAt: now,
      },
      // Gan Zhun Yin: Current Month (Student-Friendly 60/25/15, RM 1,500 Limit -> 92% Used)
      {
        userId: zhunyinId,
        year: curYear,
        month: curMonthNum,
        monthlyLimit: 1500,
        savingsTarget: 250,
        presetId: "60_25_15",
        presetName: "Student-Friendly",
        needsPct: 60,
        wantsPct: 25,
        savingsPct: 15,
        alertThreshold: 0.8,
        createdAt: now,
        updatedAt: now,
      },
      // Aiman Saver: Current Month (Fast Saver 50/20/30, RM 3,360 Limit)
      {
        userId: aimanId,
        year: curYear,
        month: curMonthNum,
        monthlyLimit: 3360,
        savingsTarget: 1440,
        presetId: "50_20_30",
        presetName: "Fast Saver",
        needsPct: 50,
        wantsPct: 20,
        savingsPct: 30,
        alertThreshold: 0.8,
        createdAt: now,
        updatedAt: now,
      },
    ];

    await Budget.collection.insertMany(budgetDocs);

    // =========================================================================
    // 3. COLLECTION 3: TRANSACTIONS (16 Standardized Categories)
    // =========================================================================
    const txDocs = [
      // --- DARREN: Two Months Ago (No budget set for this month) ---
      buildTxDoc({
        userId: darrenId,
        type: "INCOME",
        category: "SALARY",
        merchantName: "Internship Stipend & Part-Time",
        amount: 2800,
        date: makeDate(-2, 1, 9, 0),
        description: "Monthly payroll",
        source: "MANUAL",
      }),
      buildTxDoc({
        userId: darrenId,
        type: "EXPENSE",
        category: "HOUSING",
        merchantName: "Sunway Room Rental",
        amount: 650,
        date: makeDate(-2, 3, 10, 15),
        description: "Monthly rent",
        source: "MANUAL",
      }),
      buildTxDoc({
        userId: darrenId,
        type: "EXPENSE",
        category: "FOOD_AND_BEVERAGE",
        merchantName: "FamilyMart & Campus Meals",
        amount: 420,
        date: makeDate(-2, 12, 13, 20),
        description: "Lunches and snacks",
        source: "OCR",
      }),
      buildTxDoc({
        userId: darrenId,
        type: "EXPENSE",
        category: "TRANSPORT",
        merchantName: "Grab & RapidKL Pass",
        amount: 180,
        date: makeDate(-2, 18, 18, 45),
        description: "Auto-captured from GrabPay",
        source: "NOTIFICATION",
      }),

      // --- DARREN: Last Month (Student-Friendly 60/25/15 Budget) ---
      buildTxDoc({
        userId: darrenId,
        type: "INCOME",
        category: "SALARY",
        merchantName: "Monthly Salary Credited",
        amount: 3200,
        date: makeDate(-1, 1, 9, 0),
        description: "Base salary",
        source: "MANUAL",
      }),
      buildTxDoc({
        userId: darrenId,
        type: "EXPENSE",
        category: "HOUSING",
        merchantName: "Sunway Room Rental",
        amount: 650,
        date: makeDate(-1, 2, 11, 0),
        description: "Monthly room rent",
        source: "MANUAL",
      }),
      buildTxDoc({
        userId: darrenId,
        type: "EXPENSE",
        category: "GROCERIES",
        merchantName: "Jaya Grocer Sunway Geo",
        amount: 245.8,
        date: makeDate(-1, 8, 16, 30),
        description: "Weekly groceries",
        source: "OCR",
      }),
      buildTxDoc({
        userId: darrenId,
        type: "EXPENSE",
        category: "FOOD_AND_BEVERAGE",
        merchantName: "ZUS Coffee & Nando's",
        amount: 310.5,
        date: makeDate(-1, 15, 19, 10),
        description: "Auto-captured from Touch 'n Go eWallet",
        source: "NOTIFICATION",
      }),
      buildTxDoc({
        userId: darrenId,
        type: "EXPENSE",
        category: "BILLS_AND_UTILITIES",
        merchantName: "TIME Fibre & Digi Postpaid",
        amount: 149.0,
        date: makeDate(-1, 21, 14, 0),
        description: "Internet and mobile bill",
        source: "MANUAL",
      }),
      buildTxDoc({
        userId: darrenId,
        type: "EXPENSE",
        category: "SHOPPING",
        merchantName: "Uniqlo Mid Valley",
        amount: 199.9,
        date: makeDate(-1, 25, 15, 40),
        description: "Work shirts",
        source: "OCR",
      }),

      // --- DARREN: Current Month (9 active days -> Linear Regression active) ---
      buildTxDoc({
        userId: darrenId,
        type: "INCOME",
        category: "SALARY",
        merchantName: "Tech Corp Monthly Salary",
        amount: 3200,
        date: makeDate(0, 1, 9, 0),
        description: "Monthly salary",
        source: "MANUAL",
      }),
      buildTxDoc({
        userId: darrenId,
        type: "INCOME",
        category: "FREELANCE",
        merchantName: "UI Design Side Project",
        amount: 450,
        date: makeDate(0, 3, 17, 0),
        description: "Auto-captured from DuitNow",
        source: "NOTIFICATION",
      }),
      buildTxDoc({
        userId: darrenId,
        type: "EXPENSE",
        category: "HOUSING",
        merchantName: "Sunway Condo Rental",
        amount: 650,
        date: makeDate(0, 1, 10, 30),
        description: "Monthly rental transfer",
        source: "MANUAL",
      }),
      buildTxDoc({
        userId: darrenId,
        type: "EXPENSE",
        category: "GROCERIES",
        merchantName: "99 Speedmart Ampang",
        amount: 88.4,
        date: makeDate(0, 2, 18, 15),
        description: "Household essentials",
        source: "OCR",
      }),
      buildTxDoc({
        userId: darrenId,
        type: "EXPENSE",
        category: "FOOD_AND_BEVERAGE",
        merchantName: "ZUS Coffee Sunway",
        amount: 14.9,
        date: makeDate(0, 3, 12, 45),
        description: "Auto-captured from Touch 'n Go eWallet",
        source: "NOTIFICATION",
      }),
      buildTxDoc({
        userId: darrenId,
        type: "EXPENSE",
        category: "TRANSPORT",
        merchantName: "Petronas Setel Subang",
        amount: 65.0,
        date: makeDate(0, 4, 19, 20),
        description: "RON95 fuel",
        source: "MANUAL",
      }),
      buildTxDoc({
        userId: darrenId,
        type: "EXPENSE",
        category: "FOOD_AND_BEVERAGE",
        merchantName: "FamilyMart Sunway Pyramid",
        amount: 21.5,
        date: makeDate(0, 5, 14, 10),
        description: "Auto-captured from Touch 'n Go eWallet",
        source: "NOTIFICATION",
      }),
      buildTxDoc({
        userId: darrenId,
        type: "EXPENSE",
        category: "SHOPPING",
        merchantName: "Shopee Malaysia Mall",
        amount: 145.0,
        date: makeDate(0, 6, 21, 0),
        description: "Desk accessories",
        source: "MANUAL",
      }),
      buildTxDoc({
        userId: darrenId,
        type: "EXPENSE",
        category: "BILLS_AND_UTILITIES",
        merchantName: "Tenaga Nasional (TNB) & Digi",
        amount: 128.0,
        date: makeDate(0, 7, 11, 30),
        description: "Electricity & telco bill",
        source: "MANUAL",
      }),
      buildTxDoc({
        userId: darrenId,
        type: "EXPENSE",
        category: "LEISURE_AND_ENTERTAINMENT",
        merchantName: "GSC Cinemas & Spotify",
        amount: 58.0,
        date: makeDate(0, 8, 20, 45),
        description: "Weekend movie & music sub",
        source: "OCR",
      }),
      buildTxDoc({
        userId: darrenId,
        type: "EXPENSE",
        category: "HEALTH_AND_WELLNESS",
        merchantName: "Watsons Pharmacy",
        amount: 46.2,
        date: makeDate(0, 9, 16, 0),
        description: "Auto-captured from MAE by Maybank2u",
        source: "NOTIFICATION",
      }),

      // --- GAN ZHUN YIN: Student 92% Budget Risk (RM 1,380 / RM 1,500) ---
      buildTxDoc({
        userId: zhunyinId,
        type: "INCOME",
        category: "ALLOWANCE",
        merchantName: "Parents Monthly Allowance",
        amount: 1800,
        date: makeDate(0, 1, 9, 0),
        description: "Monthly university allowance",
        source: "MANUAL",
      }),
      buildTxDoc({
        userId: zhunyinId,
        type: "EXPENSE",
        category: "HOUSING",
        merchantName: "Sunway Monash Residence",
        amount: 700,
        date: makeDate(0, 1, 11, 0),
        description: "Student hostel rent",
        source: "MANUAL",
      }),
      buildTxDoc({
        userId: zhunyinId,
        type: "EXPENSE",
        category: "EDUCATION",
        merchantName: "Kinokuniya & Lab Materials",
        amount: 165,
        date: makeDate(0, 2, 15, 0),
        description: "Reference books",
        source: "OCR",
      }),
      buildTxDoc({
        userId: zhunyinId,
        type: "EXPENSE",
        category: "FOOD_AND_BEVERAGE",
        merchantName: "Chagee & GrabFood Orders",
        amount: 140,
        date: makeDate(0, 3, 19, 30),
        description: "Group study meals",
        source: "OCR",
      }),
      buildTxDoc({
        userId: zhunyinId,
        type: "EXPENSE",
        category: "TRANSPORT",
        merchantName: "Grab Rides to Campus",
        amount: 85,
        date: makeDate(0, 4, 9, 15),
        description: "Rainy day rides",
        source: "MANUAL",
      }),
      buildTxDoc({
        userId: zhunyinId,
        type: "EXPENSE",
        category: "GROCERIES",
        merchantName: "Village Grocer Sunway",
        amount: 110,
        date: makeDate(0, 6, 17, 45),
        description: "Weekly groceries",
        source: "OCR",
      }),
      buildTxDoc({
        userId: zhunyinId,
        type: "EXPENSE",
        category: "SHOPPING",
        merchantName: "Cotton On & TikTok Shop",
        amount: 120,
        date: makeDate(0, 7, 21, 10),
        description: "Apparel",
        source: "MANUAL",
      }),
      buildTxDoc({
        userId: zhunyinId,
        type: "EXPENSE",
        category: "FOOD_AND_BEVERAGE",
        merchantName: "Haidilao Sunway Pyramid",
        amount: 60,
        date: makeDate(0, 8, 20, 0),
        description: "Birthday dinner split",
        source: "OCR",
      }),

      // --- AIMAN SAVER: Fast Saver (50/20/30) High Surplus ---
      buildTxDoc({
        userId: aimanId,
        type: "INCOME",
        category: "SALARY",
        merchantName: "Software Engineer Salary",
        amount: 4200,
        date: makeDate(0, 1, 9, 0),
        description: "Monthly salary",
        source: "MANUAL",
      }),
      buildTxDoc({
        userId: aimanId,
        type: "INCOME",
        category: "INVESTMENT_RETURN",
        merchantName: "ASNB & TNG GO+ Dividend",
        amount: 600,
        date: makeDate(0, 2, 10, 0),
        description: "Quarterly return",
        source: "MANUAL",
      }),
      buildTxDoc({
        userId: aimanId,
        type: "EXPENSE",
        category: "HOUSING",
        merchantName: "Apartment Rental",
        amount: 800,
        date: makeDate(0, 2, 12, 0),
        description: "Monthly rent",
        source: "MANUAL",
      }),
      buildTxDoc({
        userId: aimanId,
        type: "EXPENSE",
        category: "GROCERIES",
        merchantName: "Lotus's Hypermarket",
        amount: 260,
        date: makeDate(0, 4, 18, 0),
        description: "Home cooking ingredients",
        source: "OCR",
      }),
      buildTxDoc({
        userId: aimanId,
        type: "EXPENSE",
        category: "TRANSPORT",
        merchantName: "Shell Fuel & PLUS Toll",
        amount: 190,
        date: makeDate(0, 6, 14, 0),
        description: "Auto-captured from Touch 'n Go eWallet",
        source: "NOTIFICATION",
      }),
      buildTxDoc({
        userId: aimanId,
        type: "EXPENSE",
        category: "BILLS_AND_UTILITIES",
        merchantName: "Unifi & Air Selangor",
        amount: 130,
        date: makeDate(0, 7, 16, 0),
        description: "Utilities",
        source: "MANUAL",
      }),
      buildTxDoc({
        userId: aimanId,
        type: "EXPENSE",
        category: "FOOD_AND_BEVERAGE",
        merchantName: "Richiamo Coffee",
        amount: 70,
        date: makeDate(0, 8, 13, 0),
        description: "Auto-captured from MAE by Maybank2u",
        source: "NOTIFICATION",
      }),
    ];

    await Transaction.collection.insertMany(txDocs);

    // =========================================================================
    // 4. COLLECTION 4: NOTIFICATIONS
    // =========================================================================
    const notifDocs = [
      {
        userId: darrenId,
        tag: "GOAL",
        title: "Balanced 50/30/20 Plan Active",
        message: "Your monthly budget limit of RM 2,400.00 and savings goal of RM 600.00 are active.",
        isRead: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        userId: darrenId,
        tag: "TXN",
        title: "Auto-Captured: FamilyMart Sunway Pyramid",
        message: "Touch 'n Go eWallet payment of RM 21.50 (FOOD AND BEVERAGE) was automatically added to your Transaction History.",
        isRead: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        userId: darrenId,
        tag: "AI",
        title: "Smart Spending Forecast Ready",
        message: "You have logged 9 active days this month. Anchored Linear Regression forecasting is now active in Insights!",
        isRead: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        userId: zhunyinId,
        tag: "ALERT",
        title: "Approaching Monthly Budget (92% Used)",
        message: "Heads up! You have spent RM 1,380.00 of your RM 1,500.00 Student-Friendly budget limit this month.",
        isRead: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        userId: zhunyinId,
        tag: "AI",
        title: "Over-Budget Risk Detected",
        message: "At your current daily burn rate, your month-end spending is projected to exceed RM 1,500. Check Insights for saving tips!",
        isRead: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        userId: aimanId,
        tag: "GOAL",
        title: "On Track for 30% Fast Saver Goal",
        message: "Great discipline! Your discretionary Wants spending is well controlled, keeping you on track to save RM 1,440+ this month.",
        isRead: false,
        createdAt: now,
        updatedAt: now,
      },
    ];

    await Notification.collection.insertMany(notifDocs);

    // =========================================================================
    // 5. COLLECTION 5: ALLINSIGHTSPREDICTIONS (Table 4.4 Schema)
    // =========================================================================
    const insightPredictionDocs = [
      {
        userId: darrenId,
        insightType: "RECOMMENDATION",
        message:
          "Based on 9 active spending days this month, your estimated month-end total is RM 1,985.50, well within your RM 2,400.00 Balanced (50/30/20) budget.",
        checklistItems: [
          {
            itemId: "chk_pack_lunch",
            text: "Brew coffee or pack lunch 2 days a week to trim Food & Beverage spend (Save ~RM 80)",
            isCompleted: false,
          },
          {
            itemId: "chk_cap_shopping",
            text: "Wait 24 hours before checking out Shopee cart items (Save ~RM 60)",
            isCompleted: true,
          },
        ],
        predictedAmount: 1985.5,
        generatedAt: now,
      },
      {
        userId: darrenId,
        insightType: "ACTION_CHECKLIST",
        message: "Monthly savings habit tracker for Balanced 50/30/20 budget plan.",
        checklistItems: [
          {
            itemId: "chk_auto_transfer",
            text: "Transfer RM 600.00 into your savings account before month-end (Save ~RM 600)",
            isCompleted: false,
          },
        ],
        predictedAmount: 1985.5,
        generatedAt: now,
      },
      {
        userId: zhunyinId,
        insightType: "WARNING",
        message:
          "Over-Budget Risk Alert: You have already used 92% (RM 1,380.00 / RM 1,500.00) of your monthly budget. Linear regression projects RM 1,790.00 by month-end.",
        checklistItems: [
          {
            itemId: "chk_limit_delivery",
            text: "Pause GrabFood & beverage delivery orders for the next 7 days (Save ~RM 95)",
            isCompleted: false,
          },
          {
            itemId: "chk_public_transit",
            text: "Use BRT/LRT student pass instead of peak-hour Grab rides (Save ~RM 55)",
            isCompleted: false,
          },
        ],
        predictedAmount: 1790.0,
        generatedAt: now,
      },
      {
        userId: aimanId,
        insightType: "ADVICE",
        message:
          "Excellent financial discipline! Your projected month-end spending is RM 1,850.00 against your RM 3,360.00 limit, leaving over RM 2,900.00 in net surplus.",
        checklistItems: [
          {
            itemId: "chk_invest_surplus",
            text: "Allocate RM 1,440.00 into ASNB or TNG GO+ to lock in your 30% Fast Saver goal (Save ~RM 1440)",
            isCompleted: true,
          },
        ],
        predictedAmount: 1850.0,
        generatedAt: now,
      },
    ];

    await AllInsightsPrediction.collection.insertMany(insightPredictionDocs);

    console.log("--------------------------------------------------------------------------------");
    console.log("[OK] SEEDING COMPLETE ACROSS ALL 5 COLLECTIONS:");
    console.log(`  - Users inserted                  : ${userDocs.length}`);
    console.log(`  - Budgets inserted                : ${budgetDocs.length}`);
    console.log(`  - Transactions inserted           : ${txDocs.length}`);
    console.log(`  - Notifications inserted          : ${notifDocs.length}`);
    console.log(`  - AllInsightsPredictions inserted : ${insightPredictionDocs.length}`);
    console.log("--------------------------------------------------------------------------------");
    console.table([
      {
        Persona: "1. Darren Google (Balanced + AutoCapture ON)",
        Email: "darren.google@gmail.com",
        Password: "password123",
        OAuth_ID: "109283746554321098765",
        User_ID: String(darrenId),
      },
      {
        Persona: "2. Gan Zhun Yin (Student 92% Budget Risk)",
        Email: "ganzhunyin@gmail.com",
        Password: "password123",
        OAuth_ID: "109283746554321098888",
        User_ID: String(zhunyinId),
      },
      {
        Persona: "3. Aiman Saver (Fast Saver 50/20/30)",
        Email: "aiman.saver@gmail.com",
        Password: "password123",
        OAuth_ID: "109283746554321098777",
        User_ID: String(aimanId),
      },
      {
        Persona: "4. Chloe Fresh (Cold-Start 0 Data)",
        Email: "chloe.fresh@gmail.com",
        Password: "password123",
        OAuth_ID: "109283746554321098666",
        User_ID: String(chloeId),
      },
    ]);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("[ERROR] Seeding failed:", error);
    process.exit(1);
  }
}

seedDatabase();
