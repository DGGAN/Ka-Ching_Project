// Import Transaction, Budget, and AllInsightsPrediction models
const Transaction = require("../models/Transaction");
const Budget = require("../models/Budget");
const AllInsightsPrediction = require("../models/AllInsightsPrediction");

// Minimum thresholds required before switching from starter estimation to full trend line
const MIN_TX_FOR_REGRESSION = 5;
const MIN_ACTIVE_DAYS_FOR_REGRESSION = 3;

// 1. Least Squares Linear Regression helper: Takes (x, y) pairs and returns slope m and intercept c
const computeLinearRegression = (points) => {
  const n = points.length;
  if (n === 0) return { slope: 0, intercept: 0 };
  if (n === 1) return { slope: points[0].y / Math.max(1, points[0].x), intercept: 0 };

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  points.forEach(({ x, y }) => {
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  });

  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) {
    return { slope: sumY / n, intercept: 0 };
  }

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  return {
    slope: Math.max(0, slope),
    intercept,
  };
};

// 2. Core AI Analytics Engine: Computes forecast & habits and upserts snapshot into MongoDB
const runAnalyticsEngine = async (userId) => {
  // Step 1: Determine current month boundaries and 90-day lookback window
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDay = now.getDate();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const ninetyDaysAgo = new Date(currentYear, currentMonth, currentDay - 90, 0, 0, 0);

  // Step 2: Query 90-day transactions and latest budget from MongoDB
  const [transactions, userBudget] = await Promise.all([
    Transaction.find({
      userId,
      date: { $gte: ninetyDaysAgo },
    }).sort({ date: 1 }),
    Budget.findOne({ userId }).sort({ updatedAt: -1 }),
  ]);

  const monthlyLimit = userBudget?.monthlyLimit || 0;
  const savingsTarget = userBudget?.savingsTarget || 0;

  // Step 3: Aggregate current month daily spending and category totals
  const dailyExpenseMap = {};
  for (let d = 1; d <= daysInMonth; d++) {
    dailyExpenseMap[d] = 0;
  }

  let thisMonthExpense = 0;
  let thisMonthIncome = 0;
  let thisMonthExpenseTxCount = 0;
  const activeSpendDaysSet = new Set();
  const thisMonthCategoryTotals = {};

  transactions.forEach((tx) => {
    const txDate = new Date(tx.date);
    const amt = Number(tx.amount) || 0;
    if (txDate.getFullYear() === currentYear && txDate.getMonth() === currentMonth) {
      if (tx.type === "EXPENSE") {
        const dayNum = txDate.getDate();
        dailyExpenseMap[dayNum] = (dailyExpenseMap[dayNum] || 0) + amt;
        thisMonthExpense += amt;
        thisMonthExpenseTxCount += 1;
        activeSpendDaysSet.add(dayNum);
        thisMonthCategoryTotals[tx.category] = (thisMonthCategoryTotals[tx.category] || 0) + amt;
      } else if (tx.type === "INCOME") {
        thisMonthIncome += amt;
      }
    }
  });

  // Step 4: Build cumulative (x, y) points and compute Anchored Linear Regression forecast
  const regressionPoints = [];
  let runningCumulative = 0;
  for (let d = 1; d <= currentDay; d++) {
    runningCumulative += dailyExpenseMap[d] || 0;
    regressionPoints.push({ x: d, y: Number(runningCumulative.toFixed(2)) });
  }

  const isColdStart = thisMonthExpenseTxCount < MIN_TX_FOR_REGRESSION && activeSpendDaysSet.size < MIN_ACTIVE_DAYS_FOR_REGRESSION;

  const { slope } = computeLinearRegression(regressionPoints);
  const dailyBurnRate = currentDay > 0 ? Number((thisMonthExpense / currentDay).toFixed(2)) : 0;
  const remainingDays = Math.max(0, daysInMonth - currentDay);

  let effectiveSlope = dailyBurnRate;
  let predictedMonthEnd = 0;

  if (thisMonthExpense > 0) {
    if (isColdStart) {
      effectiveSlope = dailyBurnRate;
    } else {
      effectiveSlope = Number(Math.max(slope, dailyBurnRate * 0.75).toFixed(2));
    }
    predictedMonthEnd = Number((thisMonthExpense + effectiveSlope * remainingDays).toFixed(2));
  }

  // Step 5: Generate 5 timeline checkpoints for the frontend SVG trend chart
  const chartCheckpoints = [];
  const sampleDays = Array.from(new Set([1, Math.min(8, currentDay), Math.min(16, currentDay), currentDay, daysInMonth])).sort((a, b) => a - b);

  sampleDays.forEach((dayNum) => {
    if (dayNum <= currentDay) {
      const found = regressionPoints.find((p) => p.x === dayNum);
      chartCheckpoints.push({
        day: dayNum,
        label: dayNum === currentDay ? "Today" : `Day ${dayNum}`,
        actual: found ? found.y : 0,
        predicted: found ? found.y : 0,
        isFuture: false,
      });
    } else {
      chartCheckpoints.push({
        day: dayNum,
        label: "End of Mo",
        actual: null,
        predicted: predictedMonthEnd,
        isFuture: true,
      });
    }
  });

  // Step 6: Mine 90-day spending habits (top merchant and weekend spending ratio)
  const merchantStats = {};
  let weekendSpend = 0;
  let total90DayExpense = 0;

  transactions.forEach((tx) => {
    if (tx.type !== "EXPENSE") return;
    const amt = Number(tx.amount) || 0;
    total90DayExpense += amt;

    const mName = (tx.merchantName || tx.merchant || "General").trim();
    if (!merchantStats[mName]) {
      merchantStats[mName] = { count: 0, total: 0 };
    }
    merchantStats[mName].count += 1;
    merchantStats[mName].total += amt;

    const dayOfWeek = new Date(tx.date).getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      weekendSpend += amt;
    }
  });

  const sortedMerchants = Object.entries(merchantStats).sort((a, b) => b[1].count - a[1].count || b[1].total - a[1].total);
  const topMerchant =
    sortedMerchants.length > 0
      ? {
          name: sortedMerchants[0][0],
          count: sortedMerchants[0][1].count,
          total: Number(sortedMerchants[0][1].total.toFixed(2)),
        }
      : null;

  const sortedCategories = Object.entries(thisMonthCategoryTotals).sort((a, b) => b[1] - a[1]);
  const topCategory =
    sortedCategories.length > 0
      ? {
          category: sortedCategories[0][0],
          amount: Number(sortedCategories[0][1].toFixed(2)),
        }
      : null;

  // Step 7: Build personalized Habit Cards and Actionable To-Do List
  const insightsList = [];
  const checklistItems = [];

  if (isColdStart) {
    insightsList.push({
      id: "cold_start_notice",
      severity: "TIP",
      title: `Learning Your Habits (${thisMonthExpenseTxCount}/${MIN_TX_FOR_REGRESSION} Added)`,
      description: `Add ${Math.max(1, MIN_TX_FOR_REGRESSION - thisMonthExpenseTxCount)} more expenses so the app can give you a more accurate end-of-month estimate.`,
    });
  }

  if (thisMonthExpense > 0) {
    if (monthlyLimit > 0) {
      const variance = predictedMonthEnd - monthlyLimit;
      if (variance > 0) {
        insightsList.push({
          id: "forecast_over",
          severity: "ALERT",
          title: "Might Exceed Monthly Budget",
          description: `At your current pace (RM ${dailyBurnRate}/day), you might spend RM ${predictedMonthEnd.toFixed(2)} by month-end — about RM ${variance.toFixed(2)} over your RM ${monthlyLimit.toFixed(0)} budget.`,
        });
        const safeDailyAllowance = Math.max(0, (monthlyLimit - thisMonthExpense) / Math.max(1, remainingDays));
        checklistItems.push({
          id: "chk_cap_daily",
          text: `Try keeping daily spending under RM ${safeDailyAllowance.toFixed(2)}/day for the rest of the month`,
          impact: `Save RM ${variance.toFixed(0)}`,
        });
      } else {
        insightsList.push({
          id: "forecast_safe",
          severity: "GOOD",
          title: "Safely Within Budget",
          description: `Great job! You are on track to finish the month around RM ${predictedMonthEnd.toFixed(2)}, leaving RM ${Math.abs(variance).toFixed(2)} of your budget unspent.`,
        });
      }
    } else {
      insightsList.push({
        id: "no_budget_set",
        severity: "TIP",
        title: "No Monthly Budget Set Yet",
        description: `You are averaging RM ${dailyBurnRate}/day (estimated RM ${predictedMonthEnd.toFixed(2)} this month). Set a budget in the Budget tab to get early warnings.`,
      });
      checklistItems.push({
        id: "chk_set_budget",
        text: "Go to the Budget tab and apply a recommended monthly limit",
        impact: "Stay on track",
      });
    }

    if (topMerchant) {
      insightsList.push({
        id: "top_merchant_habit",
        severity: topMerchant.count >= 3 ? "HABIT" : "INFO",
        title: `Most Visited Place: ${topMerchant.name}`,
        description: `You spent at "${topMerchant.name}" ${topMerchant.count} ${topMerchant.count === 1 ? "time" : "times"} (RM ${topMerchant.total.toFixed(2)} total) recently.`,
      });
      if (topMerchant.total >= 50) {
        checklistItems.push({
          id: "chk_trim_merchant",
          text: `Cut back on ${topMerchant.name} slightly next week`,
          impact: `Save ~RM ${(topMerchant.total * 0.2).toFixed(0)}`,
        });
      }
    }

    const weekendRatio = total90DayExpense > 0 ? Math.round((weekendSpend / total90DayExpense) * 100) : 0;
    if (weekendRatio >= 40) {
      insightsList.push({
        id: "weekend_surge",
        severity: "HABIT",
        title: `High Weekend Spending (${weekendRatio}%)`,
        description: `${weekendRatio}% of your recent spending happened on Saturdays and Sundays (RM ${weekendSpend.toFixed(2)}).`,
      });
      checklistItems.push({
        id: "chk_weekend_cap",
        text: "Set a small weekend spending limit before Friday night",
        impact: `Save ~RM ${(weekendSpend * 0.15).toFixed(0)}`,
      });
    }
  }

  if (topCategory && checklistItems.length < 3) {
    checklistItems.push({
      id: "chk_top_cat",
      text: `Reduce ${topCategory.category.replace(/_/g, " ").toLowerCase()} spending (RM ${topCategory.amount.toFixed(0)} so far) by 10%`,
      impact: `Save RM ${(topCategory.amount * 0.1).toFixed(0)}`,
    });
  }
  if (checklistItems.length < 3) {
    checklistItems.push({
      id: "chk_transfer_savings",
      text:
        savingsTarget > 0
          ? `Put aside RM ${savingsTarget.toFixed(0)} into savings when you get your allowance or salary`
          : `Add ${Math.max(1, MIN_TX_FOR_REGRESSION - thisMonthExpenseTxCount)} more expenses to improve your monthly forecast`,
      impact: savingsTarget > 0 ? `+RM ${savingsTarget.toFixed(0)} Saved` : "Better AI",
    });
  }

  // Step 8: Upsert the latest prediction snapshot in the AllInsightsPrediction collection
  try {
    await AllInsightsPrediction.findOneAndUpdate(
      { userId },
      {
        userId,
        predictedNextMonthSpend: predictedMonthEnd,
        regressionSlope: effectiveSlope,
        spendingHabitsSummary: insightsList.map((i) => `${i.title}: ${i.description}`).join(" | "),
        actionableChecklist: checklistItems.map((c) => `${c.text} (${c.impact})`),
        generatedAt: new Date(),
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );
  } catch (dbSyncErr) {
    console.log("Prediction snapshot sync note:", dbSyncErr.message);
  }

  // Step 9: Return complete analytics payload
  return {
    isColdStart,
    thisMonthExpenseTxCount,
    currentMonthLabel: now.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    }),
    currentDay,
    daysInMonth,
    thisMonthExpense: Number(thisMonthExpense.toFixed(2)),
    thisMonthIncome: Number(thisMonthIncome.toFixed(2)),
    dailyBurnRate,
    predictedMonthEnd,
    monthlyLimit,
    savingsTarget,
    regressionSlope: effectiveSlope,
    chartCheckpoints,
    insightsList,
    checklistItems,
  };
};

// 3. HTTP GET Handler for /api/analytics/:userId
exports.getAnalytics = async (req, res) => {
  try {
    // Step 1: Extract userId parameter
    const { userId } = req.params;

    // Validation 1: Ensure userId parameter is provided
    if (!userId) {
      return res.status(400).json({
        message: "userId parameter is required.",
      });
    }

    // Step 2: Execute analytics engine and return payload
    const analyticsData = await runAnalyticsEngine(userId);

    res.status(200).json({
      message: "AI Analytics computed successfully.",
      data: analyticsData,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to compute AI analytics.",
      error: error.message,
    });
  }
};

exports.runAnalyticsEngine = runAnalyticsEngine;
