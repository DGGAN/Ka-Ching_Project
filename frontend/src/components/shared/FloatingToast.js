/**
 * @file frontend/src/components/shared/FloatingToast.js
 * @layer Shared Atomic UI Component
 * @description Renders a sleek, retro-modern floating notification card at the top of the screen with left accent bar, circular status badge, and hard offset shadow.
 * @props {object|null} toast - Current toast object ({ type: 'success' | 'error' | 'info', message: string })
 * @props {Animated.Value} slideAnim - Animated Y translation value from useFloatingToast()
 * @exports default FloatingToast
 */

import React from "react";
import { View, Text, Animated, StyleSheet } from "react-native";
import { CheckCircle2, AlertTriangle, Info } from "lucide-react-native";
import { COLORS, SHAPES, FONTS } from "../../theme/colors";

const TOAST_THEMES = {
  success: {
    title: "SUCCESS",
    accentColor: "#15803D",
    badgeBg: "#DCFCE7",
    borderColor: "#15803D",
    Icon: CheckCircle2,
  },
  error: {
    title: "ATTENTION",
    accentColor: "#E11D48",
    badgeBg: "#FFE4E6",
    borderColor: "#E11D48",
    Icon: AlertTriangle,
  },
  info: {
    title: "NOTICE",
    accentColor: "#937A50",
    badgeBg: "#F1ECE5",
    borderColor: "#5F4E34",
    Icon: Info,
  },
};

export default function FloatingToast({ toast, slideAnim }) {
  if (!toast || !toast.message) return null;

  const styles = getStyles();
  const cfg = TOAST_THEMES[toast.type] || TOAST_THEMES.info;
  const IconComp = cfg.Icon;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.toastWrapper,
        {
          transform: [{ translateY: slideAnim || 0 }],
        },
      ]}
    >
      <View style={[styles.toastCard, { borderColor: cfg.borderColor }]}>
        {/* Left Colored Accent Strip */}
        <View style={[styles.leftAccentStrip, { backgroundColor: cfg.accentColor }]} />

        {/* Circular Status Icon Badge */}
        <View style={[styles.iconBadge, { backgroundColor: cfg.badgeBg, borderColor: cfg.accentColor }]}>
          <IconComp size={15} color={cfg.accentColor} strokeWidth={2.5} />
        </View>

        {/* Two-Line Status Header + Message Body */}
        <View style={styles.textColumn}>
          <Text style={[styles.statusLabel, { color: cfg.accentColor }]}>{cfg.title}</Text>
          <Text style={styles.messageText} numberOfLines={2}>
            {toast.message}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

const getStyles = () =>
  StyleSheet.create({
    toastWrapper: {
      position: "absolute",
      top: 10,
      left: 14,
      right: 14,
      zIndex: 9999,
      elevation: 25,
      alignItems: "center",
    },
    toastCard: {
      width: "100%",
      maxWidth: 390,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: COLORS.card,
      borderWidth: 1.8,
      borderRadius: SHAPES.cardRadius,
      paddingVertical: 10,
      paddingRight: 12,
      paddingLeft: 14,
      gap: 10,
      overflow: "hidden",
      shadowColor: "#121212",
      shadowOffset: { width: 3, height: 4 },
      shadowOpacity: 0.22,
      shadowRadius: 0,
    },
    leftAccentStrip: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 6,
    },
    iconBadge: {
      width: 30,
      height: 30,
      borderRadius: 15,
      borderWidth: 1.2,
      alignItems: "center",
      justifyContent: "center",
    },
    textColumn: {
      flex: 1,
      justifyContent: "center",
    },
    statusLabel: {
      fontFamily: FONTS.mono,
      fontSize: 8,
      fontWeight: "bold",
      letterSpacing: 1,
      marginBottom: 1,
    },
    messageText: {
      fontFamily: FONTS.mono,
      fontSize: 10,
      fontWeight: "bold",
      color: COLORS.text,
      lineHeight: 14,
    },
  });
