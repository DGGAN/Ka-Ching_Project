/**
 * @file frontend/src/features/budget/components/BudgetMonthSelector.js
 * @layer Component (Presentational UI)
 * @description Renders the horizontal month selector bar with Current Month FIRST on the left ("• Nov 2026") and past months with saved budgets to the right.
 * @exports default BudgetMonthSelector
 */

import React from "react";
import { ScrollView, TouchableOpacity, Text, StyleSheet } from "react-native";
import { COLORS, SHAPES, FONTS } from "../../../theme/colors";
import { playUiSound } from "../../../utils/soundEffects";

export default function BudgetMonthSelector({ visibleMonths = [], activeMonthObj, onSelectMonth }) {
  const styles = getStyles();

  // Reverse so Current Month is always FIRST on the left
  const orderedMonths = [...visibleMonths].reverse();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.monthBar}>
      {orderedMonths.map((m) => {
        const isSelected = m.key === activeMonthObj?.key;
        const isCurrent = Boolean(m.isCurrentMonth || m.isCurrent);
        const baseLabel = m.label || m.shortMonth || m.key;
        const displayLabel = isCurrent ? `• ${baseLabel}` : baseLabel;

        return (
          <TouchableOpacity
            key={m.key}
            style={[styles.monthChip, isSelected && styles.monthChipActive]}
            onPress={() => {
              playUiSound("tab");
              if (onSelectMonth) onSelectMonth(m.key);
            }}
          >
            <Text style={[styles.monthChipText, isSelected && styles.monthChipTextActive]}>{displayLabel}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const getStyles = () =>
  StyleSheet.create({
    monthBar: {
      paddingBottom: 12,
      gap: 6,
    },
    monthChip: {
      borderWidth: 1.5,
      borderColor: COLORS.border,
      borderRadius: SHAPES.chipRadius,
      backgroundColor: COLORS.card,
      paddingHorizontal: 11,
      paddingVertical: 6,
      marginRight: 6,
    },
    monthChipActive: {
      backgroundColor: COLORS.primary,
    },
    monthChipText: {
      fontFamily: FONTS.mono,
      fontSize: 9.5,
      fontWeight: "bold",
      color: COLORS.textMuted,
    },
    monthChipTextActive: {
      color: COLORS.primaryText,
    },
  });
