/**
 * @file frontend/src/features/auth/components/RegisterOtpModal.js
 * @layer Auth Feature Modal Component
 * @description Popup modal that prompts new users to enter the 6-digit email verification OTP before creating their account.
 * @exports default RegisterOtpModal
 */

import React from "react";
import { View, Text, Modal, TouchableOpacity, StyleSheet } from "react-native";
import { MailCheck, X } from "lucide-react-native";
import { COLORS, SHAPES, FONTS } from "../../../theme/colors";
import { playUiSound } from "../../../utils/soundEffects";
import WireInput from "../../../components/shared/WireInput";
import WireButton from "../../../components/shared/WireButton";
import FloatingToast from "../../../components/shared/FloatingToast";
import { useFloatingToast } from "../../../components/shared/useFloatingToast";

export default function RegisterOtpModal({
  visible = false,
  email = "",
  otpCode = "",
  onChangeOtpCode,
  verifying = false,
  resending = false,
  resendCooldown = 0,
  onVerify,
  onResend,
  onClose,
}) {
  const styles = getStyles();
  const { toast: modalToast, slideAnim: modalSlideAnim, showToast: modalNotify } = useFloatingToast();

  const handleClose = () => {
    playUiSound("pop");
    if (onClose) onClose();
  };

  return (
    <Modal visible={Boolean(visible)} transparent={true} animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <FloatingToast toast={modalToast} slideAnim={modalSlideAnim} />

        <View style={styles.card}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
              <View style={styles.iconCircle}>
                <MailCheck size={15} color={COLORS.primary} strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>VERIFY YOUR EMAIL</Text>
                <Text style={styles.subtitle}>Enter the 6-digit code sent to your inbox</Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={18} color={COLORS.text} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <View style={styles.emailBanner}>
            <Text style={styles.emailBannerText}>Code sent to: {email}</Text>
          </View>

          <WireInput
            label="6-DIGIT VERIFICATION CODE"
            placeholder="e.g. 123456"
            value={otpCode}
            onChangeText={(txt) => onChangeOtpCode && onChangeOtpCode(txt.replace(/[^0-9]/g, "").slice(0, 6))}
            keyboardType="number-pad"
            maxLength={6}
          />

          <View style={styles.resendRow}>
            <Text style={styles.resendHint}>Didn't receive the email? Check Spam or</Text>
            <TouchableOpacity
              disabled={resendCooldown > 0 || resending}
              onPress={() => {
                playUiSound("pop");
                if (onResend) onResend(modalNotify);
              }}
            >
              <Text style={[styles.resendLink, (resendCooldown > 0 || resending) && styles.resendLinkDisabled]}>
                {resending ? "Sending..." : resendCooldown > 0 ? `Resend (${resendCooldown}s)` : "Resend Code"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.btnRow}>
            <WireButton label="CANCEL" variant="outline" onPress={handleClose} style={{ flex: 1 }} />
            <WireButton
              label={verifying ? "VERIFYING..." : "VERIFY & CREATE"}
              onPress={() => onVerify && onVerify(modalNotify)}
              disabled={verifying}
              style={{ flex: 1.5 }}
            />
          </View>
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
      position: "relative",
    },
    card: {
      width: "100%",
      maxWidth: 365,
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
      marginBottom: 12,
      gap: 8,
    },
    iconCircle: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: COLORS.secondary,
      borderWidth: 1.5,
      borderColor: COLORS.border,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontFamily: FONTS.mono,
      fontSize: 11.5,
      fontWeight: "bold",
      color: COLORS.text,
    },
    subtitle: {
      fontFamily: FONTS.mono,
      fontSize: 8,
      color: COLORS.textMuted,
      marginTop: 1,
    },
    emailBanner: {
      borderWidth: 1,
      borderColor: COLORS.borderMuted,
      borderStyle: "dashed",
      borderRadius: SHAPES.inputRadius,
      backgroundColor: COLORS.secondary,
      paddingHorizontal: 10,
      paddingVertical: 7,
      marginBottom: 12,
    },
    emailBannerText: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      fontWeight: "bold",
      color: COLORS.text,
      textAlign: "center",
    },
    resendRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      marginTop: -2,
      marginBottom: 14,
    },
    resendHint: {
      fontFamily: FONTS.mono,
      fontSize: 8,
      color: COLORS.textMuted,
    },
    resendLink: {
      fontFamily: FONTS.mono,
      fontSize: 8,
      fontWeight: "bold",
      color: COLORS.primary,
      textDecorationLine: "underline",
    },
    resendLinkDisabled: {
      color: COLORS.textMuted,
      textDecorationLine: "none",
    },
    btnRow: {
      flexDirection: "row",
      gap: 8,
    },
  });
