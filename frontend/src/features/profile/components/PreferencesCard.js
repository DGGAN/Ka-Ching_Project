/**
 * @file frontend/src/features/profile/components/PreferencesCard.js
 * @layer Feature Component (App Preferences, Auto-Capture & Theme Switcher)
 * @description Renders Smart Auto-Capture entry, App Theme selector modal, and In-App Notification toggle.
 * @exports default PreferencesCard
 */

import React from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet } from "react-native";
import { Zap, Palette, Bell, ChevronRight, Check, X } from "lucide-react-native";
import { COLORS, SHAPES, FONTS, THEMES, ACTIVE_THEME } from "../../../theme/colors";
import { playUiSound } from "../../../utils/soundEffects";
import WireBox from "../../../components/shared/WireBox";
import WireButton from "../../../components/shared/WireButton";

export default function PreferencesCard({
  autoCaptureEnabled = false,
  onOpenAutoCaptureModal,
  activeThemeKey,
  showThemeModal = false,
  onOpenThemeModal,
  onCloseThemeModal,
  onSelectTheme,
  notificationsEnabled = true,
  onToggleNotifications,
}) {
  const styles = getStyles();
  const currentThemeId = activeThemeKey || ACTIVE_THEME || "khaki";
  const currentThemeObj = THEMES[currentThemeId] || THEMES.khaki;

  return (
    <WireBox style={styles.card}>
      <Text style={styles.sectionTitle}>AUTOMATION & APP PREFERENCES</Text>
      <Text style={styles.sectionSub}>Configure payment auto-capture, color theme, and budget notifications</Text>

      {/* 1. Smart Auto-Capture (TNG & DuitNow) */}
      <TouchableOpacity
        style={styles.settingRowBtn}
        activeOpacity={0.8}
        onPress={() => {
          playUiSound("pop");
          onOpenAutoCaptureModal();
        }}
      >
        <View style={[styles.iconBadge, { backgroundColor: "#FEF08A" }]}>
          <Zap size={16} color="#121212" strokeWidth={2.4} />
        </View>

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={styles.rowTitle}>SMART AUTO-CAPTURE</Text>
            <View
              style={[
                styles.statusChip,
                {
                  backgroundColor: autoCaptureEnabled ? "#DCFCE7" : "#FFE4E6",
                  borderColor: autoCaptureEnabled ? "#15803D" : "#E11D48",
                },
              ]}
            >
              <Text style={[styles.statusChipText, { color: autoCaptureEnabled ? "#15803D" : "#E11D48" }]}>
                {autoCaptureEnabled ? "ENABLED" : "OFF"}
              </Text>
            </View>
          </View>
          <Text style={styles.rowDesc}>Auto-log TNG eWallet, MAE & GrabPay notifications</Text>
        </View>

        <ChevronRight size={16} color={COLORS.textMuted} />
      </TouchableOpacity>

      {/* 2. App Color Theme Picker */}
      <TouchableOpacity
        style={styles.settingRowBtn}
        activeOpacity={0.8}
        onPress={() => {
          playUiSound("pop");
          onOpenThemeModal();
        }}
      >
        <View style={[styles.iconBadge, { backgroundColor: COLORS.primary }]}>
          <Palette size={16} color={COLORS.primaryText} strokeWidth={2.3} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>APP COLOR THEME</Text>
          <Text style={styles.rowDesc}>Active: {currentThemeObj.name} — tap to switch</Text>
        </View>

        <View style={styles.colorSwatchesRow}>
          {(currentThemeObj.previewColors || []).map((hex, i) => (
            <View key={i} style={[styles.colorDot, { backgroundColor: hex }]} />
          ))}
          <ChevronRight size={15} color={COLORS.textMuted} />
        </View>
      </TouchableOpacity>

      {/* 3. In-App Notification Alerts Toggle */}
      <TouchableOpacity style={[styles.settingRowBtn, { marginBottom: 0 }]} activeOpacity={0.8} onPress={onToggleNotifications}>
        <View style={[styles.iconBadge, { backgroundColor: COLORS.secondary }]}>
          <Bell size={16} color={COLORS.text} strokeWidth={2.3} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>IN-APP BUDGET & AI ALERTS</Text>
          <Text style={styles.rowDesc}>Receive 80% / 100% budget warnings and forecast alerts</Text>
        </View>

        <View
          style={[
            styles.togglePill,
            {
              backgroundColor: notificationsEnabled ? "#DCFCE7" : COLORS.secondary,
              borderColor: notificationsEnabled ? "#15803D" : COLORS.border,
            },
          ]}
        >
          <Text style={[styles.togglePillText, { color: notificationsEnabled ? "#15803D" : COLORS.textMuted }]}>
            {notificationsEnabled ? "ON" : "MUTED"}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Theme Selection Modal */}
      <Modal visible={Boolean(showThemeModal)} transparent={true} animationType="fade" onRequestClose={onCloseThemeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>SELECT APP THEME</Text>
              <TouchableOpacity onPress={onCloseThemeModal}>
                <X size={18} color={COLORS.text} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            {Object.values(THEMES).map((t) => {
              const isSelected = t.id === currentThemeId;
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.themeOptionRow, isSelected && styles.themeOptionRowActive]}
                  activeOpacity={0.85}
                  onPress={() => onSelectTheme(t.id)}
                >
                  <View style={styles.colorSwatchesRow}>
                    {t.previewColors.map((hex, idx) => (
                      <View key={idx} style={[styles.colorDotLarge, { backgroundColor: hex }]} />
                    ))}
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.themeOptionTitle}>{t.name}</Text>
                    <Text style={styles.themeOptionSub}>{t.subtitle}</Text>
                  </View>

                  {isSelected && <Check size={16} color={COLORS.primary} strokeWidth={3} />}
                </TouchableOpacity>
              );
            })}

            <WireButton label="CLOSE" variant="outline" onPress={onCloseThemeModal} style={{ marginTop: 8 }} />
          </View>
        </View>
      </Modal>
    </WireBox>
  );
}

const getStyles = () =>
  StyleSheet.create({
    card: {
      padding: 14,
      marginBottom: 14,
    },
    sectionTitle: {
      fontFamily: FONTS.mono,
      fontSize: 10.5,
      fontWeight: "bold",
      color: COLORS.text,
    },
    sectionSub: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      color: COLORS.textMuted,
      marginTop: 2,
      marginBottom: 10,
    },
    settingRowBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderWidth: 1.5,
      borderColor: COLORS.border,
      borderRadius: SHAPES.inputRadius,
      backgroundColor: COLORS.secondary,
      padding: 11,
      marginBottom: 9,
    },
    iconBadge: {
      width: 34,
      height: 34,
      borderRadius: 17,
      borderWidth: 1.2,
      borderColor: COLORS.border,
      alignItems: "center",
      justifyContent: "center",
    },
    rowTitle: {
      fontFamily: FONTS.mono,
      fontSize: 9.5,
      fontWeight: "bold",
      color: COLORS.text,
    },
    rowDesc: {
      fontFamily: FONTS.mono,
      fontSize: 8,
      color: COLORS.textMuted,
      marginTop: 2,
    },
    statusChip: {
      borderWidth: 1,
      borderRadius: 4,
      paddingHorizontal: 5,
      paddingVertical: 1,
    },
    statusChipText: {
      fontFamily: FONTS.mono,
      fontSize: 7,
      fontWeight: "bold",
    },
    colorSwatchesRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    colorDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: "#121212",
    },
    colorDotLarge: {
      width: 15,
      height: 15,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: "#121212",
    },
    togglePill: {
      borderWidth: 1.2,
      borderRadius: SHAPES.chipRadius,
      paddingHorizontal: 9,
      paddingVertical: 4,
    },
    togglePillText: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      fontWeight: "bold",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.55)",
      justifyContent: "center",
      alignItems: "center",
      padding: 18,
    },
    modalCard: {
      width: "100%",
      maxWidth: 365,
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      borderRadius: SHAPES.cardRadius,
      backgroundColor: COLORS.card,
      padding: 16,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottomWidth: 1.5,
      borderColor: COLORS.borderMuted,
      borderStyle: "dashed",
      paddingBottom: 10,
      marginBottom: 10,
    },
    modalTitle: {
      fontFamily: FONTS.mono,
      fontSize: 12,
      fontWeight: "bold",
      color: COLORS.text,
    },
    themeOptionRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderWidth: 1.5,
      borderColor: COLORS.borderMuted,
      borderRadius: SHAPES.inputRadius,
      backgroundColor: COLORS.inputBg,
      padding: 10,
      marginBottom: 8,
    },
    themeOptionRowActive: {
      borderColor: COLORS.primary,
      backgroundColor: COLORS.secondary,
    },
    themeOptionTitle: {
      fontFamily: FONTS.mono,
      fontSize: 10,
      fontWeight: "bold",
      color: COLORS.text,
    },
    themeOptionSub: {
      fontFamily: FONTS.mono,
      fontSize: 8,
      color: COLORS.textMuted,
      marginTop: 1,
    },
  });
