/**
 * @file frontend/src/utils/dateHelpers.js
 * @layer Utils (Pure Date Formatting & 6-Month Window Generator)
 * @description Provides formatDateYMD, getCurrentMonthKey, and getSixMonthWindow with both shortMonth ("Nov") and label ("Nov 2026") fields.
 * @exports formatDateYMD, getCurrentMonthKey, getSixMonthWindow
 */

// 1. Format Date object or ISO string into YYYY-MM-DD
export const formatDateYMD = (dateInput) => {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput || Date.now());
  if (isNaN(d.getTime())) {
    const fallback = new Date();
    return `${fallback.getFullYear()}-${String(fallback.getMonth() + 1).padStart(2, "0")}-${String(fallback.getDate()).padStart(2, "0")}`;
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// 2. Return current YYYY-MM key
export const getCurrentMonthKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

// 3. Generate the 6-month chronological window (oldest -> newest)
// Includes BOTH shortMonth/isCurrentMonth (used by BudgetScreen) AND label/isCurrent (used by TransactionsScreen)
export const getSixMonthWindow = (transactions = []) => {
  const rawList = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const shortMonth = d.toLocaleDateString("en-US", { month: "short" });
    const fullLabel = d.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });

    rawList.push({
      key,
      shortMonth, // e.g., "Nov" (Required by BudgetMonthSelector & BudgetScreen)
      label: fullLabel, // e.g., "Nov 2026" (Required by TransactionsScreen & Headers)
      year: d.getFullYear(),
      month: d.getMonth(),
      monthNum: d.getMonth() + 1,
      isCurrent: i === 0,
      isCurrentMonth: i === 0,
    });
  }

  // If transactions array is passed (e.g., from TransactionsScreen), trim leading empty months
  if (Array.isArray(transactions) && transactions.length > 0) {
    const firstActiveIdx = rawList.findIndex((m) =>
      transactions.some((tx) => {
        if (!tx.date) return false;
        const txDate = new Date(tx.date);
        return txDate.getFullYear() === m.year && txDate.getMonth() === m.month;
      }),
    );
    return firstActiveIdx === -1 ? [rawList[rawList.length - 1]] : rawList.slice(firstActiveIdx);
  }

  return rawList;
};
