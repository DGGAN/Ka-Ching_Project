/**
 * @file frontend/src/features/budget/hooks/useBudgetData.js
 * @layer Hook (State, Lifecycle & Form Submission — 100% Original Budget Logic)
 * @description Manages month selection, AI vs Custom mode, preset selection, bucket tab inspection, and budget saving.
 * @exports useBudgetData
 */

import { useState, useEffect, useMemo } from "react";
import { getSixMonthWindow } from "../../../utils/dateHelpers";
import { playUiSound } from "../../../utils/soundEffects";
import { fetchBudgetAndTransactionsApi, saveBudgetApi } from "../services/budgetService";
import { computeVisibleBudgetMonths, computeSelectedMonthBudgetMetrics } from "../utils/budgetCalculations";

export function useBudgetData(user, showToast, onBudgetUpdated) {
  const sixMonthList = useMemo(() => getSixMonthWindow(), []);
  const [selectedMonthKey, setSelectedMonthKey] = useState(sixMonthList[sixMonthList.length - 1].key);

  const [transactions, setTransactions] = useState([]);
  const [budgetHistoryMap, setBudgetHistoryMap] = useState({});
  const [activeMode, setActiveMode] = useState("smart");
  const [selectedPresetId, setSelectedPresetId] = useState("50_30_20");
  const [activeBucketTab, setActiveBucketTab] = useState("needs");
  const [showWhyReasons, setShowWhyReasons] = useState(false);
  const [showHowItWorksModal, setShowHowItWorksModal] = useState(false);

  const [monthlyLimitInput, setMonthlyLimitInput] = useState("");
  const [savingsTargetInput, setSavingsTargetInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const { txList, currentBudget, historyList } = await fetchBudgetAndTransactionsApi(user.id);
      setTransactions(txList);

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

  const visibleMonths = useMemo(
    () => computeVisibleBudgetMonths(sixMonthList, transactions, budgetHistoryMap),
    [sixMonthList, transactions, budgetHistoryMap],
  );

  const activeMonthObj = useMemo(
    () => visibleMonths.find((m) => m.key === selectedMonthKey) || visibleMonths[visibleMonths.length - 1],
    [visibleMonths, selectedMonthKey],
  );

  const metrics = useMemo(
    () =>
      computeSelectedMonthBudgetMetrics({
        transactions,
        budgetHistoryMap,
        activeMonthObj,
        selectedPresetId,
      }),
    [transactions, budgetHistoryMap, activeMonthObj, selectedPresetId],
  );

  // Auto-select AI recommended preset when transactions/income load
  useEffect(() => {
    if (metrics.aiRec?.presetId) {
      setSelectedPresetId(metrics.aiRec.presetId);
    }
  }, [transactions.length, metrics.baselineIncome]);

  const handleSaveBudget = async (limitVal, savingsVal) => {
    if (!metrics.isCurrentMonthSelected) {
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
      const savedDoc = await saveBudgetApi({
        userId: user.id,
        monthlyLimit: parsedLimit,
        savingsTarget: parsedSavings,
        month: activeMonthObj.monthNum || activeMonthObj.month + 1,
        year: activeMonthObj.year,
      });

      setBudgetHistoryMap((prev) => ({
        ...prev,
        [activeMonthObj.key]: savedDoc,
      }));
      setMonthlyLimitInput(String(parsedLimit));
      setSavingsTargetInput(String(parsedSavings));
      playUiSound("success");
      showToast("success", "Monthly budget updated!");
      if (typeof onBudgetUpdated === "function") {
        onBudgetUpdated();
      }
    } catch (error) {
      showToast("error", error.response?.data?.message || "Failed to save budget.");
    } finally {
      setSaving(false);
    }
  };

  return {
    visibleMonths,
    activeMonthObj,
    setSelectedMonthKey,
    activeMode,
    setActiveMode,
    selectedPresetId,
    setSelectedPresetId,
    activeBucketTab,
    setActiveBucketTab,
    showWhyReasons,
    setShowWhyReasons,
    showHowItWorksModal,
    setShowHowItWorksModal,
    monthlyLimitInput,
    setMonthlyLimitInput,
    savingsTargetInput,
    setSavingsTargetInput,
    loading,
    saving,
    handleSaveBudget,
    ...metrics,
  };
}
