/**
 * @file frontend/src/components/shared/TopHeader.js
 * @layer Shared Navigation Component
 * @description Renders the top bar with SafeArea top inset protection, Back button ("pop" sound), Notification Bell ("bell" sound), and Profile icon ("profile" sound).
 * @exports default TopHeader
 */

import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Bell, User, ArrowLeft } from "lucide-react-native";
import { COLORS, SHAPES, FONTS } from "../../theme/colors";

export default function TopHeader({
  title = "Ka-Ching!",
  showBack = false,
  unreadCount = 0,
  activeTab = "home",
  onBackPress,
  onBellPress,
  onOpenNotifications,
  onProfilePress,
  onOpenProfile,
}) {
  const insets = useSafeAreaInsets();
  const topInsetPadding = Platform.OS === "web" ? 10 : Math.max(insets.top, StatusBar.currentHeight || 28) + 8;

  const styles = getStyles(topInsetPadding);

  const handleBell = onBellPress || onOpenNotifications;
  const handleProfile = onProfilePress || onOpenProfile;

  const isNotifActive = activeTab === "notifications";
  const isProfileActive = activeTab === "profile";

  return (
    <View style={styles.headerContainer}>
      <View style={styles.leftRow}>
        {showBack ? (
          <TouchableOpacity style={styles.backBtn} onPress={onBackPress} activeOpacity={0.75}>
            <ArrowLeft size={16} color={COLORS.text} strokeWidth={2.5} />
          </TouchableOpacity>
        ) : (
          <View style={styles.logoBadge}>
            <Image source={require("../../../assets/kaching_logo.png")} style={styles.logoImg} resizeMode="cover" />
          </View>
        )}
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
      </View>

      <View style={styles.rightActionsRow}>
        <TouchableOpacity style={[styles.iconBtn, isNotifActive && styles.iconBtnActive]} onPress={handleBell} activeOpacity={0.75}>
          <Bell size={16} color={isNotifActive ? COLORS.primaryText : COLORS.text} strokeWidth={2.3} />
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount > 99 ? "99+" : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={[styles.iconBtn, isProfileActive && styles.iconBtnActive]} onPress={handleProfile} activeOpacity={0.75}>
          <User size={16} color={isProfileActive ? COLORS.primaryText : COLORS.text} strokeWidth={2.3} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const getStyles = (topInsetPadding) =>
  StyleSheet.create({
    headerContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingTop: topInsetPadding,
      paddingBottom: 10,
      backgroundColor: COLORS.card,
      borderBottomWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      zIndex: 50,
      elevation: 8,
    },
    leftRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      flex: 1,
    },
    logoBadge: {
      width: 32,
      height: 32,
      borderRadius: 8,
      borderWidth: 1.5,
      borderColor: COLORS.border,
      backgroundColor: "#FDF2C5",
      overflow: "hidden",
    },
    logoImg: {
      width: "100%",
      height: "100%",
    },
    backBtn: {
      width: 32,
      height: 32,
      borderRadius: 8,
      borderWidth: 1.5,
      borderColor: COLORS.border,
      backgroundColor: COLORS.secondary,
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      fontFamily: FONTS.mono,
      fontSize: 15,
      fontWeight: "bold",
      color: COLORS.text,
      flexShrink: 1,
    },
    rightActionsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    iconBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      borderWidth: 1.5,
      borderColor: COLORS.border,
      backgroundColor: COLORS.secondary,
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
    },
    iconBtnActive: {
      backgroundColor: COLORS.primary,
    },
    unreadBadge: {
      position: "absolute",
      top: -4,
      right: -4,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: "#E11D48",
      borderWidth: 1,
      borderColor: "#FFFFFF",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 3,
    },
    unreadBadgeText: {
      fontFamily: FONTS.mono,
      fontSize: 7.5,
      fontWeight: "bold",
      color: "#FFFFFF",
    },
  });
