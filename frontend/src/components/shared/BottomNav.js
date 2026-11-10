/**
 * @file frontend/src/components/shared/BottomNav.js
 * @layer Shared Component (Bottom 5-Button Navigation Bar — Universal Callback Support)
 * @description Supports every prop name used in both old and new App.js: onSelectTab, onChangeTab, onTabChange, setActiveTab, onPressAdd, onOpenAddModal, onAddPress, onPlusPress.
 * @exports default BottomNav
 */

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Home, ListOrdered, Plus, PieChart, Sparkles } from "lucide-react-native";
import { COLORS, SHAPES, FONTS } from "../../theme/colors";
import { playUiSound } from "../../utils/soundEffects";

export default function BottomNav({
  activeTab,
  onSelectTab,
  onChangeTab,
  onTabChange,
  setActiveTab,
  onPressAdd,
  onOpenAddModal,
  onAddPress,
  onPlusPress,
}) {
  const styles = getStyles();

  // Unified tab switch handler (supports old App.js "home" and new App.js "dashboard")
  const handleSelectTab = (tabKey) => {
    playUiSound("tab");
    const fn = onSelectTab || onChangeTab || onTabChange || setActiveTab;
    if (typeof fn === "function") {
      fn(tabKey);
    }
  };

  // Unified "+" button handler
  const handleCenterAdd = () => {
    playUiSound("tab");
    const fn = onPressAdd || onOpenAddModal || onAddPress || onPlusPress;
    if (typeof fn === "function") {
      fn();
    }
  };

  // Normalize activeTab so both "home" and "dashboard" highlight the first Home icon
  const normalizedActive = activeTab === "dashboard" ? "home" : activeTab || "home";

  const navItems = [
    { key: "home", label: "Home", Icon: Home },
    { key: "transactions", label: "History", Icon: ListOrdered },
    { key: "ADD_CENTER", isCenter: true },
    { key: "budget", label: "Budget", Icon: PieChart },
    { key: "insights", label: "Insights", Icon: Sparkles },
  ];

  return (
    <View style={styles.bottomBar}>
      {navItems.map((item) => {
        if (item.isCenter) {
          return (
            <TouchableOpacity key="center-add" style={styles.centerAddBtn} activeOpacity={0.85} onPress={handleCenterAdd}>
              <Plus size={22} color={COLORS.primaryText} strokeWidth={2.8} />
            </TouchableOpacity>
          );
        }

        const isActive = normalizedActive === item.key;
        const IconComp = item.Icon;

        return (
          <TouchableOpacity key={item.key} style={styles.navTabItem} activeOpacity={0.75} onPress={() => handleSelectTab(item.key)}>
            <IconComp size={18} color={isActive ? COLORS.primary : COLORS.textMuted} strokeWidth={isActive ? 2.5 : 2} />
            <Text style={[styles.navTabLabel, isActive && styles.navTabLabelActive]}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const getStyles = () =>
  StyleSheet.create({
    bottomBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-around",
      paddingVertical: 8,
      paddingHorizontal: 10,
      backgroundColor: COLORS.card,
      borderTopWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      zIndex: 50,
      elevation: 10,
    },
    navTabItem: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 4,
      gap: 3,
    },
    navTabLabel: {
      fontFamily: FONTS.mono,
      fontSize: 9,
      color: COLORS.textMuted,
    },
    navTabLabelActive: {
      color: COLORS.primary,
      fontWeight: "bold",
    },
    centerAddBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: COLORS.primary,
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      alignItems: "center",
      justifyContent: "center",
      marginTop: -16,
      shadowColor: COLORS.text,
      shadowOffset: { width: 2, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 0,
      elevation: 4,
    },
  });
