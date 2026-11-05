// Import React hooks, native UI components, and Lucide icons
import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { Sparkles, Check, AlertTriangle, CheckCircle2, RotateCcw, Lock, Calendar } from "lucide-react-native";
import apiClient from "../api/client";
import { COLORS, SHAPES, FONTS } from "../theme/theme";
import { WireBox, WireInput, WireButton, FloatingToast, useFloatingToast } from "../components/WireUI";
import { CATEGORY_CONFIG, CategoryBadge } from "../utils/categoryIcons";

const STARTER_BASELINE_RM = 2500;
const MIN_EXPENSE_RECORDS_FOR_AI = 5;

const ALLOCATION_PRESETS = [
  {
    id: "BALANCED_50_30_20",
    name: "Balanced Plan",
    badge: "50 / 30 / 20",
    limitRatio: 0.8,
    savingsRatio: 0.2,
    desc: "80% Spending (50% Needs + 30% Wants) • 20% Savings",
  },
  {
    id: "SAVER_50_20_30",
    name: "Aggressive Saver",
    badge: "50 / 20 / 30",
    limitRatio: 0.7,
    savingsRatio: 0.3,
    desc: "70% Spending (50% Needs + 20% Wants) • 30% Savings",
  },
  {
    id: "FLEX_60_25_15",
    name: "Flexible Living",
    badge: "60 / 25 / 15",
    limitRatio: 0.85,
    savingsRatio: 0.15,
    desc: "85% Spending (60% Needs + 25% Wants) • 15% Savings",
  },
];

// Helper: Generate the 6-month window (oldest to newest)
const getSixMonthWindow = () => {
  const list = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const shortMonth = d.toLocaleDateString("en-US", { month: "short" });
    const label = d.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
    list.push({
      key,
      shortMonth,
      label,
      year: d.getFullYear(),
      month: d.getMonth(),
      monthNum: d.getMonth() + 1,
      isCurrentMonth: i === 0,
    });
  }
  return list;
};

const RAW_SIX_MONTHS = getSixMonthWindow();
const CURRENT_MONTH_KEY = RAW_SIX_MONTHS[RAW_SIX_MONTHS.length - 1].key;

// Budget Planning & Read-Only Historical Budget Archive Screen
export default function BudgetScreen({ user }) {
  // Dynamically generate styles on every render so runtime theme switches apply immediately
  const styles = getStyles();

  // 1. State for current month editable inputs and historical budget records
  const [monthlyLimitInput, setMonthlyLimitInput] = useState("");
  const [savingsTargetInput, setSavingsTargetInput] = useState("");
  const [savedLimit, setSavedLimit] = useState(0);
  const [savedSavings, setSavedSavings] = useState(0);
  const [budgetHistory, setBudgetHistory] = useState([]);
  const [previousBudgetBackup, setPreviousBudgetBackup] = useState(null);

  const [transactions, setTransactions] = useState([]);
  const [selectedMonthKey, setSelectedMonthKey] = useState(CURRENT_MONTH_KEY);
  const [selectedPresetId, setSelectedPresetId] = useState("BALANCED_50_30_20");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { toast, slideAnim, showToast } = useFloatingToast();

  // 2. Fetch budget history and transactions on mount
  useEffect(() => {
    fetchBudgetAndTransactions();
  }, []);

  const fetchBudgetAndTransactions = async () => {
    try {
      setLoading(true);
      const [budgetRes, txRes] = await Promise.all([apiClient.get(`/budgets/${user.id}`), apiClient.get(`/transactions/${user.id}`)]);

      if (budgetRes.data) {
        const b = budgetRes.data.data;
        const hist = budgetRes.data.history || [];
        setBudgetHistory(hist);
        if (b) {
          setSavedLimit(b.monthlyLimit || 0);
          setSavedSavings(b.savingsTarget || 0);
          setMonthlyLimitInput(b.monthlyLimit ? String(b.monthlyLimit) : "");
          setSavingsTargetInput(b.savingsTarget ? String(b.savingsTarget) : "");
        }
      }

      if (txRes.data && txRes.data.data) {
        setTransactions(txRes.data.data);
      }
    } catch (error) {
      console.log("Failed to load budget data:", error.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. Sanitize numeric input fields
  const sanitizeDecimalInput = (rawText, setter, fieldName) => {
    if (/[^0-9.]/.test(rawText)) {
      showToast("error", `${fieldName}: Only numbers and a decimal point are allowed.`);
      return;
    }
    const parts = rawText.split(".");
    if (parts.length > 2) return;
    if (parts.length === 2 && parts[1].length > 2) return;
    setter(rawText);
  };

  // 4. Enrich the 6 months with transactions and matched historical budgets
  const enrichedMonths = RAW_SIX_MONTHS.map((mObj) => {
    const monthTxs = transactions.filter((tx) => {
      if (!tx.date) return false;
      const d = new Date(tx.date);
      return d.getFullYear() === mObj.year && d.getMonth() === mObj.month;
    });

    let income = 0;
    let expense = 0;
    let expenseCount = 0;
    const catMap = {};

    monthTxs.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      if (tx.type === "INCOME") {
        income += amt;
      } else if (tx.type === "EXPENSE") {
        expense += amt;
        expenseCount += 1;
        catMap[tx.category] = (catMap[tx.category] || 0) + amt;
      }
    });

    const matchedBudget = budgetHistory.find((b) => b.year === mObj.year && b.month === mObj.monthNum);

    const effectiveLimit = mObj.isCurrentMonth ? savedLimit : (matchedBudget?.monthlyLimit ?? savedLimit);

    const effectiveSavings = mObj.isCurrentMonth ? savedSavings : (matchedBudget?.savingsTarget ?? savedSavings);

    const categories = Object.entries(catMap)
      .map(([catKey, amount]) => {
        const cfg = CATEGORY_CONFIG[catKey] || CATEGORY_CONFIG.OTHER_EXPENSE;
        const pctOfLimit = effectiveLimit > 0 ? Math.round((amount / effectiveLimit) * 100) : 0;
        const pctOfSpend = expense > 0 ? Math.round((amount / expense) * 100) : 0;
        return {
          category: catKey,
          label: cfg.label,
          amount,
          pctOfLimit,
          pctOfSpend,
          iconColor: cfg.iconColor || COLORS.primary,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    return {
      ...mObj,
      income,
      expense,
      expenseCount,
      effectiveLimit,
      effectiveSavings,
      hasData: monthTxs.length > 0 || Boolean(matchedBudget),
      categories,
    };
  });

  // Trim leading empty months while keeping middle gap months
  const firstActiveIdx = enrichedMonths.findIndex((m) => m.hasData);
  const visibleMonths = firstActiveIdx === -1 ? [enrichedMonths[enrichedMonths.length - 1]] : enrichedMonths.slice(firstActiveIdx);

  const activeMonth = enrichedMonths.find((m) => m.key === selectedMonthKey) || enrichedMonths[enrichedMonths.length - 1];

  const isCurrentMonthSelected = activeMonth.isCurrentMonth;

  // 5. Compute AI Recommendation for Current Month
  const currentMonthObj = enrichedMonths[enrichedMonths.length - 1];
  const currentPreset = ALLOCATION_PRESETS.find((p) => p.id === selectedPresetId) || ALLOCATION_PRESETS[0];

  let totalAllExpense = 0;
  let totalAllExpenseCount = 0;
  const distinctExpenseMonths = new Set();

  transactions.forEach((tx) => {
    if (tx.type === "EXPENSE" && tx.date) {
      const d = new Date(tx.date);
      totalAllExpense += Number(tx.amount) || 0;
      totalAllExpenseCount += 1;
      distinctExpenseMonths.add(`${d.getFullYear()}-${d.getMonth()}`);
    }
  });

  const activeMonthCount = Math.max(1, distinctExpenseMonths.size);
  const avgHistoricalMonthlyExpense = totalAllExpense / activeMonthCount;
  const hasRealisticMonthlyIncome = currentMonthObj.income >= 500 && currentMonthObj.income >= currentMonthObj.expense;
  const hasEnoughExpenseData = totalAllExpenseCount >= MIN_EXPENSE_RECORDS_FOR_AI;

  let baselineIncomeForAI = STARTER_BASELINE_RM;
  let aiTierTitle = "Starter Baseline (RM 2,500)";
  let aiTierReason = "";

  if (hasRealisticMonthlyIncome) {
    baselineIncomeForAI = currentMonthObj.income;
    aiTierTitle = `Based on Your Income (RM ${currentMonthObj.income.toFixed(0)})`;
    aiTierReason = `Calculated from your recorded income of RM ${currentMonthObj.income.toFixed(2)} this month using the ${currentPreset.name} (${currentPreset.badge}) rule.`;
  } else if (hasEnoughExpenseData) {
    const safeExpenseReference = Math.max(avgHistoricalMonthlyExpense, currentMonthObj.expense * 1.15);
    baselineIncomeForAI = Math.max(1000, Math.round(safeExpenseReference / currentPreset.limitRatio / 50) * 50);
    aiTierTitle = `Based on Your Spending (${totalAllExpenseCount} Records)`;
    aiTierReason =
      currentMonthObj.income > 0 && currentMonthObj.income < 500
        ? `Your RM ${currentMonthObj.income.toFixed(0)} income entry looks like a one-off gift, so we based this on your real spending (RM ${currentMonthObj.expense.toFixed(0)} spent) with a 15% safety buffer.`
        : `You logged ${totalAllExpenseCount} expenses (RM ${currentMonthObj.expense.toFixed(0)} this month). We added a 15% safety buffer so your budget stays positive.`;
  } else {
    const recordsNeeded = Math.max(1, MIN_EXPENSE_RECORDS_FOR_AI - totalAllExpenseCount);
    baselineIncomeForAI = Math.max(STARTER_BASELINE_RM, Math.ceil((currentMonthObj.expense * 1.25) / 100) * 100);
    aiTierTitle = `Starter Guide (${totalAllExpenseCount}/${MIN_EXPENSE_RECORDS_AI_SAFE(MIN_EXPENSE_RECORDS_FOR_AI)} Expenses Added)`;
    aiTierReason = `Add ${recordsNeeded} more expense ${recordsNeeded === 1 ? "record" : "records"} (or log your monthly salary/allowance) to unlock a personalized recommendation. Using a RM ${baselineIncomeForAI} starter baseline for now.`;
  }

  const recommendedLimit = Math.round(baselineIncomeForAI * currentPreset.limitRatio);
  const recommendedSavings = Math.round(baselineIncomeForAI * currentPreset.savingsRatio);

  // 6. Save Current Month Budget Handler
  const handleSaveBudget = async (limitVal = monthlyLimitInput, savingsVal = savingsTargetInput, isAutoApply = false) => {
    if (!isCurrentMonthSelected) {
      showToast("error", "Past month budgets are read-only.");
      return;
    }

    const parsedLimit = parseFloat(limitVal);
    const parsedSavings = savingsVal === "" ? 0 : parseFloat(savingsVal);

    if (!limitVal || isNaN(parsedLimit) || parsedLimit <= 0) {
      showToast("error", "Please enter a Monthly Spending Limit greater than RM 0.");
      return;
    }
    if (isNaN(parsedSavings) || parsedSavings < 0) {
      showToast("error", "Please enter a valid Savings Target (RM 0 or more).");
      return;
    }

    try {
      setSaving(true);
      if (savedLimit > 0 || savedSavings > 0) {
        setPreviousBudgetBackup({
          limit: savedLimit,
          savings: savedSavings,
        });
      }

      const now = new Date();
      await apiClient.post("/budgets", {
        userId: user.id,
        monthlyLimit: Number(parsedLimit.toFixed(2)),
        savingsTarget: Number(parsedSavings.toFixed(2)),
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      });

      setSavedLimit(Number(parsedLimit.toFixed(2)));
      setSavedSavings(Number(parsedSavings.toFixed(2)));
      setMonthlyLimitInput(String(Number(parsedLimit.toFixed(2))));
      setSavingsTargetInput(String(Number(parsedSavings.toFixed(2))));

      showToast("success", isAutoApply ? `Applied ${currentPreset.name}: RM ${parsedLimit.toFixed(0)} limit!` : "Current month budget saved!");
      fetchBudgetAndTransactions();
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to save budget.";
      showToast("error", msg);
    } finally {
      setSaving(false);
    }
  };

  const handleUndoBudgetChange = async () => {
    if (!previousBudgetBackup) return;
    const { limit, savings } = previousBudgetBackup;
    setPreviousBudgetBackup(null);
    await handleSaveBudget(String(limit), String(savings), false);
    showToast("success", `Restored previous budget (RM ${limit.toFixed(0)}).`);
  };

  // Metrics for currently selected month (Current or Historical)
  const displayLimit = activeMonth.effectiveLimit;
  const displaySavings = activeMonth.effectiveSavings;
  const displayExpense = activeMonth.expense;
  const remainingBudget = displayLimit - displayExpense;
  const rawProgressPct = displayLimit > 0 ? (displayExpense / displayLimit) * 100 : 0;
  const clampedBarWidth = Math.min(100, Math.max(0, rawProgressPct));
  const isOverBudget = displayLimit > 0 && displayExpense > displayLimit;
  const isNearLimit = displayLimit > 0 && !isOverBudget && rawProgressPct >= 80;
  const statusColor = isOverBudget ? COLORS.danger : isNearLimit ? "#D97706" : "#16A34A";

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, position: "relative" }}>
      <FloatingToast toast={toast} slideAnim={slideAnim} />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Top Month Switcher Bar: Current Month (Editable) vs Past Months (Read-Only) */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.monthBarContainer}>
          {visibleMonths.map((m) => {
            const isSelected = m.key === activeMonth.key;
            return (
              <TouchableOpacity
                key={m.key}
                onPress={() => setSelectedMonthKey(m.key)}
                style={[styles.monthChip, isSelected && styles.monthChipActive]}
              >
                {!m.isCurrentMonth && <Lock size={10} color={isSelected ? COLORS.primaryText : COLORS.textMuted} strokeWidth={2.5} />}
                <Text style={[styles.monthChipText, isSelected && styles.monthChipTextActive]}>
                  {m.isCurrentMonth ? `${m.shortMonth} (Current)` : m.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Read-Only Archive Banner when inspecting a Past Month */}
        {!isCurrentMonthSelected && (
          <View style={styles.readOnlyBanner}>
            <Lock size={14} color="#D97706" strokeWidth={2.5} />
            <View style={{ flex: 1 }}>
              <Text style={styles.readOnlyTitle}>PAST MONTH ARCHIVE ({activeMonth.label.toUpperCase()} — READ ONLY)</Text>
              <Text style={styles.readOnlySub}>
                Historical budgets are locked for accuracy. Switch to {currentMonthObj.shortMonth} (Current) above to adjust your active budget.
              </Text>
            </View>
          </View>
        )}

        {/* Card 1: Monthly Budget Status Hero Card */}
        <View style={[styles.statusHeroCard, isOverBudget && styles.statusHeroCardDanger]}>
          <View style={styles.heroTopRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <Calendar size={11} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.heroLabel}>
                {isCurrentMonthSelected ? `${activeMonth.label.toUpperCase()} (CURRENT BUDGET)` : `${activeMonth.label.toUpperCase()} BUDGET RECORD`}
              </Text>
            </View>
            <View
              style={[
                styles.statusPill,
                {
                  backgroundColor: isOverBudget ? "#FFE4E6" : isNearLimit ? "#FEF3C7" : "#DCFCE7",
                },
              ]}
            >
              {isOverBudget ? (
                <AlertTriangle size={11} color="#E11D48" strokeWidth={2.5} />
              ) : (
                <CheckCircle2 size={11} color={isNearLimit ? "#D97706" : "#15803D"} strokeWidth={2.5} />
              )}
              <Text
                style={[
                  styles.statusPillText,
                  {
                    color: isOverBudget ? "#E11D48" : isNearLimit ? "#D97706" : "#15803D",
                  },
                ]}
              >
                {displayLimit === 0 ? "NO BUDGET SET" : isOverBudget ? "OVER BUDGET" : isNearLimit ? "80%+ USED" : "ON TRACK"}
              </Text>
            </View>
          </View>

          <Text style={styles.heroMainAmount}>
            {displayLimit === 0
              ? "RM 0.00"
              : isOverBudget
                ? `-RM ${Math.abs(remainingBudget).toFixed(2)} Over`
                : `RM ${remainingBudget.toFixed(2)} Left`}
          </Text>
          <Text style={styles.heroSubText}>
            Spent RM {displayExpense.toFixed(2)} of RM {displayLimit.toFixed(2)} limit ({rawProgressPct.toFixed(0)}%)
          </Text>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${clampedBarWidth}%`,
                  backgroundColor: isOverBudget ? "#FB7185" : isNearLimit ? "#FBBF24" : "#4ADE80",
                },
              ]}
            />
          </View>

          <View style={styles.heroFooterRow}>
            <View style={styles.heroMiniStat}>
              <Text style={styles.heroMiniLabel}>SPENDING LIMIT</Text>
              <Text style={styles.heroMiniValue}>RM {displayLimit.toFixed(2)}</Text>
            </View>
            <View style={styles.heroMiniStat}>
              <Text style={styles.heroMiniLabel}>SAVINGS GOAL</Text>
              <Text style={styles.heroMiniValue}>RM {displaySavings.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Card 2: Category Breakdown vs Budget (Shown for both Current & Past Months!) */}
        {activeMonth.categories.length > 0 && (
          <WireBox style={styles.sectionCard}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardHeaderTitle}>{activeMonth.shortMonth.toUpperCase()} CATEGORY BREAKDOWN</Text>
              <Text style={styles.cardHeaderSub}>Share of RM {displayLimit.toFixed(0)} budget</Text>
            </View>

            <View style={{ padding: 12, gap: 10 }}>
              {activeMonth.categories.map((cat) => (
                <View key={cat.category} style={styles.catBudgetRow}>
                  <CategoryBadge category={cat.category} size={30} iconSize={15} />
                  <View style={{ flex: 1 }}>
                    <View style={styles.catBudgetTopRow}>
                      <Text style={styles.catBudgetLabel}>{cat.label}</Text>
                      <Text style={styles.catBudgetAmt}>
                        RM {cat.amount.toFixed(2)} ({cat.pctOfLimit}% of budget)
                      </Text>
                    </View>
                    <View style={styles.catBudgetTrack}>
                      <View
                        style={[
                          styles.catBudgetFill,
                          {
                            width: `${Math.min(100, Math.max(5, cat.pctOfLimit))}%`,
                            backgroundColor: cat.iconColor,
                          },
                        ]}
                      />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </WireBox>
        )}

        {/* Cards 3 & 4: AI Recommendation & Manual Edit Form (ONLY shown for Current Month!) */}
        {isCurrentMonthSelected && (
          <>
            <WireBox style={styles.sectionCard}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.aiHeaderLeft}>
                  <View style={styles.aiIconBox}>
                    <Sparkles size={14} color={COLORS.primaryText} strokeWidth={2.5} />
                  </View>
                  <View>
                    <Text style={styles.cardHeaderTitle}>RECOMMENDED BUDGET</Text>
                    <Text style={styles.cardHeaderSub}>{aiTierTitle}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.presetSection}>
                <Text style={styles.presetSectionLabel}>1. CHOOSE YOUR SAVING STYLE:</Text>
                <View style={styles.presetRow}>
                  {ALLOCATION_PRESETS.map((preset) => {
                    const isSelected = preset.id === selectedPresetId;
                    return (
                      <TouchableOpacity
                        key={preset.id}
                        style={[styles.presetCard, isSelected && styles.presetCardActive]}
                        activeOpacity={0.8}
                        onPress={() => setSelectedPresetId(preset.id)}
                      >
                        <View style={styles.presetTopRow}>
                          <Text style={[styles.presetBadgeText, isSelected && { color: COLORS.primary }]}>{preset.badge}</Text>
                          {isSelected && (
                            <View style={styles.miniCheckCircle}>
                              <Check size={9} color={COLORS.primaryText} strokeWidth={3} />
                            </View>
                          )}
                        </View>
                        <Text style={styles.presetNameText} numberOfLines={1}>
                          {preset.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <Text style={styles.presetDescHint}>{currentPreset.desc}</Text>
              </View>

              <View style={styles.aiExplainBox}>
                <Text style={styles.aiExplainText}>{aiTierReason}</Text>

                <View style={styles.aiRecommendNumbersRow}>
                  <View style={styles.aiRecBox}>
                    <Text style={styles.aiRecLabel}>SUGGESTED LIMIT ({Math.round(currentPreset.limitRatio * 100)}%)</Text>
                    <Text style={styles.aiRecValue}>RM {recommendedLimit}</Text>
                  </View>
                  <View style={styles.aiRecBox}>
                    <Text style={styles.aiRecLabel}>SUGGESTED SAVINGS ({Math.round(currentPreset.savingsRatio * 100)}%)</Text>
                    <Text style={[styles.aiRecValue, { color: "#15803D" }]}>RM {recommendedSavings}</Text>
                  </View>
                </View>

                <WireButton
                  label={`USE THIS PLAN (RM ${recommendedLimit})`}
                  variant="outline"
                  onPress={() => handleSaveBudget(String(recommendedLimit), String(recommendedSavings), true)}
                />

                {previousBudgetBackup && (
                  <TouchableOpacity style={styles.undoBtn} onPress={handleUndoBudgetChange}>
                    <RotateCcw size={12} color={COLORS.textMuted} strokeWidth={2.5} />
                    <Text style={styles.undoBtnText}>Undo Last Change (Restore RM {previousBudgetBackup.limit.toFixed(0)})</Text>
                  </TouchableOpacity>
                )}
              </View>
            </WireBox>

            <WireBox style={styles.sectionCard}>
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={styles.cardHeaderTitle}>SET YOUR OWN BUDGET ({activeMonth.shortMonth.toUpperCase()})</Text>
                  <Text style={styles.cardHeaderSub}>Customize your monthly limit and savings goal</Text>
                </View>
              </View>

              <View style={{ padding: 14 }}>
                <WireInput
                  label="Monthly Spending Limit (RM)"
                  placeholder="e.g. 1500.00"
                  keyboardType="decimal-pad"
                  value={monthlyLimitInput}
                  onChangeText={(text) => sanitizeDecimalInput(text, setMonthlyLimitInput, "Spending Limit")}
                />

                <WireInput
                  label="Monthly Savings Goal (RM)"
                  placeholder="e.g. 400.00"
                  keyboardType="decimal-pad"
                  value={savingsTargetInput}
                  onChangeText={(text) => sanitizeDecimalInput(text, setSavingsTargetInput, "Savings Goal")}
                />

                <WireButton
                  label={saving ? "SAVING..." : "SAVE CURRENT MONTH BUDGET"}
                  variant="filled"
                  onPress={() => handleSaveBudget(monthlyLimitInput, savingsTargetInput, false)}
                  style={{ marginTop: 4 }}
                />
              </View>
            </WireBox>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const MIN_EXPENSE_RECORDS_AI_SAFE = (val) => val;

// Dynamic style generator so runtime theme switches update all Budget screen styles immediately
const getStyles = () =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 36,
    },
    monthBarContainer: {
      paddingBottom: 12,
      gap: 8,
    },
    monthChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      borderRadius: SHAPES.chipRadius,
      backgroundColor: COLORS.card,
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginRight: 8,
    },
    monthChipActive: {
      backgroundColor: COLORS.primary,
    },
    monthChipText: {
      fontFamily: FONTS.mono,
      fontSize: 10,
      color: COLORS.textMuted,
      fontWeight: "bold",
    },
    monthChipTextActive: {
      color: COLORS.primaryText,
    },
    readOnlyBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderWidth: 1.5,
      borderColor: "#D97706",
      borderRadius: SHAPES.inputRadius,
      backgroundColor: "#FEF3C7",
      padding: 12,
      marginBottom: 14,
    },
    readOnlyTitle: {
      fontFamily: FONTS.mono,
      fontSize: 9.5,
      fontWeight: "bold",
      color: "#92400E",
    },
    readOnlySub: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      color: "#92400E",
      marginTop: 2,
      lineHeight: 13,
    },
    statusHeroCard: {
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      borderRadius: SHAPES.cardRadius,
      backgroundColor: COLORS.primary,
      padding: 16,
      marginBottom: 16,
      shadowColor: COLORS.text,
      shadowOffset: { width: 4, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 0,
      elevation: 4,
    },
    statusHeroCardDanger: {
      backgroundColor: "#881337",
    },
    heroTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    heroLabel: {
      fontFamily: FONTS.mono,
      fontSize: 9.5,
      color: COLORS.primaryText,
      opacity: 0.9,
      letterSpacing: 1,
    },
    statusPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 12,
    },
    statusPillText: {
      fontFamily: FONTS.mono,
      fontSize: 8,
      fontWeight: "bold",
    },
    heroMainAmount: {
      fontFamily: FONTS.mono,
      fontSize: 26,
      fontWeight: "bold",
      color: COLORS.primaryText,
      marginBottom: 2,
    },
    heroSubText: {
      fontFamily: FONTS.mono,
      fontSize: 10,
      color: COLORS.primaryText,
      opacity: 0.88,
      marginBottom: 12,
    },
    progressTrack: {
      width: "100%",
      height: 10,
      backgroundColor: "rgba(0,0,0,0.28)",
      borderRadius: 5,
      overflow: "hidden",
      marginBottom: 14,
    },
    progressFill: {
      height: "100%",
      borderRadius: 5,
    },
    heroFooterRow: {
      flexDirection: "row",
      gap: 10,
    },
    heroMiniStat: {
      flex: 1,
      borderWidth: 1.5,
      borderColor: "rgba(255,255,255,0.35)",
      borderRadius: SHAPES.inputRadius,
      backgroundColor: "rgba(0,0,0,0.2)",
      padding: 8,
    },
    heroMiniLabel: {
      fontFamily: FONTS.mono,
      fontSize: 8,
      color: COLORS.primaryText,
      opacity: 0.8,
      marginBottom: 2,
    },
    heroMiniValue: {
      fontFamily: FONTS.mono,
      fontSize: 12,
      fontWeight: "bold",
      color: COLORS.primaryText,
    },
    sectionCard: {
      marginBottom: 16,
      padding: 0,
      overflow: "hidden",
    },
    cardHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 11,
      borderBottomWidth: SHAPES.borderWidth,
      borderColor: COLORS.borderMuted,
      borderStyle: "dashed",
    },
    catBudgetRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    catBudgetTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 4,
    },
    catBudgetLabel: {
      fontFamily: FONTS.mono,
      fontSize: 10,
      fontWeight: "bold",
      color: COLORS.text,
    },
    catBudgetAmt: {
      fontFamily: FONTS.mono,
      fontSize: 9,
      color: COLORS.textMuted,
    },
    catBudgetTrack: {
      width: "100%",
      height: 6,
      borderRadius: 3,
      backgroundColor: COLORS.secondary,
      overflow: "hidden",
    },
    catBudgetFill: {
      height: "100%",
      borderRadius: 3,
    },
    aiHeaderLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    aiIconBox: {
      width: 28,
      height: 28,
      borderRadius: SHAPES.chipRadius,
      backgroundColor: COLORS.primary,
      borderWidth: 1.5,
      borderColor: COLORS.border,
      alignItems: "center",
      justifyContent: "center",
    },
    cardHeaderTitle: {
      fontFamily: FONTS.mono,
      fontSize: 11,
      fontWeight: "bold",
      color: COLORS.text,
      letterSpacing: 0.8,
    },
    cardHeaderSub: {
      fontFamily: FONTS.mono,
      fontSize: 9,
      color: COLORS.textMuted,
      marginTop: 1,
    },
    presetSection: {
      paddingHorizontal: 14,
      paddingTop: 12,
      paddingBottom: 8,
    },
    presetSectionLabel: {
      fontFamily: FONTS.mono,
      fontSize: 9,
      fontWeight: "bold",
      color: COLORS.textMuted,
      marginBottom: 8,
      letterSpacing: 0.5,
    },
    presetRow: {
      flexDirection: "row",
      gap: 8,
    },
    presetCard: {
      flex: 1,
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.borderMuted,
      borderRadius: SHAPES.inputRadius,
      backgroundColor: COLORS.card,
      padding: 8,
    },
    presetCardActive: {
      borderColor: COLORS.primary,
      backgroundColor: COLORS.secondary,
    },
    presetTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 4,
    },
    presetBadgeText: {
      fontFamily: FONTS.mono,
      fontSize: 9,
      fontWeight: "bold",
      color: COLORS.text,
    },
    miniCheckCircle: {
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: COLORS.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    presetNameText: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      color: COLORS.textMuted,
    },
    presetDescHint: {
      fontFamily: FONTS.mono,
      fontSize: 9,
      color: COLORS.primary,
      fontWeight: "bold",
      marginTop: 8,
      textAlign: "center",
    },
    aiExplainBox: {
      paddingHorizontal: 14,
      paddingBottom: 14,
    },
    aiExplainText: {
      fontFamily: FONTS.mono,
      fontSize: 9.5,
      color: COLORS.textMuted,
      lineHeight: 15,
      marginBottom: 12,
    },
    aiRecommendNumbersRow: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 12,
    },
    aiRecBox: {
      flex: 1,
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      borderRadius: SHAPES.inputRadius,
      backgroundColor: COLORS.secondary,
      padding: 10,
      alignItems: "center",
    },
    aiRecLabel: {
      fontFamily: FONTS.mono,
      fontSize: 8,
      color: COLORS.textMuted,
      marginBottom: 4,
    },
    aiRecValue: {
      fontFamily: FONTS.mono,
      fontSize: 15,
      fontWeight: "bold",
      color: COLORS.text,
    },
    undoBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      marginTop: 10,
      paddingVertical: 6,
    },
    undoBtnText: {
      fontFamily: FONTS.mono,
      fontSize: 9.5,
      color: COLORS.textMuted,
      textDecorationLine: "underline",
    },
  });
