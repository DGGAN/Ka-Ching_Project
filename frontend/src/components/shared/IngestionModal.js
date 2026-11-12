/**
 * @file frontend/src/components/shared/IngestionModal.js
 * @layer Shared Navigation / Modal Component
 * @description Renders the "+" Add Transaction method picker modal (Manual Entry, Snap Receipt Photo, or Gallery Batch OCR) and triggers onSelectMethod.
 * @exports default IngestionModal
 */

import React from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet } from "react-native";
import { Edit3, Camera, Image as ImageIcon, X, ChevronRight } from "lucide-react-native";
import { COLORS, SHAPES, FONTS } from "../../theme/colors";
import { playUiSound } from "../../utils/soundEffects";
import WireButton from "./WireButton";

export default function IngestionModal({ visible = false, onClose, onSelectMethod, onSelectOption, onSelectMode, onSelectManual, onSelectOCR }) {
  const styles = getStyles();

  const handleChoose = (methodId) => {
    playUiSound("pop");
    const callback = onSelectMethod || onSelectOption || onSelectMode;
    if (typeof callback === "function") {
      callback(methodId);
      return;
    }
    if (methodId === "manual" && typeof onSelectManual === "function") {
      onSelectManual();
    } else if (typeof onSelectOCR === "function") {
      onSelectOCR(methodId);
    }
  };

  return (
    <Modal
      visible={Boolean(visible)}
      transparent={true}
      animationType="fade"
      onRequestClose={() => {
        playUiSound("pop");
        if (onClose) onClose();
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Modal Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.modalTitle}>ADD TRANSACTION</Text>
              <Text style={styles.modalSubtitle}>Choose how you want to record your transaction</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                playUiSound("pop");
                if (onClose) onClose();
              }}
            >
              <X size={18} color={COLORS.text} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* Option 1: Manual Entry */}
          <TouchableOpacity style={styles.optionCard} activeOpacity={0.8} onPress={() => handleChoose("manual")}>
            <View style={[styles.iconBox, { backgroundColor: COLORS.primary }]}>
              <Edit3 size={18} color={COLORS.primaryText} strokeWidth={2.3} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.optionTitle}>MANUAL ENTRY</Text>
              <Text style={styles.optionDesc}>Type in an expense or income record manually</Text>
            </View>
            <ChevronRight size={16} color={COLORS.textMuted} />
          </TouchableOpacity>

          {/* Option 2: Snap Receipt Photo (Camera OCR) */}
          <TouchableOpacity style={styles.optionCard} activeOpacity={0.8} onPress={() => handleChoose("camera")}>
            <View style={[styles.iconBox, { backgroundColor: "#DCFCE7" }]}>
              <Camera size={18} color="#15803D" strokeWidth={2.3} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.optionTitle}>SNAP RECEIPT PHOTO (OCR)</Text>
              <Text style={styles.optionDesc}>Use your camera to scan a physical receipt</Text>
            </View>
            <ChevronRight size={16} color={COLORS.textMuted} />
          </TouchableOpacity>

          {/* Option 3: Upload Gallery Screenshots (Batch OCR) */}
          <TouchableOpacity style={styles.optionCard} activeOpacity={0.8} onPress={() => handleChoose("ocr_batch")}>
            <View style={[styles.iconBox, { backgroundColor: "#FEF3C7" }]}>
              <ImageIcon size={18} color="#D97706" strokeWidth={2.3} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.optionTitle}>GALLERY BATCH UPLOAD (OCR)</Text>
              <Text style={styles.optionDesc}>Pick 1 to 5 payment screenshots or receipts from gallery</Text>
            </View>
            <ChevronRight size={16} color={COLORS.textMuted} />
          </TouchableOpacity>

          <WireButton
            label="CANCEL"
            variant="outline"
            onPress={() => {
              playUiSound("pop");
              if (onClose) onClose();
            }}
            style={{ marginTop: 6 }}
          />
        </View>
      </View>
    </Modal>
  );
}

const getStyles = () =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.55)",
      justifyContent: "center",
      alignItems: "center",
      padding: 18,
    },
    modalCard: {
      width: "100%",
      maxWidth: 365,
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      borderRadius: SHAPES.cardRadius,
      backgroundColor: COLORS.card,
      padding: 16,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottomWidth: 1.5,
      borderColor: COLORS.borderMuted,
      borderStyle: "dashed",
      paddingBottom: 10,
      marginBottom: 12,
    },
    modalTitle: {
      fontFamily: FONTS.mono,
      fontSize: 13,
      fontWeight: "bold",
      color: COLORS.text,
      letterSpacing: 0.8,
    },
    modalSubtitle: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      color: COLORS.textMuted,
      marginTop: 2,
    },
    optionCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderWidth: 1.5,
      borderColor: COLORS.border,
      borderRadius: SHAPES.inputRadius,
      backgroundColor: COLORS.secondary,
      padding: 12,
      marginBottom: 10,
    },
    iconBox: {
      width: 38,
      height: 38,
      borderRadius: 19,
      borderWidth: 1.5,
      borderColor: COLORS.border,
      alignItems: "center",
      justifyContent: "center",
    },
    optionTitle: {
      fontFamily: FONTS.mono,
      fontSize: 10.5,
      fontWeight: "bold",
      color: COLORS.text,
    },
    optionDesc: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      color: COLORS.textMuted,
      marginTop: 2,
    },
  });
