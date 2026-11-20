/**
 * @file backend/scripts/seedTestUsers.js
 * @description Seeds all 5 MongoDB collections (User, Transaction, Budget, Notification, AllInsightsPrediction) across 4 distinct test personas with password "password123":
 *   1. Ka-Ching Demo   -> Balanced (50/30/20) + 3-month history + Google Linked (kaching.pfmapp@gmail.com)
 *   2. Mei Ling Tan    -> Student-Friendly (60/25/15) + 92% Budget Risk + Google Linked
 *   3. Aiman Saver     -> Fast Saver (50/20/30) + Unbound Google (for testing Bind Google)
 *   4. Chloe Fresh     -> Cold-Start (0 Data -> Default Balanced 50/30/20)
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

const MONGO_URI = process.env.MONGO_URI;

const makeDate = (monthOffset, dayOfMonth, hour = 13, minute = 30) => {
  const now = new Date();
  const targetYear = now.getFullYear();
  const targetMonth = now.getMonth() + monthOffset;
  const maxDayInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  const cappedDay = monthOffset === 0 ? Math.min(dayOfMonth, now.getDate()) : Math.min(dayOfMonth, maxDayInMonth);
  return new Date(targetYear, targetMonth, Math.max(1, cappedDay), hour, minute, 0);
};

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

    await Promise.all([
      User.deleteMany({}),
      Transaction.deleteMany({}),
      Budget.deleteMany({}),
      Notification.deleteMany({}),
      AllInsightsPrediction.deleteMany({}),
    ]);
    console.log("[INFO] Cleared all 5 collections. Seeding 4 distinct test personas...\n");

    const now = new Date();
    const curYear = now.getFullYear();
    const curMonthNum = now.getMonth() + 1;

    const prev1Date = new Date(curYear, now.getMonth() - 1, 1);
    const prev1Year = prev1Date.getFullYear();
    const prev1MonthNum = prev1Date.getMonth() + 1;

    const salt = await bcrypt.genSalt(10);
    const sharedPasswordHash = await bcrypt.hash("password123", salt);

    const kachingDemoId = new mongoose.Types.ObjectId();
    const studentId = new mongoose.Types.ObjectId();
    const aimanId = new mongoose.Types.ObjectId();
    const chloeId = new mongoose.Types.ObjectId();

    const userDocs = [
      {
        _id: kachingDemoId,
        username: "Ka-Ching Demo",
        email: "kaching.pfmapp@gmail.com",
        passwordHash: sharedPasswordHash,
        oauthProvider: "GOOGLE",
        oauthId: "109283746554321098765",
        isNotificationEnabled: true,
        autoCaptureEnabled: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        _id: studentId,
        username: "Mei Ling Tan",
        email: "meiling.student@gmail.com",
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
        oauthProvider: "NONE",
        oauthId: null,
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

    const budgetDocs = [
      {
        userId: kachingDemoId,
        year: prev1Year,
        month: prev1MonthNum,
        monthlyLimit: 2560,
        savingsTarget: 640,
        presetId: "50_30_20",
        presetName: "Balanced",
        needsPct: 50,
        wantsPct: 30,
        savingsPct: 20,
        alertThreshold: 0.8,
        createdAt: now,
        updatedAt: now,
      },
      {
        userId: kachingDemoId,
        year: curYear,
        month: curMonthNum,
        monthlyLimit: 2800,
        savingsTarget: 700,
        presetId: "50_30_20",
        presetName: "Balanced",
        needsPct: 50,
        wantsPct: 30,
        savingsPct: 20,
        alertThreshold: 0.8,
        createdAt: now,
        updatedAt: now,
      },
      {
        userId: studentId,
        year: curYear,
        month: curMonthNum,
        monthlyLimit: 1500,
        savingsTarget: 270,
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

    const txDocs = [
      // =========================================================================
      // PERSONA 1: KA-CHING DEMO (kaching.pfmapp@gmail.com) -> AI Suggests BALANCED (50/30/20)
      // Current month: Income RM 3,500 | Needs ~RM 1,560 (45%) | Wants ~RM 880 (25%)
      // =========================================================================
      // 2 Months Ago
      buildTxDoc({
        userId: kachingDemoId,
        type: "INCOME",
        category: "SALARY",
        merchantName: "Tech Corp Monthly Salary",
        amount: 3200,
        date: makeDate(-2, 1, 9, 0),
        description: "Monthly payroll",
        source: "MANUAL",
      }),
      buildTxDoc({
        userId: kachingDemoId,
        type: "EXPENSE",
        category: "HOUSING",
        merchantName: "Sunway Condo Rental",
        amount: 750,
        date: makeDate(-2, 3, 10, 15),
        description: "Monthly rent",
        source: "MANUAL",
      }),
      buildTxDoc({
        userId: kachingDemoId,
        type: "EXPENSE",
        category: "FOOD_AND_BEVERAGE",
        merchantName: "FamilyMart & Campus Meals",
        amount: 460,
        date: makeDate(-2, 12, 13, 20),
        description: "Lunches and snacks",
        source: "OCR",
      }),
      buildTxDoc({
        userId: kachingDemoId,
        type: "EXPENSE",
        category: "TRANSPORT",
        merchantName: "Petronas Setel & RapidKL",
        amount: 240,
        date: makeDate(-2, 18, 18, 45),
        description: "Auto-captured from GrabPay",
        source: "NOTIFICATION",
      }),
      buildTxDoc({
        userId: kachingDemoId,
        type: "EXPENSE",
        category: "SHOPPING",
        merchantName: "Uniqlo & Shopee Mall",
        amount: 540,
        date: makeDate(-2, 22, 15, 0),
        description: "Clothing & gadgets",
        source: "MANUAL",
      }),
      buildTxDoc({
        userId: kachingDemoId,
        type: "EXPENSE",
        category: "LEISURE_AND_ENTERTAINMENT",
        merchantName: "GSC IMAX & Weekend Outing",
        amount: 310,
        date: makeDate(-2, 26, 20, 30),
        description: "Movies and karaoke",
        source: "OCR",
      }),

      // 1 Month Ago
      buildTxDoc({
        userId: kachingDemoId,
        type: "INCOME",
        category: "SALARY",
        merchantName: "Tech Corp Monthly Salary",
        amount: 3200,
        date: makeDate(-1, 1, 9, 0),
        description: "Base salary",
        source: "MANUAL",
      }),
      buildTxDoc({
        userId: kachingDemoId,
        type: "EXPENSE",
        category: "HOUSING",
        merchantName: "Sunway Condo Rental",
        amount: 750,
        date: makeDate(-1, 2, 11, 0),
        description: "Monthly room rent",
        source: "MANUAL",
      }),
      buildTxDoc({
        userId: kachingDemoId,
        type: "EXPENSE",
        category: "GROCERIES",
        merchantName: "Jaya Grocer Sunway Geo",
        amount: 295.8,
        date: makeDate(-1, 8, 16, 30),
        description: "Weekly groceries",
        source: "OCR",
      }),
      buildTxDoc({
        userId: kachingDemoId,
        type: "EXPENSE",
        category: "FOOD_AND_BEVERAGE",
        merchantName: "ZUS Coffee & Nando's",
        amount: 340.5,
        date: makeDate(-1, 15, 19, 10),
        description: "Auto-captured from Touch 'n Go eWallet",
        source: "NOTIFICATION",
      }),
      buildTxDoc({
        userId: kachingDemoId,
        type: "EXPENSE",
        category: "BILLS_AND_UTILITIES",
        merchantName: "TIME Fibre & Digi Postpaid",
        amount: 149.0,
        date: makeDate(-1, 21, 14, 0),
        description: "Internet and mobile bill",
        source: "MANUAL",
      }),
      buildTxDoc({
        userId: kachingDemoId,
        type: "EXPENSE",
        category: "SHOPPING",
        merchantName: "Uniqlo Mid Valley & Nike",
        amount: 580.0,
        date: makeDate(-1, 24, 15, 40),
        description: "Work shirts & sneakers",
        source: "OCR",
      }),
      buildTxDoc({
        userId: kachingDemoId,
        type: "EXPENSE",
        category: "LEISURE_AND_ENTERTAINMENT",
        merchantName: "Genting Day Trip & Spotify",
        amount: 290.0,
        date: makeDate(-1, 27, 19, 0),
        description: "Weekend entertainment",
        source: "MANUAL",
      }),

      // Current Month (Ka-Ching Demo: Income 3,500 | Needs 1,560 [45%] | Wants 880 [25%] | Total 2,440 [70%])
      buildTxDoc({
        userId: kachingDemoId,
        type: "INCOME",
        category: "SALARY",
        merchantName: "Tech Corp Monthly Salary",
        amount: 3200,
        date: makeDate(0, 1, 9, 0),
        description: "Monthly salary",
        source: "MANUAL",
      }),
      buildTxDoc({
        userId: kachingDemoId,
        type: "INCOME",
        category: "FREELANCE",
        merchantName: "UI Design Side Project",
        amount: 300,
        date: makeDate(0, 4, 17, 0),
        description: "Auto-captured from DuitNow",
        source: "NOTIFICATION",
      }),
      buildTxDoc({
        userId: kachingDemoId,
        type: "EXPENSE",
        category: "HOUSING",
        merchantName: "Sunway Condo Rental",
        amount: 750,
        date: makeDate(0, 1, 10, 30),
        description: "Monthly rental transfer",
        source: "MANUAL",
      }),
      buildTxDoc({
        userId: kachingDemoId,
        type: "EXPENSE",
        category: "GROCERIES",
        merchantName: "99 Speedmart Ampang",
        amount: 245.5,
        date: makeDate(0, 3, 18, 15),
        description: "Household essentials",
        source: "OCR",
      }),
      buildTxDoc({
        userId: kachingDemoId,
        type: "EXPENSE",
        category: "FOOD_AND_BEVERAGE",
        merchantName: "ZUS Coffee & Oriental Kopi",
        amount: 184.5,
        date: makeDate(0, 6, 12, 45),
        description: "Auto-captured from Touch 'n Go eWallet",
        source: "NOTIFICATION",
      }),
      buildTxDoc({
        userId: kachingDemoId,
        type: "EXPENSE",
        category: "TRANSPORT",
        merchantName: "Petronas Setel Subang",
        amount: 165.0,
        date: makeDate(0, 9, 19, 20),
        description: "RON95 fuel & toll",
        source: "MANUAL",
      }),
      buildTxDoc({
        userId: kachingDemoId,
        type: "EXPENSE",
        category: "SHOPPING",
        merchantName: "Shopee Malaysia Mall",
        amount: 495.0,
        date: makeDate(0, 11, 21, 0),
        description: "Mechanical keyboard & desk accessories",
        source: "MANUAL",
      }),
      buildTxDoc({
        userId: kachingDemoId,
        type: "EXPENSE",
        category: "BILLS_AND_UTILITIES",
        merchantName: "Tenaga Nasional (TNB) & Digi",
        amount: 148.0,
        date: makeDate(0, 13, 11, 30),
        description: "Electricity & telco bill",
        source: "MANUAL",
      }),
      buildTxDoc({
        userId: kachingDemoId,
        type: "EXPENSE",
        category: "LEISURE_AND_ENTERTAINMENT",
        merchantName: "GSC Cinemas, Bowling & Spotify",
        amount: 245.0,
        date: makeDate(0, 15, 20, 45),
        description: "Weekend movie & hangout",
        source: "OCR",
      }),
      buildTxDoc({
        userId: kachingDemoId,
        type: "EXPENSE",
        category: "OTHER_EXPENSE",
        merchantName: "Gift & Coffee Catch-up",
        amount: 140.0,
        date: makeDate(0, 17, 15, 20),
        description: "Friend birthday gift",
        source: "MANUAL",
      }),
      buildTxDoc({
        userId: kachingDemoId,
        type: "EXPENSE",
        category: "HEALTH_AND_WELLNESS",
        merchantName: "Watsons Pharmacy",
        amount: 67.0,
        date: makeDate(0, 19, 16, 0),
        description: "Auto-captured from MAE by Maybank2u",
        source: "NOTIFICATION",
      }),

      // =========================================================================
      // PERSONA 2: MEI LING TAN -> AI Suggests STUDENT-FRIENDLY (60/25/15) + 92% Risk
      // Income RM 1,800 | Needs RM 1,260 (70% of income) | Wants RM 120 (7%) | Total RM 1,380
      // =========================================================================
      buildTxDoc({
        userId: studentId,
        type: "INCOME",
        category: "ALLOWANCE",
        merchantName: "Parents Monthly Allowance",
        amount: 1800,
        date: makeDate(0, 1, 9, 0),
        description: "Monthly university allowance",
        source: "MANUAL",
      }),
      buildTxDoc({
        userId: studentId,
        type: "EXPENSE",
        category: "HOUSING",
        merchantName: "Sunway Monash Residence",
        amount: 700,
        date: makeDate(0, 1, 11, 0),
        description: "Student hostel rent",
        source: "MANUAL",
      }),
      buildTxDoc({
        userId: studentId,
        type: "EXPENSE",
        category: "EDUCATION",
        merchantName: "Kinokuniya & Lab Materials",
        amount: 165,
        date: makeDate(0, 4, 15, 0),
        description: "Reference books",
        source: "OCR",
      }),
      buildTxDoc({
        userId: studentId,
        type: "EXPENSE",
        category: "FOOD_AND_BEVERAGE",
        merchantName: "Chagee & GrabFood Orders",
        amount: 140,
        date: makeDate(0, 7, 19, 30),
        description: "Group study meals",
        source: "OCR",
      }),
      buildTxDoc({
        userId: studentId,
        type: "EXPENSE",
        category: "TRANSPORT",
        merchantName: "Grab Rides to Campus",
        amount: 85,
        date: makeDate(0, 10, 9, 15),
        description: "Rainy day rides",
        source: "MANUAL",
      }),
      buildTxDoc({
        userId: studentId,
        type: "EXPENSE",
        category: "GROCERIES",
        merchantName: "Village Grocer Sunway",
        amount: 110,
        date: makeDate(0, 13, 17, 45),
        description: "Weekly groceries",
        source: "OCR",
      }),
      buildTxDoc({
        userId: studentId,
        type: "EXPENSE",
        category: "SHOPPING",
        merchantName: "Cotton On & TikTok Shop",
        amount: 120,
        date: makeDate(0, 16, 21, 10),
        description: "Apparel",
        source: "MANUAL",
      }),
      buildTxDoc({
        userId: studentId,
        type: "EXPENSE",
        category: "FOOD_AND_BEVERAGE",
        merchantName: "Haidilao Sunway Pyramid",
        amount: 60,
        date: makeDate(0, 19, 20, 0),
        description: "Birthday dinner split",
        source: "OCR",
      }),

      // =========================================================================
      // PERSONA 3: AIMAN SAVER -> AI Suggests FAST SAVER (50/20/30)
      // Income RM 4,800 | Needs RM 1,450 (30%) | Wants RM 180 (4%) | Surplus 66%
      // =========================================================================
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
        date: makeDate(0, 3, 10, 0),
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
        date: makeDate(0, 6, 18, 0),
        description: "Home cooking ingredients",
        source: "OCR",
      }),
      buildTxDoc({
        userId: aimanId,
        type: "EXPENSE",
        category: "TRANSPORT",
        merchantName: "Shell Fuel & PLUS Toll",
        amount: 190,
        date: makeDate(0, 10, 14, 0),
        description: "Auto-captured from Touch 'n Go eWallet",
        source: "NOTIFICATION",
      }),
      buildTxDoc({
        userId: aimanId,
        type: "EXPENSE",
        category: "BILLS_AND_UTILITIES",
        merchantName: "Unifi & Air Selangor",
        amount: 130,
        date: makeDate(0, 14, 16, 0),
        description: "Utilities",
        source: "MANUAL",
      }),
      buildTxDoc({
        userId: aimanId,
        type: "EXPENSE",
        category: "FOOD_AND_BEVERAGE",
        merchantName: "Richiamo Coffee",
        amount: 70,
        date: makeDate(0, 16, 13, 0),
        description: "Auto-captured from MAE by Maybank2u",
        source: "NOTIFICATION",
      }),
      buildTxDoc({
        userId: aimanId,
        type: "EXPENSE",
        category: "LEISURE_AND_ENTERTAINMENT",
        merchantName: "Badminton Court & Netflix",
        amount: 180,
        date: makeDate(0, 18, 20, 0),
        description: "Weekly badminton & streaming",
        source: "MANUAL",
      }),
    ];

    await Transaction.collection.insertMany(txDocs);

    const notifDocs = [
      {
        userId: kachingDemoId,
        tag: "GOAL",
        title: "Balanced 50/30/20 Plan Active",
        message: "Your monthly budget limit of RM 2,800.00 and savings goal of RM 700.00 are active.",
        isRead: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        userId: kachingDemoId,
        tag: "TXN",
        title: "Auto-Captured RM 67.00",
        message: "Watsons Pharmacy (HEALTH AND WELLNESS) was automatically logged via MAE by Maybank2u.",
        isRead: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        userId: kachingDemoId,
        tag: "AI",
        title: "Smart Spending Forecast Ready",
        message: "Your spending trend is on track with your Balanced (50/30/20) budget plan!",
        isRead: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        userId: studentId,
        tag: "ALERT",
        title: "Approaching Monthly Budget (92% Used)",
        message: "Heads up! You have spent RM 1,380.00 of your RM 1,500.00 Student-Friendly budget limit this month.",
        isRead: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        userId: studentId,
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

    const insightPredictionDocs = [
      {
        userId: kachingDemoId,
        insightType: "RECOMMENDATION",
        message:
          "Your spending is balanced across Needs (45%) and Wants (25%), keeping you comfortably within your RM 2,800.00 Balanced (50/30/20) budget.",
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
        predictedAmount: 2680.0,
        generatedAt: now,
      },
      {
        userId: studentId,
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
          "Excellent financial discipline! Your projected month-end spending is RM 1,980.00 against your RM 3,360.00 limit, leaving over RM 2,800.00 in net surplus.",
        checklistItems: [
          {
            itemId: "chk_invest_surplus",
            text: "Allocate RM 1,440.00 into ASNB or TNG GO+ to lock in your 30% Fast Saver goal (Save ~RM 1440)",
            isCompleted: true,
          },
        ],
        predictedAmount: 1980.0,
        generatedAt: now,
      },
    ];

    await AllInsightsPrediction.collection.insertMany(insightPredictionDocs);

    console.log("--------------------------------------------------------------------------------");
    console.log("[OK] SEEDING COMPLETE ACROSS ALL 5 COLLECTIONS");
    console.log("--------------------------------------------------------------------------------");
    console.table([
      {
        Persona: "1. Ka-Ching Demo (Balanced 50/30/20 + 3-Month History)",
        Email: "kaching.pfmapp@gmail.com",
        Password: "password123",
      },
      {
        Persona: "2. Mei Ling Tan (Student-Friendly 60/25/15 + 92% Risk)",
        Email: "meiling.student@gmail.com",
        Password: "password123",
      },
      {
        Persona: "3. Aiman Saver (Fast Saver 50/20/30 + Unbound Google)",
        Email: "aiman.saver@gmail.com",
        Password: "password123",
      },
      {
        Persona: "4. Chloe Fresh (Cold-Start 0 Data -> Default Balanced)",
        Email: "chloe.fresh@gmail.com",
        Password: "password123",
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
