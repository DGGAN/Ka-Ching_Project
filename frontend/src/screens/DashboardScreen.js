// Import React hooks, native UI components, SVG vector engine, and icon utilities
import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import Svg, { Polyline, Polygon, Circle, Line } from "react-native-svg";
import { ArrowUp, ArrowDown, BarChart2, PlusCircle, TrendingUp, TrendingDown } from "lucide-react-native";
import apiClient from "../api/client";
import { COLORS, SHAPES, FONTS } from "../theme/theme";
import { WireBox } from "../components/WireUI";
import { CATEGORY_CONFIG, EXPENSE_CATEGORY_KEYS, CategoryBadge } from "../utils/categoryIcons";

// Helper function: Safely parse date and generate a unique month key formatted as "YYYY-MM"
const toMonthKey = (year, monthIndex) => `${year}-${String(monthIndex + 1).padStart(2, "0")}`;

// Dashboard Screen (Fixes SVG trend line nodes to align 100% pixel-perfectly on top of bars)
export default function DashboardScreen({ user, onSeeAllTransactions, onPressAddQuick }) {
  // State to store transactions fetched from backend and loading status
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartWidth, setChartWidth] = useState(0);

  const now = new Date();
  const defaultMonthKey = toMonthKey(now.getFullYear(), now.getMonth());
  const [selectedMonthKey, setSelectedMonthKey] = useState(defaultMonthKey);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/transactions/${user.id}`);
      if (response.data && response.data.data) {
        setTransactions(response.data.data);
      }
    } catch (error) {
      console.log("Failed to load dashboard transactions:", error.message);
    } finally {
      setLoading(false);
    }
  };

  // 1. Build full 6-month buckets
  const rawSixMonths = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = toMonthKey(d.getFullYear(), d.getMonth());
    const catBreakdown = {};
    EXPENSE_CATEGORY_KEYS.forEach((k) => {
      catBreakdown[k] = 0;
    });

    rawSixMonths.push({
      key,
      year: d.getFullYear(),
      month: d.getMonth(),
      shortLabel: d.toLocaleDateString("en-US", { month: "short" }),
      fullLabel: d.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      totalIncome: 0,
      totalExpense: 0,
      hasActivity: false,
      categoryTotals: catBreakdown,
    });
  }

  // 2. Iterate through transactions, explicitly casting Number(tx.amount) to prevent 0-bar bugs
  let allTimeIncome = 0;
  let allTimeExpense = 0;

  transactions.forEach((tx) => {
    const amt = Number(tx.amount) || 0;
    const txDate = new Date(tx.date || tx.createdAt || Date.now());
    const txKey = toMonthKey(txDate.getFullYear(), txDate.getMonth());
    const bucket = rawSixMonths.find((b) => b.key === txKey);

    if (tx.type === "INCOME") {
      allTimeIncome += amt;
      if (bucket) {
        bucket.totalIncome += amt;
        bucket.hasActivity = true;
      }
    } else if (tx.type === "EXPENSE") {
      allTimeExpense += amt;
      if (bucket) {
        bucket.totalExpense += amt;
        bucket.hasActivity = true;
        const catKey = bucket.categoryTotals[tx.category] !== undefined ? tx.category : "OTHER_EXPENSE";
        bucket.categoryTotals[catKey] += amt;
      }
    }
  });

  const currentBalance = allTimeIncome - allTimeExpense;

  // 3. Smart leading-month trimming (keeps 1 prior month if only 1 month has activity)
  const firstActiveIdx = rawSixMonths.findIndex((b) => b.hasActivity);
  let visibleMonthsBuckets = [];
  if (firstActiveIdx === -1) {
    visibleMonthsBuckets = [rawSixMonths[rawSixMonths.length - 1]];
  } else {
    const startIdx = firstActiveIdx === rawSixMonths.length - 1 ? Math.max(0, firstActiveIdx - 1) : firstActiveIdx;
    visibleMonthsBuckets = rawSixMonths.slice(startIdx);
  }

  const activeBucketIndex = visibleMonthsBuckets.findIndex((b) => b.key === selectedMonthKey);
  const resolvedIndex = activeBucketIndex !== -1 ? activeBucketIndex : visibleMonthsBuckets.length - 1;
  const activeBucket = visibleMonthsBuckets[resolvedIndex];
  const prevBucket = resolvedIndex > 0 ? visibleMonthsBuckets[resolvedIndex - 1] : null;

  let momChangePct = null;
  if (prevBucket && prevBucket.totalExpense > 0) {
    momChangePct = Math.round(((activeBucket.totalExpense - prevBucket.totalExpense) / prevBucket.totalExpense) * 100);
  }

  const maxMonthlyExpense = Math.max(...visibleMonthsBuckets.map((b) => b.totalExpense), 0);
  const hasAnyExpenseData = maxMonthlyExpense > 0;

  // 4. Filter out 0-spend categories and sort from highest to lowest spend
  const nonZeroCategoryKeys = EXPENSE_CATEGORY_KEYS.filter((catKey) => (activeBucket.categoryTotals[catKey] || 0) > 0).sort(
    (a, b) => activeBucket.categoryTotals[b] - activeBucket.categoryTotals[a],
  );

  // 5. Unify bar pixel height and SVG node Y-coordinate formula so nodes sit strictly on bar tops!
  const PLOT_HEIGHT = 115;
  const MAX_BAR_HEIGHT = 78;
  const numCols = visibleMonthsBuckets.length;
  const colWidth = chartWidth > 0 && numCols > 0 ? chartWidth / numCols : 0;

  const computedBars = visibleMonthsBuckets.map((item, idx) => {
    const ratio = maxMonthlyExpense > 0 ? item.totalExpense / maxMonthlyExpense : 0;
    const barHeight = item.totalExpense > 0 ? Math.max(Math.round(ratio * MAX_BAR_HEIGHT), 14) : 4;
    const centerX = colWidth * idx + colWidth / 2;
    const topY = PLOT_HEIGHT - barHeight;
    return {
      ...item,
      barHeight,
      centerX,
      topY,
    };
  });

  const polylinePoints = computedBars.map((b) => `${b.centerX},${b.topY}`).join(" ");
  const areaPoints =
    computedBars.length > 1
      ? `${computedBars[0].centerX},${PLOT_HEIGHT} ${polylinePoints} ${computedBars[computedBars.length - 1].centerX},${PLOT_HEIGHT}`
      : "";

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Top greeting and currently logged-in username */}
      <View style={styles.greetingSection}>
        <Text style={styles.greetingSub}>Good day,</Text>
        <Text style={styles.greetingName}>{user.username}</Text>
      </View>

      {/* 核心净余额大卡片 */}
      {/* Main Balance Hero Card */}
      <View style={styles.balanceHeroCard}>
        <Text style={styles.balanceLabel}>CURRENT TOTAL BALANCE</Text>
        <Text style={styles.balanceAmount}>RM {currentBalance.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>

        <View style={styles.incomeExpenseRow}>
          <View style={styles.incomeSubBox}>
            <View style={styles.subBoxHeader}>
              <View style={styles.incomeBadgeIcon}>
                <ArrowUp size={10} color="#065F46" strokeWidth={3} />
              </View>
              <Text style={styles.subBoxLabel}>{activeBucket.shortLabel} INCOME</Text>
            </View>
            <Text style={styles.incomeValueText}>+RM {activeBucket.totalIncome.toFixed(2)}</Text>
          </View>

          <View style={styles.expenseSubBox}>
            <View style={styles.subBoxHeader}>
              <View style={styles.expenseBadgeIcon}>
                <ArrowDown size={10} color="#9F1239" strokeWidth={3} />
              </View>
              <Text style={styles.subBoxLabel}>{activeBucket.shortLabel} EXPENSES</Text>
            </View>
            <Text style={styles.expenseValueText}>-RM {activeBucket.totalExpense.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      {/* Investment-Style Trend Line + Stacked Bar Combo Chart & Non-Zero Category Breakdown */}
      <WireBox style={styles.sectionCard}>
        <View style={styles.cardHeaderRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardHeaderTitle}>SPENDING BREAKDOWN</Text>
            <Text style={styles.cardHeaderHint}>Tap any month bar to inspect its categories</Text>
          </View>

          <View style={styles.headerBadgesRight}>
            {momChangePct !== null && (
              <View style={[styles.momBadge, { backgroundColor: momChangePct > 0 ? "#FFE4E6" : "#DCFCE7" }]}>
                {momChangePct > 0 ? (
                  <TrendingUp size={10} color="#E11D48" strokeWidth={2.5} />
                ) : (
                  <TrendingDown size={10} color="#15803D" strokeWidth={2.5} />
                )}
                <Text style={[styles.momBadgeText, { color: momChangePct > 0 ? "#E11D48" : "#15803D" }]}>
                  {momChangePct > 0 ? `+${momChangePct}%` : `${momChangePct}%`}
                </Text>
              </View>
            )}
            <View style={styles.activeMonthBadge}>
              <Text style={styles.activeMonthBadgeText}>{activeBucket.fullLabel}</Text>
            </View>
          </View>
        </View>

        <View style={styles.chartBox}>
          {!hasAnyExpenseData ? (
            <View style={styles.emptyChartBox}>
              <BarChart2 size={22} color={COLORS.textMuted} strokeWidth={1.8} />
              <Text style={styles.emptyChartTitle}>No Spending Graph Yet</Text>
              <Text style={styles.emptyChartSub}>
                Your investment-style spending trend line and bars will appear here once you log your first expense.
              </Text>
            </View>
          ) : (
            <View style={styles.comboChartContainer}>
              {/* Strictly aligned plot area: Bars grow from bottom, SVG nodes sit at exact bar top */}
              <View style={[styles.plotArea, { height: PLOT_HEIGHT }]} onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}>
                {/* 1. Stacked category color bar columns (amount text floats right above bar top) */}
                <View style={styles.barsColumnsWrapper}>
                  {computedBars.map((item) => {
                    const isSelected = item.key === activeBucket.key;
                    const activeSegments = EXPENSE_CATEGORY_KEYS.filter((catKey) => item.categoryTotals[catKey] > 0);

                    return (
                      <TouchableOpacity
                        key={item.key}
                        style={styles.barColumnTouch}
                        activeOpacity={0.75}
                        onPress={() => setSelectedMonthKey(item.key)}
                      >
                        {/* Real expense amount floating directly above the bar peak node */}
                        <Text style={[styles.barPeakAmount, isSelected && styles.barPeakAmountActive]} numberOfLines={1}>
                          RM {item.totalExpense >= 100 ? Math.round(item.totalExpense) : item.totalExpense.toFixed(0)}
                        </Text>

                        {/* Stacked color bar with exact pixel height matching SVG node */}
                        <View
                          style={[
                            styles.stackedBarBox,
                            {
                              height: item.barHeight,
                              borderColor: isSelected ? COLORS.text : COLORS.border,
                              borderWidth: isSelected ? 2 : 1,
                              opacity: isSelected ? 0.95 : 0.6,
                            },
                          ]}
                        >
                          {activeSegments.length > 0 ? (
                            activeSegments.map((catKey) => (
                              <View
                                key={catKey}
                                style={{
                                  flex: item.categoryTotals[catKey],
                                  backgroundColor: CATEGORY_CONFIG[catKey].iconColor,
                                  width: "100%",
                                }}
                              />
                            ))
                          ) : (
                            <View style={{ flex: 1, backgroundColor: COLORS.borderMuted }} />
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* 2. Top SVG trend line & circle nodes (topY matches bar top edge 100%) */}
                {chartWidth > 0 && (
                  <Svg width={chartWidth} height={PLOT_HEIGHT} style={styles.svgOverlay} pointerEvents="none">
                    <Line
                      x1="0"
                      y1={PLOT_HEIGHT - MAX_BAR_HEIGHT}
                      x2={chartWidth}
                      y2={PLOT_HEIGHT - MAX_BAR_HEIGHT}
                      stroke={COLORS.borderMuted}
                      strokeWidth="1"
                      strokeDasharray="3,3"
                    />
                    <Line
                      x1="0"
                      y1={PLOT_HEIGHT - MAX_BAR_HEIGHT / 2}
                      x2={chartWidth}
                      y2={PLOT_HEIGHT - MAX_BAR_HEIGHT / 2}
                      stroke={COLORS.borderMuted}
                      strokeWidth="1"
                      strokeDasharray="3,3"
                    />

                    {computedBars.length > 1 && <Polygon points={areaPoints} fill={COLORS.primary} fillOpacity="0.14" />}

                    {computedBars.length > 1 && (
                      <Polyline
                        points={polylinePoints}
                        fill="none"
                        stroke={COLORS.text}
                        strokeWidth="2.5"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                      />
                    )}

                    {computedBars.map((node) => {
                      const isNodeActive = node.key === activeBucket.key;
                      return (
                        <Circle
                          key={node.key}
                          cx={node.centerX}
                          cy={node.topY}
                          r={isNodeActive ? 5.5 : 4}
                          fill={isNodeActive ? COLORS.primary : COLORS.card}
                          stroke={COLORS.text}
                          strokeWidth={2}
                        />
                      );
                    })}
                  </Svg>
                )}
              </View>

              {/* 3. X-Axis clickable month selector pills */}
              <View style={styles.xAxisMonthsRow}>
                {computedBars.map((item) => {
                  const isSelected = item.key === activeBucket.key;
                  return (
                    <TouchableOpacity key={item.key} style={styles.xAxisMonthCol} onPress={() => setSelectedMonthKey(item.key)}>
                      <View style={[styles.monthPill, isSelected && styles.monthPillSelected]}>
                        <Text style={[styles.monthLabel, isSelected && styles.monthLabelSelected]}>{item.shortLabel}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* Render ONLY non-zero expense categories for the selected month */}
        {nonZeroCategoryKeys.length === 0 ? (
          <View style={styles.noMonthSpendBox}>
            <Text style={styles.noMonthSpendText}>No expenses recorded in {activeBucket.fullLabel}.</Text>
          </View>
        ) : (
          <View style={styles.categoryGrid}>
            {nonZeroCategoryKeys.map((catKey) => {
              const cfg = CATEGORY_CONFIG[catKey];
              const MiniIcon = cfg.Icon;
              const spentAmt = activeBucket.categoryTotals[catKey] || 0;
              const sharePct = activeBucket.totalExpense > 0 ? Math.min(100, Math.round((spentAmt / activeBucket.totalExpense) * 100)) : 0;

              return (
                <View
                  key={catKey}
                  style={[
                    styles.categoryGridItem,
                    {
                      backgroundColor: cfg.bgColor,
                      borderColor: cfg.iconColor,
                    },
                  ]}
                >
                  <View style={styles.catTopRow}>
                    <View style={styles.catTitleRow}>
                      <MiniIcon size={13} color={cfg.iconColor} strokeWidth={2.5} />
                      <Text style={styles.catLabel} numberOfLines={1}>
                        {cfg.label}
                      </Text>
                    </View>
                    <Text style={[styles.catPctBadge, { color: cfg.iconColor }]}>{sharePct}%</Text>
                  </View>

                  <Text style={[styles.catAmount, { color: cfg.iconColor }]}>RM {spentAmt.toFixed(2)}</Text>

                  <View style={styles.catProgressTrack}>
                    <View
                      style={[
                        styles.catProgressFill,
                        {
                          width: `${sharePct}%`,
                          backgroundColor: cfg.iconColor,
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </WireBox>

      {/* Recent Transactions List Card */}
      <WireBox style={styles.sectionCard}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardHeaderTitle}>RECENT TRANSACTIONS</Text>
          {transactions.length > 0 && (
            <TouchableOpacity onPress={onSeeAllTransactions}>
              <Text style={styles.seeAllLink}>See all</Text>
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 24 }} />
        ) : transactions.length === 0 ? (
          <View style={styles.emptyTxContainer}>
            <PlusCircle size={26} color={COLORS.primary} strokeWidth={2} />
            <Text style={styles.emptyTxTitle}>No Transactions Recorded Yet</Text>
            <Text style={styles.emptyTxSub}>Tap the "+" button in the bottom bar to log your first income or expense.</Text>
            {onPressAddQuick && (
              <TouchableOpacity style={styles.emptyAddBtn} onPress={onPressAddQuick}>
                <Text style={styles.emptyAddBtnText}>+ ADD FIRST TRANSACTION</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          transactions.slice(0, 5).map((tx, idx) => {
            const isIncome = tx.type === "INCOME";
            const cfg = CATEGORY_CONFIG[tx.category] || CATEGORY_CONFIG.OTHER_EXPENSE;
            const formattedDate = tx.date ? new Date(tx.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "";

            return (
              <View key={tx._id || idx} style={[styles.txRow, idx < Math.min(transactions.length, 5) - 1 && styles.txRowBorder]}>
                <View style={styles.txLeft}>
                  <CategoryBadge category={tx.category} size={38} iconSize={18} />
                  <View>
                    <Text style={styles.txMerchant}>{tx.merchantName || tx.merchant || "General"}</Text>
                    <Text style={styles.txCategory}>
                      {cfg.label} • {formattedDate}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.txAmount, { color: isIncome ? "#16A34A" : "#E11D48" }]}>
                  {isIncome ? "+" : "-"}RM {Number(tx.amount).toFixed(2)}
                </Text>
              </View>
            );
          })
        )}
      </WireBox>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 30,
  },
  greetingSection: {
    marginBottom: 10,
  },
  greetingSub: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.textMuted,
  },
  greetingName: {
    fontFamily: FONTS.mono,
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
    marginTop: 2,
  },
  balanceHeroCard: {
    borderWidth: SHAPES.borderWidth,
    borderColor: COLORS.border,
    borderRadius: SHAPES.cardRadius,
    backgroundColor: COLORS.primary,
    padding: 16,
    marginBottom: 14,
    shadowColor: COLORS.text,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 0,
    elevation: 4,
  },
  balanceLabel: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.primaryText,
    opacity: 0.85,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  balanceAmount: {
    fontFamily: FONTS.mono,
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.primaryText,
    marginBottom: 14,
  },
  incomeExpenseRow: {
    flexDirection: "row",
    gap: 10,
  },
  incomeSubBox: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#6EE7B7",
    borderRadius: SHAPES.inputRadius,
    backgroundColor: "rgba(6, 78, 59, 0.35)",
    padding: 10,
  },
  expenseSubBox: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#FDA4AF",
    borderRadius: SHAPES.inputRadius,
    backgroundColor: "rgba(136, 19, 55, 0.35)",
    padding: 10,
  },
  subBoxHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 5,
  },
  incomeBadgeIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#A7F3D0",
    alignItems: "center",
    justifyContent: "center",
  },
  expenseBadgeIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#FECDD3",
    alignItems: "center",
    justifyContent: "center",
  },
  subBoxLabel: {
    fontFamily: FONTS.mono,
    fontSize: 8,
    fontWeight: "bold",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  incomeValueText: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    fontWeight: "bold",
    color: "#A7F3D0",
  },
  expenseValueText: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    fontWeight: "bold",
    color: "#FECDD3",
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
    fontSize: 8,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  headerBadgesRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  momBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: SHAPES.chipRadius,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  momBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 8,
    fontWeight: "bold",
  },
  activeMonthBadge: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: SHAPES.chipRadius,
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  activeMonthBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    fontWeight: "bold",
    color: COLORS.text,
  },
  seeAllLink: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.textMuted,
    textDecorationLine: "underline",
  },
  chartBox: {
    padding: 14,
  },
  emptyChartBox: {
    borderWidth: 1.5,
    borderColor: COLORS.borderMuted,
    borderStyle: "dashed",
    borderRadius: SHAPES.inputRadius,
    backgroundColor: COLORS.secondary,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyChartTitle: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    fontWeight: "bold",
    color: COLORS.text,
    marginTop: 6,
  },
  emptyChartSub: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: 4,
    lineHeight: 14,
  },
  comboChartContainer: {
    borderWidth: SHAPES.borderWidth,
    borderColor: COLORS.border,
    borderRadius: SHAPES.inputRadius,
    backgroundColor: COLORS.secondary,
    paddingTop: 10,
    paddingBottom: 8,
    paddingHorizontal: 6,
  },
  plotArea: {
    width: "100%",
    position: "relative",
    justifyContent: "flex-end",
    borderBottomWidth: 1.5,
    borderColor: COLORS.borderMuted,
  },
  svgOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 5,
  },
  barsColumnsWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: "100%",
    width: "100%",
    zIndex: 2,
  },
  barColumnTouch: {
    flex: 1,
    height: "100%",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  barPeakAmount: {
    fontFamily: FONTS.mono,
    fontSize: 8.5,
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  barPeakAmountActive: {
    color: COLORS.text,
    fontWeight: "bold",
  },
  stackedBarBox: {
    width: 24,
    borderTopLeftRadius: SHAPES.chipRadius / 2,
    borderTopRightRadius: SHAPES.chipRadius / 2,
    overflow: "hidden",
    flexDirection: "column",
  },
  xAxisMonthsRow: {
    flexDirection: "row",
    width: "100%",
    marginTop: 6,
  },
  xAxisMonthCol: {
    flex: 1,
    alignItems: "center",
  },
  monthPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: SHAPES.chipRadius,
  },
  monthPillSelected: {
    backgroundColor: COLORS.primary,
  },
  monthLabel: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.textMuted,
  },
  monthLabelSelected: {
    color: COLORS.primaryText,
    fontWeight: "bold",
  },
  noMonthSpendBox: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    alignItems: "center",
  },
  noMonthSpendText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.textMuted,
    fontStyle: "italic",
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 8,
  },
  categoryGridItem: {
    width: "48.2%",
    borderWidth: 1.5,
    borderRadius: SHAPES.chipRadius,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  catTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  catTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flex: 1,
  },
  catLabel: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    fontWeight: "bold",
    color: COLORS.text,
    flex: 1,
  },
  catPctBadge: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    fontWeight: "bold",
  },
  catAmount: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 6,
  },
  catProgressTrack: {
    width: "100%",
    height: 4,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 2,
    overflow: "hidden",
  },
  catProgressFill: {
    height: "100%",
    borderRadius: 2,
  },
  emptyTxContainer: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  emptyTxTitle: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.text,
    marginTop: 8,
  },
  emptyTxSub: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: 4,
    lineHeight: 15,
  },
  emptyAddBtn: {
    marginTop: 12,
    borderWidth: SHAPES.borderWidth,
    borderColor: COLORS.border,
    borderRadius: SHAPES.buttonRadius,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  emptyAddBtnText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    fontWeight: "bold",
    color: COLORS.primaryText,
  },
  txRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  txRowBorder: {
    borderBottomWidth: 1,
    borderColor: COLORS.borderMuted,
    borderStyle: "dashed",
  },
  txLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  txMerchant: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.text,
  },
  txCategory: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  txAmount: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    fontWeight: "bold",
  },
});
