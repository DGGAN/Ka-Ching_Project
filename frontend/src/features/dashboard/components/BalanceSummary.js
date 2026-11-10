/**
 * @file frontend/src/features/dashboard/components/BalanceSummary.js
 * @layer Component (Presentational UI — 100% Original Dashboard Hero Card Design)
 * @description Renders the Hero Card with Yellow Period Pill, Month Net Badge, All-Time Accumulated Balance, Income/Expense boxes, and embedded Budget Strip.
 * @props {object} activeMonth - Active month enriched object
 * @props {number} monthlyNet - Selected month net cashflow
 * @props {number} allTimeSavedBalance - Total accumulated savings across all history
 * @props {boolean} isAllTimeNegative - Whether all-time savings is negative
 * @props {number} activeLimit - Monthly budget limit for selected month
 * @props {number} budgetUsedPct - Budget used percentage
 * @props {boolean} isOverBudget - Whether selected month is over budget
 * @exports default BalanceSummary
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Calendar } from "lucide-react-native";
import { COLORS, SHAPES, FONTS } from "../../../theme/colors";
import IncomeExpenseSummary from "./IncomeExpenseSummary";
import SpendingOverview from "./SpendingOverview";

export default function BalanceSummary({
  activeMonth,
  monthlyNet = 0,
  allTimeSavedBalance = 0,
  isAllTimeNegative = false,
  activeLimit = 0,
  budgetUsedPct = 0,
  isOverBudget = false,
}) {
  const styles = getStyles();

  return (
    <View style={[styles.balanceHeroCard, isAllTimeNegative && styles.balanceHeroCardNegative]}>
      <View style={styles.heroHeaderRow}>
        <View style={styles.periodPill}>
          <Calendar size={10} color="#121212" strokeWidth={2.5} />
          <Text style={styles.periodPillText}>
            {activeMonth.isCurrentMonth ? `${activeMonth.label.toUpperCase()} (CURRENT MONTH)` : `PAST ARCHIVE • ${activeMonth.label.toUpperCase()}`}
          </Text>
        </View>

        <View style={styles.monthNetBadge}>
          <Text style={styles.monthNetBadgeText}>
            {activeMonth.shortMonth} Net: {monthlyNet >= 0 ? `+RM ${monthlyNet.toFixed(0)}` : `-RM ${Math.abs(monthlyNet).toFixed(0)}`}
          </Text>
        </View>
      </View>

      <Text style={styles.balanceSubLabel}>TOTAL ACCUMULATED SAVINGS (ALL-TIME)</Text>
      <Text style={styles.balanceAmount}>
        {isAllTimeNegative ? "-RM " : "RM "}
        {Math.abs(allTimeSavedBalance).toLocaleString("en-MY", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </Text>

      {/* Selected Month Income & Expenses Breakdown */}
      <IncomeExpenseSummary shortMonth={activeMonth.shortMonth} income={activeMonth.income} expense={activeMonth.expense} />

      {/* Compact 1-Line Budget Summary Strip for Selected Month */}
      <SpendingOverview
        shortMonth={activeMonth.shortMonth}
        expense={activeMonth.expense}
        activeLimit={activeLimit}
        budgetUsedPct={budgetUsedPct}
        isOverBudget={isOverBudget}
      />
    </View>
  );
}

const getStyles = () =>
  StyleSheet.create({
    balanceHeroCard: {
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      borderRadius: SHAPES.cardRadius,
      backgroundColor: COLORS.primary,
      padding: 16,
      marginBottom: 16,
      shadowColor: COLORS.text,
      shadowOffset: { width: 4, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 0,
      elevation: 4,
    },
    balanceHeroCardNegative: {
      backgroundColor: "#881337",
    },
    heroHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
      flexWrap: "wrap",
      gap: 6,
    },
    periodPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      backgroundColor: "#FEF08A",
      borderWidth: 1.5,
      borderColor: "#121212",
      borderRadius: SHAPES.chipRadius,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    periodPillText: {
      fontFamily: FONTS.mono,
      fontSize: 8,
      fontWeight: "bold",
      color: "#121212",
      letterSpacing: 0.5,
    },
    monthNetBadge: {
      backgroundColor: "rgba(0,0,0,0.28)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.4)",
      paddingHorizontal: 8,
      paddingVertical: 2.5,
      borderRadius: SHAPES.chipRadius,
    },
    monthNetBadgeText: {
      fontFamily: FONTS.mono,
      fontSize: 8,
      fontWeight: "bold",
      color: "#FFFFFF",
    },
    balanceSubLabel: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      color: COLORS.primaryText,
      opacity: 0.88,
      letterSpacing: 1.1,
      marginBottom: 2,
    },
    balanceAmount: {
      fontFamily: FONTS.mono,
      fontSize: 28,
      fontWeight: "bold",
      color: COLORS.primaryText,
      marginBottom: 12,
    },
  });
