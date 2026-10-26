// Import React hooks, native UI components, and Lucide icons
import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { Zap, Sparkles, Sliders, RotateCcw } from "lucide-react-native";
import apiClient from "../api/client";
import { COLORS, SHAPES, FONTS } from "../theme/theme";
import { WireBox, WireInput, WireButton, FloatingToast, useFloatingToast } from "../components/WireUI";
import { CATEGORY_CONFIG, EXPENSE_CATEGORY_KEYS, CategoryBadge } from "../utils/categoryIcons";

// Define budget allocation plans strictly aligned with the 50/30/20 rule (50% Needs + 30% Wants = 80% Limit, 20% Savings)
const RATIO_PRESETS = [
  {
    id: "STANDARD_50_30_20",
    name: "Balanced Plan",
    subtitle: "50% Needs + 30% Wants (80% Limit) • 20% Savings",
    needsRatio: 0.5,
    wantsRatio: 0.3,
    limitRatio: 0.8,
    saveRatio: 0.2,
    bufferRatio: 0.1,
  },
  {
    id: "SAVER_50_20_30",
    name: "Aggressive Saver",
    subtitle: "50% Needs + 20% Wants (70% Limit) • 30% Savings",
    needsRatio: 0.5,
    wantsRatio: 0.2,
    limitRatio: 0.7,
    saveRatio: 0.3,
    bufferRatio: 0.1,
  },
  {
    id: "FLEX_60_25_15",
    name: "Flexible Living",
    subtitle: "60% Needs + 25% Wants (85% Limit) • 15% Savings",
    needsRatio: 0.6,
    wantsRatio: 0.25,
    limitRatio: 0.85,
    saveRatio: 0.15,
    bufferRatio: 0.1,
  },
];

// Budget Planning Screen (Uses global FloatingToast, strictly aligned with 50/30/20 rule & Monthly period)
export default function BudgetScreen({ user }) {
  const [currentBudget, setCurrentBudget] = useState(null);
  const [previousBudgetBackup, setPreviousBudgetBackup] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [limitInput, setLimitInput] = useState("");
  const [savingsInput, setSavingsInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState("STANDARD_50_30_20");

  // Invoke global FloatingToast hook from WireUI.js
  const { toast, slideAnim, showToast } = useFloatingToast();

  useEffect(() => {
    fetchBudgetAndTransactions();
  }, []);

  const fetchBudgetAndTransactions = async () => {
    try {
      setLoading(true);
      const [budgetRes, txRes] = await Promise.all([apiClient.get(`/budgets/${user.id}`), apiClient.get(`/transactions/${user.id}`)]);

      const savedBudget = budgetRes.data?.data || null;
      const txList = txRes.data?.data || [];

      setCurrentBudget(savedBudget);
      setTransactions(txList);

      if (savedBudget) {
        setLimitInput(String(savedBudget.monthlyLimit));
        setSavingsInput(String(savedBudget.savingsTarget || 0));
      }
    } catch (error) {
      console.log("Failed to load budget screen data:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNumericChange = (rawText, setter, fieldName) => {
    if (/[^0-9.]/.test(rawText)) {
      showToast("error", `${fieldName}: Only numbers and decimal point are allowed.`);
      return;
    }
    const parts = rawText.split(".");
    if (parts.length > 2) {
      showToast("error", `${fieldName}: Only one decimal point is allowed.`);
      return;
    }
    if (parts.length === 2 && parts[1].length > 2) {
      showToast("error", `${fieldName}: Maximum 2 decimal places allowed.`);
      return;
    }
    setter(rawText);
  };

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const currentMonthName = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  let thisMonthExpense = 0;
  let thisMonthIncome = 0;
  const thisMonthCategorySpend = {};
  EXPENSE_CATEGORY_KEYS.forEach((k) => {
    thisMonthCategorySpend[k] = 0;
  });

  const threeMonthsAgo = new Date(currentYear, currentMonth - 2, 1, 0, 0, 0);
  const activeExpenseMonthsSet = new Set();
  const activeIncomeMonthsSet = new Set();
  let threeMonthTotalExpense = 0;
  let threeMonthTotalIncome = 0;
  let threeMonthWantsExpense = 0;

  transactions.forEach((tx) => {
    const amt = Number(tx.amount) || 0;
    const txDate = new Date(tx.date || tx.createdAt || Date.now());
    const mKey = `${txDate.getFullYear()}-${txDate.getMonth()}`;

    if (txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear) {
      if (tx.type === "EXPENSE") {
        thisMonthExpense += amt;
        const catKey = thisMonthCategorySpend[tx.category] !== undefined ? tx.category : "OTHER_EXPENSE";
        thisMonthCategorySpend[catKey] += amt;
      } else if (tx.type === "INCOME") {
        thisMonthIncome += amt;
      }
    }

    if (txDate >= threeMonthsAgo) {
      if (tx.type === "EXPENSE") {
        threeMonthTotalExpense += amt;
        activeExpenseMonthsSet.add(mKey);
        if (["SHOPPING", "LEISURE_AND_ENTERTAINMENT", "OTHER_EXPENSE"].includes(tx.category)) {
          threeMonthWantsExpense += amt;
        }
      } else if (tx.type === "INCOME") {
        threeMonthTotalIncome += amt;
        activeIncomeMonthsSet.add(mKey);
      }
    }
  });

  // 3-Tier trigger logic for AI Auto-Recommendation
  const activePreset = RATIO_PRESETS.find((p) => p.id === selectedPresetId) || RATIO_PRESETS[0];
  const numExpenseMonths = Math.max(1, activeExpenseMonthsSet.size);
  const numIncomeMonths = Math.max(1, activeIncomeMonthsSet.size);
  const avgMonthlyExpense = threeMonthTotalExpense / numExpenseMonths;
  const avgMonthlyIncome = threeMonthTotalIncome / numIncomeMonths;

  let aiBaseIncome = 2500;
  let aiModeDescription = "Starter Baseline: Based on RM 2,500 monthly income (Log transactions to personalize)";

  if (avgMonthlyIncome > 0 && avgMonthlyExpense > 0) {
    aiBaseIncome = Math.max(avgMonthlyIncome, avgMonthlyExpense * 1.15);
    aiModeDescription = `Based on your ${activeExpenseMonthsSet.size}-month spending average (RM ${avgMonthlyExpense.toFixed(0)}/mo)`;
  } else if (avgMonthlyIncome > 0) {
    aiBaseIncome = avgMonthlyIncome;
    aiModeDescription = `Based on your logged monthly income (RM ${avgMonthlyIncome.toFixed(0)})`;
  } else if (avgMonthlyExpense > 0) {
    const trimmedSpend = avgMonthlyExpense - (threeMonthWantsExpense / numExpenseMonths) * 0.1;
    aiBaseIncome = trimmedSpend / activePreset.limitRatio;
    aiModeDescription = `Based on ${activeExpenseMonthsSet.size}-month spending average (-10% non-essential trim)`;
  }

  const roundToTen = (val) => Math.max(50, Math.round(val / 10) * 10);
  const aiNeedsAmount = roundToTen(aiBaseIncome * activePreset.needsRatio);
  const aiWantsAmount = roundToTen(aiBaseIncome * activePreset.wantsRatio);
  const aiSuggestedLimit = aiNeedsAmount + aiWantsAmount;
  const aiSavingsTarget = roundToTen(aiBaseIncome * activePreset.saveRatio);
  const aiEmergencyBuffer = roundToTen(aiBaseIncome * activePreset.bufferRatio);

  const handleSaveManualBudget = async () => {
    const parsedLimit = parseFloat(limitInput);
    const parsedSavings = savingsInput ? parseFloat(savingsInput) : 0;

    if (!limitInput || isNaN(parsedLimit) || parsedLimit <= 0) {
      showToast("error", "Please enter a valid Monthly Spending Limit greater than RM 0.");
      return;
    }
    if (parsedLimit > 100000 || parsedSavings > 100000) {
      showToast("error", "Amount exceeds RM 100,000/month. Please check for extra zeros!");
      return;
    }

    try {
      setSaving(true);
      if (currentBudget) {
        setPreviousBudgetBackup({
          monthlyLimit: currentBudget.monthlyLimit,
          savingsTarget: currentBudget.savingsTarget || 0,
        });
      }

      const res = await apiClient.post("/budgets", {
        userId: user.id,
        monthlyLimit: Number(parsedLimit.toFixed(2)),
        savingsTarget: Number(parsedSavings.toFixed(2)),
        month: currentMonth + 1,
        year: currentYear,
      });
      setCurrentBudget(res.data.data);

      if (thisMonthIncome > 0 && parsedLimit + parsedSavings > thisMonthIncome) {
        showToast("success", `Saved! Note: Limit + Savings (RM ${(parsedLimit + parsedSavings).toFixed(0)}) exceeds this month's income.`);
      } else {
        showToast("success", 'Budget settings saved! Tap "UNDO" at the top if you made a typo.');
      }
    } catch (error) {
      showToast("error", error.response?.data?.message || "Failed to save budget settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleApplyAIRecommendation = async () => {
    try {
      setSaving(true);
      if (currentBudget) {
        setPreviousBudgetBackup({
          monthlyLimit: currentBudget.monthlyLimit,
          savingsTarget: currentBudget.savingsTarget || 0,
        });
      }

      setLimitInput(String(aiSuggestedLimit));
      setSavingsInput(String(aiSavingsTarget));

      const res = await apiClient.post("/budgets", {
        userId: user.id,
        monthlyLimit: aiSuggestedLimit,
        savingsTarget: aiSavingsTarget,
        month: currentMonth + 1,
        year: currentYear,
      });
      setCurrentBudget(res.data.data);
      showToast("success", `Applied ${activePreset.name}: Limit RM ${aiSuggestedLimit} & Savings RM ${aiSavingsTarget}!`);
    } catch (error) {
      showToast("error", error.response?.data?.message || "Failed to apply AI recommendation.");
    } finally {
      setSaving(false);
    }
  };

  const handleUndoLastChange = async () => {
    if (!previousBudgetBackup) return;
    try {
      setSaving(true);
      const res = await apiClient.post("/budgets", {
        userId: user.id,
        monthlyLimit: previousBudgetBackup.monthlyLimit,
        savingsTarget: previousBudgetBackup.savingsTarget,
        month: currentMonth + 1,
        year: currentYear,
      });
      setCurrentBudget(res.data.data);
      setLimitInput(String(previousBudgetBackup.monthlyLimit));
      setSavingsInput(String(previousBudgetBackup.savingsTarget));
      setPreviousBudgetBackup(null);
      showToast("success", "Restored your previous budget settings!");
    } catch (error) {
      showToast("error", "Failed to restore previous budget.");
    } finally {
      setSaving(false);
    }
  };

  const activeLimit = currentBudget?.monthlyLimit || 0;
  const activeSavings = currentBudget?.savingsTarget || 0;
  const remainingBudget = activeLimit > 0 ? activeLimit - thisMonthExpense : 0;
  const usedPercentage = activeLimit > 0 ? (thisMonthExpense / activeLimit) * 100 : 0;
  const isOverBudget = activeLimit > 0 && thisMonthExpense > activeLimit;

  const activeSpendCategories = EXPENSE_CATEGORY_KEYS.filter((catKey) => thisMonthCategorySpend[catKey] > 0).sort(
    (a, b) => thisMonthCategorySpend[b] - thisMonthCategorySpend[a],
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, position: "relative" }}>
      {/* Render globally reusable FloatingToast component */}
      <FloatingToast toast={toast} slideAnim={slideAnim} />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Section 1: Top Budget Summary Hero Card */}
        <View style={styles.summaryHeroCard}>
          <View style={styles.heroHeaderRow}>
            <Text style={styles.heroHeaderTitle}>BUDGET SUMMARY — {currentMonthName.toUpperCase()}</Text>
            {previousBudgetBackup ? (
              <TouchableOpacity style={styles.undoBadgeBtn} onPress={handleUndoLastChange} activeOpacity={0.8}>
                <RotateCcw size={10} color="#111111" strokeWidth={2.5} />
                <Text style={styles.undoBadgeText}>UNDO LAST CHANGE</Text>
              </TouchableOpacity>
            ) : activeLimit === 0 ? (
              <View style={styles.unsetBadge}>
                <Text style={styles.unsetBadgeText}>NOT SET YET</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.summaryGrid}>
            <View style={styles.summarySubBox}>
              <Text style={styles.summarySubLabel}>TOTAL BUDGET</Text>
              <Text style={styles.summarySubValue}>{activeLimit > 0 ? `RM ${activeLimit.toFixed(2)}` : "RM 0.00"}</Text>
            </View>

            <View style={styles.summarySubBox}>
              <Text style={styles.summarySubLabel}>SAVINGS TARGET</Text>
              <Text style={styles.summarySubValue}>{activeSavings > 0 ? `RM ${activeSavings.toFixed(2)}` : "RM 0.00"}</Text>
            </View>

            <View style={styles.summarySubBox}>
              <Text style={styles.summarySubLabel}>SPENT SO FAR</Text>
              <Text style={[styles.summarySubValue, { color: "#FECDD3" }]}>RM {thisMonthExpense.toFixed(2)}</Text>
            </View>

            <View style={styles.summarySubBox}>
              <Text style={styles.summarySubLabel}>REMAINING</Text>
              <Text style={[styles.summarySubValue, { color: isOverBudget ? "#FDA4AF" : "#A7F3D0" }]}>
                {activeLimit === 0
                  ? "Set limit below"
                  : isOverBudget
                    ? `-RM ${Math.abs(remainingBudget).toFixed(2)}`
                    : `RM ${remainingBudget.toFixed(2)}`}
              </Text>
            </View>
          </View>

          <View style={styles.overallProgressHeader}>
            <Text style={styles.overallProgressText}>
              {activeLimit > 0 ? `Overall budget used: ${usedPercentage.toFixed(1)}%` : 'Tap "Apply Recommendation" below to initialize your budget'}
            </Text>
            {isOverBudget && <Text style={styles.overBudgetWarningTag}>OVER LIMIT!</Text>}
          </View>

          <View style={styles.overallTrack}>
            <View
              style={[
                styles.overallFill,
                {
                  width: `${Math.min(usedPercentage, 100)}%`,
                  backgroundColor: isOverBudget ? "#FB7185" : usedPercentage > 80 ? "#FBBF24" : "#A7F3D0",
                },
              ]}
            />
          </View>
        </View>

        {/* Section 2: Category Budget Usage Breakdown Card */}
        <WireBox style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeaderTitle}>BUDGET USAGE — THIS MONTH</Text>
            <Text style={styles.cardHeaderHint}>{activeSpendCategories.length} active categories</Text>
          </View>

          {activeSpendCategories.length === 0 ? (
            <View style={styles.emptyUsageBox}>
              <Text style={styles.emptyUsageText}>
                No expenses recorded this month yet. Once you add expenses, you will see how much of your total budget each category consumes.
              </Text>
            </View>
          ) : (
            activeSpendCategories.map((catKey, idx) => {
              const cfg = CATEGORY_CONFIG[catKey];
              const spentAmt = thisMonthCategorySpend[catKey];
              const denominator = activeLimit > 0 ? activeLimit : thisMonthExpense;
              const pctOfTotal = denominator > 0 ? (spentAmt / denominator) * 100 : 0;

              return (
                <View key={catKey} style={[styles.usageItemBox, idx < activeSpendCategories.length - 1 && styles.usageItemBorder]}>
                  <View style={styles.usageTopRow}>
                    <View style={styles.usageCatLeft}>
                      <CategoryBadge category={catKey} size={28} iconSize={14} />
                      <Text style={styles.usageCatTitle}>{cfg.label}</Text>
                    </View>
                    <Text style={styles.usageSpentText}>RM {spentAmt.toFixed(2)} Spent</Text>
                  </View>

                  <View style={styles.usageBarTrack}>
                    <View
                      style={[
                        styles.usageBarFill,
                        {
                          width: `${Math.min(pctOfTotal, 100)}%`,
                          backgroundColor: cfg.iconColor,
                        },
                      ]}
                    />
                  </View>

                  <Text style={styles.usageSubText}>
                    {activeLimit > 0 ? `${pctOfTotal.toFixed(1)}% of total monthly budget` : `${pctOfTotal.toFixed(1)}% of this month's spending`}
                  </Text>
                </View>
              );
            })
          )}
        </WireBox>

        {/* 模块 3：手动预算设置卡片（固定统一为 Monthly 周期） */}
        {/* Section 3: Manual Budget Setup Card (Unified as Monthly Period) */}
        <WireBox style={styles.setupCard}>
          <View style={styles.setupHeaderBorder}>
            <Text style={styles.cardHeaderTitle}>MANUAL BUDGET SETUP</Text>
          </View>

          <WireInput
            label="Monthly Spending Limit (RM)"
            placeholder="e.g. 2000.00"
            keyboardType="decimal-pad"
            value={limitInput}
            onChangeText={(txt) => handleNumericChange(txt, setLimitInput, "Spending Limit")}
          />

          <WireInput
            label="Monthly Savings Target (RM)"
            placeholder="e.g. 500.00"
            keyboardType="decimal-pad"
            value={savingsInput}
            onChangeText={(txt) => handleNumericChange(txt, setSavingsInput, "Savings Target")}
          />

          <View style={styles.periodFieldBlock}>
            <Text style={styles.periodLabel}>BUDGET PERIOD</Text>
            <View style={styles.periodReadonlyBox}>
              <Text style={styles.periodValueText}>Monthly ({currentMonthName})</Text>
              <Text style={styles.periodTag}>STANDARD</Text>
            </View>
          </View>

          <WireButton label={saving ? "SAVING..." : "SAVE BUDGET"} variant="filled" onPress={handleSaveManualBudget} />
        </WireBox>

        {/* Section 4: AI Auto-Recommendation Card (Strictly 50% Needs + 30% Wants = 80% Limit & 20% Savings) */}
        <WireBox style={styles.aiCard}>
          <View style={styles.aiHeaderRow}>
            <View style={styles.aiIconBadge}>
              <Zap size={15} color={COLORS.primaryText} strokeWidth={2.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.aiHeaderTitle}>AI AUTO-RECOMMENDATION</Text>
              <Text style={styles.aiHeaderSubtitle}>{aiModeDescription}</Text>
            </View>
          </View>

          <View style={styles.presetSection}>
            <View style={styles.presetLabelRow}>
              <Sliders size={11} color={COLORS.textMuted} strokeWidth={2.2} />
              <Text style={styles.presetSectionTitle}>ALLOCATION STYLE:</Text>
            </View>

            <View style={styles.presetPillsRow}>
              {RATIO_PRESETS.map((preset) => {
                const isSelected = preset.id === selectedPresetId;
                return (
                  <TouchableOpacity
                    key={preset.id}
                    style={[styles.presetPill, isSelected && styles.presetPillActive]}
                    onPress={() => setSelectedPresetId(preset.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.presetPillTitle, isSelected && styles.presetPillTitleActive]}>{preset.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.activePresetHint}>{activePreset.subtitle}</Text>
          </View>

          <View style={styles.aiMetricsBox}>
            <View style={styles.aiMetricRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.aiMetricLabel}>Suggested Limit</Text>
                <Text style={styles.aiMetricSub}>
                  ({Math.round(activePreset.needsRatio * 100)}% Needs RM {aiNeedsAmount} + {Math.round(activePreset.wantsRatio * 100)}% Wants RM{" "}
                  {aiWantsAmount})
                </Text>
              </View>
              <Text style={styles.aiMetricValue}>RM {aiSuggestedLimit.toFixed(2)}</Text>
            </View>

            <View style={styles.aiMetricRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.aiMetricLabel}>Savings Target</Text>
                <Text style={styles.aiMetricSub}>({Math.round(activePreset.saveRatio * 100)}% monthly savings allocation)</Text>
              </View>
              <Text style={[styles.aiMetricValue, { color: COLORS.success }]}>RM {aiSavingsTarget.toFixed(2)}</Text>
            </View>

            <View style={[styles.aiMetricRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.aiMetricLabel}>Emergency Buffer</Text>
                <Text style={styles.aiMetricSub}>(Recommended safety cushion for unexpected bills)</Text>
              </View>
              <Text style={[styles.aiMetricValue, { color: "#0284C7" }]}>RM {aiEmergencyBuffer.toFixed(2)}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.applyAiBtn} onPress={handleApplyAIRecommendation} activeOpacity={0.85} disabled={saving}>
            <Sparkles size={15} color={COLORS.primaryText} strokeWidth={2.5} />
            <Text style={styles.applyAiBtnText}>{saving ? "APPLYING..." : "APPLY RECOMMENDATION"}</Text>
          </TouchableOpacity>
        </WireBox>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 34,
  },
  summaryHeroCard: {
    borderWidth: SHAPES.borderWidth,
    borderColor: COLORS.border,
    borderRadius: SHAPES.cardRadius,
    backgroundColor: COLORS.primary,
    padding: 15,
    marginBottom: 14,
    shadowColor: COLORS.text,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 0,
    elevation: 4,
  },
  heroHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  heroHeaderTitle: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    fontWeight: "bold",
    color: COLORS.primaryText,
    opacity: 0.9,
    letterSpacing: 1,
  },
  unsetBadge: {
    backgroundColor: "rgba(255,255,255,0.22)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  unsetBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 8,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  undoBadgeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEF08A",
    borderWidth: 1.5,
    borderColor: "#111111",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: SHAPES.chipRadius,
  },
  undoBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 8,
    fontWeight: "bold",
    color: "#111111",
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 12,
  },
  summarySubBox: {
    width: "48.2%",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.4)",
    borderRadius: SHAPES.inputRadius,
    backgroundColor: "rgba(0,0,0,0.22)",
    padding: 9,
  },
  summarySubLabel: {
    fontFamily: FONTS.mono,
    fontSize: 8,
    color: COLORS.primaryText,
    opacity: 0.85,
    marginBottom: 3,
  },
  summarySubValue: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    fontWeight: "bold",
    color: COLORS.primaryText,
  },
  overallProgressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  overallProgressText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.primaryText,
    opacity: 0.95,
  },
  overBudgetWarningTag: {
    fontFamily: FONTS.mono,
    fontSize: 8,
    fontWeight: "bold",
    color: "#FECDD3",
  },
  overallTrack: {
    width: "100%",
    height: 9,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
    borderRadius: 5,
    backgroundColor: "rgba(0,0,0,0.25)",
    overflow: "hidden",
  },
  overallFill: {
    height: "100%",
  },
  sectionCard: {
    marginBottom: 14,
    padding: 0,
    overflow: "hidden",
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: SHAPES.borderWidth,
    borderColor: COLORS.borderMuted,
    borderStyle: "dashed",
  },
  cardHeaderTitle: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    fontWeight: "bold",
    color: COLORS.text,
    letterSpacing: 1,
  },
  cardHeaderHint: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.textMuted,
  },
  emptyUsageBox: {
    padding: 16,
  },
  emptyUsageText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.textMuted,
    lineHeight: 16,
    textAlign: "center",
  },
  usageItemBox: {
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  usageItemBorder: {
    borderBottomWidth: 1,
    borderColor: COLORS.borderMuted,
    borderStyle: "dashed",
  },
  usageTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  usageCatLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  usageCatTitle: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    fontWeight: "bold",
    color: COLORS.text,
  },
  usageSpentText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    fontWeight: "bold",
    color: COLORS.text,
  },
  usageBarTrack: {
    width: "100%",
    height: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    backgroundColor: COLORS.secondary,
    overflow: "hidden",
  },
  usageBarFill: {
    height: "100%",
  },
  usageSubText: {
    fontFamily: FONTS.mono,
    fontSize: 8,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  setupCard: {
    marginBottom: 14,
    padding: 14,
  },
  setupHeaderBorder: {
    borderBottomWidth: 1.5,
    borderColor: COLORS.borderMuted,
    borderStyle: "dashed",
    paddingBottom: 8,
    marginBottom: 12,
  },
  periodFieldBlock: {
    marginBottom: 14,
  },
  periodLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.textMuted,
    marginBottom: 4,
    letterSpacing: 1,
  },
  periodReadonlyBox: {
    borderWidth: SHAPES.borderWidth,
    borderColor: COLORS.border,
    borderRadius: SHAPES.inputRadius,
    backgroundColor: COLORS.inputBg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  periodValueText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.text,
  },
  periodTag: {
    fontFamily: FONTS.mono,
    fontSize: 8,
    fontWeight: "bold",
    color: COLORS.primary,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  aiCard: {
    padding: 14,
    shadowColor: COLORS.text,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 0,
    elevation: 3,
  },
  aiHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderBottomWidth: 1.5,
    borderColor: COLORS.borderMuted,
    borderStyle: "dashed",
    paddingBottom: 10,
    marginBottom: 12,
  },
  aiIconBadge: {
    width: 28,
    height: 28,
    borderRadius: SHAPES.chipRadius,
    backgroundColor: COLORS.primary,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  aiHeaderTitle: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    fontWeight: "bold",
    color: COLORS.text,
    letterSpacing: 0.8,
  },
  aiHeaderSubtitle: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.textMuted,
    marginTop: 2,
    lineHeight: 13,
  },
  presetSection: {
    marginBottom: 12,
  },
  presetLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 6,
  },
  presetSectionTitle: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    fontWeight: "bold",
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  presetPillsRow: {
    flexDirection: "row",
    gap: 6,
  },
  presetPill: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: SHAPES.chipRadius,
    backgroundColor: COLORS.inputBg,
    paddingVertical: 7,
    alignItems: "center",
  },
  presetPillActive: {
    borderColor: COLORS.border,
    backgroundColor: COLORS.primary,
  },
  presetPillTitle: {
    fontFamily: FONTS.mono,
    fontSize: 8.5,
    fontWeight: "bold",
    color: COLORS.text,
  },
  presetPillTitleActive: {
    color: COLORS.primaryText,
  },
  activePresetHint: {
    fontFamily: FONTS.mono,
    fontSize: 8,
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: 5,
  },
  aiMetricsBox: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: SHAPES.inputRadius,
    backgroundColor: COLORS.secondary,
    padding: 10,
    marginBottom: 12,
  },
  aiMetricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderColor: COLORS.borderMuted,
    borderStyle: "dashed",
  },
  aiMetricLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    fontWeight: "bold",
    color: COLORS.text,
  },
  aiMetricSub: {
    fontFamily: FONTS.mono,
    fontSize: 8,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  aiMetricValue: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.text,
  },
  applyAiBtn: {
    width: "100%",
    borderWidth: SHAPES.borderWidth,
    borderColor: COLORS.border,
    borderRadius: SHAPES.buttonRadius,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  applyAiBtnText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    fontWeight: "bold",
    color: COLORS.primaryText,
    letterSpacing: 1.2,
  },
});
