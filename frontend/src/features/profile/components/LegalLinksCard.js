/**
 * @file frontend/src/features/profile/components/LegalLinksCard.js
 * @layer Profile Feature Card Component
 * @description Renders the Privacy Policy (PDPA 2010) and Terms of Service quick-access buttons inside ProfileScreen.
 * @exports default LegalLinksCard
 */

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { ShieldCheck, FileText } from "lucide-react-native";
import { COLORS, SHAPES, FONTS } from "../../../theme/colors";
import { playUiSound } from "../../../utils/soundEffects";

export default function LegalLinksCard({ onOpenLegalModal }) {
  const styles = getStyles();

  return (
    <View style={styles.legalLinksRow}>
      <TouchableOpacity
        style={styles.legalLinkBtn}
        activeOpacity={0.8}
        onPress={() => {
          playUiSound("pop");
          if (onOpenLegalModal) onOpenLegalModal("privacy");
        }}
      >
        <ShieldCheck size={13} color={COLORS.primary} strokeWidth={2.5} />
        <Text style={styles.legalLinkBtnText}>PRIVACY POLICY (PDPA)</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.legalLinkBtn}
        activeOpacity={0.8}
        onPress={() => {
          playUiSound("pop");
          if (onOpenLegalModal) onOpenLegalModal("terms");
        }}
      >
        <FileText size={13} color={COLORS.primary} strokeWidth={2.5} />
        <Text style={styles.legalLinkBtnText}>TERMS OF SERVICE</Text>
      </TouchableOpacity>
    </View>
  );
}

const getStyles = () =>
  StyleSheet.create({
    legalLinksRow: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 10,
    },
    legalLinkBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      borderWidth: 1.5,
      borderColor: COLORS.border,
      borderRadius: SHAPES.buttonRadius,
      backgroundColor: COLORS.card,
      paddingVertical: 10,
      paddingHorizontal: 8,
    },
    legalLinkBtnText: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      fontWeight: "bold",
      color: COLORS.text,
    },
  });
