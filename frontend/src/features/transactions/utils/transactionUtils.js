/**
 * @file frontend/src/features/transactions/utils/transactionUtils.js
 * @layer Utils (Pure Helper Functions — 100% Original Transactions Logic)
 * @description Provides getCurrentMonthKey, buildGroupedSections by calendar date, and getCategoryTriggerLabel.
 * @exports PAGE_LIMIT, getCurrentMonthKey, buildGroupedSections, getCategoryTriggerLabel
 */

import { getCategoryMeta } from "../../../utils/categoryConfig";

export const PAGE_LIMIT = 15;

// Helper to get current YYYY-MM key so screen defaults to Current Month on open
export const getCurrentMonthKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

// Group loaded transactions by calendar date for clean section headers
export const buildGroupedSections = (transactions = []) => {
  const groups = {};
  transactions.forEach((tx) => {
    const dateStr = tx.date
      ? new Date(tx.date).toLocaleDateString("en-GB", {
          weekday: "short",
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "Recent";
    if (!groups[dateStr]) {
      groups[dateStr] = { dateStr, items: [], dayTotal: 0 };
    }
    groups[dateStr].items.push(tx);
    const amt = Number(tx.amount) || 0;
    groups[dateStr].dayTotal += tx.type === "INCOME" ? amt : -amt;
  });
  return Object.values(groups);
};

// Format top category button label
export const getCategoryTriggerLabel = (selectedCategories = []) => {
  if (selectedCategories.length === 0) return "Category";
  if (selectedCategories.length === 1) {
    const cfg = getCategoryMeta(selectedCategories[0]);
    return cfg.name || cfg.label || selectedCategories[0];
  }
  return `${selectedCategories.length} Selected`;
};
