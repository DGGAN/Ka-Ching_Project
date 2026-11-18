/**
 * @file frontend/src/features/profile/components/AutoCaptureModal.js
 * @layer Profile Feature Modal Component (Smart Auto-Capture Setup & Live Payment Notification Tester)
 * @description Provides the PDPA 2010 opt-in master switch, step-by-step Android & iOS 27 Webhook automation setup, and a Live Payment Notification Tester that pops real OS banners and logs directly to Render.
 * @exports default AutoCaptureModal
 */

import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Modal, ScrollView, TextInput, ActivityIndicator, Platform, StyleSheet } from "react-native";
import { Zap, Smartphone, ShieldCheck, Copy, Check, X, Play, Send, CheckCircle2 } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import apiClient from "../../../api/apiClient";
import { COLORS, SHAPES, FONTS } from "../../../theme/colors";
import { playUiSound } from "../../../utils/soundEffects";
import { triggerLivePaymentNotificationCapture } from "../../../services/autoCaptureService";
import WireButton from "../../../components/shared/WireButton";
import FloatingToast from "../../../components/shared/FloatingToast";
import { useFloatingToast } from "../../../components/shared/useFloatingToast";

// Predefined real-world Malaysian e-wallet & bank notification samples for instant live demo & testing
const SAMPLE_NOTIFICATIONS = [
  {
    id: "tng_transfer",
    label: "TNG • Transfer (RM 0.01)",
    title: "Touch 'n Go eWallet",
    text: "You have transferred RM 0.01 to FRIEND via Touch 'n Go eWallet.",
    packageName: "my.com.tngdigital.ewallet",
  },
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

  // Single FloatingToast instance rendered strictly inside the Modal overlay
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

  // Build full webhook endpoint URL
  const baseApiUrl = apiClient.defaults?.baseURL || "https://kaching-backend-27o2.onrender.com/api";
  const webhookUrl = `${baseApiUrl.replace(/\/$/, "")}/transactions/auto-capture`;

  const androidJsonTemplate = JSON.stringify(
    {
      userId: user?.id || "YOUR_USER_ID",
      title: "{not_title}",
      text: "{not_text}",
      packageName: "{not_app_package}",
      platform: "ANDROID_LISTENER",
    },
    null,
    2,
  );

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

  // 1. Toggle Master Opt-In Switch in MongoDB & sync to AsyncStorage
  const handleToggleMasterSwitch = async () => {
    if (!user?.id || toggling) return;
    const nextState = !enabled;

    try {
      setToggling(true);
      playUiSound("pop");
      const res = await apiClient.put(`/transactions/auto-capture-toggle/${user.id}`, { enabled: nextState });

      const confirmedState = Boolean(res.data?.autoCaptureEnabled);
      setEnabled(confirmedState);

      try {
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

      notify(confirmedState ? "success" : "info", confirmedState ? "Smart Auto-Capture ENABLED!" : "Smart Auto-Capture DISABLED.");
    } catch (error) {
      notify("error", error.response?.data?.message || "Failed to update Auto-Capture status.");
    } finally {
      setToggling(false);
    }
  };

  // 2. Copy Webhook URL or JSON template
  const handleCopyText = async (fieldKey, textValue) => {
    playUiSound("pop");
    try {
      if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(textValue);
      } else {
        const { Share } = require("react-native");
        await Share.share({ message: textValue }).catch(() => {});
      }
      setCopiedField(fieldKey);
      notify("success", `Copied ${fieldKey}!`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (e) {
      notify("info", textValue);
    }
  };

  // 3. Fire Live OS Notification & Auto-Capture into Backend
  const handleSimulateNotification = async (sampleObj) => {
    if (!user?.id) return;

    try {
      setSimulatingId(sampleObj.id);
      const res = await triggerLivePaymentNotificationCapture({
        userId: user.id,
        title: sampleObj.title,
        text: sampleObj.text,
        packageName: sampleObj.packageName,
        platform: activeGuideTab === "ios" ? "IOS_27_SHORTCUT" : "ANDROID_LISTENER",
        isUserNotificationEnabled: user?.isNotificationEnabled !== false,
      });

      const capturedTx = res.data?.data;
      setLastCapturedResult(capturedTx);

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
      const errMsg = error.response?.data?.message || "Auto-capture blocked or failed. Make sure Step 1 above is ENABLED.";
      notify("error", errMsg);
    } finally {
      setSimulatingId(null);
    }
  };

  // 4. Parse & Log Any Custom / Copied Payment Notification Text
  const handleSendCustomNotification = async () => {
    const cleanText = customNotifText.trim();
    if (!cleanText) {
      notify("error", "Paste or type a payment alert first (e.g. Paid RM 19.90 to ZUS COFFEE).");
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

          <ScrollView style={{ maxHeight: 470 }} showsVerticalScrollIndicator={false}>
            {/* 1. Master Opt-In Switch Card (PDPA 2010 Privacy Gatekeeper) */}
            <View style={[styles.masterSwitchCard, enabled ? styles.masterSwitchCardOn : styles.masterSwitchCardOff]}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <ShieldCheck size={14} color={enabled ? "#15803D" : "#E11D48"} strokeWidth={2.5} />
                  <Text style={[styles.masterStatusTitle, { color: enabled ? "#15803D" : "#E11D48" }]}>
                    STEP 1: {enabled ? "ENABLED (ACTIVE)" : "DISABLED (LOCKED)"}
                  </Text>
                </View>
                <Text style={styles.masterStatusDesc}>
                  {enabled
                    ? "Incoming TNG eWallet, MAE, GrabPay & DuitNow alerts will be parsed by the 4-Tier AI engine and logged with an AUTO badge."
                    : "Privacy Lock Active (PDPA 2010): No payment notifications will be captured until you enable this switch."}
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

            {/* 2. Live Notification & Paste Tester (100% Reliable on Any Phone + Web) */}
            <View style={styles.sandboxCard}>
              <Text style={styles.sandboxTitle}>STEP 2: LIVE PAYMENT NOTIFICATION TESTER & QUICK PARSER</Text>
              <Text style={styles.sandboxSub}>
                Tap any real Malaysian eWallet notification below (or paste any TNG/MAE alert text) — it will pop a real OS notification banner and
                auto-capture it into your account:
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

              {/* Custom Notification Text Paste / Input Tester */}
              <View style={styles.customInputRow}>
                <TextInput
                  style={styles.customInput}
                  placeholder="Paste or type alert: Paid RM 19.90 to ZUS COFFEE"
                  placeholderTextColor={COLORS.textMuted}
                  value={customNotifText}
                  onChangeText={setCustomNotifText}
                />
                <TouchableOpacity style={styles.sendCustomBtn} onPress={handleSendCustomNotification} disabled={Boolean(simulatingId)}>
                  <Send size={13} color={COLORS.primaryText} />
                  <Text style={styles.sendCustomBtnText}>CAPTURE</Text>
                </TouchableOpacity>
              </View>

              {/* Last Captured Result Feedback Box */}
              {lastCapturedResult && (
                <View style={styles.capturedResultBox}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 5,
                      marginBottom: 2,
                    }}
                  >
                    <CheckCircle2 size={13} color="#15803D" />
                    <Text style={styles.capturedResultTitle}>AUTO-CAPTURED & SAVED WITH "AUTO" BADGE:</Text>
                  </View>
                  <Text style={styles.capturedResultMeta}>
                    • Merchant: {lastCapturedResult.merchantName} | Amount: RM {Number(lastCapturedResult.amount).toFixed(2)}
                  </Text>
                  <Text style={styles.capturedResultMeta}>
                    • Category: {lastCapturedResult.category} ({lastCapturedResult.budgetType}) | Source: {lastCapturedResult.source}
                  </Text>
                </View>
              )}
            </View>

            {/* 3. Platform Background Webhook Bridge Guide (Android & iOS Shortcuts) */}
            <View style={styles.platformTabsRow}>
              <TouchableOpacity
                style={[styles.platformTabBtn, activeGuideTab === "android" && styles.platformTabBtnActive]}
                onPress={() => {
                  playUiSound("tab");
                  setActiveGuideTab("android");
                }}
              >
                <Zap size={13} color={activeGuideTab === "android" ? COLORS.primaryText : COLORS.text} />
                <Text style={[styles.platformTabText, activeGuideTab === "android" && styles.platformTabTextActive]}>ANDROID WEBHOOK BRIDGE</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.platformTabBtn, activeGuideTab === "ios" && styles.platformTabBtnActive]}
                onPress={() => {
                  playUiSound("tab");
                  setActiveGuideTab("ios");
                }}
              >
                <Smartphone size={13} color={activeGuideTab === "ios" ? COLORS.primaryText : COLORS.text} />
                <Text style={[styles.platformTabText, activeGuideTab === "ios" && styles.platformTabTextActive]}>iOS 27 SHORTCUTS BRIDGE</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.guideBox}>
              <Text style={styles.guideHeader}>
                {activeGuideTab === "android" ? "OPTIONAL: ANDROID BACKGROUND NOTIFICATION FORWARDER" : "OPTIONAL: iOS 27 APPLE SHORTCUTS AUTOMATION"}
              </Text>
              <Text style={styles.guideStep}>
                {activeGuideTab === "android"
                  ? "Note: When you transfer money inside TNG eWallet, TNG only sends a push banner to the receiver's phone. To auto-forward incoming bank/eWallet banners in the background on Android (bypassing Xiaomi/OPPO battery killers), paste your Webhook URL & JSON below into Notification Forwarder / MacroDroid:"
                  : "Open iPhone Shortcuts -> Automation -> New Automation -> Transaction / When Touch 'n Go eWallet closes -> Run Immediately -> Get Contents of URL (POST JSON):"}
              </Text>

              {/* Copyable Webhook URL Row */}
              <View style={styles.codeBlock}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.codeLabel}>WEBHOOK ENDPOINT URL (POST):</Text>
                  <Text style={styles.codeText} numberOfLines={1} selectable={true}>
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
                  <Text style={styles.codeLabel}>JSON BODY (USER ID PRE-FILLED):</Text>
                  <Text style={styles.codeText} numberOfLines={3} selectable={true}>
                    {activeGuideTab === "android" ? androidJsonTemplate : iosShortcutJsonTemplate}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.copyBtn}
                  onPress={() => handleCopyText("JSON", activeGuideTab === "android" ? androidJsonTemplate : iosShortcutJsonTemplate)}
                >
                  {copiedField === "JSON" ? <Check size={12} color="#15803D" /> : <Copy size={12} color={COLORS.text} />}
                  <Text style={styles.copyBtnText}>{copiedField === "JSON" ? "COPIED" : "COPY JSON"}</Text>
                </TouchableOpacity>
              </View>
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
    sandboxCard: {
      borderWidth: 1.5,
      borderColor: COLORS.border,
      borderStyle: "dashed",
      borderRadius: SHAPES.inputRadius,
      backgroundColor: COLORS.secondary,
      padding: 10,
      marginBottom: 10,
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
      fontSize: 7.8,
      fontWeight: "bold",
      color: "#15803D",
    },
    capturedResultMeta: {
      fontFamily: FONTS.mono,
      fontSize: 8,
      color: "#121212",
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
    },
    guideHeader: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      fontWeight: "bold",
      color: COLORS.primary,
      marginBottom: 4,
    },
    guideStep: {
      fontFamily: FONTS.mono,
      fontSize: 7.8,
      color: COLORS.text,
      lineHeight: 12,
      marginBottom: 6,
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
