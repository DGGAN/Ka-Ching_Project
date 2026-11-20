/**
 * @file frontend/src/components/shared/TopHeader.js
 * @layer Shared Navigation Component
 * @description Renders the top bar with SafeArea top inset protection, Back button, animated Notification Bell & unread badge pop (on count increase), and Profile icon.
 * @exports default TopHeader
 */

import React, { useEffect, useRef } from "react";
import { View, Text, Image, TouchableOpacity, Animated, StyleSheet, Platform, StatusBar } from "react-native";
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

  // Track previous unread count so animation fires ONLY when count increases (e.g. 0->1 or 1->2)
  const prevUnreadRef = useRef(unreadCount);
  const bellShakeAnim = useRef(new Animated.Value(0)).current;
  const badgeScaleAnim = useRef(new Animated.Value(1)).current;
  const badgeTextSlideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const useNative = Platform.OS !== "web";

    if (unreadCount > prevUnreadRef.current) {
      // Reset values before playing synchronized bell shake + badge pop-in animation
      bellShakeAnim.setValue(0);
      badgeScaleAnim.setValue(0.65);
      badgeTextSlideAnim.setValue(-6);

      Animated.parallel([
        // 1. Subtle playful bell ring shake
        Animated.sequence([
          Animated.timing(bellShakeAnim, { toValue: 1, duration: 75, useNativeDriver: useNative }),
          Animated.timing(bellShakeAnim, { toValue: -1, duration: 75, useNativeDriver: useNative }),
          Animated.timing(bellShakeAnim, { toValue: 0.7, duration: 70, useNativeDriver: useNative }),
          Animated.timing(bellShakeAnim, { toValue: -0.7, duration: 70, useNativeDriver: useNative }),
          Animated.timing(bellShakeAnim, { toValue: 0.3, duration: 60, useNativeDriver: useNative }),
          Animated.timing(bellShakeAnim, { toValue: 0, duration: 60, useNativeDriver: useNative }),
        ]),
        // 2. Red badge spring bounce (0.65 -> 1.32 -> 1.0)
        Animated.sequence([
          Animated.spring(badgeScaleAnim, {
            toValue: 1.32,
            friction: 4,
            tension: 180,
            useNativeDriver: useNative,
          }),
          Animated.spring(badgeScaleAnim, {
            toValue: 1,
            friction: 5,
            tension: 140,
            useNativeDriver: useNative,
          }),
        ]),
        // 3. Digit drop-in flip feel (-6px -> 0px)
        Animated.timing(badgeTextSlideAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: useNative,
        }),
      ]).start();
    }

    prevUnreadRef.current = unreadCount;
  }, [unreadCount]);

  const bellRotation = bellShakeAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ["-18deg", "0deg", "18deg"],
  });

  return (
    <View style={styles.headerContainer}>
      <View style={styles.leftRow}>
        {showBack ? (
          <TouchableOpacity style={styles.backBtn} onPress={onBackPress} activeOpacity={0.75}>
            <ArrowLeft size={16} color={COLORS.text} strokeWidth={2.5} />
          </TouchableOpacity>
        ) : (
          <View style={styles.logoBadge}>
            <Image source={require("../../../assets/images/kaching_logo.png")} style={styles.logoImg} resizeMode="contain" />
          </View>
        )}
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
      </View>

      <View style={styles.rightActionsRow}>
        <TouchableOpacity style={[styles.iconBtn, isNotifActive && styles.iconBtnActive]} onPress={handleBell} activeOpacity={0.75}>
          <Animated.View style={{ transform: [{ rotate: bellRotation }] }}>
            <Bell size={16} color={isNotifActive ? COLORS.primaryText : COLORS.text} strokeWidth={2.3} />
          </Animated.View>
          {unreadCount > 0 && (
            <Animated.View style={[styles.unreadBadge, { transform: [{ scale: badgeScaleAnim }] }]}>
              <Animated.Text style={[styles.unreadBadgeText, { transform: [{ translateY: badgeTextSlideAnim }] }]}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </Animated.Text>
            </Animated.View>
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
      overflow: "hidden",
    },
    unreadBadgeText: {
      fontFamily: FONTS.mono,
      fontSize: 7.5,
      fontWeight: "bold",
      color: "#FFFFFF",
    },
  });
