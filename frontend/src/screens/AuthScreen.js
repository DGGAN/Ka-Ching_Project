/**
 * @file frontend/src/screens/AuthScreen.js
 * @layer Screen (Authentication Entry — Smooth Login/Register Toggle, 2-Step Email OTP Registration, Real Google OAuth & Pinned Bottom Legal Footer)
 * @description Assembles the AuthScreen design using useAuthForm, GoogleColorfulIcon, SecretDevPersonasPanel, RegisterOtpModal, ForgotPasswordModal, AuthLegalNotice, and LegalPolicyModal.
 * @props {Function} onLoginSuccess - Callback invoked with authenticated user object
 * @exports default AuthScreen
 */

import React, { useState, useEffect } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, LayoutAnimation, Platform, UIManager } from "react-native";
import { COLORS, SHAPES, FONTS } from "../theme/colors";
import { playUiSound } from "../utils/soundEffects";
import WireInput from "../components/shared/WireInput";
import WireButton from "../components/shared/WireButton";
import FloatingToast from "../components/shared/FloatingToast";
import { useFloatingToast } from "../components/shared/useFloatingToast";
import LegalPolicyModal from "../components/shared/LegalPolicyModal";

import { useAuthForm } from "../features/auth/hooks/useAuthForm";
import GoogleColorfulIcon from "../features/auth/components/GoogleColorfulIcon";
import { SecretDevPersonasPanel } from "../features/auth/components/GoogleSignInModal";
import RegisterOtpModal from "../features/auth/components/RegisterOtpModal";
import ForgotPasswordModal from "../features/auth/components/ForgotPasswordModal";
import AuthLegalNotice from "../features/auth/components/AuthLegalNotice";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function AuthScreen({ onLoginSuccess }) {
  const styles = getStyles();
  const { toast, slideAnim, showToast } = useFloatingToast();
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState(null); // "privacy" | "terms" | null
  const [loadingDots, setLoadingDots] = useState(".");

  const {
    isRegistering,
    setIsRegistering,
    username,
    setUsername,
    email,
    setEmail,
    password,
    setPassword,
    submitting,
    googleLoading,
    showRegisterOtpModal,
    setShowRegisterOtpModal,
    registerOtpCode,
    setRegisterOtpCode,
    verifyingRegisterOtp,
    resendingRegisterOtp,
    registerResendCooldown,
    handleVerifyRegisterOtp,
    handleResendRegisterOtp,
    showSecretDevPanel,
    setShowSecretDevPanel,
    handleSecretLogoTap,
    handleSubmit,
    authenticateWithGoogleBackend,
    handleRealUserGoogleLogin,
  } = useAuthForm(onLoginSuccess, showToast);

  // Smoothly animate loading dots (. -> .. -> ...) while sending verification email or logging in
  useEffect(() => {
    if (!submitting) {
      setLoadingDots(".");
      return;
    }
    const timer = setInterval(() => {
      setLoadingDots((prev) => (prev.length >= 3 ? "." : prev + "."));
    }, 350);
    return () => clearInterval(timer);
  }, [submitting]);

  // Smoothly animate layout when switching between Login and Register
  const handleToggleAuthMode = (nextRegistering) => {
    if (nextRegistering === isRegistering) return;
    playUiSound("tab");
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsRegistering(nextRegistering);
  };

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
        {/* Top Logo & Title Section (Tap Logo 5 times quickly to unlock secret Dev Panel) */}
        <View style={styles.headerSection}>
          <TouchableOpacity activeOpacity={0.9} onPress={handleSecretLogoTap} style={styles.logoContainer}>
            <Image source={require("../../assets/images/kaching_logo.png")} style={styles.logoImage} resizeMode="contain" />
          </TouchableOpacity>
          <Text style={styles.appTitle}>Ka-Ching!</Text>
          <Text style={styles.subtitle1}>Your personal finance companion.</Text>
          <Text style={styles.subtitle2}>Track smarter. Save better.</Text>
        </View>

        {/* Form Input Section */}
        <View style={styles.formSection}>
          {/* Smooth Segmented Mode Switcher (LOGIN / REGISTER) */}
          <View style={styles.modeSwitchTrack}>
            <TouchableOpacity
              style={[styles.modeSwitchBtn, !isRegistering && styles.modeSwitchBtnActive]}
              activeOpacity={0.85}
              onPress={() => handleToggleAuthMode(false)}
            >
              <Text style={[styles.modeSwitchText, !isRegistering && styles.modeSwitchTextActive]}>LOGIN</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeSwitchBtn, isRegistering && styles.modeSwitchBtnActive]}
              activeOpacity={0.85}
              onPress={() => handleToggleAuthMode(true)}
            >
              <Text style={[styles.modeSwitchText, isRegistering && styles.modeSwitchTextActive]}>REGISTER</Text>
            </TouchableOpacity>
          </View>

          {isRegistering && <WireInput label="Username" placeholder="tommy" value={username} onChangeText={setUsername} />}

          <WireInput label="Email Address" placeholder="tommy@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" />

          <WireInput label="Password" placeholder="••••••••" value={password} onChangeText={setPassword} secureTextEntry={true} />

          {!isRegistering && (
            <View style={styles.forgotRow}>
              <TouchableOpacity
                onPress={() => {
                  playUiSound("pop");
                  setShowForgotModal(true);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>
          )}

          <WireButton
            label={
              submitting
                ? isRegistering
                  ? `Sending Verification Code${loadingDots}`
                  : `Logging in${loadingDots}`
                : isRegistering
                  ? "Register Account"
                  : "Login"
            }
            onPress={handleSubmit}
            disabled={submitting}
            variant="filled"
          />

          {/* Dashed divider: OR CONTINUE WITH */}
          <View style={styles.dividerRow}>
            <View style={styles.dashedLine} />
            <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
            <View style={styles.dashedLine} />
          </View>

          {/* Official Black Google OAuth Button for Real Users */}
          <TouchableOpacity style={styles.googleBlackBtn} onPress={handleRealUserGoogleLogin} disabled={googleLoading} activeOpacity={0.85}>
            <View style={styles.googleWhiteBadge}>
              <GoogleColorfulIcon size={18} />
            </View>
            <Text style={styles.googleBlackBtnText}>{googleLoading ? "Signing in..." : "Continue with Google"}</Text>
          </TouchableOpacity>

          {/* SECRET DEVELOPER PANEL: Completely invisible unless Logo is tapped 5 times */}
          <SecretDevPersonasPanel
            visible={showSecretDevPanel}
            onClose={() => setShowSecretDevPanel(false)}
            onSelectPersona={authenticateWithGoogleBackend}
          />
        </View>

        {/* Pinned Bottom Footer: Terms & Privacy Policy */}
        <View style={styles.footerSection}>
          <AuthLegalNotice onOpenLegalModal={(tab) => setLegalModalTab(tab)} />
        </View>
      </ScrollView>

      {/* 2-Step Registration 6-Digit Email OTP Verification Modal */}
      <RegisterOtpModal
        visible={showRegisterOtpModal}
        email={email.trim().toLowerCase()}
        otpCode={registerOtpCode}
        onChangeOtpCode={setRegisterOtpCode}
        verifying={verifyingRegisterOtp}
        resending={resendingRegisterOtp}
        resendCooldown={registerResendCooldown}
        onVerify={handleVerifyRegisterOtp}
        onResend={handleResendRegisterOtp}
        onClose={() => setShowRegisterOtpModal(false)}
      />

      {/* Two-Step Forgot Password & 6-Digit OTP Recovery Modal */}
      <ForgotPasswordModal
        visible={showForgotModal}
        initialEmail={email}
        onClose={() => setShowForgotModal(false)}
        onResetSuccess={(resetEmail) => {
          setEmail(resetEmail);
          setPassword("");
          showToast("success", "Password updated! Please login with your new password.");
        }}
      />

      {/* In-App Privacy Policy & Terms of Service Modal */}
      <LegalPolicyModal visible={Boolean(legalModalTab)} initialTab={legalModalTab || "privacy"} onClose={() => setLegalModalTab(null)} />
    </View>
  );
}

const getStyles = () =>
  StyleSheet.create({
    container: {
      flexGrow: 1,
      backgroundColor: COLORS.background,
      paddingBottom: 22,
    },
    headerSection: {
      alignItems: "center",
      paddingTop: 34,
      paddingBottom: 18,
      paddingHorizontal: 24,
      borderBottomWidth: SHAPES.borderWidth,
      borderColor: COLORS.borderMuted,
      borderStyle: "dashed",
    },
    logoContainer: {
      width: 112,
      height: 112,
      borderRadius: 28,
      borderWidth: 2,
      borderColor: COLORS.border,
      backgroundColor: "#FDF2C5",
      overflow: "hidden",
      marginBottom: 14,
      shadowColor: COLORS.text,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 4,
    },
    logoImage: {
      width: "100%",
      height: "100%",
    },
    appTitle: {
      fontSize: 26,
      fontFamily: FONTS.mono,
      fontWeight: "bold",
      color: COLORS.text,
      letterSpacing: 0.5,
    },
    subtitle1: {
      fontSize: 12,
      fontFamily: FONTS.mono,
      fontWeight: "bold",
      color: COLORS.text,
      marginTop: 6,
    },
    subtitle2: {
      fontSize: 11,
      fontFamily: FONTS.mono,
      color: COLORS.textMuted,
      marginTop: 2,
    },
    formSection: {
      paddingHorizontal: 24,
      paddingTop: 18,
    },
    modeSwitchTrack: {
      flexDirection: "row",
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      borderRadius: SHAPES.buttonRadius,
      backgroundColor: COLORS.secondary,
      padding: 3,
      marginBottom: 16,
    },
    modeSwitchBtn: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: SHAPES.chipRadius,
      alignItems: "center",
    },
    modeSwitchBtnActive: {
      backgroundColor: COLORS.primary,
    },
    modeSwitchText: {
      fontFamily: FONTS.mono,
      fontSize: 10.5,
      fontWeight: "bold",
      color: COLORS.textMuted,
      letterSpacing: 0.8,
    },
    modeSwitchTextActive: {
      color: COLORS.primaryText,
    },
    forgotRow: {
      alignItems: "flex-end",
      marginBottom: 16,
      marginTop: -6,
    },
    forgotText: {
      fontFamily: FONTS.mono,
      fontSize: 10,
      color: COLORS.textMuted,
      textDecorationLine: "underline",
    },
    dividerRow: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 18,
    },
    dashedLine: {
      flex: 1,
      height: 1,
      borderWidth: 1,
      borderColor: COLORS.borderMuted,
      borderStyle: "dashed",
    },
    dividerText: {
      fontFamily: FONTS.mono,
      fontSize: 10,
      color: COLORS.textMuted,
      marginHorizontal: 10,
    },
    googleBlackBtn: {
      width: "100%",
      backgroundColor: "#111111",
      borderRadius: SHAPES.buttonRadius,
      paddingVertical: 11,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
      position: "relative",
    },
    googleWhiteBadge: {
      position: "absolute",
      left: 14,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: "#FFFFFF",
      alignItems: "center",
      justifyContent: "center",
    },
    googleBlackBtnText: {
      color: "#FFFFFF",
      fontFamily: FONTS.mono,
      fontSize: 12,
      fontWeight: "bold",
      letterSpacing: 0.5,
    },
    footerSection: {
      marginTop: "auto",
      marginHorizontal: 24,
      paddingTop: 4,
      borderTopWidth: SHAPES.borderWidth,
      borderColor: COLORS.borderMuted,
      borderStyle: "dashed",
    },
  });
