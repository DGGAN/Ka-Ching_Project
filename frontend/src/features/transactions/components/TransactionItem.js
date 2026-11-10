/**
 * @file frontend/src/features/transactions/components/TransactionItem.js
 * @layer Component (Presentational UI — 100% Original Design with ChevronRight)
 * @description Renders a single transaction card row with CategoryBadge, OCR tag, amount, and ChevronRight. Tapping opens Detail Modal.
 * @exports default TransactionItem
 */

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { COLORS, FONTS } from "../../../theme/colors";
import { getCategoryMeta } from "../../../utils/categoryConfig";
import WireBox from "../../../components/shared/WireBox";
import CategoryBadge from "../../../components/shared/CategoryBadge";

export default function TransactionItem({ tx, onPressItem }) {
  const styles = getStyles();
  const isIncome = tx.type === "INCOME";
  const cfg = getCategoryMeta(tx.category);

  return (
    <TouchableOpacity activeOpacity={0.75} onPress={() => onPressItem(tx)}>
      <WireBox style={styles.txRowCard}>
        <CategoryBadge category={tx.category} size={38} iconSize={18} />

        <View style={{ flex: 1 }}>
          <View style={styles.merchantLine}>
            <Text style={styles.txMerchant} numberOfLines={1}>
              {tx.merchantName || tx.merchant || "General"}
            </Text>
            {tx.source === "OCR" && (
              <View style={styles.ocrTag}>
                <Text style={styles.ocrTagText}>OCR</Text>
              </View>
            )}
          </View>
          <Text style={styles.txMeta} numberOfLines={1}>
            {cfg.name || cfg.label}
            {tx.description ? ` • ${tx.description}` : ""}
          </Text>
        </View>

        <View style={styles.rightActionCol}>
          <Text style={[styles.txAmount, { color: isIncome ? "#16A34A" : "#E11D48" }]}>
            {isIncome ? "+" : "-"}RM {Number(tx.amount).toFixed(2)}
          </Text>
          <ChevronRight size={14} color={COLORS.textMuted} />
        </View>
      </WireBox>
    </TouchableOpacity>
  );
}

const getStyles = () =>
  StyleSheet.create({
    txRowCard: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 6,
      gap: 10,
    },
    merchantLine: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    txMerchant: {
      fontFamily: FONTS.mono,
      fontSize: 12,
      fontWeight: "bold",
      color: COLORS.text,
      flexShrink: 1,
    },
    ocrTag: {
      backgroundColor: COLORS.secondary,
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: 4,
      paddingHorizontal: 4,
      paddingVertical: 1,
    },
    ocrTagText: {
      fontFamily: FONTS.mono,
      fontSize: 7.5,
      fontWeight: "bold",
      color: COLORS.primary,
    },
    txMeta: {
      fontFamily: FONTS.mono,
      fontSize: 9.5,
      color: COLORS.textMuted,
      marginTop: 2,
    },
    rightActionCol: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    txAmount: {
      fontFamily: FONTS.mono,
      fontSize: 12,
      fontWeight: "bold",
    },
  });
