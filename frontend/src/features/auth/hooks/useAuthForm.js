/**
 * @file frontend/src/features/auth/hooks/useAuthForm.js
 * @layer Hook (Authentication State, Real Google OAuth 2.0 & 5-Tap Secret Dev Panel)
 * @description Manages Login/Register state, 5-tap duck logo secret unlock, and real Google OAuth 2.0 authentication on both Web and Mobile (Android/iOS).
 * @exports useAuthForm, DEV_TEST_ACCOUNTS
 */

import { useState, useRef, useEffect } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import apiClient from "../../../api/apiClient";
import { playUiSound } from "../../../utils/soundEffects";
import { loginWithEmailApi, registerWithEmailApi, authenticateGoogleBackendApi, fetchGoogleUserInfoApi } from "../services/authService";

WebBrowser.maybeCompleteAuthSession();

// 4 Preset Developer Test Accounts loaded from .env
export const DEV_TEST_ACCOUNTS = [
  {
    tag: "1. Balanced",
    email: process.env.EXPO_PUBLIC_GOOGLE_EMAIL,
    username: process.env.EXPO_PUBLIC_GOOGLE_USERNAME,
    oauthId: process.env.EXPO_PUBLIC_GOOGLE_OAUTH_ID,
  },
  {
    tag: "2. 92% Risk",
    email: process.env.EXPO_PUBLIC_GOOGLE_ALT_EMAIL,
    username: process.env.EXPO_PUBLIC_GOOGLE_ALT_USERNAME,
    oauthId: process.env.EXPO_PUBLIC_GOOGLE_ALT_OAUTH_ID,
  },
  {
    tag: "3. Fast Saver",
    email: process.env.EXPO_PUBLIC_GOOGLE_SAVER_EMAIL,
    username: process.env.EXPO_PUBLIC_GOOGLE_SAVER_USERNAME,
    oauthId: process.env.EXPO_PUBLIC_GOOGLE_SAVER_OAUTH_ID,
  },
  {
    tag: "4. Empty New",
    email: process.env.EXPO_PUBLIC_GOOGLE_FRESH_EMAIL,
    username: process.env.EXPO_PUBLIC_GOOGLE_FRESH_USERNAME,
    oauthId: process.env.EXPO_PUBLIC_GOOGLE_FRESH_OAUTH_ID,
  },
];

export function useAuthForm(onLoginSuccess, showToast) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  // Secret 5-Tap Logo Unlock State (Hidden from normal users by default)
  const [showSecretDevPanel, setShowSecretDevPanel] = useState(false);
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef(null);

  const isDevFeatureAllowed = process.env.EXPO_PUBLIC_ENABLE_DEV_SHORTCUTS !== "false";

  // Check if returning from a same-tab Web Google OAuth redirect (#access_token=...)
  useEffect(() => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const hash = window.location.hash || "";
      if (hash.includes("access_token=")) {
        const params = new URLSearchParams(hash.replace(/^#/, ""));
        const accessToken = params.get("access_token");
        window.history.replaceState({}, document.title, window.location.pathname);
        if (accessToken) {
          handleVerifyGoogleAccessToken(accessToken);
        }
      }
    }
  }, []);

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
    playUiSound("pop");
    if (!email.trim() || !password || (isRegistering && !username.trim())) {
      showToast("error", "Please fill in all required fields.");
      return;
    }

    try {
      const data = isRegistering
        ? await registerWithEmailApi(username.trim(), email.trim(), password)
        : await loginWithEmailApi(email.trim(), password);

      await AsyncStorage.setItem("userToken", data.token);
      await AsyncStorage.setItem("userData", JSON.stringify(data.user));

      showToast("success", isRegistering ? "Account registered!" : "Welcome back!");
      setTimeout(() => {
        onLoginSuccess(data.user);
      }, 300);
    } catch (error) {
      const targetUrl = apiClient.defaults.baseURL;
      const backendMessage = error.response?.data?.message || `Cannot reach server (${targetUrl}). Check Wi-Fi & backend.`;
      showToast("error", backendMessage);
    }
  };

  // 2. Complete backend /auth/google sign-in with verified Google profile payload
  const authenticateWithGoogleBackend = async ({ email: gEmail, username: gName, oauthId: gId }) => {
    try {
      setGoogleLoading(true);
      const data = await authenticateGoogleBackendApi({
        email: gEmail,
        username: gName,
        oauthId: gId,
      });
      await AsyncStorage.setItem("userToken", data.token);
      await AsyncStorage.setItem("userData", JSON.stringify(data.user));
      showToast("success", `Signed in as ${data.user.username}!`);
      setTimeout(() => {
        onLoginSuccess(data.user);
      }, 300);
    } catch (error) {
      const targetUrl = apiClient.defaults.baseURL;
      const errMsg = error.response?.data?.message || `Cannot reach backend (${targetUrl}). Check internet connection.`;
      showToast("error", errMsg);
    } finally {
      setGoogleLoading(false);
    }
  };

  // Helper: Verify real Google OAuth 2.0 access_token against Google UserInfo API
  const handleVerifyGoogleAccessToken = async (accessToken) => {
    try {
      setGoogleLoading(true);
      const profile = await fetchGoogleUserInfoApi(accessToken);
      await authenticateWithGoogleBackend({
        email: profile.email,
        username: profile.name || profile.email.split("@")[0],
        oauthId: profile.sub,
      });
    } catch (err) {
      showToast("error", "Google Sign-In verification failed. Please try again or use email login.");
      setGoogleLoading(false);
    }
  };

  // 3. Primary Black Button: Real User "Continue with Google" Handler (Web + Mobile APK)
  const handleRealUserGoogleLogin = async () => {
    playUiSound("pop");

    const rawClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "";
    const clientId = rawClientId.replace(/['"\s]/g, "").trim();

    if (!clientId.endsWith(".apps.googleusercontent.com")) {
      showToast("error", "Google Client ID is missing in .env. Please login with your email and password.");
      return;
    }

    const scope = encodeURIComponent("openid email profile");

    // A. Web Browser Flow
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const redirectUri = window.location.origin;
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(
        redirectUri,
      )}&response_type=token&scope=${scope}&prompt=select_account`;

      const width = 500;
      const height = 620;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(authUrl, "google_oauth_popup", `width=${width},height=${height},left=${left},top=${top}`);

      if (popup) {
        const pollTimer = setInterval(async () => {
          try {
            if (popup.closed) {
              clearInterval(pollTimer);
              return;
            }
            if (popup.location.href.includes("error=")) {
              popup.close();
              clearInterval(pollTimer);
              showToast("error", "Google Sign-In was cancelled or rejected.");
              return;
            }
            if (popup.location.href.includes("access_token=")) {
              const hash = popup.location.hash.substring(1);
              const params = new URLSearchParams(hash);
              const accessToken = params.get("access_token");
              popup.close();
              clearInterval(pollTimer);

              if (accessToken) {
                await handleVerifyGoogleAccessToken(accessToken);
              }
            }
          } catch (err) {
            // Ignore cross-origin frame access errors while user is on accounts.google.com
          }
        }, 400);
        return;
      }
    }

    // B. Mobile (Android / iOS) System Browser Flow using your Authorized Render Callback URI
    try {
      setGoogleLoading(true);
      const baseApiUrl = (apiClient.defaults?.baseURL || "https://kaching-backend-27o2.onrender.com/api").replace(/\/$/, "");
      const backendRedirectUri = `${baseApiUrl}/auth/google/callback`;
      const appReturnUrl = makeRedirectUri({ scheme: "kaching", path: "auth" });

      // Pass appReturnUrl inside OAuth `state` so the Render callback bounces straight back into the app
      const statePayload = encodeURIComponent(appReturnUrl);
      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(
        backendRedirectUri,
      )}&response_type=token&scope=${scope}&state=${statePayload}&prompt=select_account`;

      const result = await WebBrowser.openAuthSessionAsync(googleAuthUrl, appReturnUrl);

      if (result.type === "success" && result.url) {
        const hashPart = result.url.split("#")[1] || "";
        const queryPart = result.url.split("?")[1]?.split("#")[0] || "";
        const params = new URLSearchParams(hashPart || queryPart);
        const accessToken = params.get("access_token");

        if (accessToken) {
          await handleVerifyGoogleAccessToken(accessToken);
          return;
        }
      }

      if (result.type !== "cancel" && result.type !== "dismiss") {
        showToast("error", "Google Sign-In could not complete. Please verify your internet or use email login.");
      }
    } catch (mobileErr) {
      showToast("error", "Google Sign-In is currently unavailable. Please login with your email and password.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return {
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
  };
}
