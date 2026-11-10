/**
 * @file frontend/src/features/dashboard/hooks/useDashboardData.js
 * @layer Hook (State & Lifecycle Management — 100% Original Dashboard Logic)
 * @description Manages transactions, latestBudget, budgetHistory, selectedMonthKey, and chartBoxWidth state for DashboardScreen.
 * @exports useDashboardData
 */

import { useState, useEffect, useMemo } from "react";
import apiClient from "../../../api/apiClient";
import { getRawSixMonthWindow, computeDashboardMetrics, computeChartGeometry } from "../utils/dashboardCalculations";

const RAW_SIX_MONTHS = getRawSixMonthWindow();
const CURRENT_MONTH_KEY = RAW_SIX_MONTHS[RAW_SIX_MONTHS.length - 1].key;

export function useDashboardData(user) {
  const [transactions, setTransactions] = useState([]);
  const [latestBudget, setLatestBudget] = useState(null);
  const [budgetHistory, setBudgetHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonthKey, setSelectedMonthKey] = useState(CURRENT_MONTH_KEY);
  const [chartBoxWidth, setChartBoxWidth] = useState(0);

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData();
    }
  }, [user?.id]);

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

  const metrics = useMemo(
    () => computeDashboardMetrics(transactions, latestBudget, budgetHistory, RAW_SIX_MONTHS, selectedMonthKey),
    [transactions, latestBudget, budgetHistory, selectedMonthKey],
  );

  const chartGeometry = useMemo(() => computeChartGeometry(metrics.visibleMonths, chartBoxWidth), [metrics.visibleMonths, chartBoxWidth]);

  return {
    loading,
    selectedMonthKey,
    setSelectedMonthKey,
    chartBoxWidth,
    setChartBoxWidth,
    ...metrics,
    chartGeometry,
  };
}
