/**
 * @file frontend/src/features/insights/utils/insightsUtils.js
 * @layer Utils (Pure Math & SVG Geometry — 100% Original Insights Logic)
 * @description Extracts numeric RM values from checklist impact badges, computes 125px SVG chart coordinates, and calculates checklist savings totals.
 * @exports parseImpactAmount, computeInsightsChartGeometry, computeChecklistSavings
 */

// 1. Helper function: Extract numeric RM value from impact badge string (e.g. "Save ~RM 80" -> 80)
export const parseImpactAmount = (impactStr = "") => {
  const match = String(impactStr).match(/RM\s*([0-9]+(\.[0-9]+)?)/i);
  return match ? parseFloat(match[1]) : 0;
};

// 2. Compute exact geometry for the 125px Monthly Spending Trend Chart
export const computeInsightsChartGeometry = ({
  chartCheckpoints = [],
  predictedMonthEnd = 0,
  monthlyLimit = 0,
  thisMonthExpense = 0,
  chartWidth = 0,
}) => {
  const PLOT_HEIGHT = 125;
  const TOP_PAD = 18;
  const BOTTOM_PAD = 10;
  const usableHeight = PLOT_HEIGHT - TOP_PAD - BOTTOM_PAD;

  const maxChartValue = Math.max(predictedMonthEnd, monthlyLimit, thisMonthExpense, 100) * 1.12;

  const numPoints = chartCheckpoints.length;
  const stepX = chartWidth > 0 && numPoints > 1 ? chartWidth / (numPoints - 1) : 0;

  const plottedNodes = chartCheckpoints.map((pt, idx) => {
    const x = idx === 0 ? 14 : idx === numPoints - 1 ? Math.max(14, chartWidth - 14) : stepX * idx;
    const val = pt.isFuture ? pt.predicted : pt.actual;
    const ratio = maxChartValue > 0 ? Math.min(1, val / maxChartValue) : 0;
    const y = TOP_PAD + usableHeight * (1 - ratio);
    return { ...pt, x, y, val };
  });

  const actualNodes = plottedNodes.filter((n) => !n.isFuture);
  const lastActualNode = actualNodes[actualNodes.length - 1];
  const futureNodes = plottedNodes.filter((n) => n.isFuture);
  const forecastSegmentNodes = lastActualNode ? [lastActualNode, ...futureNodes] : futureNodes;

  const actualPolylineStr = actualNodes.map((n) => `${n.x},${n.y}`).join(" ");
  const forecastPolylineStr = forecastSegmentNodes.map((n) => `${n.x},${n.y}`).join(" ");

  const actualAreaStr =
    actualNodes.length > 1
      ? `${actualNodes[0].x},${PLOT_HEIGHT - BOTTOM_PAD} ${actualPolylineStr} ${actualNodes[actualNodes.length - 1].x},${PLOT_HEIGHT - BOTTOM_PAD}`
      : "";

  const limitY = monthlyLimit > 0 ? TOP_PAD + usableHeight * (1 - Math.min(1, monthlyLimit / maxChartValue)) : null;

  return {
    PLOT_HEIGHT,
    TOP_PAD,
    BOTTOM_PAD,
    usableHeight,
    plottedNodes,
    actualNodes,
    forecastSegmentNodes,
    actualPolylineStr,
    forecastPolylineStr,
    actualAreaStr,
    limitY,
  };
};

// 3. Calculate completed tasks and total potential RM saved from checked items
export const computeChecklistSavings = (checklistItems = [], checkedIds = {}) => {
  const completedCount = checklistItems.filter((item) => checkedIds[item.id]).length;
  const allCompleted = checklistItems.length > 0 && completedCount === checklistItems.length;

  let committedSavingsRM = 0;
  let totalPossibleSavingsRM = 0;
  checklistItems.forEach((item) => {
    const amt = parseImpactAmount(item.impact);
    totalPossibleSavingsRM += amt;
    if (checkedIds[item.id]) {
      committedSavingsRM += amt;
    }
  });

  return {
    completedCount,
    allCompleted,
    committedSavingsRM,
    totalPossibleSavingsRM,
  };
};
