/**
 * @file frontend/src/features/ocr/components/ReceiptReviewForm.js
 * @layer Component (Presentational UI — 100% Original Category Popup & Shared Calendar Modal)
 * @description Renders the CHANGE RECEIPT CATEGORY 2-column popup modal and the shared CalendarModal for the active receipt item.
 * @exports default ReceiptReviewForm
 */

import React from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet } from "react-native";
import { Check } from "lucide-react-native";
import { COLORS, SHAPES, FONTS } from "../../../theme/colors";
import { EXPENSE_CATEGORY_KEYS, getCategoryMeta } from "../../../utils/categoryConfig";
import WireButton from "../../../components/shared/WireButton";
import CalendarModal from "../../../components/shared/CalendarModal";
import CategoryBadge from "../../../components/shared/CategoryBadge";

export default function ReceiptReviewForm({
  scannedItems = [],
  activeItemIndexForCat,
  onCloseCatModal,
  activeItemIndexForDate,
  onCloseDateModal,
  onUpdateField,
}) {
  const styles = getStyles();

  const currentItemForCat = activeItemIndexForCat !== null ? scannedItems[activeItemIndexForCat] : null;
  const currentItemForDate = activeItemIndexForDate !== null ? scannedItems[activeItemIndexForDate] : null;

  return (
    <>
      {/* Category Selection Modal for Active Scanned Item */}
      <Modal visible={activeItemIndexForCat !== null} transparent={true} animationType="fade" onRequestClose={onCloseCatModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.popupCard}>
            <Text style={styles.popupTitle}>CHANGE RECEIPT CATEGORY</Text>
            <View style={styles.categoryGrid}>
              {EXPENSE_CATEGORY_KEYS.map((catKey) => {
                const cfg = getCategoryMeta(catKey);
                const isSelected = currentItemForCat?.category === catKey;

                return (
                  <TouchableOpacity
                    key={catKey}
                    style={[styles.catCard, isSelected && styles.catCardSelected]}
                    onPress={() => {
                      if (activeItemIndexForCat !== null) {
                        onUpdateField(activeItemIndexForCat, "category", catKey);
                      }
                      onCloseCatModal();
                    }}
                  >
                    <CategoryBadge category={catKey} size={28} iconSize={14} />
                    <Text style={styles.catCardTitle} numberOfLines={1}>
                      {cfg.name || cfg.label}
                    </Text>
                    {isSelected && <Check size={12} color={COLORS.primary} strokeWidth={3} />}
                  </TouchableOpacity>
                );
              })}
            </View>
            <WireButton label="CLOSE" variant="outline" onPress={onCloseCatModal} style={{ marginTop: 12 }} />
          </View>
        </View>
      </Modal>

      {/* Shared Calendar Modal for Active Scanned Item */}
      <CalendarModal
        visible={activeItemIndexForDate !== null}
        selectedDate={currentItemForDate ? currentItemForDate.date : new Date()}
        onSelectDate={(pickedDate) => {
          if (activeItemIndexForDate !== null) {
            onUpdateField(activeItemIndexForDate, "date", pickedDate);
          }
        }}
        onClose={onCloseDateModal}
      />
    </>
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
    popupTitle: {
      fontFamily: FONTS.mono,
      fontSize: 12,
      fontWeight: "bold",
      color: COLORS.text,
      marginBottom: 12,
    },
    categoryGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      gap: 8,
    },
    catCard: {
      width: "48.5%",
      borderWidth: 1.5,
      borderColor: COLORS.borderMuted,
      borderRadius: SHAPES.chipRadius,
      backgroundColor: COLORS.card,
      padding: 7,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    catCardSelected: {
      borderColor: COLORS.primary,
      backgroundColor: COLORS.secondary,
    },
    catCardTitle: {
      fontFamily: FONTS.mono,
      fontSize: 9,
      fontWeight: "bold",
      color: COLORS.text,
      flex: 1,
    },
  });
