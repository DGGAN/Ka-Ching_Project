/**
 * @file frontend/src/components/shared/AutoCaptureModal.js
 * @layer Shared Feature Modal Component (Smart Auto-Capture Setup & Live Verification Sandbox)
 * @description Provides the PDPA opt-in master switch, step-by-step iOS 27 Shortcuts & Android Notification Listener setup guides, and a live notification simulation sandbox with a single top-level FloatingToast.
 * @exports default AutoCaptureModal
 */

import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Modal, ScrollView, TextInput, ActivityIndicator, Platform, Linking, StyleSheet } from "react-native";
import { Zap, Smartphone, ShieldCheck, Copy, Check, X, Play, ExternalLink, Send } from "lucide-react-native";
import apiClient from "../../api/apiClient";
import { COLORS, SHAPES, FONTS } from "../../theme/colors";
import { playUiSound } from "../../utils/soundEffects";
import WireButton from "./WireButton";
import FloatingToast from "./FloatingToast";
import { useFloatingToast } from "./useFloatingToast";

// Predefined real-world Malaysian e-wallet & bank notification samples for instant testing
const SAMPLE_NOTIFICATIONS = [
  {
    id: "tng_familymart",
    label: "TNG • FamilyMart (RM 15.90)",
    title: "Touch 'n Go eWallet",
    text: "You have paid RM 15.90 to FAMILYMART SUNWAY using Touch 'n Go eWallet.",
    packageName: "my.com.tngdigital.ewallet",
  },
  {
    id: "tng_chagee",
    label: "TNG • Chagee (RM 22.80)",
    title: "Touch 'n Go eWallet",
    text: "You have paid RM 22.80 to CHAGEE PAVILION using Touch 'n Go eWallet.",
    packageName: "my.com.tngdigital.ewallet",
  },
  {
    id: "grab_ride",
    label: "GrabPay • Grab Ride (RM 18.00)",
    title: "Grab",
    text: "Paid RM 18.00 to Grab Ride via GrabPay.",
    packageName: "com.grabtaxi.passenger",
  },
  {
    id: "mae_groceries",
    label: "MAE • Jaya Grocer (RM 64.50)",
    title: "MAE by Maybank2u",
    text: "DuitNow QR payment of RM 64.50 to JAYA GROCER was successful.",
    packageName: "com.maybank2u.life",
  },
  {
    id: "duitnow_income",
    label: "DuitNow • Received (+RM 120.00)",
    title: "DuitNow Transfer",
    text: "You have received RM 120.00 from FREELANCE CLIENT via DuitNow.",
    packageName: "com.maybank2u.life",
  },
];

export default function AutoCaptureModal({ visible = false, onClose, user, autoCaptureEnabled = false, onStatusChanged, onTransactionCaptured }) {
  const styles = getStyles();

  // Single FloatingToast instance rendered strictly inside the Modal overlay (prevents duplicate background toast)
  const { toast: modalToast, slideAnim: modalSlideAnim, showToast: notify } = useFloatingToast();

  const [enabled, setEnabled] = useState(Boolean(autoCaptureEnabled));
  const [toggling, setToggling] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState(Platform.OS === "ios" ? "ios" : "android");
  const [copiedField, setCopiedField] = useState(null);
  const [simulatingId, setSimulatingId] = useState(null);
  const [customNotifText, setCustomNotifText] = useState("");
  const [lastCapturedResult, setLastCapturedResult] = useState(null);

  useEffect(() => {
    setEnabled(Boolean(autoCaptureEnabled));
  }, [autoCaptureEnabled, visible]);

  // Build full webhook endpoint URL using apiClient baseURL
  const baseApiUrl = apiClient.defaults?.baseURL || "http://localhost:5000/api";
  const webhookUrl = `${baseApiUrl.replace(/\/$/, "")}/transactions/auto-capture`;

  const shortcutJsonTemplate = JSON.stringify(
    {
      userId: user?.id || "YOUR_USER_ID",
      title: "Touch 'n Go eWallet",
      text: "You have paid RM 15.90 to FAMILYMART using Touch 'n Go eWallet.",
      platform: "IOS_27_SHORTCUT",
    },
    null,
    2,
  );

  // 1. Toggle Master Opt-In Switch in MongoDB
  const handleToggleMasterSwitch = async () => {
    if (!user?.id || toggling) return;
    const nextState = !enabled;

    try {
      setToggling(true);
      playUiSound("pop");
      const res = await apiClient.put(`/transactions/auto-capture-toggle/${user.id}`, { enabled: nextState });

      const confirmedState = Boolean(res.data?.autoCaptureEnabled);
      setEnabled(confirmedState);
      if (typeof onStatusChanged === "function") {
        onStatusChanged(confirmedState);
      }

      notify(confirmedState ? "success" : "info", confirmedState ? "Smart Auto-Capture ENABLED!" : "Smart Auto-Capture DISABLED.");
    } catch (error) {
      notify("error", error.response?.data?.message || "Failed to update Auto-Capture status.");
    } finally {
      setToggling(false);
    }
  };

  // 2. Copy Webhook URL or JSON payload to clipboard
  const handleCopyText = async (fieldKey, textValue) => {
    playUiSound("pop");
    try {
      if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(textValue);
      }
      setCopiedField(fieldKey);
      notify("success", `Copied ${fieldKey} to clipboard!`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (e) {
      notify("info", textValue);
    }
  };

  // 3. Open Android Notification Access Settings
  const handleOpenAndroidSettings = () => {
    playUiSound("pop");
    if (Platform.OS === "web") {
      notify("info", "On an Android phone, this opens Settings -> Special App Access -> Notification Access.");
      return;
    }
    Linking.openSettings().catch(() => {
      notify("error", "Could not open device settings.");
    });
  };

  // 4. Simulate or Send a Live Payment Notification to POST /api/transactions/auto-capture
  const handleSimulateNotification = async (sampleObj) => {
    if (!user?.id) return;

    try {
      setSimulatingId(sampleObj.id);
      const res = await apiClient.post("/transactions/auto-capture", {
        userId: user.id,
        title: sampleObj.title,
        text: sampleObj.text,
        packageName: sampleObj.packageName,
        platform: activeGuideTab === "ios" ? "IOS_27_SHORTCUT" : "ANDROID_LISTENER",
      });

      const capturedTx = res.data?.data;
      setLastCapturedResult(capturedTx);

      // Play #1 "income" gem sound for income or #2 "expense" pipe sound for expenses
      if (capturedTx?.type === "INCOME") {
        playUiSound("income");
      } else {
        playUiSound("expense");
      }

      notify("success", res.data?.message || "Payment auto-captured into Transaction History!");

      if (typeof onTransactionCaptured === "function") {
        onTransactionCaptured(capturedTx);
      }
    } catch (error) {
      playUiSound("pop");
      const errMsg = error.response?.data?.message || "Auto-capture blocked or failed. Make sure the switch above is ENABLED.";
      notify("error", errMsg);
    } finally {
      setSimulatingId(null);
    }
  };

  // 5. Send Custom Notification Text from Input Box
  const handleSendCustomNotification = async () => {
    const cleanText = customNotifText.trim();
    if (!cleanText) {
      notify("error", "Enter a payment notification text first (e.g. Paid RM 19.90 to ZUS COFFEE).");
      return;
    }

    await handleSimulateNotification({
      id: "custom_input",
      title: "Touch 'n Go eWallet",
      text: cleanText,
      packageName: "my.com.tngdigital.ewallet",
    });
    setCustomNotifText("");
  };

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
        {/* Single Top-Level FloatingToast inside the Modal */}
        <FloatingToast toast={modalToast} slideAnim={modalSlideAnim} />

        <View style={styles.modalCard}>
          {/* Header Row */}
          <View style={styles.headerRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={styles.zapBadge}>
                <Zap size={14} color="#121212" strokeWidth={2.5} />
              </View>
              <View>
                <Text style={styles.modalTitle}>SMART AUTO-CAPTURE (TNG & DUITNOW)</Text>
                <Text style={styles.modalSubtitle}>Zero-touch expense logging from payment notifications</Text>
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

          <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false}>
            {/* 1. Master Opt-In Switch Card (PDPA 2010 Privacy Gatekeeper) */}
            <View style={[styles.masterSwitchCard, enabled ? styles.masterSwitchCardOn : styles.masterSwitchCardOff]}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <ShieldCheck size={14} color={enabled ? "#15803D" : "#E11D48"} strokeWidth={2.5} />
                  <Text style={[styles.masterStatusTitle, { color: enabled ? "#15803D" : "#E11D48" }]}>
                    STATUS: {enabled ? "ENABLED (ACTIVE)" : "DISABLED (LOCKED)"}
                  </Text>
                </View>
                <Text style={styles.masterStatusDesc}>
                  {enabled
                    ? "Incoming TNG eWallet, MAE, GrabPay & DuitNow alerts will be parsed and logged automatically."
                    : "Privacy Lock Active (PDPA 2010): No background notifications will be captured until you enable this switch."}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.togglePillBtn, { backgroundColor: enabled ? "#15803D" : COLORS.danger }]}
                onPress={handleToggleMasterSwitch}
                disabled={toggling}
              >
                {toggling ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.togglePillText}>{enabled ? "TURN OFF" : "ENABLE NOW"}</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* 2. Platform Setup Guide Switcher: iOS 27 Shortcuts vs Android Listener */}
            <View style={styles.platformTabsRow}>
              <TouchableOpacity
                style={[styles.platformTabBtn, activeGuideTab === "ios" && styles.platformTabBtnActive]}
                onPress={() => {
                  playUiSound("tab");
                  setActiveGuideTab("ios");
                }}
              >
                <Smartphone size={13} color={activeGuideTab === "ios" ? COLORS.primaryText : COLORS.text} />
                <Text style={[styles.platformTabText, activeGuideTab === "ios" && styles.platformTabTextActive]}>iOS 27 SHORTCUTS SETUP</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.platformTabBtn, activeGuideTab === "android" && styles.platformTabBtnActive]}
                onPress={() => {
                  playUiSound("tab");
                  setActiveGuideTab("android");
                }}
              >
                <Zap size={13} color={activeGuideTab === "android" ? COLORS.primaryText : COLORS.text} />
                <Text style={[styles.platformTabText, activeGuideTab === "android" && styles.platformTabTextActive]}>ANDROID LISTENER SETUP</Text>
              </TouchableOpacity>
            </View>

            {/* 3. Step-by-Step User Setup Instructions */}
            {activeGuideTab === "ios" ? (
              <View style={styles.guideBox}>
                <Text style={styles.guideHeader}>ONE-TIME iOS 27 APPLE SHORTCUTS AUTOMATION (3 STEPS)</Text>
                <Text style={styles.guideStep}>
                  <Text style={{ fontWeight: "bold" }}>Step 1:</Text> Open the <Text style={{ fontWeight: "bold" }}>Shortcuts</Text> app on your
                  iPhone {"->"} tap <Text style={{ fontWeight: "bold" }}>Automation</Text> {"->"} tap <Text style={{ fontWeight: "bold" }}>+</Text>{" "}
                  (New Automation).
                </Text>
                <Text style={styles.guideStep}>
                  <Text style={{ fontWeight: "bold" }}>Step 2:</Text> Select <Text style={{ fontWeight: "bold" }}>Transaction / Notification</Text>{" "}
                  (or when <Text style={{ fontWeight: "bold" }}>Touch 'n Go eWallet</Text> closes) and choose{" "}
                  <Text style={{ fontWeight: "bold" }}>Run Immediately</Text>.
                </Text>
                <Text style={styles.guideStep}>
                  <Text style={{ fontWeight: "bold" }}>Step 3:</Text> Add action <Text style={{ fontWeight: "bold" }}>Get Contents of URL</Text>{" "}
                  (Method: <Text style={{ fontWeight: "bold" }}>POST</Text>, Body: <Text style={{ fontWeight: "bold" }}>JSON</Text>) and paste your
                  Webhook URL & JSON below:
                </Text>

                {/* Copyable Webhook URL Row */}
                <View style={styles.codeBlock}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.codeLabel}>WEBHOOK ENDPOINT URL:</Text>
                    <Text style={styles.codeText} numberOfLines={1}>
                      {webhookUrl}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.copyBtn} onPress={() => handleCopyText("URL", webhookUrl)}>
                    {copiedField === "URL" ? <Check size={12} color="#15803D" /> : <Copy size={12} color={COLORS.text} />}
                    <Text style={styles.copyBtnText}>{copiedField === "URL" ? "COPIED" : "COPY URL"}</Text>
                  </TouchableOpacity>
                </View>

                {/* Copyable JSON Payload Template */}
                <View style={[styles.codeBlock, { marginTop: 6 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.codeLabel}>SHORTCUT JSON BODY (USER ID PRE-FILLED):</Text>
                    <Text style={styles.codeText} numberOfLines={3}>
                      {shortcutJsonTemplate}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.copyBtn} onPress={() => handleCopyText("JSON", shortcutJsonTemplate)}>
                    {copiedField === "JSON" ? <Check size={12} color="#15803D" /> : <Copy size={12} color={COLORS.text} />}
                    <Text style={styles.copyBtnText}>{copiedField === "JSON" ? "COPIED" : "COPY JSON"}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.guideBox}>
                <Text style={styles.guideHeader}>ONE-TIME ANDROID NOTIFICATION ACCESS (2 STEPS)</Text>
                <Text style={styles.guideStep}>
                  <Text style={{ fontWeight: "bold" }}>Step 1:</Text> Turn ON the <Text style={{ fontWeight: "bold" }}>Smart Auto-Capture</Text>{" "}
                  master switch above.
                </Text>
                <Text style={styles.guideStep}>
                  <Text style={{ fontWeight: "bold" }}>Step 2:</Text> Grant <Text style={{ fontWeight: "bold" }}>Notification Listener Access</Text>{" "}
                  (or forward via MacroDroid HTTP Webhook to <Text style={{ fontWeight: "bold" }}>{webhookUrl}</Text>) so Ka-Ching! can detect Touch
                  'n Go eWallet, MAE, and GrabPay payment alerts in the background:
                </Text>

                <TouchableOpacity style={styles.androidSettingsBtn} onPress={handleOpenAndroidSettings}>
                  <ExternalLink size={13} color={COLORS.primary} />
                  <Text style={styles.androidSettingsText}>OPEN ANDROID NOTIFICATION ACCESS SETTINGS</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* 4. Live Verification Sandbox (Test Disabled vs Enabled Behavior) */}
            <View style={styles.sandboxCard}>
              <Text style={styles.sandboxTitle}>LIVE VERIFICATION SANDBOX (TEST IT NOW)</Text>
              <Text style={styles.sandboxSub}>
                Tap any real Malaysian payment notification below to test the pipeline (try tapping while DISABLED vs ENABLED):
              </Text>

              <View style={styles.samplePillsWrap}>
                {SAMPLE_NOTIFICATIONS.map((item) => {
                  const isRunning = simulatingId === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.samplePillBtn}
                      onPress={() => handleSimulateNotification(item)}
                      disabled={Boolean(simulatingId)}
                    >
                      {isRunning ? (
                        <ActivityIndicator size="small" color={COLORS.primary} />
                      ) : (
                        <Play size={11} color={COLORS.primary} strokeWidth={2.5} />
                      )}
                      <Text style={styles.samplePillText}>{item.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Custom Notification Text Tester */}
              <View style={styles.customInputRow}>
                <TextInput
                  style={styles.customInput}
                  placeholder="Or type custom notification: Paid RM 19.90 to ZUS COFFEE"
                  placeholderTextColor={COLORS.textMuted}
                  value={customNotifText}
                  onChangeText={setCustomNotifText}
                />
                <TouchableOpacity style={styles.sendCustomBtn} onPress={handleSendCustomNotification}>
                  <Send size={13} color={COLORS.primaryText} />
                  <Text style={styles.sendCustomBtnText}>SEND</Text>
                </TouchableOpacity>
              </View>

              {/* Last Captured Result Feedback Box */}
              {lastCapturedResult && (
                <View style={styles.capturedResultBox}>
                  <Text style={styles.capturedResultTitle}>LAST AUTO-CAPTURED RECORD (SAVED WITH "AUTO" BADGE):</Text>
                  <Text style={styles.capturedResultMeta}>
                    • Merchant: {lastCapturedResult.merchantName} | Amount: RM {Number(lastCapturedResult.amount).toFixed(2)}
                  </Text>
                  <Text style={styles.capturedResultMeta}>
                    • Category: {lastCapturedResult.category} ({lastCapturedResult.budgetType}) | Source: {lastCapturedResult.source}
                  </Text>
                </View>
              )}
            </View>
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
      marginBottom: 10,
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
    masterSwitchCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderWidth: 1.5,
      borderRadius: SHAPES.inputRadius,
      padding: 10,
      marginBottom: 10,
    },
    masterSwitchCardOn: {
      backgroundColor: "#F0FDF4",
      borderColor: "#15803D",
    },
    masterSwitchCardOff: {
      backgroundColor: "#FFF1F2",
      borderColor: "#E11D48",
    },
    masterStatusTitle: {
      fontFamily: FONTS.mono,
      fontSize: 9.5,
      fontWeight: "bold",
    },
    masterStatusDesc: {
      fontFamily: FONTS.mono,
      fontSize: 8,
      color: COLORS.textMuted,
      lineHeight: 12,
      marginTop: 3,
    },
    togglePillBtn: {
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: SHAPES.chipRadius,
      borderWidth: 1.2,
      borderColor: "#121212",
      minWidth: 82,
      alignItems: "center",
    },
    togglePillText: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      fontWeight: "bold",
      color: "#FFFFFF",
    },
    platformTabsRow: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 8,
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
      fontSize: 8,
      fontWeight: "bold",
      color: COLORS.text,
    },
    platformTabTextActive: {
      color: COLORS.primaryText,
    },
    guideBox: {
      borderWidth: 1.2,
      borderColor: COLORS.borderMuted,
      borderRadius: SHAPES.inputRadius,
      backgroundColor: COLORS.inputBg,
      padding: 10,
      marginBottom: 10,
    },
    guideHeader: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      fontWeight: "bold",
      color: COLORS.primary,
      marginBottom: 6,
    },
    guideStep: {
      fontFamily: FONTS.mono,
      fontSize: 8,
      color: COLORS.text,
      lineHeight: 12.5,
      marginBottom: 4,
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
      marginTop: 4,
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
    androidSettingsBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      borderWidth: 1.2,
      borderColor: COLORS.primary,
      borderRadius: SHAPES.chipRadius,
      backgroundColor: COLORS.card,
      paddingVertical: 8,
      marginTop: 6,
    },
    androidSettingsText: {
      fontFamily: FONTS.mono,
      fontSize: 8,
      fontWeight: "bold",
      color: COLORS.primary,
    },
    sandboxCard: {
      borderWidth: 1.5,
      borderColor: COLORS.border,
      borderStyle: "dashed",
      borderRadius: SHAPES.inputRadius,
      backgroundColor: COLORS.secondary,
      padding: 10,
    },
    sandboxTitle: {
      fontFamily: FONTS.mono,
      fontSize: 9,
      fontWeight: "bold",
      color: COLORS.text,
    },
    sandboxSub: {
      fontFamily: FONTS.mono,
      fontSize: 7.5,
      color: COLORS.textMuted,
      lineHeight: 11.5,
      marginTop: 2,
      marginBottom: 8,
    },
    samplePillsWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      marginBottom: 8,
    },
    samplePillBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      borderWidth: 1.2,
      borderColor: COLORS.border,
      borderRadius: SHAPES.chipRadius,
      backgroundColor: COLORS.card,
      paddingHorizontal: 8,
      paddingVertical: 6,
    },
    samplePillText: {
      fontFamily: FONTS.mono,
      fontSize: 8,
      fontWeight: "bold",
      color: COLORS.text,
    },
    customInputRow: {
      flexDirection: "row",
      gap: 6,
      alignItems: "center",
    },
    customInput: {
      flex: 1,
      borderWidth: 1.2,
      borderColor: COLORS.border,
      borderRadius: SHAPES.inputRadius,
      backgroundColor: COLORS.card,
      paddingHorizontal: 8,
      paddingVertical: 6,
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      color: COLORS.text,
    },
    sendCustomBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: COLORS.primary,
      borderWidth: 1.2,
      borderColor: COLORS.border,
      borderRadius: SHAPES.inputRadius,
      paddingHorizontal: 10,
      paddingVertical: 7,
    },
    sendCustomBtnText: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      fontWeight: "bold",
      color: COLORS.primaryText,
    },
    capturedResultBox: {
      marginTop: 8,
      padding: 8,
      borderWidth: 1,
      borderColor: "#15803D",
      borderRadius: 6,
      backgroundColor: "#DCFCE7",
    },
    capturedResultTitle: {
      fontFamily: FONTS.mono,
      fontSize: 7.5,
      fontWeight: "bold",
      color: "#15803D",
      marginBottom: 2,
    },
    capturedResultMeta: {
      fontFamily: FONTS.mono,
      fontSize: 8,
      color: "#121212",
    },
  });
