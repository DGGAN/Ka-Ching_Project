/**
 * @file frontend/src/features/budget/hooks/useBudgetData.js
 * @layer Hook (State, Month Filtering & Per-Month Setup Resolution)
 * @description Filters visibleMonths so ONLY the Current Month and past months that actually have a saved budget are shown. Resolves each month's exact saved preset setup.
 * @exports useBudgetData
 */

import { useState, useEffect } from "react";
import { getSixMonthWindow } from "../../../utils/dateHelpers";
import { playUiSound } from "../../../utils/soundEffects";
import { fetchBudgetData, saveMonthlyBudget } from "../services/budgetService";
import { BUDGET_PRESETS, computeBudgetRecommendation } from "../utils/budgetRecommendations";
import { calculateMonthlySpending, getNonZeroBucketCategories } from "../utils/budgetCalculations";

export function useBudgetData(user, showToast) {
  const sixMonthList = getSixMonthWindow();
  const currentMonthKey = sixMonthList[sixMonthList.length - 1].key;
  const [selectedMonthKey, setSelectedMonthKey] = useState(currentMonthKey);

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
      loadBudgetAndTransactions();
    }
  }, [user?.id]);

  const loadBudgetAndTransactions = async () => {
    try {
      setLoading(true);
      const { transactions: txList, currentBudget, historyList } = await fetchBudgetData(user.id);
      setTransactions(txList);

      const map = {};
      (historyList || []).forEach((b) => {
        if (b.year && b.month && Number(b.monthlyLimit) > 0) {
          const k = `${b.year}-${String(b.month).padStart(2, "0")}`;
          map[k] = b;
        }
      });

      if (currentBudget && Number(currentBudget.monthlyLimit) > 0) {
        const cYear = currentBudget.year || new Date().getFullYear();
        const cMonth = currentBudget.month || new Date().getMonth() + 1;
        const cKey = `${cYear}-${String(cMonth).padStart(2, "0")}`;
        map[cKey] = currentBudget;

        setMonthlyLimitInput(String(currentBudget.monthlyLimit || ""));
        setSavingsTargetInput(String(currentBudget.savingsTarget || ""));
        if (currentBudget.presetId && currentBudget.presetId !== "CUSTOM") {
          setSelectedPresetId(currentBudget.presetId);
        }
      }

      setBudgetHistoryMap(map);
    } catch (error) {
      console.log("Failed to load budget data:", error.message);
    } finally {
      setLoading(false);
    }
  };

  // STRICT RULE: Only show the Current Month + Past Months that ACTUALLY have a saved budget
  const visibleMonths = sixMonthList.filter(
    (m) => m.isCurrentMonth || m.isCurrent || Boolean(budgetHistoryMap[m.key] && Number(budgetHistoryMap[m.key].monthlyLimit) > 0),
  );

  const activeMonthObj =
    visibleMonths.find((m) => m.key === selectedMonthKey) || visibleMonths[visibleMonths.length - 1] || sixMonthList[sixMonthList.length - 1];

  const isCurrentMonthSelected = Boolean(activeMonthObj.isCurrentMonth || activeMonthObj.isCurrent);

  // Compute selected month's income, total spent, and per-category expenses
  const { selectedMonthSpent, selectedMonthIncome, actualNeedsSpent, actualWantsSpent, categorySpendMap } = calculateMonthlySpending(
    transactions,
    activeMonthObj,
  );

  const baselineIncome = selectedMonthIncome > 0 ? selectedMonthIncome : 3000;

  // Compute AI Recommendation for current month
  const aiRec = computeBudgetRecommendation(transactions, baselineIncome);
  useEffect(() => {
    const currentSaved = budgetHistoryMap[currentMonthKey];
    if (!currentSaved && aiRec?.presetId) {
      setSelectedPresetId(aiRec.presetId);
    }
  }, [transactions.length, baselineIncome]);

  // Strict per-month budget lookup
  const savedBudgetForMonth = budgetHistoryMap[activeMonthObj.key] || null;

  const currentSelectedPreset = BUDGET_PRESETS.find((p) => p.id === selectedPresetId) || BUDGET_PRESETS[0];

  const activePreset =
    !isCurrentMonthSelected && savedBudgetForMonth
      ? {
          id: savedBudgetForMonth.presetId || "50_30_20",
          name: savedBudgetForMonth.presetName || "Saved Plan",
          ratioLabel: `${savedBudgetForMonth.needsPct || 50} / ${savedBudgetForMonth.wantsPct || 30} / ${savedBudgetForMonth.savingsPct || 20}`,
          needsPct: savedBudgetForMonth.needsPct || 50,
          wantsPct: savedBudgetForMonth.wantsPct || 30,
          savingsPct: savedBudgetForMonth.savingsPct || 20,
        }
      : currentSelectedPreset;

  const needsAllowance = Math.round((baselineIncome * activePreset.needsPct) / 100);
  const wantsAllowance = Math.round((baselineIncome * activePreset.wantsPct) / 100);
  const recommendedLimit = needsAllowance + wantsAllowance;
  const recommendedSavings = Math.round((baselineIncome * activePreset.savingsPct) / 100);

  const activeLimit = savedBudgetForMonth?.monthlyLimit || 0;
  const activeSavings = savedBudgetForMonth?.savingsTarget || 0;
  const usagePct = activeLimit > 0 ? Math.min(100, (selectedMonthSpent / activeLimit) * 100) : 0;
  const isOverBudget = activeLimit > 0 && selectedMonthSpent > activeLimit;

  const projectedNetSavings = Math.max(0, baselineIncome - selectedMonthSpent);
  const targetSavingsGoal = activeSavings > 0 ? activeSavings : recommendedSavings;
  const savingsProgressPct = targetSavingsGoal > 0 ? Math.min(100, Math.round((projectedNetSavings / targetSavingsGoal) * 100)) : 0;

  const needsCategoryList = getNonZeroBucketCategories("needs", actualNeedsSpent, categorySpendMap);
  const wantsCategoryList = getNonZeroBucketCategories("wants", actualWantsSpent, categorySpendMap);

  const handleSaveBudget = async (limitVal, savingsVal, isCustomMode = false) => {
    if (!isCurrentMonthSelected) {
      showToast("error", "Past months are read-only.");
      return;
    }

    const parsedLimit = Number(limitVal);
    const parsedSavings = Number(savingsVal || 0);

    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      showToast("error", "Enter a valid spending limit > RM 0.");
      return;
    }

    const totalPlanPool = parsedLimit + parsedSavings;
    const customSavingsPct = totalPlanPool > 0 ? Math.round((parsedSavings / totalPlanPool) * 100) : 20;
    const customNeedsPct = Math.round((100 - customSavingsPct) * 0.625);
    const customWantsPct = Math.max(0, 100 - customSavingsPct - customNeedsPct);

    const payload = {
      userId: user.id,
      monthlyLimit: parsedLimit,
      savingsTarget: parsedSavings,
      month: activeMonthObj.monthNum,
      year: activeMonthObj.year,
      presetId: isCustomMode ? "CUSTOM" : currentSelectedPreset.id,
      presetName: isCustomMode ? "Custom Plan" : currentSelectedPreset.name,
      needsPct: isCustomMode ? customNeedsPct : currentSelectedPreset.needsPct,
      wantsPct: isCustomMode ? customWantsPct : currentSelectedPreset.wantsPct,
      savingsPct: isCustomMode ? customSavingsPct : currentSelectedPreset.savingsPct,
    };

    try {
      setSaving(true);
      const savedDoc = await saveMonthlyBudget(payload);

      setBudgetHistoryMap((prev) => ({
        ...prev,
        [activeMonthObj.key]: savedDoc || payload,
      }));
      setMonthlyLimitInput(String(parsedLimit));
      setSavingsTargetInput(String(parsedSavings));
      playUiSound("success");
      showToast("success", "Monthly budget updated!");
    } catch (error) {
      showToast("error", error.response?.data?.message || "Failed to save budget.");
    } finally {
      setSaving(false);
    }
  };

  return {
    visibleMonths,
    activeMonthObj,
    isCurrentMonthSelected,
    selectedMonthKey,
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
    selectedMonthSpent,
    selectedMonthIncome,
    actualNeedsSpent,
    actualWantsSpent,
    baselineIncome,
    aiRec,
    activePreset,
    savedBudgetForMonth,
    needsAllowance,
    wantsAllowance,
    recommendedLimit,
    recommendedSavings,
    activeLimit,
    activeSavings,
    usagePct,
    isOverBudget,
    projectedNetSavings,
    savingsProgressPct,
    needsCategoryList,
    wantsCategoryList,
    handleSaveBudget,
  };
}
