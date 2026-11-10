/**
 * @file frontend/src/features/budget/components/BudgetProgressCard.js
 * @layer Component (Presentational UI — 100% Original Monthly Budget Status Hero Card)
 * @description Renders the Monthly Budget Status Hero Card with spent/limit numbers, progress bar, and remaining/savings footer.
 * @exports default BudgetProgressCard
 */

import React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { COLORS, SHAPES, FONTS } from "../../../theme/colors";
import WireBox from "../../../components/shared/WireBox";

export default function BudgetProgressCard({
  activeMonthObj,
  isCurrentMonthSelected = true,
  loading = false,
  activeLimit = 0,
  activeSavings = 0,
  selectedMonthSpent = 0,
  usagePct = 0,
  isOverBudget = false,
}) {
  const styles = getStyles();

  return (
    <WireBox style={styles.statusCard}>
      <View style={styles.statusHeaderRow}>
        <View>
          <Text style={styles.statusTitle}>{activeMonthObj.label.toUpperCase()} BUDGET</Text>
          <Text style={styles.statusSub}>{isCurrentMonthSelected ? "Active Monthly Plan" : "Historical Archive (Read-Only)"}</Text>
        </View>

        {activeLimit > 0 && (
          <View style={[styles.statusBadge, { backgroundColor: isOverBudget ? "#FFE4E6" : "#DCFCE7" }]}>
            <Text style={[styles.statusBadgeText, { color: isOverBudget ? "#E11D48" : "#15803D" }]}>
              {isOverBudget ? "OVER LIMIT" : `${usagePct.toFixed(0)}% USED`}
            </Text>
          </View>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 16 }} />
      ) : activeLimit > 0 ? (
        <>
          <View style={styles.MainNumbersRow}>
            <Text style={styles.spentBigText}>RM {selectedMonthSpent.toFixed(2)}</Text>
            <Text style={styles.limitMutedText}>/ RM {activeLimit.toFixed(0)} limit</Text>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${usagePct}%`,
                  backgroundColor: isOverBudget ? "#E11D48" : usagePct >= 80 ? "#F59E0B" : "#16A34A",
                },
              ]}
            />
          </View>

          <View style={styles.statusFooterRow}>
            <Text style={styles.footerMetaText}>
              {isOverBudget
                ? `Exceeded by RM ${(selectedMonthSpent - activeLimit).toFixed(2)}`
                : `RM ${(activeLimit - selectedMonthSpent).toFixed(2)} remaining`}
            </Text>
            <Text style={styles.footerMetaText}>Savings Goal: RM {activeSavings.toFixed(0)}</Text>
          </View>
        </>
      ) : (
        <Text style={styles.noBudgetText}>
          {isCurrentMonthSelected
            ? "No budget set for this month yet. Apply an AI plan below!"
            : `No budget was recorded for ${activeMonthObj.label}.`}
        </Text>
      )}
    </WireBox>
  );
}

const getStyles = () =>
  StyleSheet.create({
    statusCard: {
      marginBottom: 14,
      padding: 14,
    },
    statusHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },
    statusTitle: {
      fontFamily: FONTS.mono,
      fontSize: 11,
      fontWeight: "bold",
      color: COLORS.text,
      letterSpacing: 0.8,
    },
    statusSub: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      color: COLORS.textMuted,
      marginTop: 2,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: SHAPES.chipRadius,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    statusBadgeText: {
      fontFamily: FONTS.mono,
      fontSize: 8,
      fontWeight: "bold",
    },
    MainNumbersRow: {
      flexDirection: "row",
      alignItems: "baseline",
      gap: 6,
      marginBottom: 8,
    },
    spentBigText: {
      fontFamily: FONTS.mono,
      fontSize: 22,
      fontWeight: "bold",
      color: COLORS.text,
    },
    limitMutedText: {
      fontFamily: FONTS.mono,
      fontSize: 11,
      color: COLORS.textMuted,
    },
    progressTrack: {
      height: 10,
      borderWidth: 1.5,
      borderColor: COLORS.border,
      borderRadius: 6,
      backgroundColor: COLORS.secondary,
      overflow: "hidden",
      marginBottom: 8,
    },
    progressFill: {
      height: "100%",
    },
    statusFooterRow: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    footerMetaText: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      color: COLORS.textMuted,
      fontWeight: "bold",
    },
    noBudgetText: {
      fontFamily: FONTS.mono,
      fontSize: 9.5,
      color: COLORS.textMuted,
      paddingVertical: 8,
    },
  });
