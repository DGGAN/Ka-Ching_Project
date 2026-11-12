/**
 * @file frontend/src/components/shared/BottomNav.js
 * @layer Shared Navigation Component
 * @description Renders the 5-tab bottom navigation bar with SafeArea bottom inset protection and plays "tab" for tabs and "pop" for the central "+" button.
 * @exports default BottomNav
 */

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Home, ListOrdered, Plus, PieChart, Sparkles } from "lucide-react-native";
import { COLORS, SHAPES, FONTS } from "../../theme/colors";
import { playUiSound } from "../../utils/soundEffects";

export default function BottomNav({ activeTab = "home", onSelectTab, onChangeTab, onTabChange, onPressAdd, onOpenAddModal, onOpenIngestionModal }) {
  const insets = useSafeAreaInsets();
  const bottomInsetPadding = Platform.OS === "web" ? 10 : Math.max(insets.bottom, Platform.OS === "android" ? 28 : 20) + 6;

  const styles = getStyles(bottomInsetPadding);

  const triggerTabSwitch = (tabKey) => {
    playUiSound("tab");
    const fn = onSelectTab || onChangeTab || onTabChange;
    if (typeof fn === "function") {
      fn(tabKey);
    }
  };

  const triggerAddModal = () => {
    playUiSound("pop");
    const fn = onPressAdd || onOpenAddModal || onOpenIngestionModal;
    if (typeof fn === "function") {
      fn();
    }
  };

  const isHomeActive = activeTab === "home" || activeTab === "dashboard";

  return (
    <View style={styles.navBar}>
      <TouchableOpacity style={styles.navItem} onPress={() => triggerTabSwitch("home")}>
        <Home size={18} color={isHomeActive ? COLORS.primary : COLORS.textMuted} strokeWidth={isHomeActive ? 2.6 : 2} />
        <Text style={[styles.navText, isHomeActive && styles.navTextActive]}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem} onPress={() => triggerTabSwitch("transactions")}>
        <ListOrdered
          size={18}
          color={activeTab === "transactions" ? COLORS.primary : COLORS.textMuted}
          strokeWidth={activeTab === "transactions" ? 2.6 : 2}
        />
        <Text style={[styles.navText, activeTab === "transactions" && styles.navTextActive]}>History</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.plusBtnWrapper} activeOpacity={0.85} onPress={triggerAddModal}>
        <View style={styles.plusBtn}>
          <Plus size={22} color={COLORS.primaryText} strokeWidth={2.8} />
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem} onPress={() => triggerTabSwitch("budget")}>
        <PieChart size={18} color={activeTab === "budget" ? COLORS.primary : COLORS.textMuted} strokeWidth={activeTab === "budget" ? 2.6 : 2} />
        <Text style={[styles.navText, activeTab === "budget" && styles.navTextActive]}>Budget</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem} onPress={() => triggerTabSwitch("insights")}>
        <Sparkles size={18} color={activeTab === "insights" ? COLORS.primary : COLORS.textMuted} strokeWidth={activeTab === "insights" ? 2.6 : 2} />
        <Text style={[styles.navText, activeTab === "insights" && styles.navTextActive]}>Insights</Text>
      </TouchableOpacity>
    </View>
  );
}

const getStyles = (bottomInsetPadding) =>
  StyleSheet.create({
    navBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-around",
      backgroundColor: COLORS.card,
      borderTopWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      paddingTop: 8,
      paddingBottom: bottomInsetPadding,
      paddingHorizontal: 8,
      zIndex: 50,
      elevation: 12,
    },
    navItem: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 3,
    },
    navText: {
      fontFamily: FONTS.mono,
      fontSize: 9,
      color: COLORS.textMuted,
    },
    navTextActive: {
      fontWeight: "bold",
      color: COLORS.primary,
    },
    plusBtnWrapper: {
      paddingHorizontal: 8,
      marginTop: -14,
    },
    plusBtn: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: COLORS.primary,
      borderWidth: 2,
      borderColor: COLORS.border,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: COLORS.text,
      shadowOffset: { width: 2, height: 3 },
      shadowOpacity: 0.25,
      shadowRadius: 0,
      elevation: 5,
    },
  });
