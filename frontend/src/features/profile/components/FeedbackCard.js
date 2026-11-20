/**
 * @file frontend/src/features/profile/components/FeedbackCard.js
 * @layer Profile Feature Card Component
 * @description Renders a Feedback & Support card inside ProfileScreen that opens the user's native mail app pre-addressed to kaching.pfmapp@gmail.com.
 * @exports default FeedbackCard
 */

import React from "react";
import { View, Text, TouchableOpacity, Linking, Platform, StyleSheet } from "react-native";
import { Mail, MessageSquareHeart, ExternalLink } from "lucide-react-native";
import { COLORS, SHAPES, FONTS } from "../../../theme/colors";
import { playUiSound } from "../../../utils/soundEffects";

const SUPPORT_EMAIL = "kaching.pfmapp@gmail.com";

export default function FeedbackCard({ user, showToast }) {
  const styles = getStyles();

  // Open user's default mail app with pre-filled subject and starter message
  const handleOpenFeedbackEmail = async () => {
    playUiSound("pop");
    const username = user?.username || "Ka-Ching! User";
    const subject = encodeURIComponent("Ka-Ching! App Feedback & Support");
    const body = encodeURIComponent(
      `Hi Ka-Ching! Team,\n\nI would like to share some feedback / report an issue:\n\n[Write your message here]\n\n---\nAccount: ${username}\nPlatform: ${Platform.OS.toUpperCase()}`,
    );
    const mailtoUrl = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;

    try {
      const supported = await Linking.canOpenURL(mailtoUrl);
      if (supported) {
        await Linking.openURL(mailtoUrl);
      } else {
        // Fallback attempt on Android 11+ where canOpenURL may return false without <queries>
        await Linking.openURL(mailtoUrl);
      }
    } catch (err) {
      if (typeof showToast === "function") {
        showToast("info", `Please email your feedback to ${SUPPORT_EMAIL}`);
      }
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.iconBadge}>
          <MessageSquareHeart size={15} color={COLORS.primary} strokeWidth={2.5} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>FEEDBACK &amp; SUPPORT</Text>
          <Text style={styles.subtitle}>Found a bug or want us to support another Malaysian bank? Let us know!</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.emailBtn} activeOpacity={0.85} onPress={handleOpenFeedbackEmail}>
        <Mail size={14} color={COLORS.primaryText} strokeWidth={2.5} />
        <Text style={styles.emailBtnText}>EMAIL {SUPPORT_EMAIL.toUpperCase()}</Text>
        <ExternalLink size={12} color={COLORS.primaryText} strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );
}

const getStyles = () =>
  StyleSheet.create({
    card: {
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      borderRadius: SHAPES.cardRadius,
      backgroundColor: COLORS.card,
      padding: 13,
      marginBottom: 12,
    },
    topRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 10,
    },
    iconBadge: {
      width: 34,
      height: 34,
      borderRadius: 17,
      borderWidth: 1.5,
      borderColor: COLORS.border,
      backgroundColor: COLORS.secondary,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontFamily: FONTS.mono,
      fontSize: 10.5,
      fontWeight: "bold",
      color: COLORS.text,
      letterSpacing: 0.5,
    },
    subtitle: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      color: COLORS.textMuted,
      marginTop: 2,
      lineHeight: 13,
    },
    emailBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
      borderWidth: 1.5,
      borderColor: COLORS.border,
      borderRadius: SHAPES.buttonRadius,
      backgroundColor: COLORS.primary,
      paddingVertical: 9,
      paddingHorizontal: 10,
    },
    emailBtnText: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      fontWeight: "bold",
      color: COLORS.primaryText,
      letterSpacing: 0.3,
    },
  });
