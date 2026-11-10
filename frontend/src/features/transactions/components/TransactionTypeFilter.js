/**
 * @file frontend/src/features/transactions/components/TransactionTypeFilter.js
 * @layer Component (Presentational UI — 100% Original Design)
 * @description Renders the Type Switcher (ALL / EXPENSE / INCOME) + Record Counter & Reset Row.
 * @exports default TransactionTypeFilter
 */

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS, SHAPES, FONTS } from "../../../theme/colors";
import { playUiSound } from "../../../utils/soundEffects";

export default function TransactionTypeFilter({
  selectedType,
  onSelectType,
  loadedCount = 0,
  totalCount = 0,
  hasCustomFilters = false,
  onResetFilters,
}) {
  const styles = getStyles();

  return (
    <View style={styles.typeAndCountBar}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {["ALL", "EXPENSE", "INCOME"].map((typeKey) => {
          const active = selectedType === typeKey;
          return (
            <TouchableOpacity
              key={typeKey}
              onPress={() => {
                playUiSound("pop");
                onSelectType(typeKey);
              }}
              style={[styles.typeTab, active && styles.typeTabActive]}
            >
              <Text style={[styles.typeTabText, active && styles.typeTabTextActive]}>{typeKey}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Text style={styles.resultsCountText}>
          {loadedCount}/{totalCount}
        </Text>
        {hasCustomFilters && (
          <TouchableOpacity onPress={onResetFilters}>
            <Text style={styles.resetFilterText}>Reset</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const getStyles = () =>
  StyleSheet.create({
    typeAndCountBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    typeTab: {
      borderWidth: 1.5,
      borderColor: COLORS.border,
      borderRadius: SHAPES.chipRadius,
      backgroundColor: COLORS.secondary,
      paddingHorizontal: 9,
      paddingVertical: 4,
      marginRight: 5,
    },
    typeTabActive: {
      backgroundColor: COLORS.text,
    },
    typeTabText: {
      fontFamily: FONTS.mono,
      fontSize: 9,
      fontWeight: "bold",
      color: COLORS.text,
    },
    typeTabTextActive: {
      color: COLORS.card,
    },
    resultsCountText: {
      fontFamily: FONTS.mono,
      fontSize: 9,
      color: COLORS.textMuted,
    },
    resetFilterText: {
      fontFamily: FONTS.mono,
      fontSize: 9,
      fontWeight: "bold",
      color: COLORS.danger,
      textDecorationLine: "underline",
    },
  });
