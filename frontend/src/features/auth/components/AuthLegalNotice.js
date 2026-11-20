/**
 * @file frontend/src/features/auth/components/AuthLegalNotice.js
 * @layer Auth Feature Component
 * @description Renders the clickable Terms of Service & Privacy Policy agreement notice inside AuthScreen.
 * @exports default AuthLegalNotice
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, FONTS } from "../../../theme/colors";
import { playUiSound } from "../../../utils/soundEffects";

export default function AuthLegalNotice({ onOpenLegalModal }) {
  const styles = getStyles();

  return (
    <View style={styles.legalRow}>
      <Text style={styles.legalText}>
        By continuing, you agree to Ka-Ching!'s{" "}
        <Text
          style={styles.legalLink}
          onPress={() => {
            playUiSound("pop");
            if (onOpenLegalModal) onOpenLegalModal("terms");
          }}
        >
          Terms of Service
        </Text>{" "}
        &amp;{" "}
        <Text
          style={styles.legalLink}
          onPress={() => {
            playUiSound("pop");
            if (onOpenLegalModal) onOpenLegalModal("privacy");
          }}
        >
          Privacy Policy
        </Text>
        .
      </Text>
    </View>
  );
}

const getStyles = () =>
  StyleSheet.create({
    legalRow: {
      marginBottom: 14,
      paddingHorizontal: 4,
    },
    legalText: {
      fontFamily: FONTS.mono,
      fontSize: 9,
      color: COLORS.textMuted,
      textAlign: "center",
      lineHeight: 14,
    },
    legalLink: {
      color: COLORS.text,
      fontWeight: "bold",
      textDecorationLine: "underline",
    },
  });
