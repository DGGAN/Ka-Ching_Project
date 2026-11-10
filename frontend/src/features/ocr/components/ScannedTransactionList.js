/**
 * @file frontend/src/features/ocr/components/ScannedTransactionList.js
 * @layer Component (Presentational UI — 100% Original Verification Queue Header & List)
 * @description Renders the VERIFICATION QUEUE (N) header row, empty state or list of ScannedTransactionItem cards, and the VERIFY & SAVE ALL button.
 * @exports default ScannedTransactionList
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, FONTS } from "../../../theme/colors";
import WireButton from "../../../components/shared/WireButton";
import CameraPreview from "./CameraPreview";
import ScannedTransactionItem from "./ScannedTransactionItem";

export default function ScannedTransactionList({
  scannedItems = [],
  scanning = false,
  savingAll = false,
  onUpdateField,
  onRemove,
  onOpenCategoryModal,
  onOpenDateModal,
  onVerifyAndSaveAll,
}) {
  const styles = getStyles();

  return (
    <>
      <View style={styles.queueHeaderRow}>
        <Text style={styles.queueTitle}>VERIFICATION QUEUE ({scannedItems.length})</Text>
        <Text style={styles.queueSub}>Review & edit before saving</Text>
      </View>

      {scannedItems.length === 0 && !scanning ? (
        <CameraPreview scanning={false} isEmpty={true} />
      ) : (
        scannedItems.map((item, idx) => (
          <ScannedTransactionItem
            key={item.id}
            item={item}
            index={idx}
            onUpdateField={onUpdateField}
            onRemove={onRemove}
            onOpenCategoryModal={onOpenCategoryModal}
            onOpenDateModal={onOpenDateModal}
          />
        ))
      )}

      {scannedItems.length > 0 && (
        <WireButton
          label={savingAll ? "SAVING VERIFIED RECEIPTS..." : `VERIFY & SAVE ALL (${scannedItems.length})`}
          variant="filled"
          onPress={onVerifyAndSaveAll}
          style={{ marginTop: 6 }}
        />
      )}
    </>
  );
}

const getStyles = () =>
  StyleSheet.create({
    queueHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    queueTitle: {
      fontFamily: FONTS.mono,
      fontSize: 11,
      fontWeight: "bold",
      color: COLORS.text,
      letterSpacing: 0.8,
    },
    queueSub: {
      fontFamily: FONTS.mono,
      fontSize: 9,
      color: COLORS.textMuted,
    },
  });
