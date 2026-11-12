/**
 * @file frontend/src/features/transactions/components/TransactionItem.js
 * @layer Component (Presentational UI)
 * @description Renders a single transaction row inside TransactionGroup with distinct badges for "OCR" (Receipt Scanner) and "AUTO" (Notification Auto-Capture).
 * @props {object} tx - Transaction document object passed from TransactionGroup
 * @props {function} onPressItem - Callback invoked with tx when tapped
 * @exports default TransactionItem
 */

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS, SHAPES, FONTS } from "../../../theme/colors";
import { getCategoryMeta } from "../../../utils/categoryConfig";
import CategoryBadge from "../../../components/shared/CategoryBadge";

export default function TransactionItem({ tx, onPressItem }) {
  const styles = getStyles();
  if (!tx) return null;

  const isIncome = tx.type === "INCOME";
  const cfg = getCategoryMeta(tx.category);

  const isOcrSource = tx.source === "OCR";
  const isNotificationSource = tx.source === "NOTIFICATION";

  return (
    <TouchableOpacity style={styles.txItemCard} activeOpacity={0.78} onPress={() => onPressItem && onPressItem(tx)}>
      <CategoryBadge category={tx.category} size={36} iconSize={17} />

      <View style={styles.txInfoCol}>
        <View style={styles.merchantRow}>
          <Text style={styles.txMerchant} numberOfLines={1}>
            {tx.merchantName || tx.merchant || "General"}
          </Text>

          {isOcrSource && (
            <View style={styles.ocrTagPill}>
              <Text style={styles.ocrTagText}>OCR</Text>
            </View>
          )}

          {isNotificationSource && (
            <View style={styles.autoTagPill}>
              <Text style={styles.autoTagText}>AUTO</Text>
            </View>
          )}
        </View>

        <Text style={styles.txCategory} numberOfLines={1}>
          {cfg.name || cfg.label}
          {tx.description ? ` • ${tx.description}` : ""}
        </Text>
      </View>

      <Text style={[styles.txAmount, { color: isIncome ? "#16A34A" : "#E11D48" }]}>
        {isIncome ? "+" : "-"}RM {Number(tx.amount || 0).toFixed(2)}
      </Text>
    </TouchableOpacity>
  );
}

const getStyles = () =>
  StyleSheet.create({
    txItemCard: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      borderRadius: SHAPES.cardRadius,
      backgroundColor: COLORS.card,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 8,
      gap: 11,
    },
    txInfoCol: {
      flex: 1,
    },
    merchantRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    txMerchant: {
      fontFamily: FONTS.mono,
      fontSize: 11.5,
      fontWeight: "bold",
      color: COLORS.text,
      flexShrink: 1,
    },
    ocrTagPill: {
      backgroundColor: "#FEF08A",
      borderWidth: 1,
      borderColor: "#121212",
      borderRadius: 4,
      paddingHorizontal: 4,
      paddingVertical: 1,
    },
    ocrTagText: {
      fontFamily: FONTS.mono,
      fontSize: 6.5,
      fontWeight: "bold",
      color: "#121212",
    },
    autoTagPill: {
      backgroundColor: "#DCFCE7",
      borderWidth: 1,
      borderColor: "#15803D",
      borderRadius: 4,
      paddingHorizontal: 5,
      paddingVertical: 1,
    },
    autoTagText: {
      fontFamily: FONTS.mono,
      fontSize: 6.5,
      fontWeight: "bold",
      color: "#15803D",
    },
    txCategory: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      color: COLORS.textMuted,
      marginTop: 2,
    },
    txAmount: {
      fontFamily: FONTS.mono,
      fontSize: 11.5,
      fontWeight: "bold",
    },
  });
