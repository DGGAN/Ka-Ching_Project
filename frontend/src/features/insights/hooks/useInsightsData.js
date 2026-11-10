/**
 * @file frontend/src/features/insights/hooks/useInsightsData.js
 * @layer Hook (State, AsyncStorage Persistence & Lifecycle — 100% Original Insights Logic)
 * @description Manages analytics fetching, chartWidth measurement, and AsyncStorage checklist persistence with encouraging toast feedback.
 * @exports useInsightsData
 */

import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchInsightsAnalyticsApi } from "../services/insightsService";
import { parseImpactAmount } from "../utils/insightsUtils";

export function useInsightsData(user, showToast) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartWidth, setChartWidth] = useState(0);
  const [checkedIds, setCheckedIds] = useState({});

  useEffect(() => {
    if (user?.id) {
      fetchAnalyticsData(false);
    }
  }, [user?.id]);

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
      const data = await fetchInsightsAnalyticsApi(user.id);
      if (data) {
        setAnalytics(data);
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

  return {
    analytics,
    loading,
    chartWidth,
    setChartWidth,
    checkedIds,
    fetchAnalyticsData,
    toggleChecklistItem,
  };
}
