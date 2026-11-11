/**
 * @file frontend/src/features/dashboard/utils/dashboardCalculations.js
 * @layer Utils (Pure Financial & Chart Math Functions — Strict Per-Month Budget Matching)
 * @description Strictly matches each month's budget by (year, monthNum) from budgetHistory without falling back to another month's budget.
 * @exports getRawSixMonthWindow, computeDashboardMetrics, computeChartGeometry
 */

import { getCategoryMeta } from "../../../utils/categoryConfig";

export const getRawSixMonthWindow = () => {
  const list = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const shortMonth = d.toLocaleDateString("en-US", { month: "short" });
    const fullLabel = d.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
    list.push({
      key,
      shortMonth,
      label: fullLabel,
      year: d.getFullYear(),
      month: d.getMonth(),
      monthNum: d.getMonth() + 1,
      isCurrentMonth: i === 0,
    });
  }
  return list;
};

export const computeDashboardMetrics = (transactions = [], latestBudget = null, budgetHistory = [], rawSixMonths = [], selectedMonthKey = "") => {
  let allTimeIncome = 0;
  let allTimeExpense = 0;
  (transactions || []).forEach((tx) => {
    const amt = Number(tx.amount) || 0;
    if (tx.type === "INCOME") allTimeIncome += amt;
    else if (tx.type === "EXPENSE") allTimeExpense += amt;
  });
  const allTimeSavedBalance = allTimeIncome - allTimeExpense;
  const isAllTimeNegative = allTimeSavedBalance < 0;

  const enrichedMonths = rawSixMonths.map((mObj) => {
    const monthTxs = (transactions || []).filter((tx) => {
      if (!tx.date) return false;
      const d = new Date(tx.date);
      return d.getFullYear() === mObj.year && d.getMonth() === mObj.month;
    });

    let income = 0;
    let expense = 0;
    const catMap = {};

    monthTxs.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      if (tx.type === "INCOME") {
        income += amt;
      } else if (tx.type === "EXPENSE") {
        expense += amt;
        catMap[tx.category] = (catMap[tx.category] || 0) + amt;
      }
    });

    // STRICTLY match budget for this exact (year, monthNum) ONLY!
    // Never fall back to another month's budget if this month had no budget set.
    const matchedFromHistory = (budgetHistory || []).find((b) => Number(b.year) === mObj.year && Number(b.month) === mObj.monthNum);
    const matchedFromLatest =
      latestBudget && Number(latestBudget.year) === mObj.year && Number(latestBudget.month) === mObj.monthNum ? latestBudget : null;

    const matchedBudget = matchedFromHistory || matchedFromLatest || null;
    const monthLimit = Number(matchedBudget?.monthlyLimit) || 0;

    const categories = Object.entries(catMap)
      .map(([catKey, amount]) => {
        const cfg = getCategoryMeta(catKey);
        const rawPct = expense > 0 ? (amount / expense) * 100 : 0;
        return {
          category: catKey,
          label: cfg.name || cfg.label || "Other Expenses",
          amount,
          rawPct,
          pct: Math.max(1, Math.round(rawPct)),
          iconColor: cfg.iconColor || "#E87A90",
          bgColor: cfg.bgColor || "#FFE5EC",
          IconComponent: cfg.Icon,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    return {
      ...mObj,
      monthTxs,
      income,
      expense,
      monthLimit,
      hasData: monthTxs.length > 0,
      categories,
    };
  });

  const firstActiveIdx = enrichedMonths.findIndex((m) => m.hasData);
  const visibleMonths = firstActiveIdx === -1 ? [enrichedMonths[enrichedMonths.length - 1]] : enrichedMonths.slice(firstActiveIdx);

  const activeMonthIdxInFull = enrichedMonths.findIndex((m) => m.key === selectedMonthKey);
  const activeMonth = activeMonthIdxInFull !== -1 ? enrichedMonths[activeMonthIdxInFull] : enrichedMonths[enrichedMonths.length - 1];

  const prevMonth = activeMonthIdxInFull > 0 ? enrichedMonths[activeMonthIdxInFull - 1] : null;

  let momDiffPct = null;
  if (prevMonth && prevMonth.expense > 0) {
    momDiffPct = Math.round(((activeMonth.expense - prevMonth.expense) / prevMonth.expense) * 100);
  }

  const monthlyNet = activeMonth.income - activeMonth.expense;
  const activeLimit = activeMonth.monthLimit;
  const budgetUsedPct = activeLimit > 0 ? Math.round((activeMonth.expense / activeLimit) * 100) : 0;
  const isOverBudget = activeLimit > 0 && activeMonth.expense > activeLimit;

  return {
    allTimeSavedBalance,
    isAllTimeNegative,
    visibleMonths,
    activeMonth,
    momDiffPct,
    monthlyNet,
    activeLimit,
    budgetUsedPct,
    isOverBudget,
  };
};

export const computeChartGeometry = (visibleMonths = [], chartBoxWidth = 0) => {
  const CHART_HEIGHT = 154;
  const TOP_PAD = 28;
  const BOTTOM_PAD = 30;
  const USABLE_BAR_MAX_H = CHART_HEIGHT - TOP_PAD - BOTTOM_PAD;
  const BAR_WIDTH = visibleMonths.length <= 3 ? 34 : 26;

  const maxMonthlyExpense = Math.max(...visibleMonths.map((m) => m.expense), 100);

  const numBars = visibleMonths.length;
  const colWidth = chartBoxWidth > 0 && numBars > 0 ? chartBoxWidth / numBars : 0;

  const chartNodes = visibleMonths.map((m, idx) => {
    const centerX = colWidth * idx + colWidth / 2;
    const ratio = maxMonthlyExpense > 0 ? m.expense / maxMonthlyExpense : 0;
    const barHeight = m.expense > 0 ? Math.max(8, ratio * USABLE_BAR_MAX_H) : 0;
    const topY = CHART_HEIGHT - BOTTOM_PAD - barHeight;
    return {
      ...m,
      centerX,
      barHeight,
      topY,
    };
  });

  const polylinePoints = chartNodes.map((n) => `${n.centerX},${n.topY}`).join(" ");

  const areaPolygonPoints =
    chartNodes.length > 1
      ? `${chartNodes[0].centerX},${CHART_HEIGHT - BOTTOM_PAD} ${polylinePoints} ${chartNodes[chartNodes.length - 1].centerX},${
          CHART_HEIGHT - BOTTOM_PAD
        }`
      : "";

  return {
    CHART_HEIGHT,
    TOP_PAD,
    BOTTOM_PAD,
    USABLE_BAR_MAX_H,
    BAR_WIDTH,
    colWidth,
    chartNodes,
    polylinePoints,
    areaPolygonPoints,
  };
};
