/**
 * @file frontend/src/features/auth/components/ForgotPasswordModal.js
 * @layer Auth Feature Component
 * @description Two-step Forgot Password modal (Step 1: Verify account exists & send 6-digit OTP email; Step 2: Verify OTP & set new password). Includes built-in top-level FloatingToast so alerts are never hidden behind the modal.
 * @exports default ForgotPasswordModal
 */

import React, { useState, useEffect } from "react";
import { View, Text, Modal, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { X, Mail, KeyRound, ShieldCheck, ArrowLeft } from "lucide-react-native";
import apiClient from "../../../api/apiClient";
import { COLORS, SHAPES, FONTS } from "../../../theme/colors";
import WireButton from "../../../components/shared/WireButton";
import FloatingToast from "../../../components/shared/FloatingToast";
import { useFloatingToast } from "../../../components/shared/useFloatingToast";
import { playUiSound } from "../../../utils/soundEffects";

export default function ForgotPasswordModal({ visible, initialEmail = "", onClose, onResetSuccess }) {
  const styles = getStyles();
  const { toast, slideAnim, showToast } = useFloatingToast();

  // step 1 = Enter Email to get OTP, step 2 = Enter 6-digit OTP + New Password
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setStep(1);
      setEmail(initialEmail || "");
      setOtpCode("");
      setNewPassword("");
      setConfirmPassword("");
    }
  }, [visible, initialEmail]);

  // Step 1: Check if account exists in DB and send 6-digit OTP
  const handleSendOtp = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      showToast("error", "Please enter a valid registered email address.");
      return;
    }

    try {
      setLoading(true);
      const res = await apiClient.post("/auth/forgot-password", { email: cleanEmail });
      playUiSound("pop");
      showToast("success", res.data?.message || "6-digit code sent to your email!");
      setStep(2);
    } catch (error) {
      const errMsg = error.response?.data?.message || "Could not send reset code. Please try again.";
      showToast("error", errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify 6-digit OTP and save new password
  const handleConfirmReset = async () => {
    if (otpCode.trim().length !== 6) {
      showToast("error", "Please enter the 6-digit verification code.");
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      showToast("error", "New password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("error", "New password and confirmation do not match.");
      return;
    }

    try {
      setLoading(true);
      const res = await apiClient.post("/auth/reset-password", {
        email: email.trim().toLowerCase(),
        otpCode: otpCode.trim(),
        newPassword,
      });
      playUiSound("edit");
      showToast("success", res.data?.message || "Password updated!");
      setTimeout(() => {
        onResetSuccess?.(email.trim().toLowerCase());
        onClose();
      }, 900);
    } catch (error) {
      const errMsg = error.response?.data?.message || "Invalid or expired verification code.";
      showToast("error", errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <FloatingToast toast={toast} slideAnim={slideAnim} />

        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
              <KeyRound size={16} color={COLORS.primary} strokeWidth={2.4} />
              <Text style={styles.modalTitle}>{step === 1 ? "FORGOT PASSWORD" : "VERIFY & RESET PASSWORD"}</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                playUiSound("pop");
                onClose();
              }}
            >
              <X size={18} color={COLORS.text} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {step === 1 ? (
            <>
              <Text style={styles.helperText}>
                Enter the email address registered with your Ka-Ching! account. We will verify your account and send a 6-digit recovery code.
              </Text>

              <Text style={styles.inputLabel}>REGISTERED EMAIL ADDRESS</Text>
              <View style={styles.inputRow}>
                <Mail size={15} color={COLORS.textMuted} />
                <TextInput
                  style={styles.textInput}
                  placeholder="yourname@gmail.com"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View style={styles.actionsRow}>
                <WireButton
                  label="CANCEL"
                  variant="outline"
                  onPress={() => {
                    playUiSound("pop");
                    onClose();
                  }}
                  style={{ flex: 1 }}
                />
                {loading ? (
                  <View style={{ flex: 1, alignItems: "center" }}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  </View>
                ) : (
                  <WireButton label="SEND 6-DIGIT CODE" onPress={handleSendOtp} style={{ flex: 1.3 }} />
                )}
              </View>
            </>
          ) : (
            <>
              <Text style={styles.helperText}>
                Enter the 6-digit code sent to <Text style={{ fontWeight: "bold", color: COLORS.text }}>{email}</Text> and choose a new password (min
                8 chars, letters & numbers).
              </Text>

              <Text style={styles.inputLabel}>6-DIGIT VERIFICATION CODE</Text>
              <View style={styles.inputRow}>
                <ShieldCheck size={15} color={COLORS.primary} />
                <TextInput
                  style={[styles.textInput, { letterSpacing: 4, fontWeight: "bold", fontSize: 14 }]}
                  placeholder="123456"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otpCode}
                  onChangeText={setOtpCode}
                />
              </View>

              <Text style={styles.inputLabel}>NEW PASSWORD</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Min 8 chars (letters + numbers)"
                  placeholderTextColor={COLORS.textMuted}
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
              </View>

              <Text style={styles.inputLabel}>CONFIRM NEW PASSWORD</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Re-enter new password"
                  placeholderTextColor={COLORS.textMuted}
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.backBtn}
                  onPress={() => {
                    playUiSound("pop");
                    setStep(1);
                  }}
                >
                  <ArrowLeft size={14} color={COLORS.text} />
                  <Text style={styles.backBtnText}>BACK</Text>
                </TouchableOpacity>

                {loading ? (
                  <View style={{ flex: 1, alignItems: "center" }}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  </View>
                ) : (
                  <WireButton label="RESET PASSWORD" onPress={handleConfirmReset} style={{ flex: 1.5 }} />
                )}
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const getStyles = () =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.55)",
      justifyContent: "center",
      alignItems: "center",
      padding: 18,
    },
    modalCard: {
      width: "100%",
      maxWidth: 370,
      backgroundColor: COLORS.card,
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      borderRadius: SHAPES.cardRadius,
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
      marginBottom: 12,
    },
    modalTitle: {
      fontFamily: FONTS.mono,
      fontSize: 12,
      fontWeight: "bold",
      color: COLORS.text,
      letterSpacing: 0.6,
    },
    helperText: {
      fontFamily: FONTS.mono,
      fontSize: 9.5,
      color: COLORS.textMuted,
      lineHeight: 14,
      marginBottom: 12,
    },
    inputLabel: {
      fontFamily: FONTS.mono,
      fontSize: 9.5,
      fontWeight: "bold",
      color: COLORS.text,
      marginBottom: 4,
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      borderRadius: SHAPES.inputRadius,
      backgroundColor: COLORS.inputBg,
      paddingHorizontal: 10,
      paddingVertical: 7,
      marginBottom: 10,
    },
    textInput: {
      flex: 1,
      fontFamily: FONTS.mono,
      fontSize: 11.5,
      color: COLORS.text,
      paddingVertical: 2,
    },
    actionsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginTop: 6,
    },
    backBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      borderRadius: SHAPES.buttonRadius,
      paddingVertical: 11,
      paddingHorizontal: 14,
      backgroundColor: COLORS.background,
    },
    backBtnText: {
      fontFamily: FONTS.mono,
      fontSize: 10,
      fontWeight: "bold",
      color: COLORS.text,
    },
  });
