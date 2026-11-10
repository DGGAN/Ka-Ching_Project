/**
 * @file frontend/src/features/transactions/components/TransactionFilterBar.js
 * @layer Component (Presentational UI — 100% Original Design)
 * @description Renders the Unified Single Time & Month Filter Row (Current Month First -> Past Months -> Quick Ranges).
 * @exports default TransactionFilterBar
 */

import React from "react";
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS, SHAPES, FONTS } from "../../../theme/colors";
import { playUiSound } from "../../../utils/soundEffects";

export default function TransactionFilterBar({ dynamicMonthOptions = [], timeFilter, onSelectTimeFilter }) {
  const styles = getStyles();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {dynamicMonthOptions.map((m) => {
        const isSelected = timeFilter === m.key;
        return (
          <TouchableOpacity
            key={m.key}
            onPress={() => {
              playUiSound("pop");
              onSelectTimeFilter(m.key);
            }}
            style={[styles.periodChip, isSelected && styles.periodChipActive]}
          >
            <Text style={[styles.periodChipText, isSelected && styles.periodChipTextActive]}>{m.isCurrent ? `• ${m.label}` : m.label}</Text>
          </TouchableOpacity>
        );
      })}

      <View style={styles.verticalDivider} />

      {[
        { key: "ALL", label: "All Time" },
        { key: "TODAY", label: "Today" },
        { key: "THIS_WEEK", label: "This Week" },
      ].map((tf) => {
        const isSelected = timeFilter === tf.key;
        return (
          <TouchableOpacity
            key={tf.key}
            onPress={() => {
              playUiSound("pop");
              onSelectTimeFilter(tf.key);
            }}
            style={[styles.periodChip, isSelected && styles.periodChipActive]}
          >
            <Text style={[styles.periodChipText, isSelected && styles.periodChipTextActive]}>{tf.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const getStyles = () =>
  StyleSheet.create({
    filterScroll: {
      marginBottom: 8,
    },
    periodChip: {
      borderWidth: 1.5,
      borderColor: COLORS.border,
      borderRadius: SHAPES.chipRadius,
      backgroundColor: COLORS.card,
      paddingHorizontal: 10,
      paddingVertical: 5,
      marginRight: 6,
    },
    periodChipActive: {
      backgroundColor: COLORS.primary,
    },
    periodChipText: {
      fontFamily: FONTS.mono,
      fontSize: 9.5,
      fontWeight: "bold",
      color: COLORS.textMuted,
    },
    periodChipTextActive: {
      color: COLORS.primaryText,
    },
    verticalDivider: {
      width: 1.5,
      backgroundColor: COLORS.borderMuted,
      marginHorizontal: 4,
      marginVertical: 2,
    },
  });
