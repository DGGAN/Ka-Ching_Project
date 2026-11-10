/**
 * @file frontend/src/features/ocr/components/ScannedTransactionItem.js
 * @layer Component (Presentational UI — 100% Original Receipt Verification Card)
 * @description Renders an individual receiptVerifyCard with READ CLARITY badge, remove trash button, ReceiptImagePreview, Merchant/Amount inputs, and Category/Date selectors.
 * @exports default ScannedTransactionItem
 */

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { CheckCircle2, AlertTriangle, Trash2, Calendar as CalendarIcon, ChevronDown } from "lucide-react-native";
import { COLORS, SHAPES, FONTS } from "../../../theme/colors";
import { getCategoryMeta } from "../../../utils/categoryConfig";
import WireBox from "../../../components/shared/WireBox";
import WireInput from "../../../components/shared/WireInput";
import CategoryBadge from "../../../components/shared/CategoryBadge";
import ReceiptImagePreview from "./ReceiptImagePreview";

export default function ScannedTransactionItem({ item, index, onUpdateField, onRemove, onOpenCategoryModal, onOpenDateModal }) {
  const styles = getStyles();
  const cfg = getCategoryMeta(item.category);
  const pctConfidence = Math.round((item.confidenceScore || 0.85) * 100);
  const isHighConfidence = pctConfidence >= 85;
  const dateObj = item.date instanceof Date && !isNaN(item.date.getTime()) ? item.date : new Date(item.date);

  return (
    <WireBox style={styles.receiptVerifyCard}>
      {/* Top Status & Confidence Badge Row */}
      <View style={styles.verifyCardTopRow}>
        <View style={[styles.confidencePill, { backgroundColor: isHighConfidence ? "#DCFCE7" : "#FEF3C7" }]}>
          {isHighConfidence ? (
            <CheckCircle2 size={12} color="#15803D" strokeWidth={2.5} />
          ) : (
            <AlertTriangle size={12} color="#D97706" strokeWidth={2.5} />
          )}
          <Text style={[styles.confidencePillText, { color: isHighConfidence ? "#15803D" : "#D97706" }]}>
            {pctConfidence}% READ CLARITY {isHighConfidence ? "— CLEAR" : "— PLEASE DOUBLE CHECK"}
          </Text>
        </View>

        <TouchableOpacity style={styles.removeBtn} onPress={() => onRemove(index)}>
          <Trash2 size={14} color={COLORS.danger} strokeWidth={2.2} />
        </TouchableOpacity>
      </View>

      {/* Receipt Thumbnail + Raw OCR Snippet */}
      <ReceiptImagePreview imageUri={item.imageUri} rawText={item.rawText} merchantName={item.merchantName} amount={item.amount} />

      {/* Editable Extracted Fields */}
      <WireInput label="Merchant Name" value={item.merchantName} onChangeText={(val) => onUpdateField(index, "merchantName", val)} />

      <WireInput
        label="Total Amount (RM)"
        keyboardType="decimal-pad"
        value={item.amount}
        onChangeText={(val) => onUpdateField(index, "amount", val)}
      />

      {/* Category & Date Row */}
      <View style={styles.catAndDateRow}>
        <TouchableOpacity style={styles.halfSelectorBtn} onPress={() => onOpenCategoryModal(index)}>
          <CategoryBadge category={item.category} size={26} iconSize={13} />
          <View style={{ flex: 1 }}>
            <Text style={styles.halfSelectorLabel}>CATEGORY</Text>
            <Text style={styles.halfSelectorVal} numberOfLines={1}>
              {cfg.name || cfg.label}
            </Text>
          </View>
          <ChevronDown size={13} color={COLORS.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.halfSelectorBtn} onPress={() => onOpenDateModal(index)}>
          <CalendarIcon size={16} color={COLORS.primary} strokeWidth={2.2} />
          <View style={{ flex: 1 }}>
            <Text style={styles.halfSelectorLabel}>RECEIPT DATE</Text>
            <Text style={styles.halfSelectorVal} numberOfLines={1}>
              {dateObj.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </Text>
          </View>
          <ChevronDown size={13} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>
    </WireBox>
  );
}

const getStyles = () =>
  StyleSheet.create({
    receiptVerifyCard: {
      padding: 14,
      marginBottom: 12,
    },
    verifyCardTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },
    confidencePill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      borderWidth: 1.5,
      borderColor: COLORS.border,
      borderRadius: SHAPES.chipRadius,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    confidencePillText: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      fontWeight: "bold",
    },
    removeBtn: {
      padding: 5,
      borderWidth: 1,
      borderColor: COLORS.danger,
      borderRadius: SHAPES.chipRadius,
      backgroundColor: COLORS.dangerBg,
    },
    catAndDateRow: {
      flexDirection: "row",
      gap: 8,
      marginTop: 2,
    },
    halfSelectorBtn: {
      flex: 1,
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      borderRadius: SHAPES.inputRadius,
      backgroundColor: COLORS.inputBg,
      paddingHorizontal: 10,
      paddingVertical: 8,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    halfSelectorLabel: {
      fontFamily: FONTS.mono,
      fontSize: 7.5,
      color: COLORS.textMuted,
    },
    halfSelectorVal: {
      fontFamily: FONTS.mono,
      fontSize: 10,
      fontWeight: "bold",
      color: COLORS.text,
      marginTop: 1,
    },
  });
