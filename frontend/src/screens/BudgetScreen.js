/**
 * @file frontend/src/screens/BudgetScreen.js
 * @layer Screen (Top-Level Page Skeleton)
 * @description Assembles the Monthly Budget Planner screen with Current-First month bar, saved historical setup inspection, and concise preset apply button.
 * @exports default BudgetScreen
 */

import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { Sparkles, Sliders, Lock } from "lucide-react-native";
import { COLORS, SHAPES, FONTS } from "../theme/colors";
import { playUiSound } from "../utils/soundEffects";
import WireBox from "../components/shared/WireBox";
import WireInput from "../components/shared/WireInput";
import WireButton from "../components/shared/WireButton";
import FloatingToast from "../components/shared/FloatingToast";
import { useFloatingToast } from "../components/shared/useFloatingToast";

import { useBudgetData } from "../features/budget/hooks/useBudgetData";
import BudgetMonthSelector from "../features/budget/components/BudgetMonthSelector";
import BudgetProgressCard from "../features/budget/components/BudgetProgressCard";
import BudgetPresetSelector from "../features/budget/components/BudgetPresetSelector";
import BudgetCategoryBreakdown from "../features/budget/components/BudgetCategoryBreakdown";
import BudgetHowItWorksModal from "../features/budget/components/BudgetHowItWorksModal";

export default function BudgetScreen({ user, onBudgetUpdated }) {
  const styles = getStyles();
  const { toast, slideAnim, showToast } = useFloatingToast();

  const {
    visibleMonths,
    activeMonthObj,
    isCurrentMonthSelected,
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
    actualNeedsSpent,
    actualWantsSpent,
    baselineIncome,
    aiRec,
    activePreset,
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
  } = useBudgetData(user, showToast);

  const safePresetName = (activePreset?.name || "BALANCED").toUpperCase();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.background,
        position: "relative",
      }}
    >
      <FloatingToast toast={toast} slideAnim={slideAnim} />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* 1. Month Selector Bar */}
        <BudgetMonthSelector visibleMonths={visibleMonths} activeMonthObj={activeMonthObj} onSelectMonth={setSelectedMonthKey} />

        {/* 2. Monthly Budget Status Hero Card */}
        <BudgetProgressCard
          activeMonthObj={activeMonthObj}
          isCurrentMonthSelected={isCurrentMonthSelected}
          loading={loading}
          activeLimit={activeLimit}
          activeSavings={activeSavings}
          selectedMonthSpent={selectedMonthSpent}
          usagePct={usagePct}
          isOverBudget={isOverBudget}
        />

        {/* 3. Current Month Controls vs Past Month Archive Breakdown */}
        {!isCurrentMonthSelected ? (
          <WireBox style={styles.lockedArchiveCard}>
            <View style={styles.lockedTitleRow}>
              <Lock size={15} color={COLORS.primary} strokeWidth={2.5} />
              <Text style={styles.lockedTitle}>{(activeMonthObj?.label || "").toUpperCase()} SAVED SETUP (READ-ONLY)</Text>
            </View>

            {/* Clear Historical Setup Summary Banner */}
            <View style={styles.archiveSetupSummaryBox}>
              <Text style={styles.archiveSetupText}>
                SAVED PLAN: {activePreset?.name?.toUpperCase()} ({activePreset?.ratioLabel}) • LIMIT: RM {Number(activeLimit).toFixed(0)} • SAVE GOAL:
                RM {Number(activeSavings).toFixed(0)}
              </Text>
            </View>

            <Text style={styles.lockedSub}>Past months preserve the exact budget setup and category breakdown recorded at that time:</Text>

            <BudgetCategoryBreakdown
              activePreset={activePreset}
              activeBucketTab={activeBucketTab}
              onSelectBucketTab={setActiveBucketTab}
              setActiveBucketTab={setActiveBucketTab}
              needsCap={
                activeLimit > 0
                  ? Math.round((activeLimit * (activePreset?.needsPct || 50)) / ((activePreset?.needsPct || 50) + (activePreset?.wantsPct || 30)))
                  : needsAllowance
              }
              wantsCap={
                activeLimit > 0
                  ? Math.round((activeLimit * (activePreset?.wantsPct || 30)) / ((activePreset?.needsPct || 50) + (activePreset?.wantsPct || 30)))
                  : wantsAllowance
              }
              saveGoal={activeSavings > 0 ? activeSavings : recommendedSavings}
              actualNeedsSpent={actualNeedsSpent}
              actualWantsSpent={actualWantsSpent}
              projectedNetSavings={projectedNetSavings}
              savingsProgressPct={savingsProgressPct}
              baselineIncome={baselineIncome}
              selectedMonthSpent={selectedMonthSpent}
              needsCategoryList={needsCategoryList}
              wantsCategoryList={wantsCategoryList}
              activeMonthLabel={activeMonthObj?.label || ""}
              sectionTitle={`TAP ANY BUCKET TO INSPECT ${(activeMonthObj?.shortMonth || "MONTH").toUpperCase()} SPENDING`}
            />
          </WireBox>
        ) : (
          <>
            <View style={styles.modeTabsRow}>
              <TouchableOpacity
                style={[styles.modeTabBtn, activeMode === "smart" && styles.modeTabBtnActive]}
                onPress={() => {
                  playUiSound("tab");
                  setActiveMode("smart");
                }}
              >
                <Sparkles size={13} color={activeMode === "smart" ? COLORS.primaryText : COLORS.text} strokeWidth={2.5} />
                <Text style={[styles.modeTabText, activeMode === "smart" && styles.modeTabTextActive]}>AI SMART PLAN</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeTabBtn, activeMode === "custom" && styles.modeTabBtnActive]}
                onPress={() => {
                  playUiSound("tab");
                  setActiveMode("custom");
                }}
              >
                <Sliders size={13} color={activeMode === "custom" ? COLORS.primaryText : COLORS.text} strokeWidth={2.5} />
                <Text style={[styles.modeTabText, activeMode === "custom" && styles.modeTabTextActive]}>CUSTOM BUDGET</Text>
              </TouchableOpacity>
            </View>

            {activeMode === "smart" ? (
              <WireBox style={styles.plannerCard}>
                <BudgetPresetSelector
                  baselineIncome={baselineIncome}
                  selectedPresetId={selectedPresetId}
                  onSelectPreset={setSelectedPresetId}
                  aiRec={aiRec}
                  showWhyReasons={showWhyReasons}
                  onToggleWhyReasons={() => setShowWhyReasons(!showWhyReasons)}
                  onOpenHowItWorks={() => setShowHowItWorksModal(true)}
                />

                <BudgetCategoryBreakdown
                  activePreset={activePreset}
                  activeBucketTab={activeBucketTab}
                  onSelectBucketTab={setActiveBucketTab}
                  setActiveBucketTab={setActiveBucketTab}
                  needsCap={needsAllowance}
                  wantsCap={wantsAllowance}
                  saveGoal={recommendedSavings}
                  actualNeedsSpent={actualNeedsSpent}
                  actualWantsSpent={actualWantsSpent}
                  projectedNetSavings={projectedNetSavings}
                  savingsProgressPct={savingsProgressPct}
                  baselineIncome={baselineIncome}
                  selectedMonthSpent={selectedMonthSpent}
                  needsCategoryList={needsCategoryList}
                  wantsCategoryList={wantsCategoryList}
                  activeMonthLabel={activeMonthObj?.label || ""}
                />

                <WireButton
                  label={saving ? "APPLYING..." : `APPLY ${safePresetName} PLAN`}
                  onPress={async () => {
                    await handleSaveBudget(recommendedLimit, recommendedSavings, false);
                    if (onBudgetUpdated) onBudgetUpdated();
                  }}
                  disabled={saving}
                  style={{ marginTop: 12 }}
                />
              </WireBox>
            ) : (
              <WireBox style={styles.plannerCard}>
                <Text style={styles.plannerTitle}>CUSTOM MONTHLY TARGETS</Text>
                <Text style={[styles.plannerSub, { marginBottom: 12 }]}>Set your own monthly spending limit and savings target</Text>

                <WireInput
                  label="MONTHLY SPENDING LIMIT (RM)"
                  value={monthlyLimitInput}
                  onChangeText={setMonthlyLimitInput}
                  placeholder="e.g. 2400"
                  keyboardType="numeric"
                />

                <WireInput
                  label="MONTHLY SAVINGS GOAL (RM)"
                  value={savingsTargetInput}
                  onChangeText={setSavingsTargetInput}
                  placeholder="e.g. 600"
                  keyboardType="numeric"
                />

                <WireButton
                  label={saving ? "SAVING..." : "SAVE CUSTOM BUDGET"}
                  onPress={async () => {
                    await handleSaveBudget(monthlyLimitInput, savingsTargetInput, true);
                    if (onBudgetUpdated) onBudgetUpdated();
                  }}
                  disabled={saving}
                />
              </WireBox>
            )}
          </>
        )}

        {/* 4. Modal: "HOW SMART BUDGETING WORKS" */}
        <BudgetHowItWorksModal visible={showHowItWorksModal} onClose={() => setShowHowItWorksModal(false)} />
      </ScrollView>
    </View>
  );
}

const getStyles = () =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 36,
    },
    modeTabsRow: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 12,
    },
    modeTabBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      borderRadius: SHAPES.buttonRadius,
      backgroundColor: COLORS.card,
      paddingVertical: 10,
    },
    modeTabBtnActive: {
      backgroundColor: COLORS.primary,
    },
    modeTabText: {
      fontFamily: FONTS.mono,
      fontSize: 9.5,
      fontWeight: "bold",
      color: COLORS.text,
    },
    modeTabTextActive: {
      color: COLORS.primaryText,
    },
    plannerCard: {
      padding: 14,
    },
    plannerTitle: {
      fontFamily: FONTS.mono,
      fontSize: 10.5,
      fontWeight: "bold",
      color: COLORS.text,
    },
    plannerSub: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      color: COLORS.textMuted,
      marginTop: 2,
    },
    lockedArchiveCard: {
      padding: 14,
      backgroundColor: COLORS.card,
    },
    lockedTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 6,
    },
    lockedTitle: {
      fontFamily: FONTS.mono,
      fontSize: 10.5,
      fontWeight: "bold",
      color: COLORS.text,
    },
    archiveSetupSummaryBox: {
      borderWidth: 1.2,
      borderColor: COLORS.primary,
      borderRadius: SHAPES.inputRadius,
      backgroundColor: COLORS.secondary,
      paddingHorizontal: 10,
      paddingVertical: 7,
      marginBottom: 8,
    },
    archiveSetupText: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      fontWeight: "bold",
      color: COLORS.text,
    },
    lockedSub: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      color: COLORS.textMuted,
      lineHeight: 13,
      marginBottom: 10,
    },
  });
