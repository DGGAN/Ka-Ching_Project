/**
 * @file frontend/src/components/shared/LegalPolicyModal.js
 * @layer Shared UI Modal Component
 * @description In-app Terms of Service and PDPA 2010 Privacy Policy viewer accessible from AuthScreen and ProfileScreen.
 * @exports default LegalPolicyModal
 */

import React, { useState, useEffect } from "react";
import { View, Text, Modal, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { ShieldCheck, FileText, X } from "lucide-react-native";
import { COLORS, SHAPES, FONTS } from "../../theme/colors";
import { playUiSound } from "../../utils/soundEffects";
import WireButton from "./WireButton";  

const SUPPORT_EMAIL = process.env.EXPO_PUBLIC_SUPPORT_EMAIL.trim();

export default function LegalPolicyModal({ visible = false, initialTab = "privacy", onClose }) {
  const styles = getStyles();
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (visible && initialTab) {
      setActiveTab(initialTab);
    }
  }, [visible, initialTab]);

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
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              {activeTab === "privacy" ? (
                <ShieldCheck size={16} color={COLORS.primary} strokeWidth={2.5} />
              ) : (
                <FileText size={16} color={COLORS.primary} strokeWidth={2.5} />
              )}
              <Text style={styles.headerTitle}>{activeTab === "privacy" ? "PRIVACY POLICY (PDPA)" : "TERMS OF SERVICE"}</Text>
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

          {/* Switcher Tabs */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === "privacy" && styles.tabBtnActive]}
              onPress={() => {
                playUiSound("tab");
                setActiveTab("privacy");
              }}
            >
              <Text style={[styles.tabText, activeTab === "privacy" && styles.tabTextActive]}>PRIVACY POLICY</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === "terms" && styles.tabBtnActive]}
              onPress={() => {
                playUiSound("tab");
                setActiveTab("terms");
              }}
            >
              <Text style={[styles.tabText, activeTab === "terms" && styles.tabTextActive]}>TERMS OF SERVICE</Text>
            </TouchableOpacity>
          </View>

          {/* Policy Content */}
          <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
            {activeTab === "privacy" ? (
              <View style={styles.bodyBox}>
                <Text style={styles.sectionTitle}>1. WHAT WE COLLECT (PDPA 2010)</Text>
                <Text style={styles.bodyText}>
                  We follow Malaysia's Personal Data Protection Act (PDPA 2010). Ka-Ching! only collects your username, email address, and the
                  expenses, income, or budgets you choose to record. We never sell or share your personal data with advertisers.
                </Text>

                <Text style={styles.sectionTitle}>2. SMART AUTO-CAPTURE &amp; SUPPORTED APPS</Text>
                <Text style={styles.bodyText}>
                  Smart Auto-Capture is completely optional (OFF by default). Only when you turn it ON and grant phone permission will Ka-Ching! read
                  payment alerts containing RM amounts from these 10 currently supported Malaysian apps:{"\n"}• Touch 'n Go eWallet, MAE by Maybank2u,
                  Grab / GrabPay, CIMB OCTO MY, MyPB (Public Bank), RHB Mobile Banking, HLB Connect, Boost eWallet, Shopee / ShopeePay, and GXBank.
                  {"\n"}
                  Personal chats (WhatsApp, Instagram, SMS, calls) are strictly ignored on your device and never uploaded.
                </Text>

                <Text style={styles.sectionTitle}>3. RECEIPT PHOTOS (RECEIPT SCANNER)</Text>
                <Text style={styles.bodyText}>
                  When you snap or upload a receipt photo, it is only used to read the store name, date, and total RM amount so you don't have to type
                  it manually.
                </Text>

                <Text style={styles.sectionTitle}>4. YOUR RIGHTS &amp; CONTACT</Text>
                <Text style={styles.bodyText}>
                  You are always in control. You can turn off Auto-Capture, mute notifications, unlink Google Sign-In, or edit/delete your
                  transactions anytime in the app. For data or privacy questions, email us at {SUPPORT_EMAIL}.
                </Text>
              </View>
            ) : (
              <View style={styles.bodyBox}>
                <Text style={styles.sectionTitle}>1. USING KA-CHING!</Text>
                <Text style={styles.bodyText}>
                  Ka-Ching! is a personal expense tracker designed to help you log daily spending, scan receipts, set monthly budgets, and view
                  spending summaries in one place.
                </Text>

                <Text style={styles.sectionTitle}>2. AUTOMATIC FEATURES &amp; ACCURACY</Text>
                <Text style={styles.bodyText}>
                  Receipt scanning, automatic category sorting, Smart Auto-Capture (currently supporting 10 Malaysian banking and eWallet apps), and
                  monthly spending forecasts are automated tools for convenience. Please review your logged entries occasionally to make sure amounts
                  and categories match your records.
                </Text>

                <Text style={styles.sectionTitle}>3. NOT FINANCIAL ADVICE</Text>
                <Text style={styles.bodyText}>
                  Budget alerts, savings targets, and spending insights are for personal reference only and are not professional financial, tax, or
                  investment advice.
                </Text>

                <Text style={styles.sectionTitle}>4. ACCOUNT SAFETY &amp; SUPPORT</Text>
                <Text style={styles.bodyText}>
                  Please keep your login password private. If you spot a bug or need help with your account, contact us anytime at {SUPPORT_EMAIL}.
                </Text>
              </View>
            )}
          </ScrollView>

          <WireButton
            label="I UNDERSTAND"
            variant="primary"
            onPress={() => {
              playUiSound("pop");
              if (onClose) onClose();
            }}
            style={{ marginTop: 12 }}
          />
        </View>
      </View>
    </Modal>
  );
}

const getStyles = () =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.58)",
      justifyContent: "center",
      alignItems: "center",
      padding: 18,
    },
    card: {
      width: "100%",
      maxWidth: 380,
      backgroundColor: COLORS.card,
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      borderRadius: SHAPES.cardRadius,
      padding: 16,
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
    headerTitle: {
      fontFamily: FONTS.mono,
      fontSize: 11,
      fontWeight: "bold",
      color: COLORS.text,
    },
    tabRow: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 10,
    },
    tabBtn: {
      flex: 1,
      paddingVertical: 7,
      alignItems: "center",
      borderWidth: 1.5,
      borderColor: COLORS.border,
      borderRadius: SHAPES.chipRadius,
      backgroundColor: COLORS.secondary,
    },
    tabBtnActive: {
      backgroundColor: COLORS.primary,
    },
    tabText: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      fontWeight: "bold",
      color: COLORS.text,
    },
    tabTextActive: {
      color: COLORS.primaryText,
    },
    bodyBox: {
      backgroundColor: COLORS.inputBg,
      borderWidth: 1,
      borderColor: COLORS.borderMuted,
      borderRadius: SHAPES.inputRadius,
      padding: 12,
    },
    sectionTitle: {
      fontFamily: FONTS.mono,
      fontSize: 9,
      fontWeight: "bold",
      color: COLORS.text,
      marginTop: 8,
      marginBottom: 3,
    },
    bodyText: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      color: COLORS.textMuted,
      lineHeight: 13.5,
      marginBottom: 6,
    },
  });
