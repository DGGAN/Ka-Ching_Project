/**
 * @file frontend/src/features/dashboard/components/IncomeExpenseSummary.js
 * @layer Component (Presentational UI — 100% Original Dashboard Design)
 * @description Renders the Selected Month Income & Expenses Breakdown boxes inside the Hero Card.
 * @props {string} shortMonth - Short month label (e.g., "Nov")
 * @props {number} income - Selected month income
 * @props {number} expense - Selected month expense
 * @exports default IncomeExpenseSummary
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, SHAPES, FONTS } from "../../../theme/colors";

export default function IncomeExpenseSummary({ shortMonth = "", income = 0, expense = 0 }) {
  const styles = getStyles();

  return (
    <View style={styles.incomeExpenseRow}>
      <View style={styles.ieBox}>
        <View style={styles.ieTitleRow}>
          <View style={[styles.dotIndicator, { backgroundColor: "#4ADE80" }]} />
          <Text style={styles.ieLabel}>{shortMonth.toUpperCase()} INCOME</Text>
        </View>
        <Text style={styles.ieValueGreen}>+RM {income.toFixed(2)}</Text>
      </View>

      <View style={styles.ieBox}>
        <View style={styles.ieTitleRow}>
          <View style={[styles.dotIndicator, { backgroundColor: "#FB7185" }]} />
          <Text style={styles.ieLabel}>{shortMonth.toUpperCase()} EXPENSES</Text>
        </View>
        <Text style={styles.ieValueRed}>-RM {expense.toFixed(2)}</Text>
      </View>
    </View>
  );
}

const getStyles = () =>
  StyleSheet.create({
    incomeExpenseRow: {
      flexDirection: "row",
      gap: 10,
    },
    ieBox: {
      flex: 1,
      borderWidth: 1.5,
      borderColor: "rgba(255,255,255,0.35)",
      borderRadius: SHAPES.inputRadius,
      backgroundColor: "rgba(0,0,0,0.22)",
      padding: 10,
    },
    ieTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 4,
    },
    dotIndicator: {
      width: 7,
      height: 7,
      borderRadius: 4,
    },
    ieLabel: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      color: COLORS.primaryText,
      opacity: 0.88,
    },
    ieValueGreen: {
      fontFamily: FONTS.mono,
      fontSize: 13,
      fontWeight: "bold",
      color: "#86EFAC",
    },
    ieValueRed: {
      fontFamily: FONTS.mono,
      fontSize: 13,
      fontWeight: "bold",
      color: "#FDA4AF",
    },
  });
