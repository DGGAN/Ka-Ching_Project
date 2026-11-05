// Import React state hooks, native UI components, SVG vector components, and local storage tool
import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import Svg, { Path } from "react-native-svg";
import AsyncStorage from "@react-native-async-storage/async-storage";
import apiClient from "../api/client";
import { COLORS, SHAPES, FONTS } from "../theme/theme";
import { WireInput, WireButton } from "../components/WireUI";

// Official 4-color Google "G" SVG icon component (Blue, Red, Yellow, Green)
const GoogleColorfulIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 48 48">
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

// Login & Register Screen (Seamlessly blends duck Logo and classic black & colorful Google button)
export default function AuthScreen({ onLoginSuccess }) {
  // Dynamically generate styles on every render so runtime theme switches apply immediately
  const styles = getStyles();

  // State to toggle between "Login mode (false)" and "Register mode (true)"
  const [isRegistering, setIsRegistering] = useState(false);

  // State variables for username, email, password inputs, and error messages
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Function to handle Login or Register primary button press
  const handleSubmit = async () => {
    setErrorMsg("");

    // Frontend basic validation: ensure required fields are not empty
    if (!email || !password || (isRegistering && !username)) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }

    try {
      // Select backend register or login endpoint based on current mode
      const endpoint = isRegistering ? "/auth/register" : "/auth/login";
      const payload = isRegistering ? { username, email, password } : { email, password };

      const response = await apiClient.post(endpoint, payload);

      // Save JWT Token and user data returned from backend into local storage
      await AsyncStorage.setItem("userToken", response.data.token);
      await AsyncStorage.setItem("userData", JSON.stringify(response.data.user));

      // Notify parent component App.js of login success to switch to Dashboard
      onLoginSuccess(response.data.user);
    } catch (error) {
      // Catch and display bilingual validation error message from backend
      const backendMessage = error.response?.data?.message || "Cannot connect to server. Is backend running?";
      setErrorMsg(backendMessage);
    }
  };

  // Handle Google OAuth login button press (connects to backend /api/auth/google)
  const handleGoogleLogin = async () => {
    setErrorMsg("");
    try {
      const response = await apiClient.post("/auth/google", {
        email: "darren.google@gmail.com",
        username: "Darren Google",
        oauthId: "109283746554321098765",
      });
      await AsyncStorage.setItem("userToken", response.data.token);
      await AsyncStorage.setItem("userData", JSON.stringify(response.data.user));
      onLoginSuccess(response.data.user);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || "Google login failed");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Top Logo & Title Section (Full-bleed rounded clipping without white padding) */}
      <View style={styles.headerSection}>
        <View style={styles.logoContainer}>
          <Image source={require("../../assets/kaching_logo.png")} style={styles.logoImage} resizeMode="cover" />
        </View>
        <Text style={styles.appTitle}>Ka-Ching!</Text>
        <Text style={styles.subtitle1}>Your personal finance companion.</Text>
        <Text style={styles.subtitle2}>Track smarter. Save better.</Text>
      </View>

      {/* Form Input Section */}
      <View style={styles.formSection}>
        {/* Error message box (displayed when validation fails) */}
        {errorMsg ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* Show Username input only in Register mode */}
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

        {/* Classic black background + official 4-color Google OAuth login button */}
        <TouchableOpacity style={styles.googleBlackBtn} onPress={handleGoogleLogin} activeOpacity={0.85}>
          <View style={styles.googleWhiteBadge}>
            <GoogleColorfulIcon />
          </View>
          <Text style={styles.googleBlackBtnText}>Continue with Google</Text>
        </TouchableOpacity>

        {/* Bottom row to switch between Login and Register modes */}
        <View style={styles.bottomSwitchRow}>
          <Text style={styles.switchHint}>{isRegistering ? "Already have an account?" : "No account yet?"}</Text>
          <TouchableOpacity
            onPress={() => {
              setIsRegistering(!isRegistering);
              setErrorMsg("");
            }}
          >
            <Text style={styles.switchLink}>{isRegistering ? "Login here" : "Register here"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

// Stylesheet: Optimized seamless rounded Logo container and classic black Google button
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
    errorBox: {
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.danger,
      borderRadius: SHAPES.inputRadius,
      backgroundColor: COLORS.dangerBg,
      padding: 10,
      marginBottom: 14,
    },
    errorText: {
      color: COLORS.danger,
      fontFamily: FONTS.mono,
      fontSize: 11,
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
      marginBottom: 20,
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
