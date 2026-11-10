/**
 * @file frontend/src/features/budget/components/BudgetMonthSelector.js
 * @layer Component (Presentational UI — 100% Original Design)
 * @description Renders the horizontal 6-month selector bar at the top of BudgetScreen.
 * @exports default BudgetMonthSelector
 */

import React from "react";
import { ScrollView, TouchableOpacity, Text, StyleSheet } from "react-native";
import { COLORS, SHAPES, FONTS } from "../../../theme/colors";
import { playUiSound } from "../../../utils/soundEffects";

export default function BudgetMonthSelector({ visibleMonths = [], activeMonthKey = "", onSelectMonth }) {
  const styles = getStyles();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.monthBar}>
      {visibleMonths.map((m) => {
        const isSelected = m.key === activeMonthKey;
        const isCurrent = m.isCurrentMonth ?? m.isCurrent;
        return (
          <TouchableOpacity
            key={m.key}
            style={[styles.monthChip, isSelected && styles.monthChipActive]}
            onPress={() => {
              playUiSound("tab");
              onSelectMonth(m.key);
            }}
          >
            <Text style={[styles.monthChipText, isSelected && styles.monthChipTextActive]}>{isCurrent ? `${m.shortMonth} (Current)` : m.label}</Text>
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
      gap: 8,
    },
    monthChip: {
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      borderRadius: SHAPES.chipRadius,
      backgroundColor: COLORS.card,
      paddingHorizontal: 12,
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
