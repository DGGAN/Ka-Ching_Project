/**
 * @file frontend/src/components/shared/CalendarModal.js
 * @layer Shared Component (Modal UI)
 * @description Standalone popup modal wrapping CalendarPicker for AddTransactionScreen and EditTransactionModal.
 * @props {boolean} visible - Controls modal visibility
 * @props {Date|string} selectedDate - Currently selected Date object or YYYY-MM-DD string
 * @props {function} onSelectDate - Callback receiving the selected Date object
 * @props {function} onClose - Callback to dismiss the modal
 * @exports default CalendarModal
 */

import React from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet } from "react-native";
import { X } from "lucide-react-native";
import { COLORS, SHAPES, FONTS } from "../../theme/colors";
import CalendarPicker from "./CalendarPicker";
import WireButton from "./WireButton";
import { playUiSound } from "../../utils/soundEffects";

export function CalendarModal({ visible, selectedDate, onSelectDate, onClose }) {
  const styles = getStyles();
  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeaderRow}>
            <View>
              <Text style={styles.modalTitle}>SELECT TRANSACTION DATE</Text>
              <Text style={styles.modalSubtitle}>Tap any day to set the date</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X size={18} color={COLORS.text} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <CalendarPicker
            selectedDate={selectedDate}
            onSelectDate={(pickedDateObj) => {
              if (onSelectDate) onSelectDate(pickedDateObj);
              if (onClose) onClose();
            }}
          />

          <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
            <WireButton
              label="TODAY"
              variant="outline"
              style={{ flex: 1 }}
              onPress={() => {
                playUiSound("pop");
                if (onSelectDate) onSelectDate(new Date());
                if (onClose) onClose();
              }}
            />
            <WireButton label="CLOSE" style={{ flex: 1 }} onPress={onClose} />
          </View>
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
      maxWidth: 350,
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      borderRadius: SHAPES.cardRadius,
      backgroundColor: COLORS.card,
      padding: 16,
    },
    modalHeaderRow: {
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
      fontSize: 11.5,
      fontWeight: "bold",
      color: COLORS.text,
    },
    modalSubtitle: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      color: COLORS.textMuted,
      marginTop: 2,
    },
  });

export default CalendarModal;
