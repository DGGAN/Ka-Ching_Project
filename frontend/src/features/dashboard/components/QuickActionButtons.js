/**
 * @file frontend/src/features/dashboard/components/QuickActionButtons.js
 * @layer Component (Presentational UI)
 * @description Quick shortcut pills for jumping to Full History or Budget Setup.
 * @props {function} onNavigateToTransactions - Navigates to TransactionsScreen
 * @props {function} onNavigateToBudget - Navigates to BudgetScreen
 * @exports default QuickActionButtons
 */

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { ListFilter, Target } from "lucide-react-native";
import { COLORS, SHAPES, FONTS } from "../../../theme/colors";

export default function QuickActionButtons({ onNavigateToTransactions, onNavigateToBudget }) {
  const styles = getStyles();

  return (
    <View style={styles.row}>
      <TouchableOpacity style={styles.btn} onPress={onNavigateToTransactions}>
        <ListFilter size={13} color={COLORS.text} />
        <Text style={styles.btnText}>VIEW FULL HISTORY</Text>
      </TouchableOpacity>

      {onNavigateToBudget && (
        <TouchableOpacity style={styles.btn} onPress={onNavigateToBudget}>
          <Target size={13} color={COLORS.text} />
          <Text style={styles.btnText}>MANAGE BUDGET</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const getStyles = () =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      gap: 8,
      marginTop: 4,
    },
    btn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      borderWidth: 1.5,
      borderColor: COLORS.border,
      borderRadius: SHAPES.buttonRadius,
      backgroundColor: COLORS.secondary,
      paddingVertical: 9,
    },
    btnText: {
      fontFamily: FONTS.mono,
      fontSize: 9,
      fontWeight: "bold",
      color: COLORS.text,
    },
  });
