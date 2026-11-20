/**
 * @file frontend/src/features/budget/utils/budgetRecommendations.js
 * @layer Utils (Pure Rule-Based Preset Recommendation Engine)
 * @description Defines the 3 allocation presets (50/30/20, 50/20/30, 60/25/15) and computes monthly-averaged, income-normalized preset recommendations.
 * @exports BUDGET_PRESETS, computeBudgetRecommendation
 */

import { getCategoryBucketType } from "./budgetCalculations";

export const BUDGET_PRESETS = [
  {
    id: "50_30_20",
    name: "Balanced",
    ratioLabel: "50 / 30 / 20",
    needsPct: 50,
    wantsPct: 30,
    savingsPct: 20,
    desc: "The standard budgeting benchmark promoted by KWSP (EPF) & AKPK. Balances essential living costs, lifestyle spending, and steady savings.",
  },
  {
    id: "50_20_30",
    name: "Fast Saver",
    ratioLabel: "50 / 20 / 30",
    needsPct: 50,
    wantsPct: 20,
    savingsPct: 30,
    desc: "Adapted from 50/30/20 to boost savings to 30% by keeping discretionary Wants spending disciplined at 20%.",
  },
  {
    id: "60_25_15",
    name: "Student-Friendly",
    ratioLabel: "60 / 25 / 15",
    needsPct: 60,
    wantsPct: 25,
    savingsPct: 15,
    desc: "Adapted for students or tighter incomes where essential costs (food, rent, transport) naturally take up a larger 60% share.",
  },
];

export const computeBudgetRecommendation = (transactions = [], baselineIncome = 3000) => {
  const expenseTxs = (transactions || []).filter((t) => t.type === "EXPENSE");
  const safeIncome = Number(baselineIncome) > 0 ? Number(baselineIncome) : 3000;

  // Cold-start fallback when user has no expense records yet
  if (expenseTxs.length === 0) {
    return {
      presetId: "50_30_20",
      reasons: [
        "No historical expenses recorded yet — starting with the KWSP/AKPK 50/30/20 allocation.",
        `Allocates RM ${Math.round(safeIncome * 0.8)} (50% Needs + 30% Wants) to spending and RM ${Math.round(safeIncome * 0.2)} to savings.`,
        "As you log more transactions, Ka-Ching! will tailor this suggestion to your real habits.",
      ],
    };
  }

  let needsTotal = 0;
  let wantsTotal = 0;
  let foodAndTransportCount = 0;
  const activeMonthKeys = new Set();

  expenseTxs.forEach((tx) => {
    const amt = Number(tx.amount) || 0;
    const cat = tx.category || "OTHER_EXPENSE";
    const bucket = String(getCategoryBucketType(cat) || "wants").toLowerCase();

    if (bucket === "needs") {
      needsTotal += amt;
    } else {
      wantsTotal += amt;
    }

    if (cat === "FOOD_AND_BEVERAGE" || cat === "TRANSPORT") {
      foodAndTransportCount += 1;
    }

    if (tx.date) {
      const d = new Date(tx.date);
      if (!isNaN(d.getTime())) {
        activeMonthKeys.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
      }
    }
  });

  // Normalize totals to monthly averages so multi-month histories never distort income ratios
  const monthCount = Math.max(1, activeMonthKeys.size);
  const avgNeeds = needsTotal / monthCount;
  const avgWants = wantsTotal / monthCount;
  const avgTotalSpend = avgNeeds + avgWants;

  const needsPctOfIncome = Math.round((avgNeeds / safeIncome) * 100);
  const wantsPctOfIncome = Math.round((avgWants / safeIncome) * 100);
  const totalSpendPctOfIncome = Math.round((avgTotalSpend / safeIncome) * 100);
  const estimatedSavingsRatePct = Math.max(0, 100 - totalSpendPctOfIncome);
  const needsShareOfSpend = avgTotalSpend > 0 ? Math.round((avgNeeds / avgTotalSpend) * 100) : 50;

  // Rule A: Heavy essential burden -> Student-Friendly (60/25/15)
  if (needsPctOfIncome >= 55 || (safeIncome <= 2200 && needsShareOfSpend >= 65)) {
    return {
      presetId: "60_25_15",
      reasons: [
        `Essential living costs average RM ${avgNeeds.toFixed(0)}/mo (${needsPctOfIncome}% of your RM ${safeIncome.toFixed(0)} income).`,
        `Food & transport account for ${foodAndTransportCount} recurring entries across your records.`,
        "The 60/25/15 split gives you a safer 60% cushion for essential costs while keeping a realistic 15% savings goal.",
      ],
    };
  }

  // Rule B: Disciplined Wants + strong monthly surplus -> Fast Saver (50/20/30)
  if (estimatedSavingsRatePct >= 28 && wantsPctOfIncome <= 20) {
    return {
      presetId: "50_20_30",
      reasons: [
        `Your discretionary Wants are well-controlled at RM ${avgWants.toFixed(0)}/mo (${wantsPctOfIncome}% of income).`,
        `Total spending uses only ${totalSpendPctOfIncome}% of your RM ${safeIncome.toFixed(0)} baseline income (leaving ~${estimatedSavingsRatePct}% surplus).`,
        "The 50/20/30 Fast Saver plan helps you lock in a higher 30% monthly savings goal.",
      ],
    };
  }

  // Rule C: Healthy balance of Needs and Lifestyle Wants -> Balanced (50/30/20)
  return {
    presetId: "50_30_20",
    reasons: [
      `Your spending is well-balanced: ${needsPctOfIncome}% Needs and ${wantsPctOfIncome}% Wants against your RM ${safeIncome.toFixed(0)} income.`,
      `Allocates RM ${Math.round(safeIncome * 0.8)} for monthly spending and RM ${Math.round(safeIncome * 0.2)} for steady savings.`,
      "Matches the KWSP/AKPK 50/30/20 benchmark for sustainable everyday budgeting.",
    ],
  };
};
