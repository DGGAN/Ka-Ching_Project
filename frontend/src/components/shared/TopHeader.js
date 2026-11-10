/**
 * @file frontend/src/components/shared/TopHeader.js
 * @layer Shared Component (Global App Header with Toggle Highlight & Back Button)
 * @description Highlights the Bell or Profile button when active; tapping an active Bell/Profile button again closes it and returns to the previous screen.
 * @exports default TopHeader
 */

import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Bell, User, ArrowLeft } from "lucide-react-native";
import { COLORS, SHAPES, FONTS } from "../../theme/colors";
import { playUiSound } from "../../utils/soundEffects";

export default function TopHeader({
  title = "Ka-Ching!",
  subtitle,
  unreadCount = 0,
  activeTab = "home",
  showBack = false,
  onBackPress,
  onBellPress,
  onNotificationPress,
  onProfilePress,
}) {
  const styles = getStyles();

  const isBellActive = activeTab === "notifications";
  const isProfileActive = activeTab === "profile";

  const handleBack = () => {
    playUiSound("pop");
    if (typeof onBackPress === "function") onBackPress();
  };

  const handleBell = () => {
    playUiSound(isBellActive ? "pop" : "bell");
    const fn = onBellPress || onNotificationPress;
    if (typeof fn === "function") fn();
  };

  const handleProfile = () => {
    playUiSound("pop");
    if (typeof onProfilePress === "function") onProfilePress();
  };

  return (
    <View style={styles.headerBar}>
      <View style={styles.brandRow}>
        {showBack ? (
          <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.75}>
            <ArrowLeft size={16} color={COLORS.text} strokeWidth={2.5} />
          </TouchableOpacity>
        ) : (
          <Image source={require("../../../assets/kaching_logo.png")} style={styles.logoImg} resizeMode="cover" />
        )}
        <View>
          <Text style={styles.headerTitle}>{title}</Text>
          {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
        </View>
      </View>

      <View style={styles.rightActions}>
        <TouchableOpacity style={[styles.iconBtn, isBellActive && styles.iconBtnActive]} onPress={handleBell} activeOpacity={0.75}>
          <Bell size={17} color={isBellActive ? COLORS.primaryText : COLORS.text} strokeWidth={2.2} />
          {unreadCount > 0 && (
            <View style={styles.badgeDot}>
              <Text style={styles.badgeDotText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={[styles.iconBtn, isProfileActive && styles.iconBtnActive]} onPress={handleProfile} activeOpacity={0.75}>
          <User size={17} color={isProfileActive ? COLORS.primaryText : COLORS.text} strokeWidth={2.2} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const getStyles = () =>
  StyleSheet.create({
    headerBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: COLORS.card,
      borderBottomWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      zIndex: 40,
    },
    brandRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
    },
    backBtn: {
      width: 30,
      height: 30,
      borderRadius: SHAPES.buttonRadius,
      borderWidth: 1.5,
      borderColor: COLORS.border,
      backgroundColor: COLORS.secondary,
      alignItems: "center",
      justifyContent: "center",
    },
    logoImg: {
      width: 28,
      height: 28,
      borderRadius: 7,
      borderWidth: 1.2,
      borderColor: COLORS.border,
    },
    headerTitle: {
      fontFamily: FONTS.mono,
      fontSize: 14,
      fontWeight: "bold",
      color: COLORS.text,
      letterSpacing: 0.6,
    },
    headerSubtitle: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      color: COLORS.textMuted,
      marginTop: 1,
    },
    rightActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    iconBtn: {
      width: 34,
      height: 34,
      borderRadius: SHAPES.buttonRadius,
      borderWidth: 1.5,
      borderColor: COLORS.border,
      backgroundColor: COLORS.secondary,
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
    },
    iconBtnActive: {
      backgroundColor: COLORS.primary,
      borderColor: COLORS.border,
    },
    badgeDot: {
      position: "absolute",
      top: -4,
      right: -4,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: COLORS.danger,
      borderWidth: 1,
      borderColor: "#FFFFFF",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 3,
    },
    badgeDotText: {
      fontFamily: FONTS.mono,
      fontSize: 8,
      fontWeight: "bold",
      color: "#FFFFFF",
    },
  });
