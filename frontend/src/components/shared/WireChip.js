/**
 * @file frontend/src/components/shared/WireChip.js
 * @layer Shared Component (Atomic UI)
 * @description Selectable pill/chip component for filter bars and preset tags.
 * @props {string} label - Chip display text
 * @props {boolean} [active=false] - Highlights chip with primary theme color when true
 * @props {function} onPress - Tap handler
 * @props {object|Array} [style] - Custom style overrides
 * @exports default WireChip
 */

import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { COLORS, SHAPES, FONTS } from "../../theme/colors";
import { playUiSound } from "../../utils/soundEffects";

export function WireChip({ label, active, onPress }) {
  const styles = getStyles();
  return (
    <TouchableOpacity
      style={[styles.wireChip, active && styles.wireChipActive]}
      onPress={() => {
        playUiSound("pop");
        if (onPress) onPress();
      }}
      activeOpacity={0.75}
    >
      <Text style={[styles.wireChipText, active && styles.wireChipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const getStyles = () =>
  StyleSheet.create({
    wireChip: {
      borderWidth: 1.5,
      borderColor: COLORS.border,
      borderRadius: SHAPES.chipRadius,
      backgroundColor: COLORS.card,
      paddingHorizontal: 11,
      paddingVertical: 5,
      marginRight: 7,
    },
    wireChipActive: {
      backgroundColor: COLORS.primary,
    },
    wireChipText: {
      fontFamily: FONTS.mono,
      fontSize: 9,
      fontWeight: "bold",
      color: COLORS.textMuted,
    },
    wireChipTextActive: {
      color: COLORS.primaryText,
    },
  });

export default WireChip;
