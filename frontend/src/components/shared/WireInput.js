/**
 * @file frontend/src/components/shared/WireInput.js
 * @layer Shared Component (Atomic UI)
 * @description Theme-reactive labeled text input field for forms and modals with built-in throttled "typing" sound feedback.
 * @props {string} [label] - Uppercase field label above the input box
 * @props {object} [style] - TextInput style overrides
 * @props {boolean} [disableTypingSound=false] - Optional flag to mute typing sound for a specific field
 * @props {...TextInputProps} props - Standard React Native TextInput props (value, onChangeText, placeholder, etc.)
 * @exports default WireInput
 */

import React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { COLORS, SHAPES, FONTS } from "../../theme/colors";
import { playUiSound } from "../../utils/soundEffects";

export function WireInput({ label, style, onChangeText, disableTypingSound = false, ...props }) {
  const styles = getStyles();

  const handleChangeText = (text) => {
    if (!disableTypingSound) {
      playUiSound("typing");
    }
    if (typeof onChangeText === "function") {
      onChangeText(text);
    }
  };

  return (
    <View style={{ marginBottom: 12 }}>
      {label ? <Text style={styles.inputLabel}>{label}</Text> : null}
      <TextInput style={[styles.wireInput, style]} placeholderTextColor={COLORS.textMuted} onChangeText={handleChangeText} {...props} />
    </View>
  );
}

const getStyles = () =>
  StyleSheet.create({
    inputLabel: {
      fontFamily: FONTS.mono,
      fontSize: 9.5,
      fontWeight: "bold",
      color: COLORS.text,
      marginBottom: 4,
    },
    wireInput: {
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      borderRadius: SHAPES.inputRadius,
      backgroundColor: COLORS.inputBg,
      paddingHorizontal: 12,
      paddingVertical: 9,
      fontFamily: FONTS.mono,
      fontSize: 11,
      color: COLORS.text,
    },
  });

export default WireInput;
