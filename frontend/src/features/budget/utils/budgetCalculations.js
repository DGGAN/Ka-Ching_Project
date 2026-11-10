/**
 * @file frontend/src/features/budget/utils/budgetCalculations.js
 * @layer Utils (Pure Financial Math — 100% Original Logic + Fixed 16-Category Mapping)
 * @description Computes contiguous visible months, selected month income/spent, Needs/Wants/Savings allowances, and non-zero category breakdowns.
 * @exports computeVisibleBudgetMonths, computeSelectedMonthBudgetMetrics
 */

import { COLORS } from "../../../theme/colors";
import { NEEDS_CATEGORY_KEYS, WANTS_CATEGORY_KEYS, getCategoryMeta } from "../../../utils/categoryConfig";
import { BUDGET_PRESETS, getCategoryBucketType, computeAiPresetRecommendation } from "./budgetRecommendations";

// 1. Trim leading empty months (same contiguous 6-month rule as Dashboard)
export const computeVisibleBudgetMonths = (sixMonthList = [], transactions = [], budgetHistoryMap = {}) => {
  const monthActivityFlags = sixMonthList.map((m) => {
    const hasTx = transactions.some((tx) => {
      if (!tx.date) return false;
      const d = new Date(tx.date);
      return d.getFullYear() === m.year && d.getMonth() === m.month;
    });
    const hasSavedBudget = Boolean(budgetHistoryMap[m.key]);
    return hasTx || hasSavedBudget;
  });

  const firstActiveIdx = monthActivityFlags.findIndex((flag) => flag === true);
  return firstActiveIdx === -1 ? [sixMonthList[sixMonthList.length - 1]] : sixMonthList.slice(firstActiveIdx);
};

// 2. Compute selected month's income, total spent, allowances, and non-zero category lists
export const computeSelectedMonthBudgetMetrics = ({ transactions = [], budgetHistoryMap = {}, activeMonthObj, selectedPresetId = "50_30_20" }) => {
  const isCurrentMonthSelected = Boolean(activeMonthObj?.isCurrentMonth ?? activeMonthObj?.isCurrent);

  let selectedMonthSpent = 0;
  let selectedMonthIncome = 0;
  let actualNeedsSpent = 0;
  let actualWantsSpent = 0;
  const categorySpendMap = {};

  transactions.forEach((tx) => {
    if (!tx.date) return;
    const d = new Date(tx.date);
    const amt = Number(tx.amount) || 0;
    if (d.getFullYear() === activeMonthObj.year && d.getMonth() === activeMonthObj.month) {
      if (tx.type === "EXPENSE" && amt > 0) {
        selectedMonthSpent += amt;
        const catKey = tx.category || "OTHER_EXPENSE";
        categorySpendMap[catKey] = (categorySpendMap[catKey] || 0) + amt;

        if (getCategoryBucketType(catKey) === "needs") {
          actualNeedsSpent += amt;
        } else {
          actualWantsSpent += amt;
        }
      } else if (tx.type === "INCOME" && amt > 0) {
        selectedMonthIncome += amt;
      }
    }
  });

  const baselineIncome = selectedMonthIncome > 0 ? selectedMonthIncome : 3000;
  const aiRec = computeAiPresetRecommendation(transactions, baselineIncome);
  const activePreset = BUDGET_PRESETS.find((p) => p.id === selectedPresetId) || BUDGET_PRESETS[0];

  const needsAllowance = Math.round((baselineIncome * activePreset.needsPct) / 100);
  const wantsAllowance = Math.round((baselineIncome * activePreset.wantsPct) / 100);
  const recommendedLimit = needsAllowance + wantsAllowance;
  const recommendedSavings = Math.round((baselineIncome * activePreset.savingsPct) / 100);

  const savedBudgetForMonth = budgetHistoryMap[activeMonthObj.key] || (isCurrentMonthSelected ? Object.values(budgetHistoryMap)[0] || null : null);

  const activeLimit = savedBudgetForMonth?.monthlyLimit || 0;
  const activeSavings = savedBudgetForMonth?.savingsTarget || 0;
  const usagePct = activeLimit > 0 ? Math.min(100, (selectedMonthSpent / activeLimit) * 100) : 0;
  const isOverBudget = activeLimit > 0 && selectedMonthSpent > activeLimit;

  const projectedNetSavings = Math.max(0, baselineIncome - selectedMonthSpent);
  const targetSavingsGoal = activeSavings > 0 ? activeSavings : recommendedSavings;
  const savingsProgressPct = targetSavingsGoal > 0 ? Math.min(100, Math.round((projectedNetSavings / targetSavingsGoal) * 100)) : 0;

  // Build NON-ZERO category breakdown lists for Needs and Wants (Strictly hide 0% / RM 0 categories!)
  const getNonZeroBucketCategories = (bucketType, bucketTotalSpent) => {
    const allowedKeys = bucketType === "needs" ? NEEDS_CATEGORY_KEYS : WANTS_CATEGORY_KEYS;

    return allowedKeys
      .map((catKey) => {
        const spent = categorySpendMap[catKey] || 0;
        const cfg = getCategoryMeta(catKey);
        const sharePct = bucketTotalSpent > 0 ? Math.round((spent / bucketTotalSpent) * 100) : 0;
        return {
          catKey,
          label: cfg.name || cfg.label || catKey.replace(/_/g, " "),
          color: cfg.iconColor || COLORS.primary,
          spent,
          sharePct,
        };
      })
      .filter((item) => item.spent > 0)
      .sort((a, b) => b.spent - a.spent);
  };

  const needsCategoryList = getNonZeroBucketCategories("needs", actualNeedsSpent);
  const wantsCategoryList = getNonZeroBucketCategories("wants", actualWantsSpent);

  return {
    isCurrentMonthSelected,
    selectedMonthSpent,
    selectedMonthIncome,
    actualNeedsSpent,
    actualWantsSpent,
    baselineIncome,
    aiRec,
    activePreset,
    needsAllowance,
    wantsAllowance,
    recommendedLimit,
    recommendedSavings,
    activeLimit,
    activeSavings,
    usagePct,
    isOverBudget,
    projectedNetSavings,
    savingsProgressPct,
    needsCategoryList,
    wantsCategoryList,
  };
};
