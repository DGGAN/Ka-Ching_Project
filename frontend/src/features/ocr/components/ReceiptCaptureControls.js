/**
 * @file frontend/src/features/ocr/components/ReceiptCaptureControls.js
 * @layer Component (Presentational UI — 100% Original Top Action Bar: Camera & Gallery Batch Upload)
 * @description Renders the scannerHeaderCard with Sparkles aiBadge, RECEIPT SCANNER title, SNAP PHOTO button, and GALLERY BATCH button.
 * @exports default ReceiptCaptureControls
 */

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Camera, Image as ImageIcon, Sparkles } from "lucide-react-native";
import { COLORS, SHAPES, FONTS } from "../../../theme/colors";
import WireBox from "../../../components/shared/WireBox";

export default function ReceiptCaptureControls({ scanning = false, onTakePhoto, onPickFromGallery }) {
  const styles = getStyles();

  return (
    <WireBox style={styles.scannerHeaderCard}>
      <View style={styles.headerTopRow}>
        <View style={styles.aiBadge}>
          <Sparkles size={13} color={COLORS.primaryText} strokeWidth={2.5} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>RECEIPT SCANNER</Text>
          <Text style={styles.headerSub}>Snap a photo or upload screenshots — we will extract the merchant, date, and total automatically</Text>
        </View>
      </View>

      <View style={styles.actionButtonsRow}>
        <TouchableOpacity style={styles.scanBtnPrimary} onPress={onTakePhoto} disabled={scanning}>
          <Camera size={15} color={COLORS.primaryText} strokeWidth={2.3} />
          <Text style={styles.scanBtnPrimaryText}>SNAP PHOTO</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.scanBtnSecondary} onPress={onPickFromGallery} disabled={scanning}>
          <ImageIcon size={15} color={COLORS.text} strokeWidth={2.3} />
          <Text style={styles.scanBtnSecondaryText}>GALLERY BATCH</Text>
        </TouchableOpacity>
      </View>
    </WireBox>
  );
}

const getStyles = () =>
  StyleSheet.create({
    scannerHeaderCard: {
      padding: 14,
      marginBottom: 14,
    },
    headerTopRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      marginBottom: 12,
    },
    aiBadge: {
      width: 30,
      height: 30,
      borderRadius: SHAPES.chipRadius,
      backgroundColor: COLORS.primary,
      borderWidth: 1.5,
      borderColor: COLORS.border,
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      fontFamily: FONTS.mono,
      fontSize: 12,
      fontWeight: "bold",
      color: COLORS.text,
      letterSpacing: 0.8,
    },
    headerSub: {
      fontFamily: FONTS.mono,
      fontSize: 9,
      color: COLORS.textMuted,
      marginTop: 2,
      lineHeight: 13,
    },
    actionButtonsRow: {
      flexDirection: "row",
      gap: 10,
    },
    scanBtnPrimary: {
      flex: 1,
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      borderRadius: SHAPES.buttonRadius,
      backgroundColor: COLORS.primary,
      paddingVertical: 11,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    scanBtnPrimaryText: {
      fontFamily: FONTS.mono,
      fontSize: 10,
      fontWeight: "bold",
      color: COLORS.primaryText,
    },
    scanBtnSecondary: {
      flex: 1,
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      borderRadius: SHAPES.buttonRadius,
      backgroundColor: COLORS.secondary,
      paddingVertical: 11,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    scanBtnSecondaryText: {
      fontFamily: FONTS.mono,
      fontSize: 10,
      fontWeight: "bold",
      color: COLORS.text,
    },
  });
