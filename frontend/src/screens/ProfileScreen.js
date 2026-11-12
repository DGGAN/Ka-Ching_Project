/**
 * @file frontend/src/screens/ProfileScreen.js
 * @layer Screen (User Profile, Smart Auto-Capture Setup & Theme Switcher)
 * @description Displays user account overview, Smart Auto-Capture (TNG/DuitNow) setup trigger, modal-based theme switcher, and logout action.
 * @exports default ProfileScreen
 */

import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Modal, ActivityIndicator, StyleSheet } from "react-native";
import { Mail, Palette, Check, ShieldCheck, LogOut, Wallet, ArrowLeftRight, Sparkles, ChevronRight, X, Zap } from "lucide-react-native";
import apiClient from "../api/apiClient";
import { COLORS, SHAPES, FONTS, THEMES, ACTIVE_THEME } from "../theme/colors";
import { playUiSound } from "../utils/soundEffects";
import WireBox from "../components/shared/WireBox";
import WireButton from "../components/shared/WireButton";
import FloatingToast from "../components/shared/FloatingToast";
import { useFloatingToast } from "../components/shared/useFloatingToast";
import AutoCaptureModal from "../components/shared/AutoCaptureModal";

export default function ProfileScreen({ user, activeThemeKey, onChangeTheme, onLogout }) {
  const styles = getStyles();

  const [stats, setStats] = useState({
    totalTxCount: 0,
    monthlyLimit: 0,
    savingsTarget: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState(activeThemeKey || ACTIVE_THEME);
  const [showThemeModal, setShowThemeModal] = useState(false);

  // Smart Auto-Capture state & Modal visibility
  const [autoCaptureEnabled, setAutoCaptureEnabled] = useState(false);
  const [showAutoCaptureModal, setShowAutoCaptureModal] = useState(false);

  const { toast, slideAnim, showToast } = useFloatingToast();

  useEffect(() => {
    if (activeThemeKey) {
      setSelectedTheme(activeThemeKey);
    }
  }, [activeThemeKey]);

  useEffect(() => {
    if (user?.id) {
      fetchAccountStats();
    }
  }, [user?.id]);

  // Fetch total transaction count, active budget settings, and Auto-Capture opt-in status
  const fetchAccountStats = async () => {
    try {
      setLoadingStats(true);
      const [txRes, budgetRes, autoRes] = await Promise.all([
        apiClient.get(`/transactions/${user.id}`, {
          params: { page: 1, limit: 1 },
        }),
        apiClient.get(`/budgets/${user.id}`),
        apiClient.get(`/transactions/auto-capture-status/${user.id}`).catch(() => ({ data: { autoCaptureEnabled: false } })),
      ]);

      const totalTxCount = txRes.data?.totalCount ?? (txRes.data?.data?.length || 0);
      const budgetData = budgetRes.data?.data || {};

      setStats({
        totalTxCount,
        monthlyLimit: budgetData.monthlyLimit || 0,
        savingsTarget: budgetData.savingsTarget || 0,
      });
      setAutoCaptureEnabled(Boolean(autoRes.data?.autoCaptureEnabled));
    } catch (error) {
      console.log("Failed to load profile stats:", error.message);
    } finally {
      setLoadingStats(false);
    }
  };

  // Handle selecting a theme inside the modal, play "theme" sound, and apply immediately
  const handleSelectTheme = (themeKey) => {
    setSelectedTheme(themeKey);
    setShowThemeModal(false);
    if (onChangeTheme) {
      onChangeTheme(themeKey);
    }
    showToast("success", `Switched theme to ${THEMES[themeKey].name}!`);
  };

  const userInitial = (user?.username || user?.email || "U").charAt(0).toUpperCase();
  const activeThemeObj = THEMES[selectedTheme] || THEMES.khaki;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.background,
        position: "relative",
      }}
    >
      <FloatingToast toast={toast} slideAnim={slideAnim} />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Section 1: User Identity Hero Card */}
        <View style={styles.profileHeroCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitialText}>{userInitial}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <View style={styles.verifiedBadge}>
              <ShieldCheck size={11} color="#121212" strokeWidth={2.5} />
              <Text style={styles.verifiedBadgeText}>ACTIVE ACCOUNT</Text>
            </View>
            <Text style={styles.usernameText}>{user?.username || "Ka-Ching User"}</Text>
            <View style={styles.emailRow}>
              <Mail size={11} color={COLORS.primaryText} strokeWidth={2.2} />
              <Text style={styles.emailText}>{user?.email || "user@kaching.my"}</Text>
            </View>
          </View>
        </View>

        {/* Section 2: Quick Financial Overview Stats */}
        <WireBox style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeaderTitle}>ACCOUNT OVERVIEW</Text>
            <Text style={styles.cardHeaderSub}>Live database summary</Text>
          </View>

          {loadingStats ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 18 }} />
          ) : (
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <ArrowLeftRight size={15} color={COLORS.primary} strokeWidth={2.3} />
                <Text style={styles.statValue}>{stats.totalTxCount}</Text>
                <Text style={styles.statLabel}>RECORDS LOGGED</Text>
              </View>

              <View style={styles.statBox}>
                <Wallet size={15} color={COLORS.primary} strokeWidth={2.3} />
                <Text style={styles.statValue}>RM {stats.monthlyLimit.toFixed(0)}</Text>
                <Text style={styles.statLabel}>MONTHLY LIMIT</Text>
              </View>

              <View style={styles.statBox}>
                <Sparkles size={15} color={COLORS.primary} strokeWidth={2.3} />
                <Text style={styles.statValue}>RM {stats.savingsTarget.toFixed(0)}</Text>
                <Text style={styles.statLabel}>SAVINGS GOAL</Text>
              </View>
            </View>
          )}
        </WireBox>

        {/* Section 3: Smart Auto-Capture (TNG eWallet / DuitNow / iOS 27 Shortcuts) */}
        <WireBox style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Zap size={15} color={COLORS.primary} strokeWidth={2.5} />
              <Text style={styles.cardHeaderTitle}>SMART AUTO-CAPTURE (TNG & DUITNOW)</Text>
            </View>
            <View
              style={[
                styles.statusBadgePill,
                {
                  backgroundColor: autoCaptureEnabled ? "#DCFCE7" : "#FFE4E6",
                  borderColor: autoCaptureEnabled ? "#15803D" : "#E11D48",
                },
              ]}
            >
              <Text style={[styles.statusBadgePillText, { color: autoCaptureEnabled ? "#15803D" : "#E11D48" }]}>
                {autoCaptureEnabled ? "ENABLED" : "DISABLED"}
              </Text>
            </View>
          </View>

          <View style={{ padding: 12 }}>
            <TouchableOpacity
              style={styles.themeTriggerBtn}
              activeOpacity={0.8}
              onPress={() => {
                playUiSound("pop");
                setShowAutoCaptureModal(true);
              }}
            >
              <View style={styles.zapCircleIcon}>
                <Zap size={16} color="#121212" strokeWidth={2.4} />
              </View>

              <View style={{ flex: 1, marginLeft: 4 }}>
                <Text style={styles.themeTitle}>{autoCaptureEnabled ? "Auto-Capture is Active" : "Enable Payment Auto-Capture"}</Text>
                <Text style={styles.themeSub}>Auto-log TNG eWallet, MAE & GrabPay notifications (Android & iOS 27 Shortcuts)</Text>
              </View>

              <View style={styles.changePillBtn}>
                <Text style={styles.changePillText}>SETUP</Text>
                <ChevronRight size={13} color={COLORS.text} strokeWidth={2.5} />
              </View>
            </TouchableOpacity>
          </View>
        </WireBox>

        {/* Section 4: Compact Theme Selector Row (Opens Theme Modal on Tap) */}
        <WireBox style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Palette size={15} color={COLORS.primary} strokeWidth={2.5} />
              <Text style={styles.cardHeaderTitle}>APPEARANCE & THEME</Text>
            </View>
            <Text style={styles.cardHeaderSub}>{Object.keys(THEMES).length} themes available</Text>
          </View>

          <View style={{ padding: 12 }}>
            <TouchableOpacity
              style={styles.themeTriggerBtn}
              activeOpacity={0.8}
              onPress={() => {
                playUiSound("pop");
                setShowThemeModal(true);
              }}
            >
              <View style={styles.swatchRow}>
                {activeThemeObj.previewColors.map((hex, i) => (
                  <View key={i} style={[styles.colorDot, { backgroundColor: hex }]} />
                ))}
              </View>

              <View style={{ flex: 1, marginLeft: 6 }}>
                <Text style={styles.themeTitle}>{activeThemeObj.name}</Text>
                <Text style={styles.themeSub}>Tap to browse and switch app themes</Text>
              </View>

              <View style={styles.changePillBtn}>
                <Text style={styles.changePillText}>CHANGE</Text>
                <ChevronRight size={13} color={COLORS.text} strokeWidth={2.5} />
              </View>
            </TouchableOpacity>
          </View>
        </WireBox>

        {/* Section 5: System Architecture Info & Logout Button */}
        <WireBox style={[styles.sectionCard, { padding: 14 }]}>
          <Text style={styles.appVersionTitle}>Ka-Ching! Financial Habit Analyzer v1.0</Text>
          <Text style={styles.appVersionSub}>
            Powered by Google Cloud Vision OCR, Anchored Linear Regression Forecasting & Rule-Based Habit Mining.
          </Text>

          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={() => {
              playUiSound("pop");
              if (onLogout) onLogout();
            }}
            activeOpacity={0.8}
          >
            <LogOut size={15} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.logoutBtnText}>LOG OUT OF ACCOUNT</Text>
          </TouchableOpacity>
        </WireBox>

        {/* Modal 1: Smart Auto-Capture Setup & Live Sandbox Modal */}
        <AutoCaptureModal
          visible={showAutoCaptureModal}
          onClose={() => setShowAutoCaptureModal(false)}
          user={user}
          autoCaptureEnabled={autoCaptureEnabled}
          onStatusChanged={(nextStatus) => setAutoCaptureEnabled(nextStatus)}
          onTransactionCaptured={() => fetchAccountStats()}
          showToast={showToast}
        />

        {/* Modal 2: Scrollable Theme Selection Popup */}
        <Modal visible={showThemeModal} transparent={true} animationType="fade" onRequestClose={() => setShowThemeModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.modalTitle}>SELECT APP THEME</Text>
                  <Text style={styles.modalSubtitle}>Choose a color palette for your workspace</Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    playUiSound("pop");
                    setShowThemeModal(false);
                  }}
                >
                  <X size={18} color={COLORS.text} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false}>
                <View style={{ gap: 10, paddingVertical: 4 }}>
                  {Object.values(THEMES).map((themeItem) => {
                    const isSelected = selectedTheme === themeItem.id;
                    return (
                      <TouchableOpacity
                        key={themeItem.id}
                        style={[styles.themeOptionCard, isSelected && styles.themeOptionCardActive]}
                        activeOpacity={0.8}
                        onPress={() => handleSelectTheme(themeItem.id)}
                      >
                        <View style={styles.swatchRow}>
                          {themeItem.previewColors.map((hex, i) => (
                            <View key={i} style={[styles.colorDot, { backgroundColor: hex }]} />
                          ))}
                        </View>

                        <View style={{ flex: 1, marginLeft: 6 }}>
                          <Text style={styles.themeTitle}>{themeItem.name}</Text>
                          <Text style={styles.themeSub}>{themeItem.subtitle}</Text>
                        </View>

                        {isSelected && (
                          <View style={styles.activeCheckCircle}>
                            <Check size={12} color={COLORS.primaryText} strokeWidth={3} />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              <WireButton
                label="CLOSE"
                variant="outline"
                onPress={() => {
                  playUiSound("pop");
                  setShowThemeModal(false);
                }}
                style={{ marginTop: 12 }}
              />
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
}

const getStyles = () =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 36,
    },
    profileHeroCard: {
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      borderRadius: SHAPES.cardRadius,
      backgroundColor: COLORS.primary,
      padding: 16,
      marginBottom: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    avatarCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      borderWidth: 2,
      borderColor: "#FFFFFF",
      backgroundColor: "rgba(0,0,0,0.22)",
      alignItems: "center",
      justifyContent: "center",
    },
    avatarInitialText: {
      fontFamily: FONTS.mono,
      fontSize: 24,
      fontWeight: "bold",
      color: "#FFFFFF",
    },
    verifiedBadge: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      gap: 4,
      backgroundColor: "#FEF08A",
      borderWidth: 1,
      borderColor: "#121212",
      borderRadius: SHAPES.chipRadius,
      paddingHorizontal: 7,
      paddingVertical: 2,
      marginBottom: 5,
    },
    verifiedBadgeText: {
      fontFamily: FONTS.mono,
      fontSize: 7.5,
      fontWeight: "bold",
      color: "#121212",
    },
    usernameText: {
      fontFamily: FONTS.mono,
      fontSize: 16,
      fontWeight: "bold",
      color: COLORS.primaryText,
    },
    emailRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      marginTop: 3,
    },
    emailText: {
      fontFamily: FONTS.mono,
      fontSize: 10,
      color: COLORS.primaryText,
      opacity: 0.9,
    },
    sectionCard: {
      marginBottom: 14,
      padding: 0,
      overflow: "hidden",
    },
    cardHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderBottomWidth: SHAPES.borderWidth,
      borderColor: COLORS.borderMuted,
      borderStyle: "dashed",
    },
    cardHeaderTitle: {
      fontFamily: FONTS.mono,
      fontSize: 11,
      fontWeight: "bold",
      color: COLORS.text,
      letterSpacing: 0.8,
    },
    cardHeaderSub: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      color: COLORS.textMuted,
    },
    statusBadgePill: {
      borderWidth: 1.2,
      borderRadius: SHAPES.chipRadius,
      paddingHorizontal: 8,
      paddingVertical: 2.5,
    },
    statusBadgePillText: {
      fontFamily: FONTS.mono,
      fontSize: 7.5,
      fontWeight: "bold",
    },
    zapCircleIcon: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: "#FEF08A",
      borderWidth: 1.5,
      borderColor: "#121212",
      alignItems: "center",
      justifyContent: "center",
    },
    statsGrid: {
      flexDirection: "row",
      padding: 12,
      gap: 8,
    },
    statBox: {
      flex: 1,
      borderWidth: 1.5,
      borderColor: COLORS.border,
      borderRadius: SHAPES.inputRadius,
      backgroundColor: COLORS.secondary,
      paddingVertical: 10,
      paddingHorizontal: 6,
      alignItems: "center",
    },
    statValue: {
      fontFamily: FONTS.mono,
      fontSize: 12,
      fontWeight: "bold",
      color: COLORS.text,
      marginTop: 5,
    },
    statLabel: {
      fontFamily: FONTS.mono,
      fontSize: 7.5,
      color: COLORS.textMuted,
      marginTop: 2,
      textAlign: "center",
    },
    themeTriggerBtn: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      borderRadius: SHAPES.inputRadius,
      backgroundColor: COLORS.inputBg,
      padding: 12,
      gap: 10,
    },
    changePillBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      borderWidth: 1.5,
      borderColor: COLORS.border,
      borderRadius: SHAPES.chipRadius,
      backgroundColor: COLORS.secondary,
      paddingHorizontal: 9,
      paddingVertical: 5,
    },
    changePillText: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      fontWeight: "bold",
      color: COLORS.text,
    },
    themeOptionCard: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1.5,
      borderColor: COLORS.borderMuted,
      borderRadius: SHAPES.inputRadius,
      backgroundColor: COLORS.card,
      padding: 11,
      gap: 10,
    },
    themeOptionCardActive: {
      borderColor: COLORS.primary,
      backgroundColor: COLORS.secondary,
    },
    swatchRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    colorDot: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 1.5,
      borderColor: "#121212",
      marginRight: -5,
    },
    themeTitle: {
      fontFamily: FONTS.mono,
      fontSize: 11,
      fontWeight: "bold",
      color: COLORS.text,
    },
    themeSub: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      color: COLORS.textMuted,
      marginTop: 2,
    },
    activeCheckCircle: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: COLORS.primary,
      alignItems: "center",
      justifyContent: "center",
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
      maxWidth: 360,
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      borderRadius: SHAPES.cardRadius,
      backgroundColor: COLORS.card,
      padding: 16,
    },
    modalHeaderRow: {
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
      fontSize: 13,
      fontWeight: "bold",
      color: COLORS.text,
      letterSpacing: 0.8,
    },
    modalSubtitle: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      color: COLORS.textMuted,
      marginTop: 2,
    },
    appVersionTitle: {
      fontFamily: FONTS.mono,
      fontSize: 10,
      fontWeight: "bold",
      color: COLORS.text,
      textAlign: "center",
    },
    appVersionSub: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      color: COLORS.textMuted,
      textAlign: "center",
      lineHeight: 13,
      marginTop: 4,
      marginBottom: 14,
    },
    logoutBtn: {
      width: "100%",
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      borderRadius: SHAPES.buttonRadius,
      backgroundColor: COLORS.danger,
      paddingVertical: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    logoutBtnText: {
      fontFamily: FONTS.mono,
      fontSize: 11,
      fontWeight: "bold",
      color: "#FFFFFF",
      letterSpacing: 1.2,
    },
  });
