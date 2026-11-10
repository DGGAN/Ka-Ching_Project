/**
 * @file frontend/src/features/transactions/components/CategoryFilterModal.js
 * @layer Component (Modal UI — 100% Original Modal 1 Design)
 * @description Renders the 2-Column Multi-Select Category Filter Popup grouped by EXPENSES (10) and INCOME (6).
 * @exports default CategoryFilterModal
 */

import React from "react";
import { View, Text, Modal, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { X, Check } from "lucide-react-native";
import { COLORS, SHAPES, FONTS } from "../../../theme/colors";
import { EXPENSE_CATEGORY_KEYS, INCOME_CATEGORY_KEYS, getCategoryMeta } from "../../../utils/categoryConfig";
import { playUiSound } from "../../../utils/soundEffects";
import WireButton from "../../../components/shared/WireButton";
import CategoryBadge from "../../../components/shared/CategoryBadge";

export default function CategoryFilterModal({ visible = false, selectedCategories = [], onToggleCategory, onClearCategories, onClose }) {
  const styles = getStyles();

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>FILTER BY CATEGORY</Text>
              <Text style={styles.modalSubHint}>Tap to select one or multiple categories</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X size={18} color={COLORS.text} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 390 }} showsVerticalScrollIndicator={false}>
            {/* All Categories Reset Banner */}
            <TouchableOpacity
              style={[styles.allCatFullBtn, selectedCategories.length === 0 && styles.catOptionItemActive]}
              onPress={() => {
                playUiSound("pop");
                onClearCategories();
              }}
            >
              <Text style={[styles.catOptionLabel, { flex: 1 }, selectedCategories.length === 0 && { fontWeight: "bold" }]}>
                ALL CATEGORIES (SHOW ALL)
              </Text>
              {selectedCategories.length === 0 && <Check size={15} color={COLORS.primary} strokeWidth={2.5} />}
            </TouchableOpacity>

            {/* Section 1: EXPENSE CATEGORIES (2-Column Grid) */}
            <View style={styles.catGroupHeaderRow}>
              <Text style={styles.catGroupHeaderText}>EXPENSES (10)</Text>
              <View style={styles.catGroupTypeBadgeExpense}>
                <Text style={styles.catGroupTypeBadgeTextExpense}>EXPENSE</Text>
              </View>
            </View>

            <View style={styles.catTwoColGrid}>
              {EXPENSE_CATEGORY_KEYS.map((catKey) => {
                const cfg = getCategoryMeta(catKey);
                const isSelected = selectedCategories.includes(catKey);
                return (
                  <TouchableOpacity
                    key={catKey}
                    style={[styles.catGridCell, isSelected && styles.catOptionItemActive]}
                    onPress={() => onToggleCategory(catKey)}
                  >
                    <CategoryBadge category={catKey} size={24} iconSize={12} />
                    <Text style={[styles.catGridLabel, isSelected && { fontWeight: "bold" }]} numberOfLines={2}>
                      {cfg.name || cfg.label}
                    </Text>
                    {isSelected && <Check size={13} color={COLORS.primary} strokeWidth={2.8} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Spacer & Dashed Divider between EXPENSE and INCOME */}
            <View style={styles.catGroupDivider} />

            {/* Section 2: INCOME CATEGORIES (2-Column Grid) */}
            <View style={styles.catGroupHeaderRow}>
              <Text style={styles.catGroupHeaderText}>INCOME (6)</Text>
              <View style={styles.catGroupTypeBadgeIncome}>
                <Text style={styles.catGroupTypeBadgeTextIncome}>INCOME</Text>
              </View>
            </View>

            <View style={styles.catTwoColGrid}>
              {INCOME_CATEGORY_KEYS.map((catKey) => {
                const cfg = getCategoryMeta(catKey);
                const isSelected = selectedCategories.includes(catKey);
                return (
                  <TouchableOpacity
                    key={catKey}
                    style={[styles.catGridCell, isSelected && styles.catOptionItemActive]}
                    onPress={() => onToggleCategory(catKey)}
                  >
                    <CategoryBadge category={catKey} size={24} iconSize={12} />
                    <Text style={[styles.catGridLabel, isSelected && { fontWeight: "bold" }]} numberOfLines={2}>
                      {cfg.name || cfg.label}
                    </Text>
                    {isSelected && <Check size={13} color={COLORS.primary} strokeWidth={2.8} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Bottom Modal Action Buttons */}
          <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
            <WireButton
              label="CLEAR"
              variant="outline"
              onPress={() => {
                playUiSound("pop");
                onClearCategories();
              }}
              style={{ flex: 1 }}
            />
            <WireButton
              label={selectedCategories.length > 0 ? `APPLY (${selectedCategories.length})` : "DONE"}
              onPress={onClose}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const getStyles = () =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
      padding: 18,
    },
    modalCard: {
      width: "100%",
      maxWidth: 365,
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      borderRadius: SHAPES.cardRadius,
      backgroundColor: COLORS.card,
      padding: 16,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottomWidth: 1.5,
      borderColor: COLORS.borderMuted,
      borderStyle: "dashed",
      paddingBottom: 10,
      marginBottom: 12,
    },
    modalTitle: {
      fontFamily: FONTS.mono,
      fontSize: 12,
      fontWeight: "bold",
      color: COLORS.text,
      letterSpacing: 1,
    },
    modalSubHint: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      color: COLORS.textMuted,
      marginTop: 2,
    },
    allCatFullBtn: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: SHAPES.inputRadius,
      borderWidth: 1.5,
      borderColor: COLORS.borderMuted,
      backgroundColor: COLORS.inputBg,
      marginBottom: 6,
    },
    catGroupHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 6,
      marginBottom: 6,
      paddingHorizontal: 2,
    },
    catGroupHeaderText: {
      fontFamily: FONTS.mono,
      fontSize: 9,
      fontWeight: "bold",
      color: COLORS.textMuted,
      letterSpacing: 0.6,
    },
    catGroupTypeBadgeExpense: {
      backgroundColor: "#FFE4E6",
      borderWidth: 1,
      borderColor: "#E11D48",
      borderRadius: 4,
      paddingHorizontal: 6,
      paddingVertical: 1,
    },
    catGroupTypeBadgeTextExpense: {
      fontFamily: FONTS.mono,
      fontSize: 7.5,
      fontWeight: "bold",
      color: "#E11D48",
    },
    catGroupTypeBadgeIncome: {
      backgroundColor: "#DCFCE7",
      borderWidth: 1,
      borderColor: "#15803D",
      borderRadius: 4,
      paddingHorizontal: 6,
      paddingVertical: 1,
    },
    catGroupTypeBadgeTextIncome: {
      fontFamily: FONTS.mono,
      fontSize: 7.5,
      fontWeight: "bold",
      color: "#15803D",
    },
    catGroupDivider: {
      borderBottomWidth: 1.5,
      borderColor: COLORS.borderMuted,
      borderStyle: "dashed",
      marginVertical: 8,
    },
    catTwoColGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      rowGap: 6,
    },
    catGridCell: {
      width: "48.5%",
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 7,
      paddingHorizontal: 8,
      borderRadius: SHAPES.inputRadius,
      borderWidth: 1.2,
      borderColor: COLORS.borderMuted,
      backgroundColor: COLORS.inputBg,
    },
    catGridLabel: {
      flex: 1,
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      color: COLORS.text,
      lineHeight: 11,
    },
    catOptionItemActive: {
      borderColor: COLORS.primary,
      backgroundColor: COLORS.secondary,
    },
    catOptionLabel: {
      fontFamily: FONTS.mono,
      fontSize: 10,
      color: COLORS.text,
    },
  });
