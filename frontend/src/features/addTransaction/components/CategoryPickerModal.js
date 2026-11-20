/**
 * @file frontend/src/features/addTransaction/components/CategoryPickerModal.js
 * @layer Feature UI Modal Component (2-Column Category Selector)
 * @description Displays a 2-column grid modal of EXPENSE or INCOME categories with icons and active selection badges.
 * @exports default CategoryPickerModal
 */

import React from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet } from "react-native";
import { Check } from "lucide-react-native";
import { COLORS, SHAPES, FONTS } from "../../../theme/colors";
import { getCategoryMeta } from "../../../utils/categoryConfig";
import { playUiSound } from "../../../utils/soundEffects";
import CategoryBadge from "../../../components/shared/CategoryBadge";
import WireButton from "../../../components/shared/WireButton";

export default function CategoryPickerModal({
  visible = false,
  type = "EXPENSE",
  activeCategoryKeys = [],
  selectedCategory,
  onSelectCategory,
  onClose,
}) {
  const styles = getStyles();

  return (
    <Modal visible={Boolean(visible)} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.popupCard}>
          <View style={styles.popupHeader}>
            <Text style={styles.popupTitle}>SELECT {type} CATEGORY</Text>
            <Text style={styles.popupSubtitle}>Choose a category to organize your spending</Text>
          </View>

          <View style={styles.categoryGrid}>
            {activeCategoryKeys.map((catKey) => {
              const cfg = getCategoryMeta(catKey);
              const isSelected = selectedCategory === catKey;
              return (
                <TouchableOpacity
                  key={catKey}
                  activeOpacity={0.8}
                  onPress={() => {
                    playUiSound("pop");
                    if (onSelectCategory) onSelectCategory(catKey);
                    if (onClose) onClose();
                  }}
                  style={[styles.catCard, isSelected && styles.catCardSelected]}
                >
                  <CategoryBadge category={catKey} size={34} iconSize={17} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.catCardTitle, isSelected && { color: COLORS.primary }]} numberOfLines={1}>
                      {cfg.name || cfg.label}
                    </Text>
                  </View>
                  {isSelected && (
                    <View style={styles.checkBadge}>
                      <Check size={10} color={COLORS.primaryText} strokeWidth={3} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <WireButton
            label="CANCEL"
            variant="outline"
            onPress={() => {
              playUiSound("pop");
              if (onClose) onClose();
            }}
            style={{ marginTop: 12 }}
          />
        </View>
      </View>
    </Modal>
  );
}

const getStyles = () =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.55)",
      justifyContent: "center",
      alignItems: "center",
      padding: 18,
    },
    popupCard: {
      width: "100%",
      maxWidth: 350,
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      borderRadius: SHAPES.cardRadius,
      backgroundColor: COLORS.card,
      padding: 16,
    },
    popupHeader: {
      borderBottomWidth: 1.5,
      borderColor: COLORS.borderMuted,
      borderStyle: "dashed",
      paddingBottom: 10,
      marginBottom: 12,
    },
    popupTitle: {
      fontFamily: FONTS.mono,
      fontSize: 13,
      fontWeight: "bold",
      color: COLORS.text,
    },
    popupSubtitle: {
      fontFamily: FONTS.mono,
      fontSize: 9,
      color: COLORS.textMuted,
      marginTop: 2,
    },
    categoryGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      gap: 8,
    },
    catCard: {
      width: "48.5%",
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.borderMuted,
      borderRadius: SHAPES.inputRadius,
      backgroundColor: COLORS.card,
      padding: 8,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    catCardSelected: {
      borderColor: COLORS.primary,
      backgroundColor: COLORS.secondary,
    },
    catCardTitle: {
      fontFamily: FONTS.mono,
      fontSize: 10,
      fontWeight: "bold",
      color: COLORS.text,
    },
    checkBadge: {
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: COLORS.primary,
      alignItems: "center",
      justifyContent: "center",
    },
  });
