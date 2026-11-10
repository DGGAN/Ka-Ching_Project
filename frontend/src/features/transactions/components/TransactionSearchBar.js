/**
 * @file frontend/src/features/transactions/components/TransactionSearchBar.js
 * @layer Component (Presentational UI — 100% Original Design)
 * @description Renders the Search Input + Multi-Category Filter Button Row.
 * @exports default TransactionSearchBar
 */

import React from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Search, X, Filter, ChevronDown } from "lucide-react-native";
import { COLORS, SHAPES, FONTS } from "../../../theme/colors";
import { playUiSound } from "../../../utils/soundEffects";
import { getCategoryTriggerLabel } from "../utils/transactionUtils";

export default function TransactionSearchBar({ searchQuery, onChangeSearch, selectedCategories = [], onOpenCategoryModal }) {
  const styles = getStyles();

  return (
    <View style={styles.searchAndCatRow}>
      <View style={styles.searchBar}>
        <Search size={15} color={COLORS.textMuted} strokeWidth={2} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search merchant or notes..."
          placeholderTextColor={COLORS.textMuted}
          value={searchQuery}
          onChangeText={onChangeSearch}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => onChangeSearch("")}>
            <X size={15} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={[styles.catDropdownBtn, selectedCategories.length > 0 && styles.catDropdownBtnActive]}
        onPress={() => {
          playUiSound("pop");
          onOpenCategoryModal();
        }}
      >
        <Filter size={13} color={selectedCategories.length > 0 ? COLORS.primaryText : COLORS.text} strokeWidth={2.2} />
        <Text style={[styles.catDropdownBtnText, selectedCategories.length > 0 && { color: COLORS.primaryText }]} numberOfLines={1}>
          {getCategoryTriggerLabel(selectedCategories)}
        </Text>
        <ChevronDown size={13} color={selectedCategories.length > 0 ? COLORS.primaryText : COLORS.text} />
      </TouchableOpacity>
    </View>
  );
}

const getStyles = () =>
  StyleSheet.create({
    searchAndCatRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 8,
    },
    searchBar: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      borderRadius: SHAPES.inputRadius,
      backgroundColor: COLORS.card,
      paddingHorizontal: 10,
      paddingVertical: 7,
      gap: 6,
    },
    searchInput: {
      flex: 1,
      fontFamily: FONTS.mono,
      fontSize: 11,
      color: COLORS.text,
      paddingVertical: 0,
    },
    catDropdownBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      borderRadius: SHAPES.inputRadius,
      backgroundColor: COLORS.card,
      paddingHorizontal: 10,
      paddingVertical: 9,
      maxWidth: 135,
    },
    catDropdownBtnActive: {
      backgroundColor: COLORS.primary,
    },
    catDropdownBtnText: {
      fontFamily: FONTS.mono,
      fontSize: 10,
      fontWeight: "bold",
      color: COLORS.text,
    },
  });
