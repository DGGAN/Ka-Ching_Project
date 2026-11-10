/**
 * @file frontend/src/features/dashboard/components/SpendingOverview.js
 * @layer Component (Presentational UI — 100% Original Dashboard Design)
 * @description Renders the Compact 1-Line Budget Summary Strip embedded inside the bottom of the Hero Card.
 * @props {string} shortMonth - Short month label (e.g., "Nov")
 * @props {number} expense - Selected month expense
 * @props {number} activeLimit - Selected month budget limit
 * @props {number} budgetUsedPct - Percentage of budget used
 * @props {boolean} isOverBudget - Whether expense exceeds activeLimit
 * @exports default SpendingOverview
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Wallet } from "lucide-react-native";
import { FONTS } from "../../../theme/colors";

export default function SpendingOverview({ shortMonth = "", expense = 0, activeLimit = 0, budgetUsedPct = 0, isOverBudget = false }) {
  const styles = getStyles();
  if (activeLimit <= 0) return null;

  return (
    <View style={styles.budgetSummaryStrip}>
      <View style={styles.budgetStripTopRow}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <Wallet size={11} color="#FFFFFF" strokeWidth={2.3} />
          <Text style={styles.budgetStripTitle}>
            {shortMonth.toUpperCase()} BUDGET: RM {expense.toFixed(0)} / RM {activeLimit.toFixed(0)}
          </Text>
        </View>
        <Text style={[styles.budgetStripStatus, { color: isOverBudget ? "#FECDD3" : "#A7F3D0" }]}>
          {isOverBudget
            ? `Over by RM ${(expense - activeLimit).toFixed(0)}`
            : `${budgetUsedPct}% Used • RM ${(activeLimit - expense).toFixed(0)} Left`}
        </Text>
      </View>

      <View style={styles.budgetStripTrack}>
        <View
          style={[
            styles.budgetStripFill,
            {
              width: `${Math.min(100, budgetUsedPct)}%`,
              backgroundColor: isOverBudget ? "#FB7185" : "#4ADE80",
            },
          ]}
        />
      </View>
    </View>
  );
}

const getStyles = () =>
  StyleSheet.create({
    budgetSummaryStrip: {
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth: 1,
      borderColor: "rgba(255,255,255,0.3)",
      borderStyle: "dashed",
    },
    budgetStripTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 5,
    },
    budgetStripTitle: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      fontWeight: "bold",
      color: "#FFFFFF",
    },
    budgetStripStatus: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      fontWeight: "bold",
    },
    budgetStripTrack: {
      width: "100%",
      height: 5,
      backgroundColor: "rgba(0,0,0,0.28)",
      borderRadius: 3,
      overflow: "hidden",
    },
    budgetStripFill: {
      height: "100%",
      borderRadius: 3,
    },
  });
