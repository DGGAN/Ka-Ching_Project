/**
 * @file frontend/src/components/shared/IngestionModal.js
 * @layer Shared Component ("+" Add Transaction Method Selection Modal)
 * @description Supports both onSelectMethod("manual" | "ocr_batch" | "ocr_single") and onSelectManual / onSelectOCR callbacks.
 * @exports default IngestionModal
 */

import React from "react";
import { View, Text, Modal, TouchableOpacity, StyleSheet } from "react-native";
import { Edit3, Camera, Layers, X, ChevronRight } from "lucide-react-native";
import { COLORS, SHAPES, FONTS } from "../../theme/colors";
import { playUiSound } from "../../utils/soundEffects";

export default function IngestionModal({ visible = false, onClose, onSelectMethod, onSelectManual, onSelectOCR }) {
  const styles = getStyles();

  const handleChoose = (methodId) => {
    playUiSound("tab");
    if (typeof onSelectMethod === "function") {
      onSelectMethod(methodId);
      if (typeof onClose === "function") onClose();
      return;
    }
    if (methodId === "manual" && typeof onSelectManual === "function") {
      onSelectManual();
      return;
    }
    if (typeof onSelectOCR === "function") {
      onSelectOCR(methodId);
    }
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>ADD TRANSACTION</Text>
              <Text style={styles.subTitle}>Choose how you want to record your entry</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X size={18} color={COLORS.text} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* Option 1: Manual Entry */}
          <TouchableOpacity style={styles.optionBtn} activeOpacity={0.8} onPress={() => handleChoose("manual")}>
            <View style={styles.iconCircle}>
              <Edit3 size={18} color={COLORS.primaryText} strokeWidth={2.2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.optTitle}>MANUAL ENTRY</Text>
              <Text style={styles.optSub}>Type amount, category & notes manually</Text>
            </View>
            <ChevronRight size={16} color={COLORS.textMuted} />
          </TouchableOpacity>

          {/* Option 2: Single / Batch AI Receipt OCR */}
          <TouchableOpacity style={styles.optionBtn} activeOpacity={0.8} onPress={() => handleChoose("ocr_batch")}>
            <View style={[styles.iconCircle, { backgroundColor: COLORS.text }]}>
              <Camera size={18} color={COLORS.card} strokeWidth={2.2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.optTitle}>AI RECEIPT SCANNER (OCR)</Text>
              <Text style={styles.optSub}>Snap or upload single/multiple receipts</Text>
            </View>
            <ChevronRight size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const getStyles = () =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
      padding: 18,
    },
    card: {
      width: "100%",
      maxWidth: 360,
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      borderRadius: SHAPES.cardRadius,
      backgroundColor: COLORS.card,
      padding: 16,
      gap: 10,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottomWidth: 1.5,
      borderColor: COLORS.borderMuted,
      borderStyle: "dashed",
      paddingBottom: 10,
      marginBottom: 4,
    },
    title: {
      fontFamily: FONTS.mono,
      fontSize: 12,
      fontWeight: "bold",
      color: COLORS.text,
      letterSpacing: 0.8,
    },
    subTitle: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      color: COLORS.textMuted,
      marginTop: 2,
    },
    optionBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 12,
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      borderRadius: SHAPES.inputRadius,
      backgroundColor: COLORS.inputBg,
    },
    iconCircle: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: COLORS.primary,
      borderWidth: 1.5,
      borderColor: COLORS.border,
      alignItems: "center",
      justifyContent: "center",
    },
    optTitle: {
      fontFamily: FONTS.mono,
      fontSize: 11,
      fontWeight: "bold",
      color: COLORS.text,
    },
    optSub: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      color: COLORS.textMuted,
      marginTop: 2,
    },
  });
