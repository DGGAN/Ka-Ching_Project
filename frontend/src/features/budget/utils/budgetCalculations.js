/**
 * @file frontend/src/features/budget/utils/budgetCalculations.js
 * @layer Utils (Pure Financial Math Functions)
 * @description Provides getCategoryBucketType, calculateMonthlySpending, and getNonZeroBucketCategories using unified 16-category keys.
 * @exports getCategoryBucketType, calculateMonthlySpending, getNonZeroBucketCategories
 */

import { COLORS } from "../../../theme/colors";
import { NEEDS_CATEGORY_KEYS, WANTS_CATEGORY_KEYS, getCategoryMeta } from "../../../utils/categoryConfig";

// 1. Check whether an expense category belongs to "needs" or "wants"
export const getCategoryBucketType = (categoryKey) => {
  if (NEEDS_CATEGORY_KEYS.includes(categoryKey)) return "needs";
  if (WANTS_CATEGORY_KEYS.includes(categoryKey)) return "wants";
  return "wants";
};

// 2. Calculate selected month's income, total spent, Needs spent, Wants spent, and category map
export const calculateMonthlySpending = (transactions = [], activeMonthObj = {}) => {
  let selectedMonthSpent = 0;
  let selectedMonthIncome = 0;
  let actualNeedsSpent = 0;
  let actualWantsSpent = 0;
  const categorySpendMap = {};

  (transactions || []).forEach((tx) => {
    if (!tx.date) return;
    const d = new Date(tx.date);
    const amt = Number(tx.amount) || 0;

    if (d.getFullYear() === activeMonthObj?.year && d.getMonth() === activeMonthObj?.month) {
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

  return {
    selectedMonthSpent,
    selectedMonthIncome,
    actualNeedsSpent,
    actualWantsSpent,
    categorySpendMap,
  };
};

// 3. Build sorted non-zero category rows for either the Needs or Wants drawer
export const getNonZeroBucketCategories = (bucketType, bucketTotalSpent = 0, categorySpendMap = {}) => {
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
