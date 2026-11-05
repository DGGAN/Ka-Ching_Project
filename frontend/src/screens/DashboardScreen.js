// Import React hooks, core React Native UI components, SVG primitives, and Lucide icons
import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import Svg, { Line, Polygon, Polyline, Circle } from "react-native-svg";
import { TrendingDown, TrendingUp, ArrowRight, Calendar, Wallet } from "lucide-react-native";
import apiClient from "../api/client";
import { COLORS, SHAPES, FONTS } from "../theme/theme";
import { WireBox } from "../components/WireUI";
import { CATEGORY_CONFIG, CategoryBadge } from "../utils/categoryIcons";

// 1. Helper: Generate the raw 6-month chronological window (oldest to newest: index 0 -> 5)
const getSixMonthWindow = () => {
  const list = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const shortMonth = d.toLocaleDateString("en-US", { month: "short" });
    const fullLabel = d.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
    list.push({
      key,
      shortMonth,
      label: fullLabel,
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

// 2. Main Dashboard Component with All-Time Savings, Budget Summary Strip & Stacked Trend Chart
export default function DashboardScreen({ user, onNavigateToTransactions, onViewAllPress }) {
  // Dynamically generate styles on every render so runtime theme changes take effect immediately
  const styles = getStyles();

  // Step 1: Component state for transactions, budgets, selected month, and SVG chart container width
  const [transactions, setTransactions] = useState([]);
  const [latestBudget, setLatestBudget] = useState(null);
  const [budgetHistory, setBudgetHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonthKey, setSelectedMonthKey] = useState(CURRENT_MONTH_KEY);
  const [chartBoxWidth, setChartBoxWidth] = useState(0);

  // Step 2: Fetch user transactions and budget history on mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [txRes, budgetRes] = await Promise.all([apiClient.get(`/transactions/${user.id}`), apiClient.get(`/budgets/${user.id}`)]);

      if (txRes.data && txRes.data.data) {
        setTransactions(txRes.data.data);
      }
      if (budgetRes.data) {
        setLatestBudget(budgetRes.data.data || null);
        setBudgetHistory(budgetRes.data.history || []);
      }
    } catch (error) {
      console.log("Dashboard load notice:", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Compute All-Time Total Accumulated Savings across the user's entire history
  let allTimeIncome = 0;
  let allTimeExpense = 0;
  transactions.forEach((tx) => {
    const amt = Number(tx.amount) || 0;
    if (tx.type === "INCOME") allTimeIncome += amt;
    else if (tx.type === "EXPENSE") allTimeExpense += amt;
  });
  const allTimeSavedBalance = allTimeIncome - allTimeExpense;
  const isAllTimeNegative = allTimeSavedBalance < 0;

  // Step 4: Aggregate income, expenses, and category breakdowns for each of the 6 months
  const enrichedMonths = RAW_SIX_MONTHS.map((mObj) => {
    const monthTxs = transactions.filter((tx) => {
      if (!tx.date) return false;
      const d = new Date(tx.date);
      return d.getFullYear() === mObj.year && d.getMonth() === mObj.month;
    });

    let income = 0;
    let expense = 0;
    const catMap = {};

    monthTxs.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      if (tx.type === "INCOME") {
        income += amt;
      } else if (tx.type === "EXPENSE") {
        expense += amt;
        catMap[tx.category] = (catMap[tx.category] || 0) + amt;
      }
    });

    // Find specific budget saved for this month/year, or fall back to latest active budget
    const matchedBudget = budgetHistory.find((b) => b.year === mObj.year && b.month === mObj.monthNum) || latestBudget;

    const monthLimit = matchedBudget?.monthlyLimit || 0;

    // Build sorted category segments for this month's stacked bar & 2-column grid
    const categories = Object.entries(catMap)
      .map(([catKey, amount]) => {
        const cfg = CATEGORY_CONFIG[catKey] || CATEGORY_CONFIG.OTHER_EXPENSE;
        const rawPct = expense > 0 ? (amount / expense) * 100 : 0;
        return {
          category: catKey,
          label: cfg.label,
          amount,
          rawPct,
          pct: Math.max(1, Math.round(rawPct)),
          iconColor: cfg.iconColor || "#E87A90",
          bgColor: cfg.bgColor || "#FFE5EC",
          IconComponent: cfg.Icon,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    return {
      ...mObj,
      monthTxs,
      income,
      expense,
      monthLimit,
      hasData: monthTxs.length > 0,
      categories,
    };
  });

  // Step 5: Apply Smart Contiguous Month Trimming Rule (Hide leading empty months, keep middle empty months)
  const firstActiveIdx = enrichedMonths.findIndex((m) => m.hasData);
  const visibleMonths = firstActiveIdx === -1 ? [enrichedMonths[enrichedMonths.length - 1]] : enrichedMonths.slice(firstActiveIdx);

  // Step 6: Resolve currently selected month object and its previous month for MoM % comparison
  const activeMonthIdxInFull = enrichedMonths.findIndex((m) => m.key === selectedMonthKey);
  const activeMonth = activeMonthIdxInFull !== -1 ? enrichedMonths[activeMonthIdxInFull] : enrichedMonths[enrichedMonths.length - 1];

  const prevMonth = activeMonthIdxInFull > 0 ? enrichedMonths[activeMonthIdxInFull - 1] : null;

  let momDiffPct = null;
  if (prevMonth && prevMonth.expense > 0) {
    momDiffPct = Math.round(((activeMonth.expense - prevMonth.expense) / prevMonth.expense) * 100);
  }

  const monthlyNet = activeMonth.income - activeMonth.expense;
  const activeLimit = activeMonth.monthLimit;
  const budgetUsedPct = activeLimit > 0 ? Math.round((activeMonth.expense / activeLimit) * 100) : 0;
  const isOverBudget = activeLimit > 0 && activeMonth.expense > activeLimit;

  // Step 7: Compute geometry for the Interactive Stacked Bar + SVG Trend Line Chart
  const CHART_HEIGHT = 154;
  const TOP_PAD = 28;
  const BOTTOM_PAD = 30;
  const USABLE_BAR_MAX_H = CHART_HEIGHT - TOP_PAD - BOTTOM_PAD;
  const BAR_WIDTH = visibleMonths.length <= 3 ? 34 : 26;

  const maxMonthlyExpense = Math.max(...visibleMonths.map((m) => m.expense), 100);

  const numBars = visibleMonths.length;
  const colWidth = chartBoxWidth > 0 && numBars > 0 ? chartBoxWidth / numBars : 0;

  const chartNodes = visibleMonths.map((m, idx) => {
    const centerX = colWidth * idx + colWidth / 2;
    const ratio = maxMonthlyExpense > 0 ? m.expense / maxMonthlyExpense : 0;
    const barHeight = m.expense > 0 ? Math.max(8, ratio * USABLE_BAR_MAX_H) : 0;
    const topY = CHART_HEIGHT - BOTTOM_PAD - barHeight;
    return {
      ...m,
      centerX,
      barHeight,
      topY,
    };
  });

  const polylinePoints = chartNodes.map((n) => `${n.centerX},${n.topY}`).join(" ");

  const areaPolygonPoints =
    chartNodes.length > 1
      ? `${chartNodes[0].centerX},${CHART_HEIGHT - BOTTOM_PAD} ${polylinePoints} ${chartNodes[chartNodes.length - 1].centerX},${CHART_HEIGHT - BOTTOM_PAD}`
      : "";

  const handlePressSeeAll = () => {
    if (typeof onNavigateToTransactions === "function") {
      onNavigateToTransactions();
    } else if (typeof onViewAllPress === "function") {
      onViewAllPress();
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* 1. Hero Card: All-Time Accumulated Balance + Selected Month Cashflow */}
      <View style={[styles.balanceHeroCard, isAllTimeNegative && styles.balanceHeroCardNegative]}>
        <View style={styles.heroHeaderRow}>
          <View style={styles.periodPill}>
            <Calendar size={10} color="#121212" strokeWidth={2.5} />
            <Text style={styles.periodPillText}>
              {activeMonth.isCurrentMonth
                ? `${activeMonth.label.toUpperCase()} (CURRENT MONTH)`
                : `PAST ARCHIVE • ${activeMonth.label.toUpperCase()}`}
            </Text>
          </View>

          <View style={styles.monthNetBadge}>
            <Text style={styles.monthNetBadgeText}>
              {activeMonth.shortMonth} Net: {monthlyNet >= 0 ? `+RM ${monthlyNet.toFixed(0)}` : `-RM ${Math.abs(monthlyNet).toFixed(0)}`}
            </Text>
          </View>
        </View>

        <Text style={styles.balanceSubLabel}>TOTAL ACCUMULATED SAVINGS (ALL-TIME)</Text>
        <Text style={styles.balanceAmount}>
          {isAllTimeNegative ? "-RM " : "RM "}
          {Math.abs(allTimeSavedBalance).toLocaleString("en-MY", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </Text>

        {/* Selected Month Income & Expenses Breakdown */}
        <View style={styles.incomeExpenseRow}>
          <View style={styles.ieBox}>
            <View style={styles.ieTitleRow}>
              <View style={[styles.dotIndicator, { backgroundColor: "#4ADE80" }]} />
              <Text style={styles.ieLabel}>{activeMonth.shortMonth.toUpperCase()} INCOME</Text>
            </View>
            <Text style={styles.ieValueGreen}>+RM {activeMonth.income.toFixed(2)}</Text>
          </View>

          <View style={styles.ieBox}>
            <View style={styles.ieTitleRow}>
              <View style={[styles.dotIndicator, { backgroundColor: "#FB7185" }]} />
              <Text style={styles.ieLabel}>{activeMonth.shortMonth.toUpperCase()} EXPENSES</Text>
            </View>
            <Text style={styles.ieValueRed}>-RM {activeMonth.expense.toFixed(2)}</Text>
          </View>
        </View>

        {/* Compact 1-Line Budget Summary Strip for Selected Month */}
        {activeLimit > 0 && (
          <View style={styles.budgetSummaryStrip}>
            <View style={styles.budgetStripTopRow}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                <Wallet size={11} color="#FFFFFF" strokeWidth={2.3} />
                <Text style={styles.budgetStripTitle}>
                  {activeMonth.shortMonth.toUpperCase()} BUDGET: RM {activeMonth.expense.toFixed(0)} / RM {activeLimit.toFixed(0)}
                </Text>
              </View>
              <Text style={[styles.budgetStripStatus, { color: isOverBudget ? "#FECDD3" : "#A7F3D0" }]}>
                {isOverBudget
                  ? `Over by RM ${(activeMonth.expense - activeLimit).toFixed(0)}`
                  : `${budgetUsedPct}% Used • RM ${(activeLimit - activeMonth.expense).toFixed(0)} Left`}
              </Text>
            </View>

            <View style={styles.budgetStripTrack}>
              <View
                style={[
                  styles.budgetStripFill,
                  {
                    width: `${Math.min(100, budgetUsedPct)}%`,
                    backgroundColor: isOverBudget ? "#FB7185" : "#4ADE80",
                  },
                ]}
              />
            </View>
          </View>
        )}
      </View>

      {/* 2. Interactive Stacked Monthly Bar + Trend Line Chart & 2-Column Category Grid */}
      <WireBox style={styles.chartCard}>
        <View style={styles.cardHeaderLine}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>SPENDING BREAKDOWN</Text>
            <Text style={styles.sectionSubTitle}>Tap any month bar to inspect its categories</Text>
          </View>

          <View style={styles.headerBadgesRight}>
            {momDiffPct !== null && (
              <View
                style={[
                  styles.momBadge,
                  {
                    backgroundColor: momDiffPct <= 0 ? "#DCFCE7" : "#FFE4E6",
                    borderColor: momDiffPct <= 0 ? "#15803D" : "#E11D48",
                  },
                ]}
              >
                {momDiffPct <= 0 ? (
                  <TrendingDown size={11} color="#15803D" strokeWidth={2.5} />
                ) : (
                  <TrendingUp size={11} color="#E11D48" strokeWidth={2.5} />
                )}
                <Text style={[styles.momBadgeText, { color: momDiffPct <= 0 ? "#15803D" : "#E11D48" }]}>
                  {momDiffPct > 0 ? `+${momDiffPct}%` : `${momDiffPct}%`}
                </Text>
              </View>
            )}

            <View style={styles.activeMonthBadge}>
              <Text style={styles.activeMonthBadgeText}>
                {activeMonth.isCurrentMonth ? `${activeMonth.shortMonth} (Current)` : activeMonth.label}
              </Text>
            </View>
          </View>
        </View>

        {/* Interactive Stacked Bar + Trend Line Plot Box */}
        <View style={[styles.plotBox, { height: CHART_HEIGHT }]} onLayout={(e) => setChartBoxWidth(e.nativeEvent.layout.width)}>
          {chartBoxWidth > 0 && (
            <>
              {/* Layer 1: Background Dashed Grid Lines & Baseline */}
              <Svg width={chartBoxWidth} height={CHART_HEIGHT} style={StyleSheet.absoluteFill}>
                <Line x1="12" y1={TOP_PAD} x2={chartBoxWidth - 12} y2={TOP_PAD} stroke={COLORS.borderMuted} strokeWidth="1" strokeDasharray="4,4" />
                <Line
                  x1="12"
                  y1={TOP_PAD + USABLE_BAR_MAX_H / 2}
                  x2={chartBoxWidth - 12}
                  y2={TOP_PAD + USABLE_BAR_MAX_H / 2}
                  stroke={COLORS.borderMuted}
                  strokeWidth="1"
                  strokeDasharray="4,4"
                />
                <Line
                  x1="12"
                  y1={CHART_HEIGHT - BOTTOM_PAD}
                  x2={chartBoxWidth - 12}
                  y2={CHART_HEIGHT - BOTTOM_PAD}
                  stroke={COLORS.borderMuted}
                  strokeWidth="1.5"
                />

                {chartNodes.length > 1 && <Polygon points={areaPolygonPoints} fill={COLORS.text} fillOpacity="0.10" />}
              </Svg>

              {/* Layer 2: Interactive Stacked Category Bars per Month */}
              <View style={[styles.barsOverlayRow, { height: CHART_HEIGHT }]}>
                {chartNodes.map((node) => {
                  const isSelected = node.key === activeMonth.key;
                  return (
                    <TouchableOpacity
                      key={node.key}
                      style={[styles.barColumnTouch, { width: colWidth }]}
                      activeOpacity={0.8}
                      onPress={() => setSelectedMonthKey(node.key)}
                    >
                      <Text style={[styles.barTopAmountText, isSelected && styles.barTopAmountTextSelected, { top: Math.max(4, node.topY - 18) }]}>
                        RM {Math.round(node.expense)}
                      </Text>

                      {node.barHeight > 0 && (
                        <View
                          style={[
                            styles.stackedBarContainer,
                            {
                              width: BAR_WIDTH,
                              height: node.barHeight,
                              bottom: BOTTOM_PAD,
                              borderWidth: isSelected ? 2 : 1,
                              borderColor: "#121212",
                              opacity: isSelected ? 1 : 0.72,
                            },
                          ]}
                        >
                          {node.categories.map((catSeg) => (
                            <View
                              key={catSeg.category}
                              style={{
                                flex: catSeg.amount,
                                backgroundColor: catSeg.iconColor,
                                width: "100%",
                              }}
                            />
                          ))}
                        </View>
                      )}

                      {/* Month Pill Label under Baseline: Shows "Nov (Current)" for current month */}
                      <View style={[styles.xAxisMonthPill, isSelected && styles.xAxisMonthPillSelected]}>
                        <Text style={[styles.xAxisMonthText, isSelected && styles.xAxisMonthTextSelected]}>
                          {node.isCurrentMonth ? `${node.shortMonth} (Current)` : node.shortMonth}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Layer 3: Foreground Connecting Trend Line & Node Circles */}
              <Svg width={chartBoxWidth} height={CHART_HEIGHT} style={StyleSheet.absoluteFill} pointerEvents="none">
                {chartNodes.length > 1 && <Polyline points={polylinePoints} fill="none" stroke="#121212" strokeWidth="2.2" />}
                {chartNodes.map((node) => {
                  const isSelected = node.key === activeMonth.key;
                  return (
                    <Circle
                      key={node.key}
                      cx={node.centerX}
                      cy={node.topY}
                      r={isSelected ? 5.5 : 4.5}
                      fill={isSelected ? "#121212" : "#FFFFFF"}
                      stroke="#121212"
                      strokeWidth="2"
                    />
                  );
                })}
              </Svg>
            </>
          )}
        </View>

        {/* 2-Column Category Breakdown Grid for Selected Month */}
        {activeMonth.categories.length === 0 ? (
          <Text style={styles.emptyChartText}>No expenses recorded in {activeMonth.label}.</Text>
        ) : (
          <View style={styles.categoryGrid}>
            {activeMonth.categories.map((catItem) => {
              const IconComp = catItem.IconComponent;
              return (
                <View
                  key={catItem.category}
                  style={[
                    styles.catMiniCard,
                    {
                      backgroundColor: catItem.bgColor,
                      borderColor: catItem.iconColor,
                    },
                  ]}
                >
                  <View style={styles.catMiniTopRow}>
                    <View style={styles.catMiniTitleRow}>
                      {IconComp && <IconComp size={13} color={catItem.iconColor} strokeWidth={2.4} />}
                      <Text style={styles.catMiniLabel} numberOfLines={1}>
                        {catItem.label}
                      </Text>
                    </View>
                    <Text style={[styles.catMiniPct, { color: catItem.iconColor }]}>{catItem.pct}%</Text>
                  </View>

                  <Text style={[styles.catMiniAmount, { color: catItem.iconColor }]}>RM {catItem.amount.toFixed(2)}</Text>

                  <View style={styles.catMiniBarTrack}>
                    <View
                      style={[
                        styles.catMiniBarFill,
                        {
                          width: `${Math.min(100, Math.max(8, catItem.rawPct))}%`,
                          backgroundColor: catItem.iconColor,
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

      {/* 3. Dynamic Transactions List Header ("RECENT TRANSACTIONS" vs "[MONTH] TRANSACTIONS") */}
      <View style={styles.recentHeaderRow}>
        <View>
          <Text style={styles.sectionTitle}>
            {activeMonth.isCurrentMonth ? "RECENT TRANSACTIONS" : `${activeMonth.label.toUpperCase()} TRANSACTIONS`}
          </Text>
          <Text style={styles.sectionSubTitle}>
            {activeMonth.isCurrentMonth ? `Latest entries added in ${activeMonth.label}` : `Historical records from ${activeMonth.label}`}
          </Text>
        </View>

        <TouchableOpacity style={styles.seeAllPillBtn} onPress={handlePressSeeAll} activeOpacity={0.75}>
          <Text style={styles.seeAllText}>See All</Text>
          <ArrowRight size={12} color={COLORS.text} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 20 }} />
      ) : activeMonth.monthTxs.length === 0 ? (
        <WireBox style={{ alignItems: "center", paddingVertical: 22 }}>
          <Text style={styles.emptyListText}>No transactions recorded in {activeMonth.label}.</Text>
        </WireBox>
      ) : (
        activeMonth.monthTxs.slice(0, 5).map((tx, idx) => {
          const isIncome = tx.type === "INCOME";
          const cfg = CATEGORY_CONFIG[tx.category] || CATEGORY_CONFIG.OTHER_EXPENSE;
          const formattedDate = tx.date
            ? new Date(tx.date).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
              })
            : "Today";

          return (
            <WireBox key={tx._id || idx} style={styles.txItemCard}>
              <CategoryBadge category={tx.category} size={36} iconSize={17} />

              <View style={{ flex: 1 }}>
                <Text style={styles.txMerchant} numberOfLines={1}>
                  {tx.merchantName || tx.merchant || "General"}
                </Text>
                <Text style={styles.txCategory} numberOfLines={1}>
                  {cfg.label} • {formattedDate}
                </Text>
              </View>

              <Text style={[styles.txAmount, { color: isIncome ? "#16A34A" : "#E11D48" }]}>
                {isIncome ? "+" : "-"}RM {Number(tx.amount).toFixed(2)}
              </Text>
            </WireBox>
          );
        })
      )}
    </ScrollView>
  );
}

// Dynamic style generator function so runtime theme changes update all COLORS and SHAPES immediately
const getStyles = () =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 32,
    },
    balanceHeroCard: {
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
    balanceHeroCardNegative: {
      backgroundColor: "#881337",
    },
    heroHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
      flexWrap: "wrap",
      gap: 6,
    },
    periodPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      backgroundColor: "#FEF08A",
      borderWidth: 1.5,
      borderColor: "#121212",
      borderRadius: SHAPES.chipRadius,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    periodPillText: {
      fontFamily: FONTS.mono,
      fontSize: 8,
      fontWeight: "bold",
      color: "#121212",
      letterSpacing: 0.5,
    },
    monthNetBadge: {
      backgroundColor: "rgba(0,0,0,0.28)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.4)",
      paddingHorizontal: 8,
      paddingVertical: 2.5,
      borderRadius: SHAPES.chipRadius,
    },
    monthNetBadgeText: {
      fontFamily: FONTS.mono,
      fontSize: 8,
      fontWeight: "bold",
      color: "#FFFFFF",
    },
    balanceSubLabel: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      color: COLORS.primaryText,
      opacity: 0.88,
      letterSpacing: 1.1,
      marginBottom: 2,
    },
    balanceAmount: {
      fontFamily: FONTS.mono,
      fontSize: 28,
      fontWeight: "bold",
      color: COLORS.primaryText,
      marginBottom: 12,
    },
    incomeExpenseRow: {
      flexDirection: "row",
      gap: 10,
    },
    ieBox: {
      flex: 1,
      borderWidth: 1.5,
      borderColor: "rgba(255,255,255,0.35)",
      borderRadius: SHAPES.inputRadius,
      backgroundColor: "rgba(0,0,0,0.22)",
      padding: 10,
    },
    ieTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 4,
    },
    dotIndicator: {
      width: 7,
      height: 7,
      borderRadius: 4,
    },
    ieLabel: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      color: COLORS.primaryText,
      opacity: 0.88,
    },
    ieValueGreen: {
      fontFamily: FONTS.mono,
      fontSize: 13,
      fontWeight: "bold",
      color: "#86EFAC",
    },
    ieValueRed: {
      fontFamily: FONTS.mono,
      fontSize: 13,
      fontWeight: "bold",
      color: "#FDA4AF",
    },
    budgetSummaryStrip: {
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth: 1,
      borderColor: "rgba(255,255,255,0.3)",
      borderStyle: "dashed",
    },
    budgetStripTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 5,
    },
    budgetStripTitle: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      fontWeight: "bold",
      color: "#FFFFFF",
    },
    budgetStripStatus: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      fontWeight: "bold",
    },
    budgetStripTrack: {
      width: "100%",
      height: 5,
      backgroundColor: "rgba(0,0,0,0.28)",
      borderRadius: 3,
      overflow: "hidden",
    },
    budgetStripFill: {
      height: "100%",
      borderRadius: 3,
    },
    chartCard: {
      marginBottom: 16,
      padding: 14,
    },
    cardHeaderLine: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottomWidth: SHAPES.borderWidth,
      borderColor: COLORS.borderMuted,
      borderStyle: "dashed",
      paddingBottom: 10,
      marginBottom: 12,
      gap: 8,
    },
    sectionTitle: {
      fontFamily: FONTS.mono,
      fontSize: 11,
      fontWeight: "bold",
      color: COLORS.text,
      letterSpacing: 1,
    },
    sectionSubTitle: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
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
      borderWidth: 1.2,
      borderRadius: 6,
      paddingHorizontal: 7,
      paddingVertical: 3,
    },
    momBadgeText: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      fontWeight: "bold",
    },
    activeMonthBadge: {
      borderWidth: 1.2,
      borderColor: COLORS.border,
      borderRadius: 6,
      backgroundColor: COLORS.secondary,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    activeMonthBadgeText: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      fontWeight: "bold",
      color: COLORS.text,
    },
    plotBox: {
      width: "100%",
      borderWidth: 1.8,
      borderColor: "#121212",
      borderRadius: 8,
      backgroundColor: COLORS.secondary,
      marginBottom: 14,
      position: "relative",
      overflow: "hidden",
    },
    barsOverlayRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      width: "100%",
    },
    barColumnTouch: {
      height: "100%",
      alignItems: "center",
      justifyContent: "flex-end",
      position: "relative",
    },
    barTopAmountText: {
      position: "absolute",
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      color: COLORS.textMuted,
    },
    barTopAmountTextSelected: {
      fontWeight: "bold",
      color: "#121212",
    },
    stackedBarContainer: {
      position: "absolute",
      borderRadius: 2,
      overflow: "hidden",
      flexDirection: "column",
    },
    xAxisMonthPill: {
      height: 19,
      paddingHorizontal: 6,
      borderRadius: 4,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 5,
    },
    xAxisMonthPillSelected: {
      backgroundColor: "#121212",
    },
    xAxisMonthText: {
      fontFamily: FONTS.mono,
      fontSize: 8,
      color: COLORS.textMuted,
    },
    xAxisMonthTextSelected: {
      color: "#FFFFFF",
      fontWeight: "bold",
    },
    emptyChartText: {
      fontFamily: FONTS.mono,
      fontSize: 10,
      color: COLORS.textMuted,
      textAlign: "center",
      paddingVertical: 12,
    },
    categoryGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      gap: 8,
    },
    catMiniCard: {
      width: "48.5%",
      borderWidth: 1.2,
      borderRadius: 8,
      padding: 10,
    },
    catMiniTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 6,
    },
    catMiniTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      flex: 1,
    },
    catMiniLabel: {
      fontFamily: FONTS.mono,
      fontSize: 9.5,
      fontWeight: "bold",
      color: "#121212",
      flex: 1,
    },
    catMiniPct: {
      fontFamily: FONTS.mono,
      fontSize: 9,
      fontWeight: "bold",
    },
    catMiniAmount: {
      fontFamily: FONTS.mono,
      fontSize: 13,
      fontWeight: "bold",
      marginBottom: 7,
    },
    catMiniBarTrack: {
      width: "100%",
      height: 5,
      borderRadius: 3,
      backgroundColor: "rgba(0,0,0,0.08)",
      overflow: "hidden",
    },
    catMiniBarFill: {
      height: "100%",
      borderRadius: 3,
    },
    recentHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },
    seeAllPillBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      borderWidth: 1.5,
      borderColor: COLORS.border,
      borderRadius: SHAPES.chipRadius,
      backgroundColor: COLORS.secondary,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    seeAllText: {
      fontFamily: FONTS.mono,
      fontSize: 9.5,
      color: COLORS.text,
      fontWeight: "bold",
    },
    emptyListText: {
      fontFamily: FONTS.mono,
      fontSize: 11,
      color: COLORS.textMuted,
    },
    txItemCard: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 8,
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
