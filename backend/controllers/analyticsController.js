// 导入所需的数据库模型与线性回归机器学习库
// Import required database models and the linear regression machine learning library
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const Budget = require("../models/Budget");
const AllInsightsPrediction = require("../models/AllInsightsPrediction");
const Notification = require("../models/Notification");
const SLR = require("ml-regression").SimpleLinearRegression;

// 核心分析引擎函数（可被 API 路由或新增账单控制器直接调用，实现双触发机制）
// Core analytics engine function (callable by API routes or transaction controller for dual-trigger mechanism)
const runAnalyticsEngine = async (userId) => {
  // 1. 获取用户信息以检查 14 天新手期
  // 1. Fetch user info to check the 14-day onboarding window
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found (用户不存在)");

  const now = new Date();
  const currentPeriod = now.toISOString().slice(0, 7); // 格式 YYYY-MM / Format YYYY-MM
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  // 2. 获取过去 90 天的所有交易记录（用于移动平均和 4 周习惯检测）
  // 2. Fetch all transactions from the past 90 days (for moving average and 4-week pattern detection)
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const allTransactions = await Transaction.find({
    userId,
    date: { $gte: ninetyDaysAgo },
    status: "VERIFIED",
  }).sort({ date: 1 });

  // 分离当月支出、当月收入和过去 90 天支出
  // Separate current month expenses, current month income, and 90-day expenses
  const currentMonthExpenses = allTransactions.filter((tx) => tx.type === "EXPENSE" && new Date(tx.date) >= startOfMonth);
  const currentMonthIncomes = allTransactions.filter((tx) => tx.type === "INCOME" && new Date(tx.date) >= startOfMonth);
  const all90DayExpenses = allTransactions.filter((tx) => tx.type === "EXPENSE");

  // 计算当月总收入（若无记录则默认 RM 2000 作为 EPF 基准）
  // Calculate current month total income (default to RM 2000 as EPF baseline if no records)
  const totalIncome = currentMonthIncomes.reduce((sum, tx) => sum + tx.amount, 0) || 2000;

  // 3. 获取当月预算配置
  // 3. Fetch current month budget configuration
  const budgetDoc = await Budget.findOne({ userId, period: currentPeriod });
  // 若用户未设置预算，按 EPF 50/30/20 法则取收入的 80% (50%必需 + 30%可选) 作为推荐上限
  // If no budget is set, use 80% of income (50% needs + 30% wants) per EPF 50/30/20 rule as recommended limit
  const budgetLimit = budgetDoc ? budgetDoc.limitAmount : Number((totalIncome * 0.8).toFixed(2));
  const savingsTarget = budgetDoc ? budgetDoc.savingsTarget : Number((totalIncome * 0.2).toFixed(2));

  // =========================================================================
  // 模块一：消费习惯与异常检测模块 (Spending Pattern Detection Module - Section 3.6.1)
  // Module 1: Spending Pattern Detection Module (4-week rolling variance analysis)
  // =========================================================================
  // 定义时间边界：当前周（过去 7 天）与前 3 周基线（过去 8 至 28 天）
  // Define time boundaries: current week (past 7 days) vs. 3-week baseline (past 8 to 28 days)
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);

  const currentWeekCategorySpend = {};
  const baselineThreeWeekCategorySpend = {};
  const currentMonthCategorySpend = {};

  // 遍历交易记录进行分类汇总
  // Iterate through transactions to aggregate spending by category
  all90DayExpenses.forEach((tx) => {
    const txDate = new Date(tx.date);
    // 统计当月各类别消费
    // Aggregate current month spending by category
    if (txDate >= startOfMonth) {
      currentMonthCategorySpend[tx.category] = (currentMonthCategorySpend[tx.category] || 0) + tx.amount;
    }
    // 统计最近 7 天各类别消费
    // Aggregate last 7 days spending by category
    if (txDate >= oneWeekAgo) {
      currentWeekCategorySpend[tx.category] = (currentWeekCategorySpend[tx.category] || 0) + tx.amount;
    }
    // 统计前 3 周（第 8-28 天）各类别消费
    // Aggregate previous 3 weeks (days 8-28) spending by category
    else if (txDate >= fourWeeksAgo && txDate < oneWeekAgo) {
      baselineThreeWeekCategorySpend[tx.category] = (baselineThreeWeekCategorySpend[tx.category] || 0) + tx.amount;
    }
  });

  // 检测消费异常尖峰（对比当前周与前 3 周的周均值）
  // Detect spending spikes (compare current week against 3-week weekly average)
  const detectedAnomalies = [];
  let topCategory = "FOOD_AND_BEVERAGE";
  let maxCategoryAmount = 0;

  for (const [cat, amt] of Object.entries(currentMonthCategorySpend)) {
    if (amt > maxCategoryAmount) {
      maxCategoryAmount = amt;
      topCategory = cat;
    }
  }

  for (const [cat, currentWeekAmt] of Object.entries(currentWeekCategorySpend)) {
    const threeWeekTotal = baselineThreeWeekCategorySpend[cat] || 0;
    const weeklyBaseline = threeWeekTotal / 3; // 过去 3 周的每周平均消费 / Weekly average over past 3 weeks

    // 如果过去有基线数据，且本周消费超过周均值的 25%（方差阈值），则标记为异常
    // If baseline exists and current week exceeds weekly average by 25% (variance threshold), flag as anomaly
    if (weeklyBaseline > 0 && currentWeekAmt > weeklyBaseline * 1.25) {
      const spikePercentage = Math.round(((currentWeekAmt - weeklyBaseline) / weeklyBaseline) * 100);
      detectedAnomalies.push({
        category: cat,
        currentWeekSpent: Number(currentWeekAmt.toFixed(2)),
        weeklyBaseline: Number(weeklyBaseline.toFixed(2)),
        spikePercentage,
      });
    }
  }

  // =========================================================================
  // 模块二：月末支出预测模块 (Predictive Alert Module - Section 3.6.2)
  // Module 2: Predictive Alert Module (Linear Regression & Fallbacks)
  // =========================================================================
  // 按天聚合当月支出以构建回归数据点
  // Aggregate current month expenses by day of month to build regression data points
  const dailyTotals = {};
  let totalSpentSoFar = 0;

  currentMonthExpenses.forEach((tx) => {
    const day = new Date(tx.date).getDate();
    dailyTotals[day] = (dailyTotals[day] || 0) + tx.amount;
    totalSpentSoFar += tx.amount;
  });

  const sortedDays = Object.keys(dailyTotals)
    .map(Number)
    .sort((a, b) => a - b);
  const uniqueDaysCount = sortedDays.length;

  const xDays = [];
  const yCumulativeAmounts = [];
  let runningTotal = 0;

  sortedDays.forEach((day) => {
    runningTotal += dailyTotals[day];
    xDays.push(day); // 自变量 X：当月第几天 / Independent variable X: day of the month
    yCumulativeAmounts.push(runningTotal); // 因变量 Y：截至当天的累计支出 / Dependent variable Y: cumulative spending
  });

  // 计算账户注册天数（判断是否在 14 天新手期内）
  // Calculate account age in days (to check if within 14-day onboarding window)
  const accountAgeDays = Math.floor((now - new Date(user.createdAt)) / (1000 * 60 * 60 * 24));

  let predictedMonthEnd = totalSpentSoFar;
  let predictionMethod = "EPF_50_30_20_FALLBACK";

  // 严格按照报告图 3.14 的决策树执行预测算法
  // Strictly execute prediction algorithm following the decision tree in Figure 3.14
  if (accountAgeDays <= 14 && uniqueDaysCount < 7) {
    // 分支 1：14 天新手期内且数据不足 7 天，使用 EPF 50/30/20 法则（80% 收入）
    // Branch 1: Within 14-day onboarding and < 7 days data, use EPF 50/30/20 rule (80% income)
    predictionMethod = "EPF_50_30_20_FALLBACK";
    predictedMonthEnd = Math.max(totalSpentSoFar, budgetLimit);
  } else if (uniqueDaysCount >= 7) {
    // 分支 2：当月有至少 7 个独立交易日，运行简单线性回归 (Simple Linear Regression)
    // Branch 2: At least 7 unique transaction days in current month, run Simple Linear Regression
    predictionMethod = "LINEAR_REGRESSION";
    const regression = new SLR(xDays, yCumulativeAmounts);
    const rawPrediction = regression.predict(daysInMonth);
    // 确保预测值不会低于目前已经花掉的钱
    // Ensure predicted value is never lower than total spent so far
    predictedMonthEnd = Math.max(totalSpentSoFar, rawPrediction);
  } else {
    // 分支 3：已过新手期但当月交易不足 7 天，使用 90 天历史移动平均法
    // Branch 3: Past onboarding but < 7 days data this month, use 90-day historical moving average
    predictionMethod = "90_DAY_MOVING_AVERAGE";
    const total90DaySpent = all90DayExpenses.reduce((sum, tx) => sum + tx.amount, 0);
    if (all90DayExpenses.length > 0) {
      const dailyAverage90 = total90DaySpent / 90;
      predictedMonthEnd = Math.max(totalSpentSoFar, dailyAverage90 * daysInMonth);
    } else {
      predictedMonthEnd = budgetLimit;
    }
  }

  predictedMonthEnd = Number(predictedMonthEnd.toFixed(2));
  totalSpentSoFar = Number(totalSpentSoFar.toFixed(2));
  const isOverspendingRisk = predictedMonthEnd > budgetLimit;

  // =========================================================================
  // 模块三：个性化建议与行动清单模块 (Actionable Insights Module - Section 3.6.3)
  // Module 3: Actionable Insights Module (Recommendations, Advice & Checklists)
  // =========================================================================
  // 计算需要削减的百分比以保护储蓄目标
  // Calculate required spending cut percentage to protect savings target
  let adviceMessage = "";
  let warningMessage = "";

  if (isOverspendingRisk) {
    const overspendAmount = Number((predictedMonthEnd - budgetLimit).toFixed(2));
    const cutPercentage = maxCategoryAmount > 0 ? Math.min(50, Math.max(10, Math.round((overspendAmount / maxCategoryAmount) * 100))) : 20;

    warningMessage = `Projected overspend: +RM ${overspendAmount.toFixed(2)}. Your current spending velocity will exceed your RM ${budgetLimit} monthly cap.`;
    adviceMessage = `Your highest spending is in ${topCategory} (RM ${maxCategoryAmount.toFixed(2)}). Cut down ${topCategory} expenses by ${cutPercentage}% for the rest of the month to save RM ${overspendAmount.toFixed(2)} and stay within budget.`;
  } else if (detectedAnomalies.length > 0) {
    const topAnomaly = detectedAnomalies[0];
    adviceMessage = `Your spending in ${topAnomaly.category} is ${topAnomaly.spikePercentage}% higher than your 3-week rolling baseline. Monitor this category closely to protect your RM ${savingsTarget} savings goal.`;
  } else {
    adviceMessage = `Great financial discipline! Your projected spending of RM ${predictedMonthEnd.toFixed(2)} is well within your RM ${budgetLimit} limit. Keep following the EPF 50/30/20 guideline.`;
  }

  // 生成互动式任务清单 (Interactive Task Checklist)
  // Generate interactive task checklist
  const checklistItems = [
    {
      itemId: "task_1",
      text: `Keep ${topCategory} spending below RM ${(maxCategoryAmount * 1.1 || 300).toFixed(0)} this month`,
      isCompleted: !isOverspendingRisk,
    },
    {
      itemId: "task_2",
      text: `Set aside RM ${savingsTarget} to hit your monthly savings target`,
      isCompleted: false,
    },
    {
      itemId: "task_3",
      text: "Review and cancel unused monthly subscriptions",
      isCompleted: false,
    },
  ];

  // =========================================================================
  // 数据库持久化：保存到 AllInsightsPredictions 和 Notifications (Table 4.4 & 4.5)
  // Database Persistence: Save to AllInsightsPredictions and Notifications
  // =========================================================================
  // 先清理该用户旧的同类型分析记录，保持仪表盘数据最新
  // Clean up old insights for this user to keep dashboard data fresh
  await AllInsightsPrediction.deleteMany({ userId });

  // 1. 保存预算推荐记录 (RECOMMENDATION)
  // 1. Save budget recommendation record (RECOMMENDATION)
  await AllInsightsPrediction.create({
    userId,
    insightType: "RECOMMENDATION",
    message: `Suggested Monthly Limit: RM ${(totalIncome * 0.8).toFixed(2)} | Savings Target: RM ${(totalIncome * 0.2).toFixed(2)} (Based on EPF 50/30/20 rule)`,
    predictedAmount: predictedMonthEnd,
  });

  // 2. 保存具体省钱建议记录 (ADVICE)
  // 2. Save specific saving advice record (ADVICE)
  await AllInsightsPrediction.create({
    userId,
    insightType: "ADVICE",
    message: adviceMessage,
    predictedAmount: predictedMonthEnd,
  });

  // 3. 保存互动任务清单记录 (ACTION_CHECKLIST)
  // 3. Save interactive task checklist record (ACTION_CHECKLIST)
  await AllInsightsPrediction.create({
    userId,
    insightType: "ACTION_CHECKLIST",
    message: "Monthly Financial Improvement Checklist",
    checklistItems,
    predictedAmount: predictedMonthEnd,
  });

  // 4. 如果存在超支风险，保存警告卡片 (WARNING) 并生成通知 (Notification)
  // 4. If overspending risk exists, save WARNING card and create a Notification
  if (isOverspendingRisk) {
    await AllInsightsPrediction.create({
      userId,
      insightType: "WARNING",
      message: warningMessage,
      predictedAmount: predictedMonthEnd,
    });

    // 在 Notifications 表中生成一条未读预警（符合 Table 4.5 规范）
    // Create an unread alert in the Notifications collection (complies with Table 4.5 specs)
    await Notification.create({
      userId,
      title: "AI Forecast: Overspending Risk",
      message: warningMessage,
      tag: "ALERT",
      isRead: false,
    });
  }

  return {
    predictionMethod,
    uniqueDaysCount,
    accountAgeDays,
    totalSpentSoFar,
    predictedMonthEnd,
    budgetLimit,
    savingsTarget,
    isOverspendingRisk,
    topSpendingCategory: topCategory,
    detectedAnomalies,
    advice: adviceMessage,
    warning: warningMessage || null,
    checklist: checklistItems,
  };
};

// 导出引擎函数供其他 Controller（如新增交易时）内部调用
// Export engine function for internal calls by other Controllers (e.g., on new transaction)
exports.runAnalyticsEngine = runAnalyticsEngine;

// 导出供前端请求仪表盘数据时调用的 HTTP GET 控制器 (Read-Trigger)
// Export HTTP GET controller for frontend dashboard requests (Read-Trigger)
exports.getFinancialAnalytics = async (req, res) => {
  try {
    const { userId } = req.params;
    const analyticsData = await runAnalyticsEngine(userId);

    res.status(200).json({
      message: "Intelligent financial analytics generated and saved successfully (智能财务分析生成并保存成功)",
      data: analyticsData,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to generate financial analytics (生成财务分析失败)",
      error: error.message,
    });
  }
};
