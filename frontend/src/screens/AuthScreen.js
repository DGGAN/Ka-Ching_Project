/**
 * @file frontend/src/screens/AuthScreen.js
 * @layer Screen (Authentication Entry — 100% Original Design + FloatingToast + Secret 5-Tap Logo Dev Panel)
 * @description Normal users only see the clean login form and the real Google sign-in button. Tapping the top duck logo 5 times unlocks the hidden 4-persona developer shortcut panel.
 * @props {Function} onLoginSuccess - Callback invoked with authenticated user object
 * @exports default AuthScreen
 */

import React, { useState, useRef } from "react";
import { View, Text, Image, TouchableOpacity, Modal, TextInput, StyleSheet, ScrollView, Platform } from "react-native";
import Svg, { Path } from "react-native-svg";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { X, Lock } from "lucide-react-native";
import apiClient from "../api/apiClient";
import { COLORS, SHAPES, FONTS } from "../theme/colors";
import WireInput from "../components/shared/WireInput";
import WireButton from "../components/shared/WireButton";
import FloatingToast from "../components/shared/FloatingToast";
import { useFloatingToast } from "../components/shared/useFloatingToast";
import { playUiSound } from "../utils/soundEffects";

// Official 4-color Google "G" SVG icon component (Blue, Red, Yellow, Green)
const GoogleColorfulIcon = ({ size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48">
    <Path
      fill="#EA4335"
      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
    />
    <Path
      fill="#4285F4"
      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
    />
    <Path
      fill="#FBBC05"
      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
    />
    <Path
      fill="#34A853"
      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
    />
  </Svg>
);

// 4 Preset Developer Test Accounts loaded from .env
const DEV_TEST_ACCOUNTS = [
  {
    tag: "1. Balanced",
    email: process.env.EXPO_PUBLIC_GOOGLE_EMAIL || "darren.google@gmail.com",
    username: process.env.EXPO_PUBLIC_GOOGLE_USERNAME || "Darren Google",
    oauthId: process.env.EXPO_PUBLIC_GOOGLE_OAUTH_ID || "109283746554321098765",
  },
  {
    tag: "2. 92% Risk",
    email: process.env.EXPO_PUBLIC_GOOGLE_ALT_EMAIL || "ganzhunyin@gmail.com",
    username: process.env.EXPO_PUBLIC_GOOGLE_ALT_USERNAME || "Gan Zhun Yin",
    oauthId: process.env.EXPO_PUBLIC_GOOGLE_ALT_OAUTH_ID || "109283746554321098888",
  },
  {
    tag: "3. Fast Saver",
    email: process.env.EXPO_PUBLIC_GOOGLE_SAVER_EMAIL || "aiman.saver@gmail.com",
    username: process.env.EXPO_PUBLIC_GOOGLE_SAVER_USERNAME || "Aiman Saver",
    oauthId: process.env.EXPO_PUBLIC_GOOGLE_SAVER_OAUTH_ID || "109283746554321098777",
  },
  {
    tag: "4. Empty New",
    email: process.env.EXPO_PUBLIC_GOOGLE_FRESH_EMAIL || "chloe.fresh@gmail.com",
    username: process.env.EXPO_PUBLIC_GOOGLE_FRESH_USERNAME || "Chloe Fresh",
    oauthId: process.env.EXPO_PUBLIC_GOOGLE_FRESH_OAUTH_ID || "109283746554321098666",
  },
];

export default function AuthScreen({ onLoginSuccess }) {
  const styles = getStyles();
  const { toast, slideAnim, showToast } = useFloatingToast();

  // State to toggle between "Login mode (false)" and "Register mode (true)"
  const [isRegistering, setIsRegistering] = useState(false);

  // Form input states
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Interactive Google Account Modal state for real users
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState("");
  const [googleNameInput, setGoogleNameInput] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  // Secret 5-Tap Logo Unlock State (Hidden from normal users by default)
  const [showSecretDevPanel, setShowSecretDevPanel] = useState(false);
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef(null);

  const isDevFeatureAllowed = process.env.EXPO_PUBLIC_ENABLE_DEV_SHORTCUTS !== "false";

  // Secret Gesture: Tap the duck logo 5 times within 2 seconds to toggle developer panel
  const handleSecretLogoTap = () => {
    if (!isDevFeatureAllowed) return;

    tapCountRef.current += 1;
    if (tapTimerRef.current) {
      clearTimeout(tapTimerRef.current);
    }

    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      const nextState = !showSecretDevPanel;
      setShowSecretDevPanel(nextState);
      playUiSound("pop");
      showToast("info", nextState ? "Developer quick-login shortcuts unlocked." : "Developer shortcuts hidden.");
      return;
    }

    tapTimerRef.current = setTimeout(() => {
      tapCountRef.current = 0;
    }, 2000);
  };

  // 1. Handle standard Email/Password Login or Register
  const handleSubmit = async () => {
    if (!email.trim() || !password || (isRegistering && !username.trim())) {
      showToast("error", "Please fill in all required fields.");
      return;
    }

    try {
      const endpoint = isRegistering ? "/auth/register" : "/auth/login";
      const payload = isRegistering ? { username: username.trim(), email: email.trim(), password } : { email: email.trim(), password };

      const response = await apiClient.post(endpoint, payload);

      await AsyncStorage.setItem("userToken", response.data.token);
      await AsyncStorage.setItem("userData", JSON.stringify(response.data.user));

      showToast("success", isRegistering ? "Account registered!" : "Welcome back!");
      setTimeout(() => {
        onLoginSuccess(response.data.user);
      }, 300);
    } catch (error) {
      const targetUrl = apiClient.defaults.baseURL;
      const backendMessage = error.response?.data?.message || `Cannot reach server (${targetUrl}). Check Wi-Fi & backend.`;
      showToast("error", backendMessage);
    }
  };

  // Helper to complete backend /auth/google sign-in with any Google profile payload
  const authenticateWithGoogleBackend = async ({ email: gEmail, username: gName, oauthId: gId }) => {
    try {
      setGoogleLoading(true);
      const response = await apiClient.post("/auth/google", {
        email: gEmail,
        username: gName,
        oauthId: gId,
      });
      await AsyncStorage.setItem("userToken", response.data.token);
      await AsyncStorage.setItem("userData", JSON.stringify(response.data.user));
      setShowGoogleModal(false);
      showToast("success", `Signed in as ${response.data.user.username}!`);
      setTimeout(() => {
        onLoginSuccess(response.data.user);
      }, 300);
    } catch (error) {
      const targetUrl = apiClient.defaults.baseURL;
      const errMsg = error.response?.data?.message || `Cannot reach backend (${targetUrl}). Ensure phone & PC are on same Wi-Fi.`;
      showToast("error", errMsg);
    } finally {
      setGoogleLoading(false);
    }
  };

  // 2. Primary Black Button: Real User "Continue with Google" Handler
  const handleRealUserGoogleLogin = async () => {
    playUiSound("pop");
    const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;

    if (Platform.OS === "web" && clientId && typeof window !== "undefined") {
      const redirectUri = window.location.origin;
      const scope = encodeURIComponent("openid email profile");
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
        redirectUri,
      )}&response_type=token&scope=${scope}&prompt=select_account`;

      const popup = window.open(authUrl, "google_oauth_popup", "width=500,height=620");
      if (popup) {
        const pollTimer = setInterval(async () => {
          try {
            if (popup.closed) {
              clearInterval(pollTimer);
              return;
            }
            if (popup.location.href.includes("access_token=")) {
              const hash = popup.location.hash.substring(1);
              const params = new URLSearchParams(hash);
              const accessToken = params.get("access_token");
              popup.close();
              clearInterval(pollTimer);

              if (accessToken) {
                const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                  headers: { Authorization: `Bearer ${accessToken}` },
                });
                const profile = await userInfoRes.json();
                await authenticateWithGoogleBackend({
                  email: profile.email,
                  username: profile.name || profile.email.split("@")[0],
                  oauthId: profile.sub,
                });
              }
            }
          } catch (err) {
            // Ignore cross-origin frame access errors while user is on accounts.google.com
          }
        }, 400);
        return;
      }
    }

    setShowGoogleModal(true);
  };

  // Submit handler for the interactive Google Sign-In modal
  const handleConfirmRealGoogleModal = async () => {
    const cleanEmail = googleEmailInput.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      showToast("error", "Please enter a valid Google email address.");
      return;
    }
    const derivedName =
      googleNameInput.trim() ||
      cleanEmail
        .split("@")[0]
        .replace(/[._]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

    await authenticateWithGoogleBackend({
      email: cleanEmail,
      username: derivedName,
      oauthId: `google_${cleanEmail}`,
    });
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
            <Image source={require("../../assets/kaching_logo.png")} style={styles.logoImage} resizeMode="cover" />
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
              <Text style={styles.forgotText}>Forgot Password?</Text>
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
          <TouchableOpacity style={styles.googleBlackBtn} onPress={handleRealUserGoogleLogin} activeOpacity={0.85}>
            <View style={styles.googleWhiteBadge}>
              <GoogleColorfulIcon size={18} />
            </View>
            <Text style={styles.googleBlackBtnText}>Continue with Google</Text>
          </TouchableOpacity>

          {/* SECRET DEVELOPER PANEL: Completely invisible unless Logo is tapped 5 times */}
          {showSecretDevPanel && (
            <View style={styles.devShortcutsBox}>
              <View style={styles.devHeaderRow}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                  <Lock size={11} color={COLORS.primary} strokeWidth={2.5} />
                  <Text style={styles.devShortcutsLabel}>DEV TEST PERSONAS (UNLOCKED)</Text>
                </View>
                <TouchableOpacity onPress={() => setShowSecretDevPanel(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <X size={13} color={COLORS.textMuted} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>

              <View style={styles.devGrid}>
                {DEV_TEST_ACCOUNTS.map((acc) => (
                  <TouchableOpacity
                    key={acc.email}
                    style={styles.devShortcutPill}
                    activeOpacity={0.8}
                    onPress={() => {
                      playUiSound("pop");
                      authenticateWithGoogleBackend(acc);
                    }}
                  >
                    <GoogleColorfulIcon size={12} />
                    <Text style={styles.devShortcutText} numberOfLines={1}>
                      {acc.tag}: {acc.username.split(" ")[0]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

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

      {/* Modal for Real User Google Sign-In Prompt */}
      <Modal visible={showGoogleModal} transparent animationType="fade" onRequestClose={() => setShowGoogleModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.googleModalCard}>
            <View style={styles.googleModalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <GoogleColorfulIcon size={18} />
                <Text style={styles.googleModalTitle}>SIGN IN WITH GOOGLE</Text>
              </View>
              <TouchableOpacity onPress={() => setShowGoogleModal(false)}>
                <X size={18} color={COLORS.text} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            <Text style={styles.googleModalSub}>Enter your Google email address to sign in or create your Ka-Ching! account:</Text>

            <Text style={styles.modalInputLabel}>GOOGLE EMAIL</Text>
            <TextInput
              style={styles.modalTextInput}
              placeholder="yourname@gmail.com"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={googleEmailInput}
              onChangeText={setGoogleEmailInput}
            />

            <Text style={styles.modalInputLabel}>DISPLAY NAME (OPTIONAL)</Text>
            <TextInput
              style={styles.modalTextInput}
              placeholder="e.g. Alex Tan"
              placeholderTextColor={COLORS.textMuted}
              value={googleNameInput}
              onChangeText={setGoogleNameInput}
            />

            <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
              <WireButton label="CANCEL" variant="outline" onPress={() => setShowGoogleModal(false)} style={{ flex: 1 }} />
              <WireButton
                label={googleLoading ? "SIGNING IN..." : "CONTINUE"}
                onPress={handleConfirmRealGoogleModal}
                disabled={googleLoading}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
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
      marginBottom: 16,
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
    devShortcutsBox: {
      marginBottom: 18,
      padding: 10,
      borderWidth: 1.5,
      borderColor: COLORS.primary,
      borderStyle: "dashed",
      borderRadius: SHAPES.inputRadius,
      backgroundColor: COLORS.secondary,
    },
    devHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    devShortcutsLabel: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      fontWeight: "bold",
      color: COLORS.text,
      letterSpacing: 0.5,
    },
    devGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      rowGap: 6,
    },
    devShortcutPill: {
      width: "48.5%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      backgroundColor: COLORS.card,
      borderWidth: 1.5,
      borderColor: COLORS.border,
      borderRadius: SHAPES.chipRadius,
      paddingVertical: 7,
      paddingHorizontal: 8,
    },
    devShortcutText: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      fontWeight: "bold",
      color: COLORS.text,
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
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.55)",
      justifyContent: "center",
      alignItems: "center",
      padding: 18,
    },
    googleModalCard: {
      width: "100%",
      maxWidth: 360,
      backgroundColor: COLORS.card,
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      borderRadius: SHAPES.cardRadius,
      padding: 16,
    },
    googleModalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottomWidth: 1.5,
      borderColor: COLORS.borderMuted,
      borderStyle: "dashed",
      paddingBottom: 10,
      marginBottom: 10,
    },
    googleModalTitle: {
      fontFamily: FONTS.mono,
      fontSize: 12,
      fontWeight: "bold",
      color: COLORS.text,
    },
    googleModalSub: {
      fontFamily: FONTS.mono,
      fontSize: 9,
      color: COLORS.textMuted,
      lineHeight: 14,
      marginBottom: 12,
    },
    modalInputLabel: {
      fontFamily: FONTS.mono,
      fontSize: 9.5,
      fontWeight: "bold",
      color: COLORS.text,
      marginBottom: 4,
    },
    modalTextInput: {
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      borderRadius: SHAPES.inputRadius,
      backgroundColor: COLORS.inputBg,
      paddingHorizontal: 10,
      paddingVertical: 8,
      fontFamily: FONTS.mono,
      fontSize: 11,
      color: COLORS.text,
      marginBottom: 10,
    },
  });
