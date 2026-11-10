/**
 * @file frontend/src/features/budget/components/BudgetCategoryBreakdown.js
 * @layer Component (Presentational UI — 100% Original 3-Bucket Interactive Drawer)
 * @description Renders the 3 interactive bucket pills (Needs, Wants, Save) and the detailed category progress bars or Savings Formula Card.
 * @exports default BudgetCategoryBreakdown
 */

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { PiggyBank } from "lucide-react-native";
import { COLORS, SHAPES, FONTS } from "../../../theme/colors";
import { playUiSound } from "../../../utils/soundEffects";
import CategoryBadge from "../../../components/shared/CategoryBadge";

export default function BudgetCategoryBreakdown({
  activePreset,
  needsCap = 0,
  wantsCap = 0,
  saveGoal = 0,
  actualNeedsSpent = 0,
  actualWantsSpent = 0,
  projectedNetSavings = 0,
  savingsProgressPct = 0,
  baselineIncome = 3000,
  selectedMonthSpent = 0,
  needsCategoryList = [],
  wantsCategoryList = [],
  activeBucketTab = "needs",
  onSelectBucketTab,
  activeMonthLabel = "",
  sectionTitle = "TAP ANY BUCKET TO INSPECT CATEGORIES",
}) {
  const styles = getStyles();

  const activeCap = activeBucketTab === "needs" ? needsCap : activeBucketTab === "wants" ? wantsCap : saveGoal;
  const activeSpent = activeBucketTab === "needs" ? actualNeedsSpent : activeBucketTab === "wants" ? actualWantsSpent : projectedNetSavings;
  const bucketProgressPct = activeCap > 0 ? Math.min(100, Math.round((activeSpent / activeCap) * 100)) : 0;
  const activeCategoryRows = activeBucketTab === "needs" ? needsCategoryList : wantsCategoryList;

  return (
    <View style={{ marginTop: 4 }}>
      <Text style={styles.tapBucketHint}>{sectionTitle}</Text>

      {/* 3-Column Interactive Bucket Row */}
      <View style={styles.bucketRow}>
        <TouchableOpacity
          style={[styles.bucketPill, activeBucketTab === "needs" && styles.bucketPillActive]}
          onPress={() => {
            playUiSound("tab");
            onSelectBucketTab("needs");
          }}
        >
          <Text style={styles.bucketTitle}>Needs ({activePreset.needsPct}%)</Text>
          <Text style={styles.bucketAmount}>RM {needsCap}</Text>
          <Text style={styles.bucketSpentSub}>Spent: RM {actualNeedsSpent.toFixed(0)}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.bucketPill, activeBucketTab === "wants" && styles.bucketPillActive]}
          onPress={() => {
            playUiSound("tab");
            onSelectBucketTab("wants");
          }}
        >
          <Text style={styles.bucketTitle}>Wants ({activePreset.wantsPct}%)</Text>
          <Text style={styles.bucketAmount}>RM {wantsCap}</Text>
          <Text style={styles.bucketSpentSub}>Spent: RM {actualWantsSpent.toFixed(0)}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.bucketPill, activeBucketTab === "savings" && styles.bucketPillActive]}
          onPress={() => {
            playUiSound("tab");
            onSelectBucketTab("savings");
          }}
        >
          <Text style={styles.bucketTitle}>Save ({activePreset.savingsPct}%)</Text>
          <Text style={[styles.bucketAmount, { color: "#15803D" }]}>RM {saveGoal}</Text>
          <Text style={styles.bucketSpentSub}>Est: RM {projectedNetSavings.toFixed(0)}</Text>
        </TouchableOpacity>
      </View>

      {/* Detailed Drawer for the Selected Bucket */}
      <View style={styles.bucketDetailBox}>
        {activeBucketTab === "savings" ? (
          /* SAVINGS BUCKET VIEW: Clear Income - Spent = Projected Savings Tracker */
          <View>
            <View style={styles.bucketProgressHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <PiggyBank size={14} color="#15803D" strokeWidth={2.5} />
                <Text style={styles.bucketDetailTitle}>SAVINGS GOAL PROGRESS ({savingsProgressPct}%)</Text>
              </View>
              <Text style={[styles.bucketProgressRatio, { color: "#15803D" }]}>
                RM {projectedNetSavings.toFixed(0)} / RM {saveGoal}
              </Text>
            </View>

            <View style={styles.progressTrackSmall}>
              <View
                style={[
                  styles.progressFillSmall,
                  {
                    width: `${savingsProgressPct}%`,
                    backgroundColor: "#16A34A",
                  },
                ]}
              />
            </View>

            <View style={styles.savingsFormulaCard}>
              <View style={styles.savingsFormulaRow}>
                <Text style={styles.savingsFormulaLabel}>Baseline Monthly Income</Text>
                <Text style={styles.savingsFormulaVal}>+RM {baselineIncome.toFixed(2)}</Text>
              </View>
              <View style={styles.savingsFormulaRow}>
                <Text style={styles.savingsFormulaLabel}>Less: Total Expenses So Far</Text>
                <Text style={[styles.savingsFormulaVal, { color: "#E11D48" }]}>-RM {selectedMonthSpent.toFixed(2)}</Text>
              </View>
              <View
                style={[
                  styles.savingsFormulaRow,
                  {
                    borderTopWidth: 1,
                    borderColor: COLORS.borderMuted,
                    paddingTop: 6,
                    marginTop: 4,
                  },
                ]}
              >
                <Text style={[styles.savingsFormulaLabel, { fontWeight: "bold", color: COLORS.text }]}>Projected Month-End Savings</Text>
                <Text style={[styles.savingsFormulaVal, { color: "#15803D", fontSize: 10.5 }]}>RM {projectedNetSavings.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        ) : (
          /* NEEDS OR WANTS BUCKET VIEW: Bucket Progress Bar + Non-Zero Category Rows */
          <View>
            <View style={styles.bucketProgressHeader}>
              <Text style={styles.bucketDetailTitle}>
                {activeBucketTab === "needs" ? "ESSENTIAL NEEDS SPENT" : "LIFESTYLE WANTS SPENT"} ({bucketProgressPct}%)
              </Text>
              <Text style={styles.bucketProgressRatio}>
                RM {activeSpent.toFixed(2)} / RM {activeCap}
              </Text>
            </View>

            <View style={styles.progressTrackSmall}>
              <View
                style={[
                  styles.progressFillSmall,
                  {
                    width: `${bucketProgressPct}%`,
                    backgroundColor: activeSpent > activeCap ? "#E11D48" : COLORS.primary,
                  },
                ]}
              />
            </View>

            {activeCategoryRows.length === 0 ? (
              <Text style={styles.emptyBucketCatText}>
                No {activeBucketTab === "needs" ? "essential (Needs)" : "discretionary (Wants)"} expenses recorded in {activeMonthLabel} yet.
              </Text>
            ) : (
              <View style={{ gap: 8, marginTop: 8 }}>
                {activeCategoryRows.map((cat) => (
                  <View key={cat.catKey} style={styles.catBreakRow}>
                    <CategoryBadge category={cat.catKey} size={26} iconSize={13} />
                    <View style={{ flex: 1 }}>
                      <View style={styles.catBreakLabelRow}>
                        <Text style={styles.catBreakName}>{cat.label}</Text>
                        <Text style={styles.catBreakAmt}>
                          RM {cat.spent.toFixed(2)} ({cat.sharePct}%)
                        </Text>
                      </View>
                      <View style={styles.catMiniTrack}>
                        <View
                          style={[
                            styles.catMiniFill,
                            {
                              width: `${Math.max(6, cat.sharePct)}%`,
                              backgroundColor: cat.color,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const getStyles = () =>
  StyleSheet.create({
    tapBucketHint: {
      fontFamily: FONTS.mono,
      fontSize: 7.5,
      fontWeight: "bold",
      color: COLORS.textMuted,
      marginBottom: 6,
      letterSpacing: 0.4,
    },
    bucketRow: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 8,
    },
    bucketPill: {
      flex: 1,
      borderWidth: 1.5,
      borderColor: COLORS.borderMuted,
      borderRadius: SHAPES.inputRadius,
      backgroundColor: COLORS.card,
      paddingVertical: 8,
      paddingHorizontal: 6,
      alignItems: "center",
    },
    bucketPillActive: {
      borderColor: COLORS.primary,
      backgroundColor: COLORS.secondary,
    },
    bucketTitle: {
      fontFamily: FONTS.mono,
      fontSize: 8,
      color: COLORS.textMuted,
      fontWeight: "bold",
    },
    bucketAmount: {
      fontFamily: FONTS.mono,
      fontSize: 11,
      fontWeight: "bold",
      color: COLORS.text,
      marginTop: 2,
    },
    bucketSpentSub: {
      fontFamily: FONTS.mono,
      fontSize: 7.5,
      color: COLORS.textMuted,
      marginTop: 2,
    },
    bucketDetailBox: {
      borderWidth: 1,
      borderColor: COLORS.borderMuted,
      borderStyle: "dashed",
      borderRadius: SHAPES.inputRadius,
      backgroundColor: COLORS.inputBg,
      padding: 10,
    },
    bucketProgressHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 5,
    },
    bucketDetailTitle: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      fontWeight: "bold",
      color: COLORS.text,
    },
    bucketProgressRatio: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      fontWeight: "bold",
      color: COLORS.primary,
    },
    progressTrackSmall: {
      height: 7,
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: 4,
      backgroundColor: COLORS.card,
      overflow: "hidden",
      marginBottom: 6,
    },
    progressFillSmall: {
      height: "100%",
    },
    emptyBucketCatText: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      color: COLORS.textMuted,
      textAlign: "center",
      paddingVertical: 8,
    },
    catBreakRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    catBreakLabelRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 3,
    },
    catBreakName: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      fontWeight: "bold",
      color: COLORS.text,
    },
    catBreakAmt: {
      fontFamily: FONTS.mono,
      fontSize: 8,
      color: COLORS.textMuted,
      fontWeight: "bold",
    },
    catMiniTrack: {
      height: 5,
      borderRadius: 3,
      backgroundColor: COLORS.secondary,
      overflow: "hidden",
    },
    catMiniFill: {
      height: "100%",
    },
    savingsFormulaCard: {
      borderWidth: 1,
      borderColor: COLORS.borderMuted,
      borderRadius: SHAPES.inputRadius,
      backgroundColor: COLORS.card,
      padding: 8,
      marginTop: 4,
      gap: 4,
    },
    savingsFormulaRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    savingsFormulaLabel: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      color: COLORS.textMuted,
    },
    savingsFormulaVal: {
      fontFamily: FONTS.mono,
      fontSize: 9,
      fontWeight: "bold",
      color: COLORS.text,
    },
  });
