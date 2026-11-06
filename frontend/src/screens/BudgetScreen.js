// Import React hooks, core React Native UI primitives, Modal, and Lucide icons
import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Modal, ActivityIndicator, StyleSheet } from "react-native";
import { Sparkles, Sliders, Info, Lock, Check, X, ChevronDown, ChevronUp, PiggyBank } from "lucide-react-native";
import apiClient from "../api/client";
import { COLORS, SHAPES, FONTS } from "../theme/theme";
import { WireBox, WireInput, WireButton, FloatingToast, useFloatingToast, getSixMonthWindow, playUiSound } from "../components/WireUI";
import { CATEGORY_CONFIG, CategoryBadge } from "../utils/categoryIcons";

// 1. Exact Category Bucket Mapping matching Backend Transaction.js Schema Enums
const NEEDS_CATEGORY_KEYS = ["FOOD_AND_DRINK", "TRANSPORT", "BILLS_AND_UTILITIES", "GROCERIES", "HEALTHCARE", "EDUCATION", "HOUSING"];

const WANTS_CATEGORY_KEYS = ["ENTERTAINMENT", "SHOPPING", "OTHER_EXPENSE"];

// Helper to check if a transaction category belongs to Needs or Wants
const getCategoryBucketType = (categoryKey) => {
  if (NEEDS_CATEGORY_KEYS.includes(categoryKey)) return "needs";
  if (WANTS_CATEGORY_KEYS.includes(categoryKey)) return "wants";
  return "wants";
};

// 2. Define the 3 Allocation Presets (Clean labels without "Primary baseline" or "Proposed alt")
const BUDGET_PRESETS = [
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

// 3. Dynamic AI Preset Recommender based on user's actual transaction patterns
const computeAiPresetRecommendation = (transactions, baselineIncome) => {
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
    if (cat === "FOOD_AND_DRINK" || cat === "TRANSPORT") {
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

// Budget Planning Screen with AI Recommendation, Accurate Bucket Breakdown & Read-Only Archive
export default function BudgetScreen({ user }) {
  const styles = getStyles();

  // 1. Generate 6-month window and track selected month
  const sixMonthList = getSixMonthWindow();
  const [selectedMonthKey, setSelectedMonthKey] = useState(sixMonthList[sixMonthList.length - 1].key);

  // 2. State for transactions, budgets, active mode, selected preset, and modals
  const [transactions, setTransactions] = useState([]);
  const [budgetHistoryMap, setBudgetHistoryMap] = useState({});
  const [activeMode, setActiveMode] = useState("smart");
  const [selectedPresetId, setSelectedPresetId] = useState("50_30_20");
  const [activeBucketTab, setActiveBucketTab] = useState("needs");
  const [showWhyReasons, setShowWhyReasons] = useState(false);
  const [showHowItWorksModal, setShowHowItWorksModal] = useState(false);

  // Manual form inputs
  const [monthlyLimitInput, setMonthlyLimitInput] = useState("");
  const [savingsTargetInput, setSavingsTargetInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { toast, slideAnim, showToast } = useFloatingToast();

  // 3. Load transactions and budget history on mount
  useEffect(() => {
    fetchBudgetAndTransactions();
  }, []);

  const fetchBudgetAndTransactions = async () => {
    try {
      setLoading(true);
      const [txRes, budgetRes] = await Promise.all([apiClient.get(`/transactions/${user.id}`), apiClient.get(`/budgets/${user.id}`)]);

      const txList = txRes.data?.data || [];
      setTransactions(txList);

      const currentBudget = budgetRes.data?.data;
      const historyList = budgetRes.data?.history || [];
      const map = {};

      historyList.forEach((b) => {
        if (b.year && b.month) {
          const k = `${b.year}-${String(b.month).padStart(2, "0")}`;
          map[k] = b;
        }
      });

      if (currentBudget) {
        const currentKey = sixMonthList[sixMonthList.length - 1].key;
        if (!map[currentKey]) map[currentKey] = currentBudget;
        setMonthlyLimitInput(String(currentBudget.monthlyLimit || ""));
        setSavingsTargetInput(String(currentBudget.savingsTarget || ""));
      }

      setBudgetHistoryMap(map);
    } catch (error) {
      console.log("Failed to load budget data:", error.message);
    } finally {
      setLoading(false);
    }
  };

  // 4. Trim leading empty months (same contiguous 6-month rule as Dashboard)
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
  const visibleMonths = firstActiveIdx === -1 ? [sixMonthList[sixMonthList.length - 1]] : sixMonthList.slice(firstActiveIdx);

  const activeMonthObj = visibleMonths.find((m) => m.key === selectedMonthKey) || visibleMonths[visibleMonths.length - 1];
  const isCurrentMonthSelected = activeMonthObj.isCurrentMonth;

  // 5. Compute selected month's income, total spent, and exact per-category expenses
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

  // 6. Compute AI Recommendation and auto-select on initial load
  const aiRec = computeAiPresetRecommendation(transactions, baselineIncome);
  useEffect(() => {
    if (aiRec?.presetId) {
      setSelectedPresetId(aiRec.presetId);
    }
  }, [transactions.length, baselineIncome]);

  const activePreset = BUDGET_PRESETS.find((p) => p.id === selectedPresetId) || BUDGET_PRESETS[0];

  const needsAllowance = Math.round((baselineIncome * activePreset.needsPct) / 100);
  const wantsAllowance = Math.round((baselineIncome * activePreset.wantsPct) / 100);
  const recommendedLimit = needsAllowance + wantsAllowance;
  const recommendedSavings = Math.round((baselineIncome * activePreset.savingsPct) / 100);

  // 7. Determine active budget for the selected month
  const savedBudgetForMonth = budgetHistoryMap[activeMonthObj.key] || (isCurrentMonthSelected ? Object.values(budgetHistoryMap)[0] || null : null);

  const activeLimit = savedBudgetForMonth?.monthlyLimit || 0;
  const activeSavings = savedBudgetForMonth?.savingsTarget || 0;
  const usagePct = activeLimit > 0 ? Math.min(100, (selectedMonthSpent / activeLimit) * 100) : 0;
  const isOverBudget = activeLimit > 0 && selectedMonthSpent > activeLimit;

  // Projected Net Savings = Income - Total Spent
  const projectedNetSavings = Math.max(0, baselineIncome - selectedMonthSpent);
  const targetSavingsGoal = activeSavings > 0 ? activeSavings : recommendedSavings;
  const savingsProgressPct = targetSavingsGoal > 0 ? Math.min(100, Math.round((projectedNetSavings / targetSavingsGoal) * 100)) : 0;

  // 8. Build NON-ZERO category breakdown lists for Needs and Wants (No 0% empty items!)
  const getNonZeroBucketCategories = (bucketType, bucketTotalSpent) => {
    const allowedKeys = bucketType === "needs" ? NEEDS_CATEGORY_KEYS : WANTS_CATEGORY_KEYS;

    return allowedKeys
      .map((catKey) => {
        const spent = categorySpendMap[catKey] || 0;
        const cfg = CATEGORY_CONFIG[catKey] || {
          label: catKey.replace(/_/g, " "),
          iconColor: COLORS.primary,
        };
        const sharePct = bucketTotalSpent > 0 ? Math.round((spent / bucketTotalSpent) * 100) : 0;
        return {
          catKey,
          label: cfg.label,
          color: cfg.iconColor || COLORS.primary,
          spent,
          sharePct,
        };
      })
      .filter((item) => item.spent > 0) // Strictly hide 0% / RM 0 categories!
      .sort((a, b) => b.spent - a.spent);
  };

  const needsCategoryList = getNonZeroBucketCategories("needs", actualNeedsSpent);
  const wantsCategoryList = getNonZeroBucketCategories("wants", actualWantsSpent);

  // 9. Save Budget Handler (Current Month Only)
  const handleSaveBudget = async (limitVal, savingsVal) => {
    if (!isCurrentMonthSelected) {
      showToast("error", "Past months are read-only.");
      return;
    }

    const parsedLimit = Number(limitVal);
    const parsedSavings = Number(savingsVal || 0);

    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      showToast("error", "Enter a valid spending limit > RM 0.");
      return;
    }

    try {
      setSaving(true);
      const res = await apiClient.post("/budgets", {
        userId: user.id,
        monthlyLimit: parsedLimit,
        savingsTarget: parsedSavings,
        month: activeMonthObj.monthNum,
        year: activeMonthObj.year,
      });

      const savedDoc = res.data?.data;
      setBudgetHistoryMap((prev) => ({
        ...prev,
        [activeMonthObj.key]: savedDoc,
      }));
      setMonthlyLimitInput(String(parsedLimit));
      setSavingsTargetInput(String(parsedSavings));
      playUiSound("success");
      showToast("success", "Monthly budget updated!");
    } catch (error) {
      showToast("error", error.response?.data?.message || "Failed to save budget.");
    } finally {
      setSaving(false);
    }
  };

  // Helper to render the 3 interactive bucket cards + per-category breakdown
  const renderBucketBreakdownSection = (needsCap, wantsCap, saveGoal, sectionTitle = "TAP ANY BUCKET TO INSPECT CATEGORIES") => {
    const activeCap = activeBucketTab === "needs" ? needsCap : activeBucketTab === "wants" ? wantsCap : saveGoal;
    const activeSpent = activeBucketTab === "needs" ? actualNeedsSpent : activeBucketTab === "wants" ? actualWantsSpent : projectedNetSavings;
    const bucketProgressPct = activeCap > 0 ? Math.min(100, Math.round((activeSpent / activeCap) * 100)) : 0;
    const activeCategoryRows = activeBucketTab === "needs" ? needsCategoryList : wantsCategoryList;

    return (
      <View style={{ marginTop: 4 }}>
        <Text style={styles.tapBucketHint}>{sectionTitle}</Text>

        {/* 3-Column Interactive Bucket Row */}
        <View style={styles.bucketRow}>
          <TouchableOpacity
            style={[styles.bucketPill, activeBucketTab === "needs" && styles.bucketPillActive]}
            onPress={() => {
              playUiSound("tab");
              setActiveBucketTab("needs");
            }}
          >
            <Text style={styles.bucketTitle}>Needs ({activePreset.needsPct}%)</Text>
            <Text style={styles.bucketAmount}>RM {needsCap}</Text>
            <Text style={styles.bucketSpentSub}>Spent: RM {actualNeedsSpent.toFixed(0)}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.bucketPill, activeBucketTab === "wants" && styles.bucketPillActive]}
            onPress={() => {
              playUiSound("tab");
              setActiveBucketTab("wants");
            }}
          >
            <Text style={styles.bucketTitle}>Wants ({activePreset.wantsPct}%)</Text>
            <Text style={styles.bucketAmount}>RM {wantsCap}</Text>
            <Text style={styles.bucketSpentSub}>Spent: RM {actualWantsSpent.toFixed(0)}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.bucketPill, activeBucketTab === "savings" && styles.bucketPillActive]}
            onPress={() => {
              playUiSound("tab");
              setActiveBucketTab("savings");
            }}
          >
            <Text style={styles.bucketTitle}>Save ({activePreset.savingsPct}%)</Text>
            <Text style={[styles.bucketAmount, { color: "#15803D" }]}>RM {saveGoal}</Text>
            <Text style={styles.bucketSpentSub}>Est: RM {projectedNetSavings.toFixed(0)}</Text>
          </TouchableOpacity>
        </View>

        {/* Detailed Drawer for the Selected Bucket */}
        <View style={styles.bucketDetailBox}>
          {activeBucketTab === "savings" ? (
            /* SAVINGS BUCKET VIEW: Clear Income - Spent = Projected Savings Tracker */
            <View>
              <View style={styles.bucketProgressHeader}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <PiggyBank size={14} color="#15803D" strokeWidth={2.5} />
                  <Text style={styles.bucketDetailTitle}>SAVINGS GOAL PROGRESS ({savingsProgressPct}%)</Text>
                </View>
                <Text style={[styles.bucketProgressRatio, { color: "#15803D" }]}>
                  RM {projectedNetSavings.toFixed(0)} / RM {saveGoal}
                </Text>
              </View>

              <View style={styles.progressTrackSmall}>
                <View
                  style={[
                    styles.progressFillSmall,
                    {
                      width: `${savingsProgressPct}%`,
                      backgroundColor: "#16A34A",
                    },
                  ]}
                />
              </View>

              <View style={styles.savingsFormulaCard}>
                <View style={styles.savingsFormulaRow}>
                  <Text style={styles.savingsFormulaLabel}>Baseline Monthly Income</Text>
                  <Text style={styles.savingsFormulaVal}>+RM {baselineIncome.toFixed(2)}</Text>
                </View>
                <View style={styles.savingsFormulaRow}>
                  <Text style={styles.savingsFormulaLabel}>Less: Total Expenses So Far</Text>
                  <Text style={[styles.savingsFormulaVal, { color: "#E11D48" }]}>-RM {selectedMonthSpent.toFixed(2)}</Text>
                </View>
                <View
                  style={[
                    styles.savingsFormulaRow,
                    {
                      borderTopWidth: 1,
                      borderColor: COLORS.borderMuted,
                      paddingTop: 6,
                      marginTop: 4,
                    },
                  ]}
                >
                  <Text style={[styles.savingsFormulaLabel, { fontWeight: "bold", color: COLORS.text }]}>Projected Month-End Savings</Text>
                  <Text style={[styles.savingsFormulaVal, { color: "#15803D", fontSize: 10.5 }]}>RM {projectedNetSavings.toFixed(2)}</Text>
                </View>
              </View>
            </View>
          ) : (
            /* NEEDS OR WANTS BUCKET VIEW: Bucket Progress Bar + Non-Zero Category Rows */
            <View>
              <View style={styles.bucketProgressHeader}>
                <Text style={styles.bucketDetailTitle}>
                  {activeBucketTab === "needs" ? "ESSENTIAL NEEDS SPENT" : "LIFESTYLE WANTS SPENT"} ({bucketProgressPct}%)
                </Text>
                <Text style={styles.bucketProgressRatio}>
                  RM {activeSpent.toFixed(2)} / RM {activeCap}
                </Text>
              </View>

              <View style={styles.progressTrackSmall}>
                <View
                  style={[
                    styles.progressFillSmall,
                    {
                      width: `${bucketProgressPct}%`,
                      backgroundColor: activeSpent > activeCap ? "#E11D48" : COLORS.primary,
                    },
                  ]}
                />
              </View>

              {activeCategoryRows.length === 0 ? (
                <Text style={styles.emptyBucketCatText}>
                  No {activeBucketTab === "needs" ? "essential (Needs)" : "discretionary (Wants)"} expenses recorded in {activeMonthObj.label} yet.
                </Text>
              ) : (
                <View style={{ gap: 8, marginTop: 8 }}>
                  {activeCategoryRows.map((cat) => (
                    <View key={cat.catKey} style={styles.catBreakRow}>
                      <CategoryBadge category={cat.catKey} size={26} iconSize={13} />
                      <View style={{ flex: 1 }}>
                        <View style={styles.catBreakLabelRow}>
                          <Text style={styles.catBreakName}>{cat.label}</Text>
                          <Text style={styles.catBreakAmt}>
                            RM {cat.spent.toFixed(2)} ({cat.sharePct}%)
                          </Text>
                        </View>
                        <View style={styles.catMiniTrack}>
                          <View
                            style={[
                              styles.catMiniFill,
                              {
                                width: `${Math.max(6, cat.sharePct)}%`,
                                backgroundColor: cat.color,
                              },
                            ]}
                          />
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.background,
        position: "relative",
      }}
    >
      <FloatingToast toast={toast} slideAnim={slideAnim} />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* 1. Month Selector Bar */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.monthBar}>
          {visibleMonths.map((m) => {
            const isSelected = m.key === activeMonthObj.key;
            return (
              <TouchableOpacity
                key={m.key}
                style={[styles.monthChip, isSelected && styles.monthChipActive]}
                onPress={() => {
                  playUiSound("tab");
                  setSelectedMonthKey(m.key);
                }}
              >
                <Text style={[styles.monthChipText, isSelected && styles.monthChipTextActive]}>
                  {m.isCurrentMonth ? `${m.shortMonth} (Current)` : m.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 2. Monthly Budget Status Hero Card */}
        <WireBox style={styles.statusCard}>
          <View style={styles.statusHeaderRow}>
            <View>
              <Text style={styles.statusTitle}>{activeMonthObj.label.toUpperCase()} BUDGET</Text>
              <Text style={styles.statusSub}>{isCurrentMonthSelected ? "Active Monthly Plan" : "Historical Archive (Read-Only)"}</Text>
            </View>

            {activeLimit > 0 && (
              <View style={[styles.statusBadge, { backgroundColor: isOverBudget ? "#FFE4E6" : "#DCFCE7" }]}>
                <Text style={[styles.statusBadgeText, { color: isOverBudget ? "#E11D48" : "#15803D" }]}>
                  {isOverBudget ? "OVER LIMIT" : `${usagePct.toFixed(0)}% USED`}
                </Text>
              </View>
            )}
          </View>

          {loading ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 16 }} />
          ) : activeLimit > 0 ? (
            <>
              <View style={styles.MainNumbersRow}>
                <Text style={styles.spentBigText}>RM {selectedMonthSpent.toFixed(2)}</Text>
                <Text style={styles.limitMutedText}>/ RM {activeLimit.toFixed(0)} limit</Text>
              </View>

              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${usagePct}%`,
                      backgroundColor: isOverBudget ? "#E11D48" : usagePct >= 80 ? "#F59E0B" : "#16A34A",
                    },
                  ]}
                />
              </View>

              <View style={styles.statusFooterRow}>
                <Text style={styles.footerMetaText}>
                  {isOverBudget
                    ? `Exceeded by RM ${(selectedMonthSpent - activeLimit).toFixed(2)}`
                    : `RM ${(activeLimit - selectedMonthSpent).toFixed(2)} remaining`}
                </Text>
                <Text style={styles.footerMetaText}>Savings Goal: RM {activeSavings.toFixed(0)}</Text>
              </View>
            </>
          ) : (
            <Text style={styles.noBudgetText}>
              {isCurrentMonthSelected
                ? "No budget set for this month yet. Apply an AI plan below!"
                : `No budget was recorded for ${activeMonthObj.label}.`}
            </Text>
          )}
        </WireBox>

        {/* 3. Current Month Controls vs Past Month Archive Breakdown */}
        {!isCurrentMonthSelected ? (
          <WireBox style={styles.lockedArchiveCard}>
            <View style={styles.lockedTitleRow}>
              <Lock size={15} color={COLORS.primary} strokeWidth={2.5} />
              <Text style={styles.lockedTitle}>{activeMonthObj.label.toUpperCase()} BREAKDOWN (READ-ONLY)</Text>
            </View>
            <Text style={styles.lockedSub}>
              Past months are locked to preserve your historical records, but you can inspect your category spending below:
            </Text>

            {renderBucketBreakdownSection(
              activeLimit > 0 ? Math.round(activeLimit * 0.625) : needsAllowance,
              activeLimit > 0 ? Math.round(activeLimit * 0.375) : wantsAllowance,
              activeSavings > 0 ? activeSavings : recommendedSavings,
              `TAP ANY BUCKET TO INSPECT ${activeMonthObj.shortMonth.toUpperCase()} SPENDING`,
            )}
          </WireBox>
        ) : (
          <>
            {/* Segmented Switcher: AI Smart Plan vs Custom Input */}
            <View style={styles.modeTabsRow}>
              <TouchableOpacity
                style={[styles.modeTabBtn, activeMode === "smart" && styles.modeTabBtnActive]}
                onPress={() => {
                  playUiSound("tab");
                  setActiveMode("smart");
                }}
              >
                <Sparkles size={13} color={activeMode === "smart" ? COLORS.primaryText : COLORS.text} strokeWidth={2.5} />
                <Text style={[styles.modeTabText, activeMode === "smart" && styles.modeTabTextActive]}>AI SMART PLAN</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeTabBtn, activeMode === "custom" && styles.modeTabBtnActive]}
                onPress={() => {
                  playUiSound("tab");
                  setActiveMode("custom");
                }}
              >
                <Sliders size={13} color={activeMode === "custom" ? COLORS.primaryText : COLORS.text} strokeWidth={2.5} />
                <Text style={[styles.modeTabText, activeMode === "custom" && styles.modeTabTextActive]}>CUSTOM BUDGET</Text>
              </TouchableOpacity>
            </View>

            {activeMode === "smart" ? (
              <WireBox style={styles.plannerCard}>
                {/* Header with "How it works" Modal Trigger */}
                <View style={styles.plannerTopRow}>
                  <View style={{ flex: 1 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <Text style={styles.plannerTitle}>CHOOSE ALLOCATION RATIO</Text>
                      <View style={styles.aiTagPill}>
                        <Text style={styles.aiTagPillText}>AI-ASSISTED</Text>
                      </View>
                    </View>
                    <Text style={styles.plannerSub}>Based on RM {baselineIncome.toFixed(0)} income & spending history</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.infoPillBtn}
                    onPress={() => {
                      playUiSound("tab");
                      setShowHowItWorksModal(true);
                    }}
                  >
                    <Info size={12} color={COLORS.primary} strokeWidth={2.5} />
                    <Text style={styles.infoPillText}>How it works</Text>
                  </TouchableOpacity>
                </View>

                {/* 3 Compact Ratio Cards */}
                <View style={styles.presetCardsRow}>
                  {BUDGET_PRESETS.map((p) => {
                    const isSelected = p.id === selectedPresetId;
                    const isSuggested = p.id === aiRec.presetId;
                    return (
                      <TouchableOpacity
                        key={p.id}
                        style={[styles.presetMiniCard, isSelected && styles.presetMiniCardActive]}
                        onPress={() => {
                          playUiSound("tab");
                          setSelectedPresetId(p.id);
                        }}
                        activeOpacity={0.8}
                      >
                        {isSuggested && (
                          <View style={styles.suggestedCrownBadge}>
                            <Text style={styles.suggestedCrownText}>★ SUGGESTED</Text>
                          </View>
                        )}
                        <Text style={[styles.presetRatioText, isSelected && { color: COLORS.primaryText }]}>{p.ratioLabel}</Text>
                        <Text style={[styles.presetNameText, isSelected && { color: COLORS.primaryText }]} numberOfLines={1}>
                          {p.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Collapsible 1-Line AI Recommendation Reason Box */}
                <TouchableOpacity style={styles.whyRecommendBox} activeOpacity={0.8} onPress={() => setShowWhyReasons(!showWhyReasons)}>
                  <View style={styles.whyHeaderRow}>
                    <Sparkles size={12} color={COLORS.primary} strokeWidth={2.5} />
                    <Text style={styles.whyHeaderTitle} numberOfLines={1}>
                      AI Suggests {BUDGET_PRESETS.find((p) => p.id === aiRec.presetId)?.name} (
                      {BUDGET_PRESETS.find((p) => p.id === aiRec.presetId)?.ratioLabel}) — Why?
                    </Text>
                    {showWhyReasons ? <ChevronUp size={14} color={COLORS.textMuted} /> : <ChevronDown size={14} color={COLORS.textMuted} />}
                  </View>

                  {showWhyReasons && (
                    <View style={{ marginTop: 6, gap: 3 }}>
                      {aiRec.reasons.map((r, i) => (
                        <Text key={i} style={styles.whyBulletText}>
                          • {r}
                        </Text>
                      ))}
                    </View>
                  )}
                </TouchableOpacity>

                {/* Interactive 3-Bucket Breakdown + Category Progress Bars */}
                {renderBucketBreakdownSection(needsAllowance, wantsAllowance, recommendedSavings)}

                <WireButton
                  label={saving ? "APPLYING..." : `APPLY ${activePreset.ratioLabel} PLAN (RM ${recommendedLimit} LIMIT)`}
                  onPress={() => handleSaveBudget(recommendedLimit, recommendedSavings)}
                  disabled={saving}
                  style={{ marginTop: 12 }}
                />
              </WireBox>
            ) : (
              <WireBox style={styles.plannerCard}>
                <Text style={styles.plannerTitle}>CUSTOM MONTHLY TARGETS</Text>
                <Text style={[styles.plannerSub, { marginBottom: 12 }]}>Set your own monthly spending limit and savings target</Text>

                <WireInput
                  label="MONTHLY SPENDING LIMIT (RM)"
                  value={monthlyLimitInput}
                  onChangeText={setMonthlyLimitInput}
                  placeholder="e.g. 2400"
                  keyboardType="numeric"
                />

                <WireInput
                  label="MONTHLY SAVINGS GOAL (RM)"
                  value={savingsTargetInput}
                  onChangeText={setSavingsTargetInput}
                  placeholder="e.g. 600"
                  keyboardType="numeric"
                />

                <WireButton
                  label={saving ? "SAVING..." : "SAVE CUSTOM BUDGET"}
                  onPress={() => handleSaveBudget(monthlyLimitInput, savingsTargetInput)}
                  disabled={saving}
                />
              </WireBox>
            )}
          </>
        )}

        {/* 4. Modal: "HOW SMART BUDGETING WORKS" */}
        <Modal visible={showHowItWorksModal} transparent={true} animationType="fade" onRequestClose={() => setShowHowItWorksModal(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.modalTitle}>HOW SMART BUDGETING WORKS</Text>
                  <Text style={styles.modalSubTitle}>YOUR FINANCIAL DATA, YOUR BUDGET</Text>
                </View>
                <TouchableOpacity onPress={() => setShowHowItWorksModal(false)}>
                  <X size={18} color={COLORS.text} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 390 }} showsVerticalScrollIndicator={false}>
                <Text style={styles.modalIntroText}>
                  Ka-Ching! analyses your financial information to help you establish a suitable monthly budget.
                </Text>

                <View style={styles.stepItemBox}>
                  <Text style={styles.stepTitle}>01. Analyse your financial activity</Text>
                  <Text style={styles.stepBody}>
                    Your previous transactions, monthly income and spending categories are analysed to understand your financial behaviour.
                  </Text>
                </View>

                <View style={styles.stepItemBox}>
                  <Text style={styles.stepTitle}>02. Recommend an allocation</Text>
                  <Text style={styles.stepBody}>
                    Based on your financial history, Ka-Ching! evaluates three predefined budget allocation options and suggests a suitable starting
                    point.
                  </Text>
                </View>

                <View style={styles.stepItemBox}>
                  <Text style={styles.stepTitle}>03. Personalise your budget</Text>
                  <Text style={styles.stepBody}>
                    Select another allocation or customise your spending limit and savings goal according to your needs.
                  </Text>
                </View>

                <Text style={styles.sectionDividerTitle}>UNDERSTANDING THE THREE ALLOCATIONS</Text>

                {BUDGET_PRESETS.map((p) => (
                  <View key={p.id} style={styles.modalPresetBox}>
                    <View style={styles.modalPresetTop}>
                      <Text style={styles.modalPresetName}>
                        {p.name} ({p.ratioLabel})
                      </Text>
                    </View>
                    <Text style={styles.modalPresetDesc}>{p.desc}</Text>
                  </View>
                ))}

                <View style={styles.goodToKnowBox}>
                  <Text style={styles.goodToKnowTitle}>Good to know</Text>
                  <Text style={styles.goodToKnowBody}>
                    The three ratios are budgeting starting points, not fixed financial rules. You can adjust your allocation at any time.
                  </Text>
                </View>
              </ScrollView>

              <WireButton label="GOT IT" onPress={() => setShowHowItWorksModal(false)} style={{ marginTop: 12 }} />
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
}

const getStyles = () =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 36,
    },
    monthBar: {
      paddingBottom: 12,
      gap: 8,
    },
    monthChip: {
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      borderRadius: SHAPES.chipRadius,
      backgroundColor: COLORS.card,
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginRight: 6,
    },
    monthChipActive: {
      backgroundColor: COLORS.primary,
    },
    monthChipText: {
      fontFamily: FONTS.mono,
      fontSize: 9.5,
      fontWeight: "bold",
      color: COLORS.textMuted,
    },
    monthChipTextActive: {
      color: COLORS.primaryText,
    },
    statusCard: {
      marginBottom: 14,
      padding: 14,
    },
    statusHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },
    statusTitle: {
      fontFamily: FONTS.mono,
      fontSize: 11,
      fontWeight: "bold",
      color: COLORS.text,
      letterSpacing: 0.8,
    },
    statusSub: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      color: COLORS.textMuted,
      marginTop: 2,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: SHAPES.chipRadius,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    statusBadgeText: {
      fontFamily: FONTS.mono,
      fontSize: 8,
      fontWeight: "bold",
    },
    MainNumbersRow: {
      flexDirection: "row",
      alignItems: "baseline",
      gap: 6,
      marginBottom: 8,
    },
    spentBigText: {
      fontFamily: FONTS.mono,
      fontSize: 22,
      fontWeight: "bold",
      color: COLORS.text,
    },
    limitMutedText: {
      fontFamily: FONTS.mono,
      fontSize: 11,
      color: COLORS.textMuted,
    },
    progressTrack: {
      height: 10,
      borderWidth: 1.5,
      borderColor: COLORS.border,
      borderRadius: 6,
      backgroundColor: COLORS.secondary,
      overflow: "hidden",
      marginBottom: 8,
    },
    progressFill: {
      height: "100%",
    },
    statusFooterRow: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    footerMetaText: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      color: COLORS.textMuted,
      fontWeight: "bold",
    },
    noBudgetText: {
      fontFamily: FONTS.mono,
      fontSize: 9.5,
      color: COLORS.textMuted,
      paddingVertical: 8,
    },
    modeTabsRow: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 12,
    },
    modeTabBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      borderRadius: SHAPES.buttonRadius,
      backgroundColor: COLORS.card,
      paddingVertical: 10,
    },
    modeTabBtnActive: {
      backgroundColor: COLORS.primary,
    },
    modeTabText: {
      fontFamily: FONTS.mono,
      fontSize: 9.5,
      fontWeight: "bold",
      color: COLORS.text,
    },
    modeTabTextActive: {
      color: COLORS.primaryText,
    },
    plannerCard: {
      padding: 14,
    },
    plannerTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 12,
      gap: 8,
    },
    plannerTitle: {
      fontFamily: FONTS.mono,
      fontSize: 10.5,
      fontWeight: "bold",
      color: COLORS.text,
    },
    aiTagPill: {
      backgroundColor: COLORS.secondary,
      borderWidth: 1,
      borderColor: COLORS.primary,
      borderRadius: 4,
      paddingHorizontal: 5,
      paddingVertical: 1,
    },
    aiTagPillText: {
      fontFamily: FONTS.mono,
      fontSize: 7,
      fontWeight: "bold",
      color: COLORS.primary,
    },
    plannerSub: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      color: COLORS.textMuted,
      marginTop: 2,
    },
    infoPillBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      borderWidth: 1.5,
      borderColor: COLORS.border,
      borderRadius: SHAPES.chipRadius,
      backgroundColor: COLORS.secondary,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    infoPillText: {
      fontFamily: FONTS.mono,
      fontSize: 8,
      fontWeight: "bold",
      color: COLORS.text,
    },
    presetCardsRow: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 10,
    },
    presetMiniCard: {
      flex: 1,
      borderWidth: 1.5,
      borderColor: COLORS.border,
      borderRadius: SHAPES.inputRadius,
      backgroundColor: COLORS.inputBg,
      paddingVertical: 10,
      paddingHorizontal: 6,
      alignItems: "center",
    },
    presetMiniCardActive: {
      backgroundColor: COLORS.primary,
    },
    suggestedCrownBadge: {
      backgroundColor: "#FEF08A",
      borderWidth: 1,
      borderColor: "#121212",
      borderRadius: 4,
      paddingHorizontal: 4,
      paddingVertical: 1,
      marginBottom: 4,
    },
    suggestedCrownText: {
      fontFamily: FONTS.mono,
      fontSize: 6.5,
      fontWeight: "bold",
      color: "#121212",
    },
    presetRatioText: {
      fontFamily: FONTS.mono,
      fontSize: 9.5,
      fontWeight: "bold",
      color: COLORS.text,
    },
    presetNameText: {
      fontFamily: FONTS.mono,
      fontSize: 8,
      color: COLORS.textMuted,
      marginTop: 3,
    },
    whyRecommendBox: {
      borderWidth: 1.5,
      borderColor: COLORS.borderMuted,
      borderRadius: SHAPES.inputRadius,
      backgroundColor: COLORS.inputBg,
      padding: 10,
      marginBottom: 10,
    },
    whyHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    whyHeaderTitle: {
      flex: 1,
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      fontWeight: "bold",
      color: COLORS.text,
    },
    whyBulletText: {
      fontFamily: FONTS.mono,
      fontSize: 8,
      color: COLORS.textMuted,
      lineHeight: 12,
    },
    tapBucketHint: {
      fontFamily: FONTS.mono,
      fontSize: 7.5,
      fontWeight: "bold",
      color: COLORS.textMuted,
      marginBottom: 6,
      letterSpacing: 0.4,
    },
    bucketRow: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 8,
    },
    bucketPill: {
      flex: 1,
      borderWidth: 1.5,
      borderColor: COLORS.borderMuted,
      borderRadius: SHAPES.inputRadius,
      backgroundColor: COLORS.card,
      paddingVertical: 8,
      paddingHorizontal: 6,
      alignItems: "center",
    },
    bucketPillActive: {
      borderColor: COLORS.primary,
      backgroundColor: COLORS.secondary,
    },
    bucketTitle: {
      fontFamily: FONTS.mono,
      fontSize: 8,
      color: COLORS.textMuted,
      fontWeight: "bold",
    },
    bucketAmount: {
      fontFamily: FONTS.mono,
      fontSize: 11,
      fontWeight: "bold",
      color: COLORS.text,
      marginTop: 2,
    },
    bucketSpentSub: {
      fontFamily: FONTS.mono,
      fontSize: 7.5,
      color: COLORS.textMuted,
      marginTop: 2,
    },
    bucketDetailBox: {
      borderWidth: 1,
      borderColor: COLORS.borderMuted,
      borderStyle: "dashed",
      borderRadius: SHAPES.inputRadius,
      backgroundColor: COLORS.inputBg,
      padding: 10,
    },
    bucketProgressHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 5,
    },
    bucketDetailTitle: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      fontWeight: "bold",
      color: COLORS.text,
    },
    bucketProgressRatio: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      fontWeight: "bold",
      color: COLORS.primary,
    },
    progressTrackSmall: {
      height: 7,
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: 4,
      backgroundColor: COLORS.card,
      overflow: "hidden",
      marginBottom: 6,
    },
    progressFillSmall: {
      height: "100%",
    },
    emptyBucketCatText: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      color: COLORS.textMuted,
      textAlign: "center",
      paddingVertical: 8,
    },
    catBreakRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    catBreakLabelRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 3,
    },
    catBreakName: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      fontWeight: "bold",
      color: COLORS.text,
    },
    catBreakAmt: {
      fontFamily: FONTS.mono,
      fontSize: 8,
      color: COLORS.textMuted,
      fontWeight: "bold",
    },
    catMiniTrack: {
      height: 5,
      borderRadius: 3,
      backgroundColor: COLORS.secondary,
      overflow: "hidden",
    },
    catMiniFill: {
      height: "100%",
    },
    savingsFormulaCard: {
      borderWidth: 1,
      borderColor: COLORS.borderMuted,
      borderRadius: SHAPES.inputRadius,
      backgroundColor: COLORS.card,
      padding: 8,
      marginTop: 4,
      gap: 4,
    },
    savingsFormulaRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    savingsFormulaLabel: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      color: COLORS.textMuted,
    },
    savingsFormulaVal: {
      fontFamily: FONTS.mono,
      fontSize: 9,
      fontWeight: "bold",
      color: COLORS.text,
    },
    lockedArchiveCard: {
      padding: 14,
      backgroundColor: COLORS.card,
    },
    lockedTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 6,
    },
    lockedTitle: {
      fontFamily: FONTS.mono,
      fontSize: 10.5,
      fontWeight: "bold",
      color: COLORS.text,
    },
    lockedSub: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      color: COLORS.textMuted,
      lineHeight: 13,
      marginBottom: 10,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
      padding: 18,
    },
    modalCard: {
      width: "100%",
      maxWidth: 360,
      backgroundColor: COLORS.card,
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      borderRadius: SHAPES.cardRadius,
      padding: 16,
    },
    modalHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottomWidth: 1.5,
      borderColor: COLORS.borderMuted,
      borderStyle: "dashed",
      paddingBottom: 10,
      marginBottom: 10,
    },
    modalTitle: {
      fontFamily: FONTS.mono,
      fontSize: 11.5,
      fontWeight: "bold",
      color: COLORS.text,
    },
    modalSubTitle: {
      fontFamily: FONTS.mono,
      fontSize: 8,
      fontWeight: "bold",
      color: COLORS.primary,
      marginTop: 2,
    },
    modalIntroText: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      color: COLORS.textMuted,
      lineHeight: 13,
      marginBottom: 10,
    },
    stepItemBox: {
      borderLeftWidth: 2,
      borderColor: COLORS.primary,
      paddingLeft: 8,
      marginBottom: 8,
    },
    stepTitle: {
      fontFamily: FONTS.mono,
      fontSize: 9,
      fontWeight: "bold",
      color: COLORS.text,
    },
    stepBody: {
      fontFamily: FONTS.mono,
      fontSize: 8,
      color: COLORS.textMuted,
      lineHeight: 12,
      marginTop: 2,
    },
    sectionDividerTitle: {
      fontFamily: FONTS.mono,
      fontSize: 9,
      fontWeight: "bold",
      color: COLORS.text,
      marginTop: 6,
      marginBottom: 8,
      letterSpacing: 0.5,
    },
    modalPresetBox: {
      borderWidth: 1.5,
      borderColor: COLORS.borderMuted,
      borderRadius: SHAPES.inputRadius,
      backgroundColor: COLORS.inputBg,
      padding: 9,
      marginBottom: 8,
    },
    modalPresetTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 4,
    },
    modalPresetName: {
      fontFamily: FONTS.mono,
      fontSize: 9.5,
      fontWeight: "bold",
      color: COLORS.text,
    },
    modalPresetDesc: {
      fontFamily: FONTS.mono,
      fontSize: 8,
      color: COLORS.textMuted,
      lineHeight: 12,
    },
    goodToKnowBox: {
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: SHAPES.inputRadius,
      backgroundColor: COLORS.secondary,
      padding: 9,
      marginTop: 2,
    },
    goodToKnowTitle: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      fontWeight: "bold",
      color: COLORS.text,
      marginBottom: 2,
    },
    goodToKnowBody: {
      fontFamily: FONTS.mono,
      fontSize: 8,
      color: COLORS.textMuted,
      lineHeight: 12,
    },
  });
