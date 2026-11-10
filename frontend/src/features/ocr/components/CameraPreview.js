/**
 * @file frontend/src/features/ocr/components/CameraPreview.js
 * @layer Component (Presentational UI — 100% Original Scanning Loader & Empty Queue Card)
 * @description Renders the scanningLoaderCard spinner during OCR extraction and the emptyQueueCard when no receipts are queued.
 * @exports default CameraPreview
 */

import React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { Camera } from "lucide-react-native";
import { COLORS, FONTS } from "../../../theme/colors";
import WireBox from "../../../components/shared/WireBox";

export default function CameraPreview({ scanning = false, isEmpty = false }) {
  const styles = getStyles();

  if (scanning) {
    return (
      <WireBox style={styles.scanningLoaderCard}>
        <ActivityIndicator size="small" color={COLORS.primary} />
        <Text style={styles.scanningTitle}>Scanning Receipt...</Text>
        <Text style={styles.scanningSub}>Reading merchant name, date, and RM total amount</Text>
      </WireBox>
    );
  }

  if (isEmpty) {
    return (
      <WireBox style={styles.emptyQueueCard}>
        <Camera size={26} color={COLORS.textMuted} strokeWidth={1.8} />
        <Text style={styles.emptyQueueTitle}>No Receipts Scanned Yet</Text>
        <Text style={styles.emptyQueueSub}>Tap "SNAP PHOTO" or "GALLERY BATCH" above to scan a receipt and verify its extracted details here.</Text>
      </WireBox>
    );
  }

  return null;
}

const getStyles = () =>
  StyleSheet.create({
    scanningLoaderCard: {
      padding: 20,
      alignItems: "center",
      marginBottom: 14,
    },
    scanningTitle: {
      fontFamily: FONTS.mono,
      fontSize: 11,
      fontWeight: "bold",
      color: COLORS.text,
      marginTop: 8,
    },
    scanningSub: {
      fontFamily: FONTS.mono,
      fontSize: 9,
      color: COLORS.textMuted,
      marginTop: 2,
    },
    emptyQueueCard: {
      paddingVertical: 28,
      paddingHorizontal: 16,
      alignItems: "center",
    },
    emptyQueueTitle: {
      fontFamily: FONTS.mono,
      fontSize: 12,
      fontWeight: "bold",
      color: COLORS.text,
      marginTop: 8,
    },
    emptyQueueSub: {
      fontFamily: FONTS.mono,
      fontSize: 9.5,
      color: COLORS.textMuted,
      textAlign: "center",
      marginTop: 4,
      lineHeight: 15,
    },
  });
