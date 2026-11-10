/**
 * @file frontend/src/features/transactions/components/TransactionGroup.js
 * @layer Component (Presentational UI — 100% Original Design)
 * @description Renders a date group header (dateStr + dayTotal) and its TransactionItem cards.
 * @exports default TransactionGroup
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, FONTS } from "../../../theme/colors";
import TransactionItem from "./TransactionItem";

export default function TransactionGroup({ group, onPressItem }) {
  const styles = getStyles();

  return (
    <View style={styles.dateGroupSection}>
      <View style={styles.dateHeaderRow}>
        <Text style={styles.dateHeaderText}>{group.dateStr}</Text>
        <Text
          style={[
            styles.dateTotalText,
            {
              color: group.dayTotal >= 0 ? "#15803D" : COLORS.textMuted,
            },
          ]}
        >
          {group.dayTotal >= 0 ? "+" : "-"}RM {Math.abs(group.dayTotal).toFixed(2)}
        </Text>
      </View>

      {group.items.map((tx) => (
        <TransactionItem key={tx._id} tx={tx} onPressItem={onPressItem} />
      ))}
    </View>
  );
}

const getStyles = () =>
  StyleSheet.create({
    dateGroupSection: {
      marginBottom: 12,
    },
    dateHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 6,
      paddingHorizontal: 4,
    },
    dateHeaderText: {
      fontFamily: FONTS.mono,
      fontSize: 10,
      fontWeight: "bold",
      color: COLORS.textMuted,
    },
    dateTotalText: {
      fontFamily: FONTS.mono,
      fontSize: 10,
      fontWeight: "bold",
    },
  });
