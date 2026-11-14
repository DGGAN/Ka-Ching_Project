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
import { ScanLine, Zap } from "lucide-react-native";
import { COLORS, SHAPES, FONTS } from "../../../theme/colors";
import { getCategoryMeta } from "../../../utils/categoryConfig";
import { playUiSound } from "../../../utils/soundEffects";
import CategoryBadge from "../../../components/shared/CategoryBadge";

export default function TransactionItem({ tx, item, onPressItem, onPress }) {
  const styles = getStyles();
  const record = tx || item;
  if (!record) return null;

  const isIncome = record.type === "INCOME";
  const cfg = getCategoryMeta(record.category);

  const isOcrSource = record.source === "OCR";
  const isNotificationSource = record.source === "NOTIFICATION" || record.source === "AUTO";

  const handleRowPress = () => {
    playUiSound("pop");
    if (typeof onPressItem === "function") {
      onPressItem(record);
    } else if (typeof onPress === "function") {
      onPress(record);
    }
  };

  return (
    <TouchableOpacity style={styles.rowContainer} activeOpacity={0.78} onPress={handleRowPress}>
      <CategoryBadge category={record.category} size={36} iconSize={17} />

      <View style={{ flex: 1 }}>
        <View style={styles.merchantRow}>
          <Text style={styles.merchantText} numberOfLines={1}>
            {record.merchantName || record.merchant || "General"}
          </Text>

          {/* OCR Badge for Camera / Gallery Scanned Receipts */}
          {isOcrSource && (
            <View style={styles.ocrPill}>
              <ScanLine size={9} color="#D97706" strokeWidth={2.5} />
              <Text style={styles.ocrPillText}>OCR</Text>
            </View>
          )}

          {/* AUTO Badge for Android Listener / iOS 27 Shortcuts Auto-Captured Notifications */}
          {isNotificationSource && (
            <View style={styles.autoPill}>
              <Zap size={9} color="#15803D" strokeWidth={2.5} />
              <Text style={styles.autoPillText}>AUTO</Text>
            </View>
          )}
        </View>

        <Text style={styles.categorySubText} numberOfLines={1}>
          {cfg.name || cfg.label}
          {record.description ? ` • ${record.description}` : ""}
        </Text>
      </View>

      <Text style={[styles.amountText, { color: isIncome ? "#16A34A" : "#E11D48" }]}>
        {isIncome ? "+" : "-"}RM {Number(record.amount || 0).toFixed(2)}
      </Text>
    </TouchableOpacity>
  );
}

const getStyles = () =>
  StyleSheet.create({
    rowContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 11,
      borderWidth: 1.5,
      borderColor: COLORS.border,
      borderRadius: SHAPES.inputRadius,
      backgroundColor: COLORS.card,
      paddingHorizontal: 11,
      paddingVertical: 10,
      marginBottom: 7,
    },
    merchantRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    merchantText: {
      fontFamily: FONTS.mono,
      fontSize: 11.5,
      fontWeight: "bold",
      color: COLORS.text,
      flexShrink: 1,
    },
    ocrPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      borderWidth: 1,
      borderColor: "#D97706",
      borderRadius: 4,
      backgroundColor: "#FEF3C7",
      paddingHorizontal: 5,
      paddingVertical: 1,
    },
    ocrPillText: {
      fontFamily: FONTS.mono,
      fontSize: 7,
      fontWeight: "bold",
      color: "#D97706",
    },
    autoPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      borderWidth: 1,
      borderColor: "#15803D",
      borderRadius: 4,
      backgroundColor: "#DCFCE7",
      paddingHorizontal: 5,
      paddingVertical: 1,
    },
    autoPillText: {
      fontFamily: FONTS.mono,
      fontSize: 7,
      fontWeight: "bold",
      color: "#15803D",
    },
    categorySubText: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      color: COLORS.textMuted,
      marginTop: 2,
    },
    amountText: {
      fontFamily: FONTS.mono,
      fontSize: 11.5,
      fontWeight: "bold",
    },
  });
