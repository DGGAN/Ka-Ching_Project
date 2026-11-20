/**
 * @file frontend/src/features/addTransaction/components/AmountHeroCard.js
 * @layer Feature UI Component (Large Amount Input Hero Card)
 * @description Displays the prominent RM currency input card with inline validation error feedback.
 * @exports default AmountHeroCard
 */

import React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { COLORS, SHAPES, FONTS } from "../../../theme/colors";

export default function AmountHeroCard({ amount, amountHintError, onChangeAmount }) {
  const styles = getStyles();

  return (
    <View style={[styles.amountHeroCard, amountHintError ? { borderColor: COLORS.danger } : null]}>
      <Text style={styles.amountCardLabel}>AMOUNT (RM)</Text>
      <View style={styles.amountInputRow}>
        <Text style={styles.currencyPrefix}>RM</Text>
        <TextInput
          style={styles.amountBigInput}
          placeholder="0.00"
          placeholderTextColor={COLORS.textMuted}
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={onChangeAmount}
          maxLength={10}
        />
      </View>
      <View style={styles.amountCardFooter}>
        {amountHintError ? (
          <Text style={styles.amountErrorHint}>{amountHintError}</Text>
        ) : (
          <Text style={styles.amountFooterHint}>Tap digits above to enter amount (e.g. 15.90)</Text>
        )}
      </View>
    </View>
  );
}

const getStyles = () =>
  StyleSheet.create({
    amountHeroCard: {
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      borderRadius: SHAPES.cardRadius,
      backgroundColor: COLORS.card,
      padding: 16,
      alignItems: "center",
      marginBottom: 16,
    },
    amountCardLabel: {
      fontFamily: FONTS.mono,
      fontSize: 9,
      color: COLORS.textMuted,
      letterSpacing: 1.5,
      marginBottom: 6,
    },
    amountInputRow: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "center",
    },
    currencyPrefix: {
      fontFamily: FONTS.mono,
      fontSize: 20,
      fontWeight: "bold",
      color: COLORS.textMuted,
      marginRight: 6,
    },
    amountBigInput: {
      fontFamily: FONTS.mono,
      fontSize: 34,
      fontWeight: "bold",
      color: COLORS.text,
      minWidth: 120,
      textAlign: "center",
      padding: 0,
    },
    amountCardFooter: {
      width: "100%",
      borderTopWidth: 1.5,
      borderColor: COLORS.borderMuted,
      borderStyle: "dashed",
      paddingTop: 8,
      marginTop: 8,
      alignItems: "center",
    },
    amountFooterHint: {
      fontFamily: FONTS.mono,
      fontSize: 9,
      color: COLORS.textMuted,
    },
    amountErrorHint: {
      fontFamily: FONTS.mono,
      fontSize: 10,
      fontWeight: "bold",
      color: COLORS.danger,
    },
  });
