/**
 * @file frontend/src/screens/DashboardScreen.js
 * @layer Screen (Top-Level Page Skeleton — 100% Original Commit a357cef Design)
 * @description Assembles the exact 3-part Dashboard layout: BalanceSummary (with embedded Budget Strip), SpendingChart, and RecentTransactions.
 * @props {object} user - Logged-in user object
 * @props {function} onNavigateToTransactions - Callback to navigate to TransactionsScreen
 * @props {function} [onViewAllPress] - Fallback callback for See All button
 * @exports default DashboardScreen
 */

import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useDashboardData } from "../features/dashboard/hooks/useDashboardData";
import BalanceSummary from "../features/dashboard/components/BalanceSummary";
import SpendingChart from "../features/dashboard/components/SpendingChart";
import RecentTransactions from "../features/dashboard/components/RecentTransactions";

export default function DashboardScreen({ user, onNavigateToTransactions, onViewAllPress }) {
  const styles = getStyles();

  const {
    loading,
    setSelectedMonthKey,
    chartBoxWidth,
    setChartBoxWidth,
    allTimeSavedBalance,
    isAllTimeNegative,
    activeMonth,
    momDiffPct,
    monthlyNet,
    activeLimit,
    budgetUsedPct,
    isOverBudget,
    chartGeometry,
  } = useDashboardData(user);

  const handlePressSeeAll = () => {
    if (typeof onNavigateToTransactions === "function") {
      onNavigateToTransactions();
    } else if (typeof onViewAllPress === "function") {
      onViewAllPress();
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* 1. Hero Card: All-Time Accumulated Balance + Selected Month Cashflow + Embedded Budget Strip */}
      <BalanceSummary
        activeMonth={activeMonth}
        monthlyNet={monthlyNet}
        allTimeSavedBalance={allTimeSavedBalance}
        isAllTimeNegative={isAllTimeNegative}
        activeLimit={activeLimit}
        budgetUsedPct={budgetUsedPct}
        isOverBudget={isOverBudget}
      />

      {/* 2. Interactive Stacked Monthly Bar + Trend Line Chart & 2-Column Category Grid */}
      <SpendingChart
        activeMonth={activeMonth}
        momDiffPct={momDiffPct}
        chartBoxWidth={chartBoxWidth}
        onLayoutPlotBox={setChartBoxWidth}
        chartGeometry={chartGeometry}
        onSelectMonthKey={setSelectedMonthKey}
      />

      {/* 3. Dynamic Transactions List Header ("RECENT TRANSACTIONS" vs "[MONTH] TRANSACTIONS") */}
      <RecentTransactions activeMonth={activeMonth} loading={loading} onPressSeeAll={handlePressSeeAll} />
    </ScrollView>
  );
}

const getStyles = () =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 32,
    },
  });
