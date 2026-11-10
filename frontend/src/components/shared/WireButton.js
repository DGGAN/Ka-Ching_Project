/**
 * @file frontend/src/components/shared/WireButton.js
 * @layer Shared Component (Atomic UI)
 * @description Theme-reactive primary and outline action button with loading spinner support.
 * @props {string} label - Button text label
 * @props {function} onPress - Press callback handler
 * @props {string} [variant="primary"] - Button visual style ("primary" | "outline")
 * @props {boolean} [loading=false] - Shows ActivityIndicator when true
 * @props {boolean} [disabled=false] - Disables touch interaction when true
 * @props {object|Array} [style] - Custom button style overrides
 * @exports default WireButton
 */

import React from "react";
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from "react-native";
import { COLORS, SHAPES, FONTS } from "../../theme/colors";
import { playUiSound } from "../../utils/soundEffects";

export function WireButton({ label, onPress, variant = "primary", loading = false, disabled = false, style }) {
  const styles = getStyles();
  const isOutline = variant === "outline";
  const isDanger = variant === "danger";

  return (
    <TouchableOpacity
      style={[styles.wireBtn, isOutline && styles.wireBtnOutline, isDanger && styles.wireBtnDanger, (disabled || loading) && { opacity: 0.6 }, style]}
      onPress={() => {
        playUiSound("pop");
        if (onPress) onPress();
      }}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator size="small" color={isOutline ? COLORS.text : COLORS.primaryText} />
      ) : (
        <Text style={[styles.wireBtnText, isOutline && { color: COLORS.text }, isDanger && { color: "#FFFFFF" }]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const getStyles = () =>
  StyleSheet.create({
    wireBtn: {
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      borderRadius: SHAPES.buttonRadius,
      backgroundColor: COLORS.primary,
      paddingVertical: 11,
      paddingHorizontal: 16,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
    },
    wireBtnOutline: {
      backgroundColor: COLORS.card,
    },
    wireBtnDanger: {
      backgroundColor: COLORS.danger,
    },
    wireBtnText: {
      fontFamily: FONTS.mono,
      fontSize: 10.5,
      fontWeight: "bold",
      color: COLORS.primaryText,
      letterSpacing: 0.8,
    },
  });

export default WireButton;
