/**
 * @file frontend/src/screens/InsightsScreen.js
 * @layer Screen (Top-Level Page Skeleton — 100% Original Commit a357cef Design)
 * @description Assembles the exact 4-part InsightsScreen layout: InsightSummaryCard, SpendingForecastChart, SpendingPatternCard, and InsightChecklist.
 * @props {object} user - Logged-in user object
 * @props {function} [onNavigateToBudget] - Optional callback to navigate to BudgetScreen
 * @exports default InsightsScreen
 */

import React from "react";
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import { COLORS, FONTS } from "../theme/colors";
import FloatingToast from "../components/shared/FloatingToast";
import { useFloatingToast } from "../components/shared/useFloatingToast";
import { useInsightsData } from "../features/insights/hooks/useInsightsData";
import InsightSummaryCard from "../features/insights/components/InsightSummaryCard";
import SpendingForecastChart from "../features/insights/components/SpendingForecastChart";
import SpendingPatternCard from "../features/insights/components/SpendingPatternCard";
import InsightChecklist from "../features/insights/components/InsightChecklist";

export default function InsightsScreen({ user, onNavigateToBudget }) {
  const styles = getStyles();
  const { toast, slideAnim, showToast } = useFloatingToast();

  const { analytics, loading, chartWidth, setChartWidth, checkedIds, fetchAnalyticsData, toggleChecklistItem } = useInsightsData(user, showToast);

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

  return (
    <View style={{ flex: 1, position: "relative" }}>
      <FloatingToast toast={toast} slideAnim={slideAnim} />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Section 1: AI Month-End Forecast Hero Card */}
        <InsightSummaryCard
          currentMonthLabel={currentMonthLabel}
          predictedMonthEnd={predictedMonthEnd}
          thisMonthExpense={thisMonthExpense}
          dailyBurnRate={dailyBurnRate}
          monthlyLimit={monthlyLimit}
          isOverProjected={isOverProjected}
          projectedVariance={projectedVariance}
          onRefresh={() => fetchAnalyticsData(true)}
        />

        {/* Section 2: Monthly Spending Trend Chart */}
        <SpendingForecastChart
          currentDay={currentDay}
          daysInMonth={daysInMonth}
          dailyBurnRate={dailyBurnRate}
          monthlyLimit={monthlyLimit}
          predictedMonthEnd={predictedMonthEnd}
          thisMonthExpense={thisMonthExpense}
          isOverProjected={isOverProjected}
          chartCheckpoints={chartCheckpoints}
          chartWidth={chartWidth}
          onLayoutChart={setChartWidth}
        />

        {/* Section 3: Spending Habits & Smart Tips */}
        <SpendingPatternCard insightsList={insightsList} />

        {/* Section 4: Persistent Money-Saving To-Do List with Savings Impact Tracker */}
        <InsightChecklist
          checklistItems={checklistItems}
          checkedIds={checkedIds}
          currentMonthLabel={currentMonthLabel}
          onToggleItem={toggleChecklistItem}
          onNavigateToBudget={onNavigateToBudget}
        />
      </ScrollView>
    </View>
  );
}

const getStyles = () =>
  StyleSheet.create({
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
  });
