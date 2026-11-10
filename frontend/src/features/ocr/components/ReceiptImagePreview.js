/**
 * @file frontend/src/features/ocr/components/ReceiptImagePreview.js
 * @layer Component (Presentational UI — 100% Original Receipt Thumbnail + Raw OCR Snippet Row)
 * @description Renders the 56x70 receiptThumb (or FileText placeholder) alongside the DETECTED TEXT ON RECEIPT snippet box.
 * @exports default ReceiptImagePreview
 */

import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { FileText } from "lucide-react-native";
import { COLORS, SHAPES, FONTS } from "../../../theme/colors";

export default function ReceiptImagePreview({ imageUri, rawText, merchantName, amount }) {
  const styles = getStyles();

  return (
    <View style={styles.previewRow}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.receiptThumb} />
      ) : (
        <View style={styles.receiptPlaceholderThumb}>
          <FileText size={20} color={COLORS.textMuted} />
        </View>
      )}
      <View style={styles.rawTextSnippetBox}>
        <Text style={styles.rawSnippetLabel}>DETECTED TEXT ON RECEIPT:</Text>
        <Text style={styles.rawSnippetText} numberOfLines={4}>
          {rawText || `${merchantName}\nTOTAL: RM ${amount}`}
        </Text>
      </View>
    </View>
  );
}

const getStyles = () =>
  StyleSheet.create({
    previewRow: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 12,
      padding: 8,
      borderWidth: 1.5,
      borderColor: COLORS.borderMuted,
      borderStyle: "dashed",
      borderRadius: SHAPES.inputRadius,
      backgroundColor: COLORS.secondary,
    },
    receiptThumb: {
      width: 56,
      height: 70,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    receiptPlaceholderThumb: {
      width: 56,
      height: 70,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: COLORS.border,
      backgroundColor: COLORS.card,
      alignItems: "center",
      justifyContent: "center",
    },
    rawTextSnippetBox: {
      flex: 1,
      justifyContent: "center",
    },
    rawSnippetLabel: {
      fontFamily: FONTS.mono,
      fontSize: 8,
      fontWeight: "bold",
      color: COLORS.textMuted,
      marginBottom: 3,
    },
    rawSnippetText: {
      fontFamily: FONTS.mono,
      fontSize: 9,
      color: COLORS.text,
      lineHeight: 13,
    },
  });
