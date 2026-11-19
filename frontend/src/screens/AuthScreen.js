/**
 * @file frontend/src/screens/AuthScreen.js
 * @layer Screen (Authentication Entry — 100% Original Design + Real Google OAuth + Forgot Password & Legal Policy Modals)
 * @description Assembles the exact original AuthScreen design using useAuthForm, GoogleColorfulIcon, SecretDevPersonasPanel, ForgotPasswordModal, and LegalPolicyModal.
 * @props {Function} onLoginSuccess - Callback invoked with authenticated user object
 * @exports default AuthScreen
 */

import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
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
import ForgotPasswordModal from "../features/auth/components/ForgotPasswordModal";

export default function AuthScreen({ onLoginSuccess }) {
  const styles = getStyles();
  const { toast, slideAnim, showToast } = useFloatingToast();
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState(null); // "privacy" | "terms" | null

  const {
    isRegistering,
    setIsRegistering,
    username,
    setUsername,
    email,
    setEmail,
    password,
    setPassword,
    googleLoading,
    showSecretDevPanel,
    setShowSecretDevPanel,
    handleSecretLogoTap,
    handleSubmit,
    authenticateWithGoogleBackend,
    handleRealUserGoogleLogin,
  } = useAuthForm(onLoginSuccess, showToast);

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

          <WireButton label={isRegistering ? "Register Account" : "Login"} onPress={handleSubmit} variant="filled" />

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

          {/* Clickable Terms of Service & Privacy Policy Agreement Notice */}
          <View style={styles.legalRow}>
            <Text style={styles.legalText}>
              By continuing, you agree to Ka-Ching!'s{" "}
              <Text
                style={styles.legalLink}
                onPress={() => {
                  playUiSound("pop");
                  setLegalModalTab("terms");
                }}
              >
                Terms of Service
              </Text>{" "}
              &amp;{" "}
              <Text
                style={styles.legalLink}
                onPress={() => {
                  playUiSound("pop");
                  setLegalModalTab("privacy");
                }}
              >
                Privacy Policy
              </Text>
              .
            </Text>
          </View>

          {/* SECRET DEVELOPER PANEL: Completely invisible unless Logo is tapped 5 times */}
          <SecretDevPersonasPanel
            visible={showSecretDevPanel}
            onClose={() => setShowSecretDevPanel(false)}
            onSelectPersona={authenticateWithGoogleBackend}
          />

          {/* Bottom row to switch between Login and Register modes */}
          <View style={styles.bottomSwitchRow}>
            <Text style={styles.switchHint}>{isRegistering ? "Already have an account?" : "No account yet?"}</Text>
            <TouchableOpacity
              onPress={() => {
                playUiSound("pop");
                setIsRegistering(!isRegistering);
              }}
            >
              <Text style={styles.switchLink}>{isRegistering ? "Login here" : "Register here"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

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
      paddingBottom: 30,
    },
    headerSection: {
      alignItems: "center",
      paddingTop: 45,
      paddingBottom: 22,
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
      paddingTop: 20,
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
      marginBottom: 12,
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
    legalRow: {
      marginBottom: 14,
      paddingHorizontal: 4,
    },
    legalText: {
      fontFamily: FONTS.mono,
      fontSize: 9,
      color: COLORS.textMuted,
      textAlign: "center",
      lineHeight: 14,
    },
    legalLink: {
      color: COLORS.text,
      fontWeight: "bold",
      textDecorationLine: "underline",
    },
    bottomSwitchRow: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      paddingTop: 16,
      borderTopWidth: SHAPES.borderWidth,
      borderColor: COLORS.borderMuted,
      borderStyle: "dashed",
    },
    switchHint: {
      fontFamily: FONTS.mono,
      fontSize: 11,
      color: COLORS.textMuted,
      marginRight: 6,
    },
    switchLink: {
      fontFamily: FONTS.mono,
      fontSize: 11,
      fontWeight: "bold",
      color: COLORS.text,
      textDecorationLine: "underline",
    },
  });
