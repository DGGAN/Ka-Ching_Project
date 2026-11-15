/**
 * @file frontend/src/features/auth/components/GoogleSignInModal.js
 * @layer Component (Presentational UI — 5-Tap Secret Developer Personas Panel)
 * @description Renders the hidden 5-tap developer 2x2 persona panel for testing. The simulated Google input modal has been removed for production security.
 * @exports SecretDevPersonasPanel
 */

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { X, Lock } from "lucide-react-native";
import { COLORS, SHAPES, FONTS } from "../../../theme/colors";
import { playUiSound } from "../../../utils/soundEffects";
import GoogleColorfulIcon from "./GoogleColorfulIcon";
import { DEV_TEST_ACCOUNTS } from "../hooks/useAuthForm";

export function SecretDevPersonasPanel({ visible = false, onClose, onSelectPersona }) {
  const styles = getStyles();
  if (!visible) return null;

  return (
    <View style={styles.devShortcutsBox}>
      <View style={styles.devHeaderRow}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <Lock size={11} color={COLORS.primary} strokeWidth={2.5} />
          <Text style={styles.devShortcutsLabel}>DEV TEST PERSONAS (UNLOCKED)</Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            playUiSound("pop");
            if (onClose) onClose();
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <X size={13} color={COLORS.textMuted} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <View style={styles.devGrid}>
        {DEV_TEST_ACCOUNTS.map((acc) => (
          <TouchableOpacity
            key={acc.email}
            style={styles.devShortcutPill}
            activeOpacity={0.8}
            onPress={() => {
              playUiSound("pop");
              if (onSelectPersona) onSelectPersona(acc);
            }}
          >
            <GoogleColorfulIcon size={12} />
            <Text style={styles.devShortcutText} numberOfLines={1}>
              {acc.tag}: {acc.username.split(" ")[0]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const getStyles = () =>
  StyleSheet.create({
    devShortcutsBox: {
      marginBottom: 18,
      padding: 10,
      borderWidth: 1.5,
      borderColor: COLORS.primary,
      borderStyle: "dashed",
      borderRadius: SHAPES.inputRadius,
      backgroundColor: COLORS.secondary,
    },
    devHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    devShortcutsLabel: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      fontWeight: "bold",
      color: COLORS.text,
      letterSpacing: 0.5,
    },
    devGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      rowGap: 6,
    },
    devShortcutPill: {
      width: "48.5%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      backgroundColor: COLORS.card,
      borderWidth: 1.5,
      borderColor: COLORS.border,
      borderRadius: SHAPES.chipRadius,
      paddingVertical: 7,
      paddingHorizontal: 8,
    },
    devShortcutText: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      fontWeight: "bold",
      color: COLORS.text,
    },
  });
