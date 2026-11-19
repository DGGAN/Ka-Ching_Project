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
                <Text style={styles.sectionTitle}>1. DATA MINIMIZATION & PDPA 2010</Text>
                <Text style={styles.bodyText}>
                  Ka-Ching! collects only your username, email address, and financial records you choose to log. We comply with Malaysia's Personal
                  Data Protection Act (PDPA 2010) and never sell your personal data.
                </Text>

                <Text style={styles.sectionTitle}>2. SMART AUTO-CAPTURE PRIVACY</Text>
                <Text style={styles.bodyText}>
                  When you explicitly opt in to Smart Auto-Capture, Ka-Ching! filters notifications strictly from whitelisted Malaysian eWallets &
                  banks containing RM amounts. Personal messages (WhatsApp, Instagram, SMS) are ignored at the device level.
                </Text>

                <Text style={styles.sectionTitle}>3. OCR RECEIPT IMAGES</Text>
                <Text style={styles.bodyText}>
                  Receipt photos are processed solely to extract merchant names, dates, and RM totals into your private ledger.
                </Text>

                <Text style={styles.sectionTitle}>4. YOUR CONTROL</Text>
                <Text style={styles.bodyText}>
                  You can toggle Auto-Capture OFF, mute push alerts, unbind Google OAuth, or delete any transaction anytime in Profile & Transaction
                  History.
                </Text>
              </View>
            ) : (
              <View style={styles.bodyBox}>
                <Text style={styles.sectionTitle}>1. PERSONAL FINANCE USE</Text>
                <Text style={styles.bodyText}>
                  Ka-Ching! is provided as a personal expense tracking, receipt scanning, and 50/30/20 budgeting companion.
                </Text>

                <Text style={styles.sectionTitle}>2. AI & ANALYTICS DISCLAIMER</Text>
                <Text style={styles.bodyText}>
                  Automated merchant categorization and month-end linear regression spending forecasts are informational insights only and do not
                  constitute licensed financial or investment advice.
                </Text>

                <Text style={styles.sectionTitle}>3. ACCOUNT SECURITY</Text>
                <Text style={styles.bodyText}>
                  You are responsible for safeguarding your login password and reviewing auto-captured or OCR-scanned entries for accuracy.
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
