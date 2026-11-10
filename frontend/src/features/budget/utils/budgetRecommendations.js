/**
 * @file frontend/src/features/budget/utils/budgetRecommendations.js
 * @layer Utils (Rule-Based AI Preset Recommender — 100% Original Logic + New Category Keys)
 * @description Defines the 3 allocation presets (50/30/20, 50/20/30, 60/25/15) and computes the suggested preset and reasons.
 * @exports BUDGET_PRESETS, getCategoryBucketType, computeAiPresetRecommendation
 */

import { NEEDS_CATEGORY_KEYS, WANTS_CATEGORY_KEYS } from "../../../utils/categoryConfig";

// Helper to check if a transaction category belongs to Needs or Wants (using unified 16 categories)
export const getCategoryBucketType = (categoryKey) => {
  if (NEEDS_CATEGORY_KEYS.includes(categoryKey)) return "needs";
  if (WANTS_CATEGORY_KEYS.includes(categoryKey)) return "wants";
  return "wants";
};

// Define the 3 Allocation Presets (Clean labels without "Primary baseline" or "Proposed alt")
export const BUDGET_PRESETS = [
  {
    id: "50_30_20",
    name: "Balanced",
    ratioLabel: "50 / 30 / 20",
    needsPct: 50,
    wantsPct: 30,
    savingsPct: 20,
    desc: "A recognised budgeting approach explained in KWSP financial education material. Provides a balanced starting point for essential expenses, lifestyle spending and savings.",
  },
  {
    id: "50_20_30",
    name: "Fast Saver",
    ratioLabel: "50 / 20 / 30",
    needsPct: 50,
    wantsPct: 20,
    savingsPct: 30,
    desc: "Allocates 30% of income towards savings by trimming discretionary lifestyle spending down to 20%.",
  },
  {
    id: "60_25_15",
    name: "Student-Friendly",
    ratioLabel: "60 / 25 / 15",
    needsPct: 60,
    wantsPct: 25,
    savingsPct: 15,
    desc: "Allocates 60% of income towards essential expenses such as food, accommodation and transportation.",
  },
];

// Dynamic AI Preset Recommender based on user's actual transaction patterns
export const computeAiPresetRecommendation = (transactions = [], baselineIncome = 3000) => {
  const expenseTxs = transactions.filter((t) => t.type === "EXPENSE");
  if (expenseTxs.length === 0) {
    return {
      presetId: "50_30_20",
      reasons: [
        "No historical expenses recorded yet — starting with the balanced 50/30/20 allocation.",
        "Allocates 80% (50% Needs + 30% Wants) to monthly spending and 20% to savings.",
        "As you log more transactions, Ka-Ching! will tailor this suggestion to your habits.",
      ],
    };
  }

  let needsTotal = 0;
  let wantsTotal = 0;
  let foodAndTransportCount = 0;

  expenseTxs.forEach((tx) => {
    const amt = Number(tx.amount) || 0;
    const cat = tx.category || "OTHER_EXPENSE";
    if (getCategoryBucketType(cat) === "needs") {
      needsTotal += amt;
    } else {
      wantsTotal += amt;
    }
    if (cat === "FOOD_AND_BEVERAGE" || cat === "TRANSPORT") {
      foodAndTransportCount += 1;
    }
  });

  const totalSpent = needsTotal + wantsTotal;
  const essentialShareOfSpend = totalSpent > 0 ? Math.round((needsTotal / totalSpent) * 100) : 50;
  const essentialShareOfIncome = baselineIncome > 0 ? Math.round((needsTotal / baselineIncome) * 100) : 50;
  const totalSpendShareOfIncome = baselineIncome > 0 ? Math.round((totalSpent / baselineIncome) * 100) : 70;

  // Rule A: High essential share -> Recommend Student-Friendly (60/25/15)
  if (essentialShareOfSpend >= 62 || essentialShareOfIncome >= 55) {
    return {
      presetId: "60_25_15",
      reasons: [
        `Your essential expenses (RM ${needsTotal.toFixed(0)}) account for ${essentialShareOfSpend}% of your total spending.`,
        `Food and transportation make up ${foodAndTransportCount} recurring expense records in your history.`,
        "This 60/25/15 allocation provides a larger 60% buffer for essential living costs.",
      ],
    };
  }

  // Rule B: Low overall spending relative to income -> Recommend Fast Saver (50/20/30)
  if (totalSpendShareOfIncome <= 65 && wantsTotal <= needsTotal * 0.45) {
    return {
      presetId: "50_20_30",
      reasons: [
        `Your discretionary (Wants) spending is well-controlled at RM ${wantsTotal.toFixed(0)}.`,
        `Your total spending uses only ${totalSpendShareOfIncome}% of your RM ${baselineIncome.toFixed(0)} baseline income.`,
        "This 50/20/30 allocation helps you lock in a higher 30% monthly savings rate.",
      ],
    };
  }

  // Rule C: Default -> Recommend Balanced (50/30/20)
  return {
    presetId: "50_30_20",
    reasons: [
      `Your spending is balanced (${essentialShareOfSpend}% essentials vs ${100 - essentialShareOfSpend}% lifestyle wants).`,
      `Allocates RM ${(baselineIncome * 0.8).toFixed(0)} for monthly spending and RM ${(baselineIncome * 0.2).toFixed(0)} for savings.`,
      "Provides a sustainable 50% Needs, 30% Wants, and 20% Savings split.",
    ],
  };
};
