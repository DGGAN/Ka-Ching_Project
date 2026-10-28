// Import React hooks, native UI components, AsyncStorage, SVG plotting, and Lucide icons
import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, { Polyline, Polygon, Circle, Line } from "react-native-svg";
import { Sparkles, TrendingUp, AlertTriangle, Info, RefreshCw, CheckSquare, Square, Flame, Award, ArrowRight } from "lucide-react-native";
import apiClient from "../api/client";
import { COLORS, SHAPES, FONTS } from "../theme/theme";
import { WireBox, FloatingToast, useFloatingToast } from "../components/WireUI";

// Helper function: Extract numeric RM value from impact badge string (e.g. "Save ~RM 80" -> 80)
const parseImpactAmount = (impactStr = "") => {
  const match = impactStr.match(/RM\s*([0-9]+(\.[0-9]+)?)/i);
  return match ? parseFloat(match[1]) : 0;
};

// AI Insights & Monthly Spending Forecast Screen with Persistent Checklist & Savings Tracker
export default function InsightsScreen({ user, onNavigateToBudget }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartWidth, setChartWidth] = useState(0);
  const [checkedIds, setCheckedIds] = useState({});

  const { toast, slideAnim, showToast } = useFloatingToast();

  useEffect(() => {
    fetchAnalyticsData(false);
  }, []);

  // Load saved checklist state from AsyncStorage once analytics month label is available
  useEffect(() => {
    if (analytics?.currentMonthLabel) {
      loadSavedChecklist(analytics.currentMonthLabel);
    }
  }, [analytics?.currentMonthLabel]);

  const getChecklistStorageKey = (monthLabel) => `kaching_checklist_${user.id}_${monthLabel.replace(/\s+/g, "_")}`;

  const loadSavedChecklist = async (monthLabel) => {
    try {
      const key = getChecklistStorageKey(monthLabel);
      const savedJson = await AsyncStorage.getItem(key);
      if (savedJson) {
        setCheckedIds(JSON.parse(savedJson));
      }
    } catch (error) {
      console.log("Failed to load checklist state:", error.message);
    }
  };

  const fetchAnalyticsData = async (showRefreshToast = false) => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/analytics/${user.id}`);
      if (response.data && response.data.data) {
        setAnalytics(response.data.data);
        if (showRefreshToast) {
          showToast("success", "Spending forecast updated!");
        }
      }
    } catch (error) {
      console.log("Failed to load AI insights:", error.message);
      showToast("error", "Could not load insights right now.");
    } finally {
      setLoading(false);
    }
  };

  // Toggle checklist item, persist to AsyncStorage, and show encouraging feedback
  const toggleChecklistItem = async (item) => {
    const nextCheckedState = !checkedIds[item.id];
    const updatedMap = {
      ...checkedIds,
      [item.id]: nextCheckedState,
    };

    setCheckedIds(updatedMap);

    if (analytics?.currentMonthLabel) {
      try {
        const key = getChecklistStorageKey(analytics.currentMonthLabel);
        await AsyncStorage.setItem(key, JSON.stringify(updatedMap));
      } catch (error) {
        console.log("Failed to save checklist state:", error.message);
      }
    }

    if (nextCheckedState) {
      const rmVal = parseImpactAmount(item.impact);
      if (rmVal > 0) {
        showToast("success", `Goal committed! This habit can save you ~RM ${rmVal.toFixed(0)} this month.`);
      } else {
        showToast("success", "Financial habit marked as completed!");
      }
    }
  };

  if (loading || !analytics) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="small" color={COLORS.primary} />
        <Text style={styles.loadingHint}>Analyzing your spending habits...</Text>
      </View>
    );
  }

  const {
    currentMonthLabel,
    currentDay,
    daysInMonth,
    thisMonthExpense,
    dailyBurnRate,
    predictedMonthEnd,
    monthlyLimit,
    chartCheckpoints = [],
    insightsList = [],
    checklistItems = [],
  } = analytics;

  const isOverProjected = monthlyLimit > 0 && predictedMonthEnd > monthlyLimit;
  const projectedVariance = monthlyLimit > 0 ? predictedMonthEnd - monthlyLimit : 0;

  const PLOT_HEIGHT = 125;
  const TOP_PAD = 18;
  const BOTTOM_PAD = 10;
  const usableHeight = PLOT_HEIGHT - TOP_PAD - BOTTOM_PAD;

  const maxChartValue = Math.max(predictedMonthEnd, monthlyLimit, thisMonthExpense, 100) * 1.12;

  const numPoints = chartCheckpoints.length;
  const stepX = chartWidth > 0 && numPoints > 1 ? chartWidth / (numPoints - 1) : 0;

  const plottedNodes = chartCheckpoints.map((pt, idx) => {
    const x = idx === 0 ? 14 : idx === numPoints - 1 ? Math.max(14, chartWidth - 14) : stepX * idx;
    const val = pt.isFuture ? pt.predicted : pt.actual;
    const ratio = maxChartValue > 0 ? Math.min(1, val / maxChartValue) : 0;
    const y = TOP_PAD + usableHeight * (1 - ratio);
    return { ...pt, x, y, val };
  });

  const actualNodes = plottedNodes.filter((n) => !n.isFuture);
  const lastActualNode = actualNodes[actualNodes.length - 1];
  const futureNodes = plottedNodes.filter((n) => n.isFuture);
  const forecastSegmentNodes = lastActualNode ? [lastActualNode, ...futureNodes] : futureNodes;

  const actualPolylineStr = actualNodes.map((n) => `${n.x},${n.y}`).join(" ");
  const forecastPolylineStr = forecastSegmentNodes.map((n) => `${n.x},${n.y}`).join(" ");

  const actualAreaStr =
    actualNodes.length > 1
      ? `${actualNodes[0].x},${PLOT_HEIGHT - BOTTOM_PAD} ${actualPolylineStr} ${actualNodes[actualNodes.length - 1].x},${PLOT_HEIGHT - BOTTOM_PAD}`
      : "";

  const limitY = monthlyLimit > 0 ? TOP_PAD + usableHeight * (1 - Math.min(1, monthlyLimit / maxChartValue)) : null;

  // Calculate completed tasks and total potential RM saved from checked items
  const completedCount = checklistItems.filter((item) => checkedIds[item.id]).length;
  const allCompleted = checklistItems.length > 0 && completedCount === checklistItems.length;

  let committedSavingsRM = 0;
  let totalPossibleSavingsRM = 0;
  checklistItems.forEach((item) => {
    const amt = parseImpactAmount(item.impact);
    totalPossibleSavingsRM += amt;
    if (checkedIds[item.id]) {
      committedSavingsRM += amt;
    }
  });

  return (
    <View style={{ flex: 1, position: "relative" }}>
      <FloatingToast toast={toast} slideAnim={slideAnim} />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Section 1: AI Month-End Forecast Hero Card */}
        <View style={styles.forecastHeroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.aiTagBadge}>
              <Sparkles size={11} color="#111111" strokeWidth={2.5} />
              <Text style={styles.aiTagText}>SMART SPENDING FORECAST</Text>
            </View>

            <TouchableOpacity style={styles.refreshBtn} onPress={() => fetchAnalyticsData(true)} activeOpacity={0.8}>
              <RefreshCw size={12} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.refreshBtnText}>REFRESH</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.heroSubLabel}>ESTIMATED TOTAL BY END OF {currentMonthLabel.toUpperCase()}</Text>
          <Text style={styles.heroPredictedAmount}>
            RM {predictedMonthEnd.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>

          <View style={styles.heroMetricsRow}>
            <View style={styles.heroMetricBox}>
              <Text style={styles.heroMetricLabel}>SPENT SO FAR</Text>
              <Text style={styles.heroMetricVal}>RM {thisMonthExpense.toFixed(0)}</Text>
            </View>

            <View style={styles.heroMetricBox}>
              <Text style={styles.heroMetricLabel}>DAILY AVG</Text>
              <Text style={styles.heroMetricVal}>RM {dailyBurnRate.toFixed(1)}/day</Text>
            </View>

            <View style={[styles.heroMetricBox, isOverProjected ? styles.heroMetricDanger : styles.heroMetricSafe]}>
              <Text style={styles.heroMetricLabel}>BUDGET CHECK</Text>
              <Text style={[styles.heroMetricVal, { color: monthlyLimit === 0 ? "#FFFFFF" : isOverProjected ? "#FECDD3" : "#A7F3D0" }]}>
                {monthlyLimit === 0
                  ? "Not Set"
                  : isOverProjected
                    ? `+RM ${projectedVariance.toFixed(0)} Over`
                    : `RM ${Math.abs(projectedVariance).toFixed(0)} Safe`}
              </Text>
            </View>
          </View>
        </View>

        {/* Section 2: Monthly Spending Trend Chart */}
        <WireBox style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.cardHeaderTitle}>MONTHLY SPENDING TREND</Text>
              <Text style={styles.cardHeaderSub}>
                Day {currentDay} of {daysInMonth} • Averaging RM {dailyBurnRate.toFixed(2)} per day
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: isOverProjected ? "#FFE4E6" : "#DCFCE7" }]}>
              <Text style={[styles.statusBadgeText, { color: isOverProjected ? "#E11D48" : "#15803D" }]}>
                {monthlyLimit === 0 ? "TRACKING" : isOverProjected ? "OVER BUDGET RISK" : "ON TRACK"}
              </Text>
            </View>
          </View>

          <View style={styles.chartWrapper}>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendLine, { backgroundColor: COLORS.primary }]} />
                <Text style={styles.legendText}>Spent So Far</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendLineDashed, { borderColor: "#D97706" }]} />
                <Text style={styles.legendText}>Month-End Estimate</Text>
              </View>
              {monthlyLimit > 0 && (
                <View style={styles.legendItem}>
                  <View style={[styles.legendLine, { backgroundColor: COLORS.danger }]} />
                  <Text style={styles.legendText}>Budget Limit (RM {monthlyLimit.toFixed(0)})</Text>
                </View>
              )}
            </View>

            <View style={[styles.plotContainer, { height: PLOT_HEIGHT }]} onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}>
              {chartWidth > 0 && plottedNodes.length > 0 && (
                <Svg width={chartWidth} height={PLOT_HEIGHT}>
                  <Line x1="0" y1={TOP_PAD} x2={chartWidth} y2={TOP_PAD} stroke={COLORS.borderMuted} strokeWidth="1" strokeDasharray="3,3" />
                  <Line
                    x1="0"
                    y1={TOP_PAD + usableHeight / 2}
                    x2={chartWidth}
                    y2={TOP_PAD + usableHeight / 2}
                    stroke={COLORS.borderMuted}
                    strokeWidth="1"
                    strokeDasharray="3,3"
                  />
                  <Line
                    x1="0"
                    y1={PLOT_HEIGHT - BOTTOM_PAD}
                    x2={chartWidth}
                    y2={PLOT_HEIGHT - BOTTOM_PAD}
                    stroke={COLORS.borderMuted}
                    strokeWidth="1.5"
                  />

                  {limitY !== null && (
                    <Line x1="0" y1={limitY} x2={chartWidth} y2={limitY} stroke={COLORS.danger} strokeWidth="1.8" strokeDasharray="5,4" />
                  )}

                  {actualNodes.length > 1 && <Polygon points={actualAreaStr} fill={COLORS.primary} fillOpacity="0.16" />}

                  {actualNodes.length > 1 && (
                    <Polyline
                      points={actualPolylineStr}
                      fill="none"
                      stroke={COLORS.primary}
                      strokeWidth="3"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                  )}

                  {forecastSegmentNodes.length > 1 && (
                    <Polyline
                      points={forecastPolylineStr}
                      fill="none"
                      stroke="#D97706"
                      strokeWidth="2.8"
                      strokeDasharray="6,4"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                  )}

                  {plottedNodes.map((node, i) => (
                    <Circle
                      key={i}
                      cx={node.x}
                      cy={node.y}
                      r={node.isFuture ? 5.5 : 4.5}
                      fill={node.isFuture ? "#FEF3C7" : COLORS.card}
                      stroke={node.isFuture ? "#D97706" : COLORS.primary}
                      strokeWidth={2.5}
                    />
                  ))}
                </Svg>
              )}
            </View>

            <View style={styles.xAxisRow}>
              {plottedNodes.map((node, i) => (
                <View key={i} style={styles.xAxisNodeCol}>
                  <Text style={[styles.xAxisDayText, node.isFuture && { color: "#D97706", fontWeight: "bold" }]}>{node.label}</Text>
                  <Text style={styles.xAxisAmtText}>RM {Math.round(node.val)}</Text>
                </View>
              ))}
            </View>
          </View>
        </WireBox>

        {/* Section 3: Spending Habits & Smart Tips */}
        <WireBox style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Flame size={15} color={COLORS.primary} strokeWidth={2.5} />
              <Text style={styles.cardHeaderTitle}>YOUR SPENDING HABITS</Text>
            </View>
            <Text style={styles.cardHeaderSub}>Personalized from your records</Text>
          </View>

          <View style={{ padding: 12, gap: 10 }}>
            {insightsList.map((insight) => {
              const isAlert = insight.severity === "ALERT";
              const isHabit = insight.severity === "HABIT";
              const badgeBg = isAlert ? "#FFE4E6" : isHabit ? "#FEF3C7" : "#DCFCE7";
              const badgeColor = isAlert ? "#E11D48" : isHabit ? "#D97706" : "#15803D";

              return (
                <View key={insight.id} style={[styles.insightItemCard, isAlert && { borderColor: COLORS.danger, backgroundColor: "#FFF5F5" }]}>
                  <View style={styles.insightTopRow}>
                    <View style={styles.insightTitleLeft}>
                      {isAlert ? (
                        <AlertTriangle size={14} color="#E11D48" strokeWidth={2.5} />
                      ) : isHabit ? (
                        <TrendingUp size={14} color="#D97706" strokeWidth={2.5} />
                      ) : (
                        <Info size={14} color="#15803D" strokeWidth={2.5} />
                      )}
                      <Text style={styles.insightTitleText}>{insight.title}</Text>
                    </View>

                    <View style={[styles.severityPill, { backgroundColor: badgeBg }]}>
                      <Text style={[styles.severityPillText, { color: badgeColor }]}>{insight.severity}</Text>
                    </View>
                  </View>

                  <Text style={styles.insightDescText}>{insight.description}</Text>
                </View>
              );
            })}
          </View>
        </WireBox>

        {/* Section 4: Persistent Money-Saving To-Do List with Savings Impact Tracker */}
        <WireBox style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardHeaderTitle}>MONEY-SAVING TO-DO LIST</Text>
              <Text style={styles.cardHeaderSub}>Check off goals you commit to — your progress is saved automatically</Text>
            </View>
            <View style={[styles.checklistCountBadge, allCompleted && { backgroundColor: "#DCFCE7", borderColor: "#15803D" }]}>
              <Text style={[styles.checklistCountText, allCompleted && { color: "#15803D" }]}>
                {completedCount}/{checklistItems.length} DONE
              </Text>
            </View>
          </View>

          {/* Live Potential Savings Summary Banner */}
          {totalPossibleSavingsRM > 0 && (
            <View style={styles.savingsImpactBanner}>
              <View style={styles.savingsBannerTop}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Award size={14} color="#15803D" strokeWidth={2.5} />
                  <Text style={styles.savingsBannerLabel}>COMMITTED MONTHLY SAVINGS:</Text>
                </View>
                <Text style={styles.savingsBannerValue}>
                  RM {committedSavingsRM.toFixed(0)} / RM {totalPossibleSavingsRM.toFixed(0)}
                </Text>
              </View>
              <View style={styles.savingsProgressTrack}>
                <View
                  style={[
                    styles.savingsProgressFill,
                    {
                      width: `${Math.min(100, (committedSavingsRM / totalPossibleSavingsRM) * 100)}%`,
                    },
                  ]}
                />
              </View>
            </View>
          )}

          <View style={{ padding: 12, gap: 8 }}>
            {checklistItems.map((item) => {
              const isChecked = Boolean(checkedIds[item.id]);
              const isBudgetSetupTask = item.id === "chk_set_budget";

              return (
                <View key={item.id}>
                  <TouchableOpacity
                    style={[styles.checkItemRow, isChecked && styles.checkItemRowDone]}
                    activeOpacity={0.75}
                    onPress={() => toggleChecklistItem(item)}
                  >
                    {isChecked ? (
                      <CheckSquare size={18} color="#15803D" strokeWidth={2.5} />
                    ) : (
                      <Square size={18} color={COLORS.textMuted} strokeWidth={2} />
                    )}

                    <Text style={[styles.checkItemText, isChecked && styles.checkItemTextDone]}>{item.text}</Text>

                    <View style={[styles.impactBadge, isChecked && { backgroundColor: "#DCFCE7", borderColor: "#15803D" }]}>
                      <Text style={[styles.impactBadgeText, isChecked && { color: "#15803D" }]}>{item.impact}</Text>
                    </View>
                  </TouchableOpacity>

                  {/* Optional quick shortcut button if the user hasn't set a budget yet */}
                  {isBudgetSetupTask && !isChecked && onNavigateToBudget && (
                    <TouchableOpacity style={styles.quickActionShortcut} onPress={onNavigateToBudget}>
                      <Text style={styles.quickActionText}>Open Budget Tab Now</Text>
                      <ArrowRight size={11} color={COLORS.primary} strokeWidth={2.5} />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}

            {allCompleted && (
              <View style={styles.allDoneCelebrationBox}>
                <Text style={styles.allDoneCelebrationText}>
                  All habits committed for {currentMonthLabel}! Sticking to these goals will help keep your spending well under control.
                </Text>
              </View>
            )}
          </View>
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
  loadingHint: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 10,
  },
  forecastHeroCard: {
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
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  aiTagBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FEF08A",
    borderWidth: 1.5,
    borderColor: "#111111",
    borderRadius: SHAPES.chipRadius,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  aiTagText: {
    fontFamily: FONTS.mono,
    fontSize: 8,
    fontWeight: "bold",
    color: "#111111",
    letterSpacing: 0.5,
  },
  refreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.25)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.45)",
    borderRadius: SHAPES.chipRadius,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  refreshBtnText: {
    fontFamily: FONTS.mono,
    fontSize: 8,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  heroSubLabel: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.primaryText,
    opacity: 0.85,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  heroPredictedAmount: {
    fontFamily: FONTS.mono,
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.primaryText,
    marginBottom: 14,
  },
  heroMetricsRow: {
    flexDirection: "row",
    gap: 8,
  },
  heroMetricBox: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.35)",
    borderRadius: SHAPES.inputRadius,
    backgroundColor: "rgba(0,0,0,0.22)",
    padding: 8,
  },
  heroMetricDanger: {
    borderColor: "#FDA4AF",
    backgroundColor: "rgba(136, 19, 55, 0.38)",
  },
  heroMetricSafe: {
    borderColor: "#6EE7B7",
    backgroundColor: "rgba(6, 78, 59, 0.35)",
  },
  heroMetricLabel: {
    fontFamily: FONTS.mono,
    fontSize: 7.5,
    color: COLORS.primaryText,
    opacity: 0.85,
    marginBottom: 3,
  },
  heroMetricVal: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    fontWeight: "bold",
    color: COLORS.primaryText,
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
    letterSpacing: 0.8,
  },
  cardHeaderSub: {
    fontFamily: FONTS.mono,
    fontSize: 8.5,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: SHAPES.chipRadius,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 8,
    fontWeight: "bold",
  },
  chartWrapper: {
    padding: 14,
  },
  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  legendLine: {
    width: 14,
    height: 3,
    borderRadius: 2,
  },
  legendLineDashed: {
    width: 14,
    height: 0,
    borderTopWidth: 2.5,
    borderStyle: "dashed",
  },
  legendText: {
    fontFamily: FONTS.mono,
    fontSize: 8.5,
    color: COLORS.textMuted,
  },
  plotContainer: {
    width: "100%",
    borderWidth: SHAPES.borderWidth,
    borderColor: COLORS.border,
    borderRadius: SHAPES.inputRadius,
    backgroundColor: COLORS.secondary,
    overflow: "hidden",
  },
  xAxisRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingHorizontal: 2,
  },
  xAxisNodeCol: {
    alignItems: "center",
  },
  xAxisDayText: {
    fontFamily: FONTS.mono,
    fontSize: 8,
    color: COLORS.textMuted,
  },
  xAxisAmtText: {
    fontFamily: FONTS.mono,
    fontSize: 8.5,
    fontWeight: "bold",
    color: COLORS.text,
    marginTop: 1,
  },
  insightItemCard: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: SHAPES.inputRadius,
    backgroundColor: COLORS.secondary,
    padding: 11,
  },
  insightTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  insightTitleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  insightTitleText: {
    fontFamily: FONTS.mono,
    fontSize: 10.5,
    fontWeight: "bold",
    color: COLORS.text,
    flex: 1,
  },
  severityPill: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SHAPES.chipRadius,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  severityPillText: {
    fontFamily: FONTS.mono,
    fontSize: 7.5,
    fontWeight: "bold",
  },
  insightDescText: {
    fontFamily: FONTS.mono,
    fontSize: 9.5,
    color: COLORS.textMuted,
    lineHeight: 15,
  },
  checklistCountBadge: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: SHAPES.chipRadius,
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 8,
  },
  checklistCountText: {
    fontFamily: FONTS.mono,
    fontSize: 8.5,
    fontWeight: "bold",
    color: COLORS.text,
  },
  savingsImpactBanner: {
    marginHorizontal: 12,
    marginTop: 10,
    padding: 10,
    borderWidth: 1.5,
    borderColor: "#15803D",
    borderRadius: SHAPES.inputRadius,
    backgroundColor: "#F0FDF4",
  },
  savingsBannerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  savingsBannerLabel: {
    fontFamily: FONTS.mono,
    fontSize: 8.5,
    fontWeight: "bold",
    color: "#15803D",
  },
  savingsBannerValue: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    fontWeight: "bold",
    color: "#15803D",
  },
  savingsProgressTrack: {
    width: "100%",
    height: 6,
    backgroundColor: "#BBF7D0",
    borderRadius: 3,
    overflow: "hidden",
  },
  savingsProgressFill: {
    height: "100%",
    backgroundColor: "#15803D",
  },
  checkItemRow: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: SHAPES.inputRadius,
    backgroundColor: COLORS.card,
    paddingHorizontal: 11,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  checkItemRowDone: {
    backgroundColor: "#F0FDF4",
    borderColor: "#15803D",
    opacity: 0.9,
  },
  checkItemText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.text,
    flex: 1,
    lineHeight: 14,
  },
  checkItemTextDone: {
    textDecorationLine: "line-through",
    color: COLORS.textMuted,
  },
  impactBadge: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SHAPES.chipRadius,
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  impactBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 8,
    fontWeight: "bold",
    color: COLORS.text,
  },
  quickActionShortcut: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    gap: 4,
    marginTop: 4,
    paddingHorizontal: 6,
  },
  quickActionText: {
    fontFamily: FONTS.mono,
    fontSize: 8.5,
    fontWeight: "bold",
    color: COLORS.primary,
    textDecorationLine: "underline",
  },
  allDoneCelebrationBox: {
    marginTop: 4,
    padding: 9,
    borderWidth: 1,
    borderColor: "#15803D",
    borderStyle: "dashed",
    borderRadius: SHAPES.inputRadius,
    backgroundColor: "#F0FDF4",
  },
  allDoneCelebrationText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: "#15803D",
    textAlign: "center",
    lineHeight: 14,
  },
});
