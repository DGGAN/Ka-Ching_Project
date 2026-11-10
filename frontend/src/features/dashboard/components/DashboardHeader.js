/**
 * @file frontend/src/features/dashboard/components/DashboardHeader.js
 * @layer Component (Presentational UI)
 * @description Horizontal scrollable month selector bar on the Dashboard, highlighting "• Nov (Current)".
 * @props {Array} monthWindow - Contiguous 6-month array from getSixMonthWindow()
 * @props {string} selectedMonthKey - Active YYYY-MM key
 * @props {function} onSelectMonth - Callback when a month chip is tapped
 * @exports default DashboardHeader
 */

import React from "react";
import { ScrollView, TouchableOpacity, Text, StyleSheet } from "react-native";
import { COLORS, SHAPES, FONTS } from "../../../theme/colors";

export default function DashboardHeader({ monthWindow = [], selectedMonthKey, onSelectMonth }) {
  const styles = getStyles();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.monthBarContainer}>
      {monthWindow.map((m) => {
        const isSelected = m.key === selectedMonthKey;
        return (
          <TouchableOpacity key={m.key} onPress={() => onSelectMonth(m.key)} style={[styles.monthChip, isSelected && styles.monthChipActive]}>
            <Text style={[styles.monthChipText, isSelected && styles.monthChipTextActive]}>
              {m.isCurrent ? `• ${m.shortLabel} (Current)` : m.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const getStyles = () =>
  StyleSheet.create({
    monthBarContainer: {
      paddingBottom: 12,
    },
    monthChip: {
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      borderRadius: SHAPES.chipRadius,
      backgroundColor: COLORS.card,
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginRight: 8,
    },
    monthChipActive: {
      backgroundColor: COLORS.primary,
    },
    monthChipText: {
      fontFamily: FONTS.mono,
      fontSize: 10,
      color: COLORS.textMuted,
      fontWeight: "bold",
    },
    monthChipTextActive: {
      color: COLORS.primaryText,
    },
  });
