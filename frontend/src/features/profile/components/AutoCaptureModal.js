/**
 * @file frontend/src/features/profile/components/AutoCaptureModal.js
 * @layer Profile Feature Modal Component (Smart Auto-Capture Setup & Step-by-Step User Guide)
 * @description Clean, user-friendly setup modal for Smart Auto-Capture on Android (System Notification Access) and iPhone (iOS Shortcuts), showing real-time readiness status and clear instructions for live eWallet/bank testing.
 * @exports default AutoCaptureModal
 */

import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Modal, ScrollView, ActivityIndicator, Platform, AppState, StyleSheet } from "react-native";
import { Zap, Smartphone, Copy, Check, X, ExternalLink, CheckCircle2, AlertCircle, HelpCircle, ChevronDown, ChevronUp } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import apiClient from "../../../api/apiClient";
import { COLORS, SHAPES, FONTS } from "../../../theme/colors";
import { playUiSound } from "../../../utils/soundEffects";
import {
  checkAndroidNotificationListenerPermission,
  openAndroidNotificationListenerSettings,
  syncAutoCaptureUserToNative,
} from "../../../services/autoCaptureService";
import WireButton from "../../../components/shared/WireButton";
import FloatingToast from "../../../components/shared/FloatingToast";
import { useFloatingToast } from "../../../components/shared/useFloatingToast";

export default function AutoCaptureModal({ visible = false, onClose, user, autoCaptureEnabled = false, onStatusChanged }) {
  const styles = getStyles();

  // Single FloatingToast instance rendered strictly inside the Modal overlay
  const { toast: modalToast, slideAnim: modalSlideAnim, showToast: notify } = useFloatingToast();

  const [enabled, setEnabled] = useState(Boolean(autoCaptureEnabled));
  const [toggling, setToggling] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState(Platform.OS === "ios" ? "ios" : "android");
  const [copiedField, setCopiedField] = useState(null);
  const [androidListenerStatus, setAndroidListenerStatus] = useState("unavailable");
  const [showRestrictedHelp, setShowRestrictedHelp] = useState(false);

  const refreshAndroidListenerStatus = async () => {
    const status = await checkAndroidNotificationListenerPermission();
    setAndroidListenerStatus(status);
    if (user?.id) {
      await syncAutoCaptureUserToNative(user.id, Boolean(autoCaptureEnabled));
    }
  };

  useEffect(() => {
    setEnabled(Boolean(autoCaptureEnabled));
    if (visible) {
      refreshAndroidListenerStatus();
    }
  }, [autoCaptureEnabled, visible]);

  // Automatically re-check Android Notification Access when user returns from Android Settings
  useEffect(() => {
    if (!visible || Platform.OS !== "android") return;
    const sub = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        refreshAndroidListenerStatus();
      }
    });
    return () => sub.remove();
  }, [visible]);

  // Build full webhook endpoint URL for iOS Shortcuts
  const baseApiUrl = apiClient.defaults?.baseURL || "https://kaching-backend-27o2.onrender.com/api";
  const webhookUrl = `${baseApiUrl.replace(/\/$/, "")}/transactions/auto-capture`;

  const iosShortcutJsonTemplate = JSON.stringify(
    {
      userId: user?.id || "YOUR_USER_ID",
      title: "Touch 'n Go eWallet",
      text: "Shortcut Input (Notification Text)",
      platform: "IOS_27_SHORTCUT",
    },
    null,
    2,
  );

  // 1. Toggle Master Opt-In Switch in MongoDB & sync to Android Native Listener
  const handleToggleMasterSwitch = async () => {
    if (!user?.id || toggling) return;
    const nextState = !enabled;

    try {
      setToggling(true);
      playUiSound("pop");
      const res = await apiClient.put(`/transactions/auto-capture-toggle/${user.id}`, {
        enabled: nextState,
      });

      const confirmedState = Boolean(res.data?.autoCaptureEnabled);
      setEnabled(confirmedState);

      // Sync to AsyncStorage & Android Native SharedPreferences
      try {
        await syncAutoCaptureUserToNative(user.id, confirmedState);
        const savedUserJson = await AsyncStorage.getItem("userData");
        if (savedUserJson) {
          const parsedUser = JSON.parse(savedUserJson);
          parsedUser.autoCaptureEnabled = confirmedState;
          await AsyncStorage.setItem("userData", JSON.stringify(parsedUser));
        }
      } catch (e) {
        // Non-blocking
      }

      if (typeof onStatusChanged === "function") {
        onStatusChanged(confirmedState);
      }

      notify(confirmedState ? "success" : "info", confirmedState ? "Step 1 Complete: Smart Auto-Capture is ON!" : "Smart Auto-Capture turned OFF.");
    } catch (error) {
      notify("error", error.response?.data?.message || "Failed to update Auto-Capture status.");
    } finally {
      setToggling(false);
    }
  };

  // 2. Copy Webhook URL or JSON payload to clipboard (for iOS Shortcuts)
  const handleCopyText = async (fieldKey, textValue) => {
    playUiSound("pop");
    try {
      if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(textValue);
      } else {
        try {
          const { Share } = require("react-native");
          await Share.share({ message: textValue });
        } catch (shareErr) {
          // Non-blocking
        }
      }
      setCopiedField(fieldKey);
      notify("success", `Copied ${fieldKey}!`);
      setTimeout(() => setCopiedField(null), 2200);
    } catch (e) {
      notify("info", textValue);
    }
  };

  // 3. Open Android System Notification Access Settings Directly
  const handleOpenAndroidSettings = async () => {
    playUiSound("pop");
    if (Platform.OS === "web") {
      notify("info", "On your Android phone APK, this button opens Settings -> Notification Access directly.");
      return;
    }
    await openAndroidNotificationListenerSettings();
  };

  const isAndroidAccessGranted = androidListenerStatus === "authorized";
  const isFullyReadyOnAndroid = enabled && isAndroidAccessGranted;

  return (
    <Modal
      visible={Boolean(visible)}
      transparent={true}
      animationType="fade"
      onRequestClose={() => {
        playUiSound("pop");
        if (onClose) onClose();
      }}
    >
      <View style={styles.modalOverlay}>
        <FloatingToast toast={modalToast} slideAnim={modalSlideAnim} />

        <View style={styles.modalCard}>
          {/* Header Row */}
          <View style={styles.headerRow}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                flex: 1,
              }}
            >
              <View style={styles.zapBadge}>
                <Zap size={14} color="#121212" strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>SMART AUTO-CAPTURE SETUP</Text>
                <Text style={styles.modalSubtitle}>Automatically log Touch 'n Go eWallet, MAE & GrabPay payments</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => {
                playUiSound("pop");
                if (onClose) onClose();
              }}
            >
              <X size={18} color={COLORS.text} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 470 }} showsVerticalScrollIndicator={false}>
            {/* STEP 1: Account Privacy Switch (PDPA Consent) */}
            <View style={[styles.stepBox, enabled ? styles.stepBoxReady : styles.stepBoxPending]}>
              <View style={styles.stepTopRow}>
                <View style={styles.stepBadgeRow}>
                  <View style={[styles.stepCircle, { backgroundColor: enabled ? "#15803D" : "#E11D48" }]}>
                    <Text style={styles.stepCircleText}>1</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stepHeading}>STEP 1: ENABLE AUTO-CAPTURE SWITCH</Text>
                    <Text style={[styles.stepStatusSub, { color: enabled ? "#15803D" : "#E11D48" }]}>
                      {enabled ? "✓ Enabled — Your account is ready to log payments" : "Currently OFF — Turn this ON first"}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.togglePillBtn, { backgroundColor: enabled ? "#15803D" : COLORS.primary }]}
                  onPress={handleToggleMasterSwitch}
                  disabled={toggling}
                >
                  {toggling ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={[styles.togglePillText, { color: enabled ? "#FFFFFF" : COLORS.primaryText }]}>
                      {enabled ? "ENABLED" : "TURN ON"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              <Text style={styles.stepDescription}>
                Only notifications containing an <Text style={{ fontWeight: "bold" }}>RM / MYR</Text> payment amount from banking & eWallet apps are
                recorded. Personal chats are ignored.
              </Text>
            </View>

            {/* Platform Switcher Tabs */}
            <View style={styles.platformTabsRow}>
              <TouchableOpacity
                style={[styles.platformTabBtn, activeGuideTab === "android" && styles.platformTabBtnActive]}
                onPress={() => {
                  playUiSound("tab");
                  setActiveGuideTab("android");
                }}
              >
                <Zap size={13} color={activeGuideTab === "android" ? COLORS.primaryText : COLORS.text} />
                <Text style={[styles.platformTabText, activeGuideTab === "android" && styles.platformTabTextActive]}>ANDROID PHONE</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.platformTabBtn, activeGuideTab === "ios" && styles.platformTabBtnActive]}
                onPress={() => {
                  playUiSound("tab");
                  setActiveGuideTab("ios");
                }}
              >
                <Smartphone size={13} color={activeGuideTab === "ios" ? COLORS.primaryText : COLORS.text} />
                <Text style={[styles.platformTabText, activeGuideTab === "ios" && styles.platformTabTextActive]}>iPHONE (iOS)</Text>
              </TouchableOpacity>
            </View>

            {/* STEP 2: Phone OS Setup */}
            {activeGuideTab === "android" ? (
              <View style={[styles.stepBox, isAndroidAccessGranted ? styles.stepBoxReady : styles.stepBoxNeutral]}>
                <View style={styles.stepBadgeRow}>
                  <View
                    style={[
                      styles.stepCircle,
                      {
                        backgroundColor: isAndroidAccessGranted ? "#15803D" : COLORS.primary,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.stepCircleText,
                        {
                          color: isAndroidAccessGranted ? "#FFFFFF" : COLORS.primaryText,
                        },
                      ]}
                    >
                      2
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stepHeading}>STEP 2: ALLOW ANDROID NOTIFICATION ACCESS</Text>
                    <Text
                      style={[
                        styles.stepStatusSub,
                        {
                          color: isAndroidAccessGranted ? "#15803D" : COLORS.textMuted,
                        },
                      ]}
                    >
                      {isAndroidAccessGranted ? "✓ System Permission Granted" : "One-time phone permission required"}
                    </Text>
                  </View>
                </View>

                <View style={styles.numberedListBox}>
                  <Text style={styles.numberedItem}>
                    <Text style={{ fontWeight: "bold" }}>1.</Text> Tap the <Text style={{ fontWeight: "bold" }}>Open Notification Access</Text> button
                    below.
                  </Text>
                  <Text style={styles.numberedItem}>
                    <Text style={{ fontWeight: "bold" }}>2.</Text> Find <Text style={{ fontWeight: "bold" }}>Ka-Ching!</Text> in the list and switch
                    it <Text style={{ fontWeight: "bold" }}>ON</Text>.
                  </Text>
                  <Text style={[styles.numberedItem, { marginBottom: 0 }]}>
                    <Text style={{ fontWeight: "bold" }}>3.</Text> Done! Any payment or transfer you make in{" "}
                    <Text style={{ fontWeight: "bold" }}>Touch 'n Go eWallet, MAE, or GrabPay</Text> will be logged automatically with an{" "}
                    <Text style={{ fontWeight: "bold", color: "#15803D" }}>AUTO</Text> badge.
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.primaryActionBtn, isAndroidAccessGranted && styles.primaryActionBtnDone]}
                  onPress={handleOpenAndroidSettings}
                >
                  <ExternalLink size={14} color={isAndroidAccessGranted ? "#15803D" : COLORS.primaryText} />
                  <Text style={[styles.primaryActionBtnText, isAndroidAccessGranted && { color: "#15803D" }]}>
                    {isAndroidAccessGranted ? "NOTIFICATION ACCESS GRANTED (VIEW SETTINGS)" : "OPEN ANDROID NOTIFICATION ACCESS"}
                  </Text>
                </TouchableOpacity>

                {/* Collapsible Help for Android 13/14/15 "Restricted Setting" */}
                <TouchableOpacity
                  style={styles.helpAccordionHeader}
                  onPress={() => {
                    playUiSound("pop");
                    setShowRestrictedHelp(!showRestrictedHelp);
                  }}
                >
                  <HelpCircle size={13} color={COLORS.textMuted} />
                  <Text style={styles.helpAccordionTitle}>Switch greyed out or says "Restricted Setting"?</Text>
                  {showRestrictedHelp ? <ChevronUp size={14} color={COLORS.textMuted} /> : <ChevronDown size={14} color={COLORS.textMuted} />}
                </TouchableOpacity>

                {showRestrictedHelp && (
                  <View style={styles.helpAccordionBody}>
                    <Text style={styles.helpAccordionText}>
                      On Android 13+, APK apps require a 1-time unlock:{"\n"}
                      1. Open phone{" "}
                      <Text style={{ fontWeight: "bold" }}>
                        Settings {"->"} Apps {"->"} Ka-Ching!
                      </Text>
                      {"\n"}
                      2. Tap <Text style={{ fontWeight: "bold" }}>"Allow restricted settings"</Text> (top-right ⋮ menu or bottom of page) and turn ON{" "}
                      <Text style={{ fontWeight: "bold" }}>"Autostart"</Text>.{"\n"}
                      3. Return here and enable Notification Access.
                    </Text>
                  </View>
                )}

                {/* Overall Readiness Banner */}
                <View
                  style={[
                    styles.readinessBanner,
                    {
                      backgroundColor: isFullyReadyOnAndroid ? "#DCFCE7" : "#FEF3C7",
                      borderColor: isFullyReadyOnAndroid ? "#15803D" : "#D97706",
                    },
                  ]}
                >
                  {isFullyReadyOnAndroid ? (
                    <CheckCircle2 size={15} color="#15803D" strokeWidth={2.5} />
                  ) : (
                    <AlertCircle size={15} color="#B45309" strokeWidth={2.5} />
                  )}
                  <Text
                    style={[
                      styles.readinessBannerText,
                      {
                        color: isFullyReadyOnAndroid ? "#15803D" : "#B45309",
                      },
                    ]}
                  >
                    {isFullyReadyOnAndroid
                      ? "ALL SET! Open Touch 'n Go eWallet or MAE and make any payment or transfer — Ka-Ching! will capture it automatically."
                      : "Complete Step 1 and Step 2 above to start capturing live eWallet & bank notifications."}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={[styles.stepBox, styles.stepBoxNeutral]}>
                <View style={styles.stepBadgeRow}>
                  <View style={[styles.stepCircle, { backgroundColor: COLORS.primary }]}>
                    <Text style={[styles.stepCircleText, { color: COLORS.primaryText }]}>2</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stepHeading}>STEP 2: ADD iPHONE SHORTCUTS AUTOMATION</Text>
                    <Text style={styles.stepStatusSub}>Forwards Apple Pay / eWallet alerts to Ka-Ching!</Text>
                  </View>
                </View>

                <View style={styles.numberedListBox}>
                  <Text style={styles.numberedItem}>
                    <Text style={{ fontWeight: "bold" }}>1.</Text> Open the <Text style={{ fontWeight: "bold" }}>Shortcuts</Text> app on iPhone {"->"}{" "}
                    tap <Text style={{ fontWeight: "bold" }}>Automation</Text> {"->"} tap <Text style={{ fontWeight: "bold" }}>+</Text>.
                  </Text>
                  <Text style={styles.numberedItem}>
                    <Text style={{ fontWeight: "bold" }}>2.</Text> Choose <Text style={{ fontWeight: "bold" }}>Transaction</Text> (or{" "}
                    <Text style={{ fontWeight: "bold" }}>App</Text> when Touch 'n Go eWallet closes) and set to{" "}
                    <Text style={{ fontWeight: "bold" }}>Run Immediately</Text>.
                  </Text>
                  <Text style={[styles.numberedItem, { marginBottom: 0 }]}>
                    <Text style={{ fontWeight: "bold" }}>3.</Text> Add action <Text style={{ fontWeight: "bold" }}>Get Contents of URL</Text> (Method:{" "}
                    <Text style={{ fontWeight: "bold" }}>POST</Text>, Body: <Text style={{ fontWeight: "bold" }}>JSON</Text>) and paste the URL & JSON
                    below:
                  </Text>
                </View>

                {/* Copyable Webhook URL */}
                <View style={styles.codeBlock}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.codeLabel}>WEBHOOK URL (POST):</Text>
                    <Text style={styles.codeText} numberOfLines={1} selectable={true}>
                      {webhookUrl}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.copyBtn} onPress={() => handleCopyText("URL", webhookUrl)}>
                    {copiedField === "URL" ? <Check size={12} color="#15803D" /> : <Copy size={12} color={COLORS.text} />}
                    <Text style={styles.copyBtnText}>{copiedField === "URL" ? "COPIED" : "COPY URL"}</Text>
                  </TouchableOpacity>
                </View>

                {/* Copyable JSON Body */}
                <View style={[styles.codeBlock, { marginTop: 6 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.codeLabel}>JSON BODY (YOUR USER ID PRE-FILLED):</Text>
                    <Text style={styles.codeText} numberOfLines={4} selectable={true}>
                      {iosShortcutJsonTemplate}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.copyBtn} onPress={() => handleCopyText("JSON", iosShortcutJsonTemplate)}>
                    {copiedField === "JSON" ? <Check size={12} color="#15803D" /> : <Copy size={12} color={COLORS.text} />}
                    <Text style={styles.copyBtnText}>{copiedField === "JSON" ? "COPIED" : "COPY JSON"}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>

          <WireButton
            label="DONE"
            variant="outline"
            onPress={() => {
              playUiSound("pop");
              if (onClose) onClose();
            }}
            style={{ marginTop: 10 }}
          />
        </View>
      </View>
    </Modal>
  );
}

const getStyles = () =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.58)",
      justifyContent: "center",
      alignItems: "center",
      padding: 16,
      position: "relative",
    },
    modalCard: {
      width: "100%",
      maxWidth: 390,
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      borderRadius: SHAPES.cardRadius,
      backgroundColor: COLORS.card,
      padding: 15,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottomWidth: 1.5,
      borderColor: COLORS.borderMuted,
      borderStyle: "dashed",
      paddingBottom: 10,
      marginBottom: 12,
      gap: 8,
    },
    zapBadge: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: "#FEF08A",
      borderWidth: 1.5,
      borderColor: "#121212",
      alignItems: "center",
      justifyContent: "center",
    },
    modalTitle: {
      fontFamily: FONTS.mono,
      fontSize: 11,
      fontWeight: "bold",
      color: COLORS.text,
    },
    modalSubtitle: {
      fontFamily: FONTS.mono,
      fontSize: 8,
      color: COLORS.textMuted,
      marginTop: 1,
    },
    stepBox: {
      borderWidth: 1.5,
      borderRadius: SHAPES.inputRadius,
      padding: 11,
      marginBottom: 10,
    },
    stepBoxReady: {
      backgroundColor: "#F0FDF4",
      borderColor: "#15803D",
    },
    stepBoxPending: {
      backgroundColor: "#FFF1F2",
      borderColor: "#E11D48",
    },
    stepBoxNeutral: {
      backgroundColor: COLORS.inputBg,
      borderColor: COLORS.border,
    },
    stepTopRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    stepBadgeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flex: 1,
    },
    stepCircle: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 1.2,
      borderColor: "#121212",
      alignItems: "center",
      justifyContent: "center",
    },
    stepCircleText: {
      fontFamily: FONTS.mono,
      fontSize: 9.5,
      fontWeight: "bold",
      color: "#FFFFFF",
    },
    stepHeading: {
      fontFamily: FONTS.mono,
      fontSize: 9.5,
      fontWeight: "bold",
      color: COLORS.text,
    },
    stepStatusSub: {
      fontFamily: FONTS.mono,
      fontSize: 8,
      color: COLORS.textMuted,
      marginTop: 1,
    },
    stepDescription: {
      fontFamily: FONTS.mono,
      fontSize: 8,
      color: COLORS.textMuted,
      lineHeight: 12,
      marginTop: 7,
    },
    togglePillBtn: {
      paddingHorizontal: 11,
      paddingVertical: 7,
      borderRadius: SHAPES.chipRadius,
      borderWidth: 1.2,
      borderColor: "#121212",
      minWidth: 78,
      alignItems: "center",
    },
    togglePillText: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      fontWeight: "bold",
    },
    platformTabsRow: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 10,
    },
    platformTabBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
      borderWidth: 1.5,
      borderColor: COLORS.border,
      borderRadius: SHAPES.chipRadius,
      backgroundColor: COLORS.secondary,
      paddingVertical: 7,
    },
    platformTabBtnActive: {
      backgroundColor: COLORS.primary,
    },
    platformTabText: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      fontWeight: "bold",
      color: COLORS.text,
    },
    platformTabTextActive: {
      color: COLORS.primaryText,
    },
    numberedListBox: {
      backgroundColor: COLORS.card,
      borderWidth: 1,
      borderColor: COLORS.borderMuted,
      borderRadius: 6,
      padding: 9,
      marginTop: 9,
      marginBottom: 9,
    },
    numberedItem: {
      fontFamily: FONTS.mono,
      fontSize: 8,
      color: COLORS.text,
      lineHeight: 13,
      marginBottom: 5,
    },
    primaryActionBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      borderWidth: 1.5,
      borderColor: COLORS.border,
      borderRadius: SHAPES.buttonRadius,
      backgroundColor: COLORS.primary,
      paddingVertical: 9,
      paddingHorizontal: 10,
    },
    primaryActionBtnDone: {
      backgroundColor: "#DCFCE7",
      borderColor: "#15803D",
    },
    primaryActionBtnText: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      fontWeight: "bold",
      color: COLORS.primaryText,
    },
    helpAccordionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 9,
      paddingTop: 7,
      borderTopWidth: 1,
      borderColor: COLORS.borderMuted,
      borderStyle: "dashed",
    },
    helpAccordionTitle: {
      flex: 1,
      fontFamily: FONTS.mono,
      fontSize: 7.5,
      fontWeight: "bold",
      color: COLORS.textMuted,
    },
    helpAccordionBody: {
      backgroundColor: COLORS.card,
      borderWidth: 1,
      borderColor: COLORS.borderMuted,
      borderRadius: 6,
      padding: 8,
      marginTop: 6,
    },
    helpAccordionText: {
      fontFamily: FONTS.mono,
      fontSize: 7.5,
      color: COLORS.text,
      lineHeight: 12.5,
    },
    readinessBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderWidth: 1.2,
      borderRadius: 6,
      padding: 8,
      marginTop: 9,
    },
    readinessBannerText: {
      flex: 1,
      fontFamily: FONTS.mono,
      fontSize: 7.8,
      fontWeight: "bold",
      lineHeight: 12,
    },
    codeBlock: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderWidth: 1,
      borderColor: COLORS.borderMuted,
      borderRadius: 6,
      backgroundColor: COLORS.card,
      padding: 7,
    },
    codeLabel: {
      fontFamily: FONTS.mono,
      fontSize: 7,
      fontWeight: "bold",
      color: COLORS.textMuted,
    },
    codeText: {
      fontFamily: FONTS.mono,
      fontSize: 7.5,
      color: COLORS.text,
      marginTop: 2,
    },
    copyBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: 6,
      backgroundColor: COLORS.secondary,
      paddingHorizontal: 7,
      paddingVertical: 5,
    },
    copyBtnText: {
      fontFamily: FONTS.mono,
      fontSize: 7.5,
      fontWeight: "bold",
      color: COLORS.text,
    },
  });
