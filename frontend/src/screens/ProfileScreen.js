// Import React hooks, core React Native UI components, and Lucide icons
import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { User, Mail, Palette, Check, ShieldCheck, LogOut, Wallet, ArrowLeftRight, Sparkles } from "lucide-react-native";
import apiClient from "../api/client";
import { COLORS, SHAPES, FONTS, THEMES, ACTIVE_THEME } from "../theme/theme";
import { WireBox, WireButton, FloatingToast, useFloatingToast } from "../components/WireUI";

// Screen 9: User Profile, Account Summary, and Runtime Theme Switcher
export default function ProfileScreen({ user, onChangeTheme, onLogout }) {
  // State for user's quick financial stats and loading indicator
  const [stats, setStats] = useState({ totalTxCount: 0, monthlyLimit: 0, savingsTarget: 0 });
  const [loadingStats, setLoadingStats] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState(ACTIVE_THEME);

  // Global floating toast hook
  const { toast, slideAnim, showToast } = useFloatingToast();

  // Load account statistics on mount
  useEffect(() => {
    fetchAccountStats();
  }, []);

  // Fetch total transaction count and active budget settings for the profile summary card
  const fetchAccountStats = async () => {
    try {
      setLoadingStats(true);
      const [txRes, budgetRes] = await Promise.all([
        apiClient.get(`/transactions/${user.id}`, { params: { page: 1, limit: 1 } }),
        apiClient.get(`/budgets/${user.id}`),
      ]);

      const totalTxCount = txRes.data?.totalCount ?? (txRes.data?.data?.length || 0);
      const budgetData = budgetRes.data?.data || {};

      setStats({
        totalTxCount,
        monthlyLimit: budgetData.monthlyLimit || 0,
        savingsTarget: budgetData.savingsTarget || 0,
      });
    } catch (error) {
      console.log("Failed to load profile stats:", error.message);
    } finally {
      setLoadingStats(false);
    }
  };

  // Handle tapping a theme card to switch the app's visual palette
  const handleSelectTheme = (themeKey) => {
    setSelectedTheme(themeKey);
    if (onChangeTheme) {
      onChangeTheme(themeKey);
    }
    showToast("success", `Switched theme to ${THEMES[themeKey].name}!`);
  };

  const userInitial = (user?.username || user?.email || "U").charAt(0).toUpperCase();

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background, position: "relative" }}>
      <FloatingToast toast={toast} slideAnim={slideAnim} />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Section 1: User Identity Hero Card */}
        <View style={styles.profileHeroCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitialText}>{userInitial}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <View style={styles.verifiedBadge}>
              <ShieldCheck size={11} color="#111111" strokeWidth={2.5} />
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

        {/* Section 3: Interactive Visual Theme Switcher */}
        <WireBox style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Palette size={15} color={COLORS.primary} strokeWidth={2.5} />
              <Text style={styles.cardHeaderTitle}>APPEARANCE & THEME</Text>
            </View>
            <Text style={styles.cardHeaderSub}>Tap to switch style</Text>
          </View>

          <View style={{ padding: 12, gap: 10 }}>
            {Object.values(THEMES).map((themeItem) => {
              const isSelected = selectedTheme === themeItem.id;
              return (
                <TouchableOpacity
                  key={themeItem.id}
                  style={[styles.themeOptionCard, isSelected && styles.themeOptionCardActive]}
                  activeOpacity={0.8}
                  onPress={() => handleSelectTheme(themeItem.id)}
                >
                  {/* Left 3-Color Swatch Preview */}
                  <View style={styles.swatchRow}>
                    {themeItem.previewColors.map((hex, i) => (
                      <View key={i} style={[styles.colorDot, { backgroundColor: hex }]} />
                    ))}
                  </View>

                  {/* Center Theme Name & Description */}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.themeTitle}>{themeItem.name}</Text>
                    <Text style={styles.themeSub}>{themeItem.subtitle}</Text>
                  </View>

                  {/* Right Active Checkmark */}
                  {isSelected && (
                    <View style={styles.activeCheckCircle}>
                      <Check size={12} color={COLORS.primaryText} strokeWidth={3} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </WireBox>

        {/* Section 4: System Architecture Info & Logout Button */}
        <WireBox style={[styles.sectionCard, { padding: 14 }]}>
          <Text style={styles.appVersionTitle}>Ka-Ching! Financial Habit Analyzer v1.0</Text>
          <Text style={styles.appVersionSub}>
            Powered by Google Cloud Vision OCR, Anchored Linear Regression Forecasting & Rule-Based Habit Mining.
          </Text>

          <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.8}>
            <LogOut size={15} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.logoutBtnText}>LOG OUT OF ACCOUNT</Text>
          </TouchableOpacity>
        </WireBox>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
    borderColor: "#111111",
    borderRadius: SHAPES.chipRadius,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginBottom: 5,
  },
  verifiedBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 7.5,
    fontWeight: "bold",
    color: "#111111",
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
  themeOptionCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.borderMuted,
    borderRadius: SHAPES.inputRadius,
    backgroundColor: COLORS.card,
    padding: 11,
    gap: 12,
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
    borderColor: "#222222",
    marginRight: -5,
  },
  themeTitle: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    fontWeight: "bold",
    color: COLORS.text,
    marginLeft: 6,
  },
  themeSub: {
    fontFamily: FONTS.mono,
    fontSize: 8.5,
    color: COLORS.textMuted,
    marginLeft: 6,
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
