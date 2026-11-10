/**
 * @file frontend/src/utils/dateHelpers.js
 * @layer Utils (Pure Date Functions)
 * @description Pure date formatting (YYYY-MM-DD) and smart 6-month contiguous window calculation.
 * @exports formatDateYMD, getSixMonthWindow
 */

// Pure date formatting and 6-month contiguous window helpers
// 1. Format Date object or ISO string into YYYY-MM-DD
export const formatDateYMD = (dateInput = new Date()) => {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) {
    const fallback = new Date();
    return `${fallback.getFullYear()}-${String(fallback.getMonth() + 1).padStart(2, "0")}-${String(fallback.getDate()).padStart(2, "0")}`;
  }
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

// 2. Build contiguous 6-month window (trims leading empty months, keeps current month at index N-1)
export const getSixMonthWindow = (transactions = []) => {
  const now = new Date();
  const rawWindow = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
    const shortLabel = d.toLocaleDateString("en-US", { month: "short" });
    rawWindow.push({
      key,
      label,
      shortLabel,
      year: d.getFullYear(),
      month: d.getMonth(),
      isCurrent: i === 0,
      hasData: false,
    });
  }

  (transactions || []).forEach((tx) => {
    if (!tx.date) return;
    const d = new Date(tx.date);
    const match = rawWindow.find((m) => m.year === d.getFullYear() && m.month === d.getMonth());
    if (match) {
      match.hasData = true;
    }
  });

  const firstActiveIdx = rawWindow.findIndex((m) => m.hasData);
  const startIdx = firstActiveIdx === -1 ? rawWindow.length - 1 : firstActiveIdx;
  return rawWindow.slice(startIdx);
};
