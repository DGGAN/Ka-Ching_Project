/**
 * @file frontend/src/features/auth/hooks/useAuthForm.js
 * @layer Hook (Authentication State, 2-Step Email OTP Registration, Real Google OAuth 2.0 & 5-Tap Secret Dev Panel)
 * @description Manages Login/Register state, 6-digit email OTP verification for new accounts, 5-tap duck logo secret unlock, and real Google OAuth 2.0 authentication on Web and Mobile.
 * @exports useAuthForm, DEV_TEST_ACCOUNTS
 */

import { useState, useRef, useEffect } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import apiClient from "../../../api/apiClient";
import { playUiSound } from "../../../utils/soundEffects";
import { loginWithEmailApi, authenticateGoogleBackendApi, fetchGoogleUserInfoApi } from "../services/authService";

WebBrowser.maybeCompleteAuthSession();

// 4 Preset Developer Test Accounts synced with backend/scripts/seedTestUsers.js
export const DEV_TEST_ACCOUNTS = [
  {
    tag: "1. Balanced",
    email: "kaching.pfmapp@gmail.com",
    username: "Ka-Ching Demo",
    oauthId: "109283746554321098765",
  },
  {
    tag: "2. 92% Risk",
    email: "meiling.student@gmail.com",
    username: "Mei Ling Tan",
    oauthId: "109283746554321098888",
  },
  {
    tag: "3. Fast Saver",
    email: "aiman.saver@gmail.com",
    username: "Aiman Saver",
    oauthId: "109283746554321098777",
  },
  {
    tag: "4. Empty New",
    email: "chloe.fresh@gmail.com",
    username: "Chloe Fresh",
    oauthId: "109283746554321098666",
  },
];

export function useAuthForm(onLoginSuccess, showToast) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // 2-Step Registration Email OTP Modal State
  const [showRegisterOtpModal, setShowRegisterOtpModal] = useState(false);
  const [registerOtpCode, setRegisterOtpCode] = useState("");
  const [verifyingRegisterOtp, setVerifyingRegisterOtp] = useState(false);
  const [resendingRegisterOtp, setResendingRegisterOtp] = useState(false);
  const [registerResendCooldown, setRegisterResendCooldown] = useState(0);

  // Secret 5-Tap Logo Unlock State (Hidden from normal users by default)
  const [showSecretDevPanel, setShowSecretDevPanel] = useState(false);
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef(null);

  const isDevFeatureAllowed = process.env.EXPO_PUBLIC_ENABLE_DEV_SHORTCUTS !== "false";

  // Countdown timer for registration OTP resend button
  useEffect(() => {
    if (registerResendCooldown <= 0) return;
    const timer = setInterval(() => {
      setRegisterResendCooldown((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [registerResendCooldown]);

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

  // 1. Handle Email/Password Login OR Step 1 of Registration (Send 6-Digit Email OTP)
  const handleSubmit = async () => {
    if (submitting) return;
    playUiSound("pop");

    if (!email.trim() || !password || (isRegistering && !username.trim())) {
      showToast("error", "Please fill in all required fields.");
      return;
    }

    try {
      setSubmitting(true);

      if (isRegistering) {
        const res = await apiClient.post("/auth/register-request-otp", {
          username: username.trim(),
          email: email.trim().toLowerCase(),
          password,
        });

        setRegisterOtpCode("");
        setRegisterResendCooldown(60);
        setShowRegisterOtpModal(true);
        showToast("success", res.data?.message || "Verification code sent to your email!");
        return;
      }

      const data = await loginWithEmailApi(email.trim(), password);
      await AsyncStorage.setItem("userToken", data.token);
      await AsyncStorage.setItem("userData", JSON.stringify(data.user));

      showToast("success", "Welcome back!");
      setTimeout(() => {
        onLoginSuccess(data.user);
      }, 300);
    } catch (error) {
      const targetUrl = apiClient.defaults.baseURL;
      const backendMessage = error.response?.data?.message || `Cannot reach server (${targetUrl}). Check Wi-Fi & backend.`;
      showToast("error", backendMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // 1.5 Step 2 of Registration: Verify 6-Digit Email OTP & Create Account
  const handleVerifyRegisterOtp = async (modalNotify) => {
    const notifyFn = typeof modalNotify === "function" ? modalNotify : showToast;
    if (verifyingRegisterOtp) return;

    if (!registerOtpCode || registerOtpCode.trim().length !== 6) {
      notifyFn("error", "Please enter the 6-digit verification code.");
      return;
    }

    try {
      setVerifyingRegisterOtp(true);
      const res = await apiClient.post("/auth/register-verify-otp", {
        email: email.trim().toLowerCase(),
        otpCode: registerOtpCode.trim(),
      });

      const data = res.data;
      await AsyncStorage.setItem("userToken", data.token);
      await AsyncStorage.setItem("userData", JSON.stringify(data.user));

      setShowRegisterOtpModal(false);
      setRegisterOtpCode("");
      showToast("success", "Email verified! Welcome to Ka-Ching!");
      setTimeout(() => {
        onLoginSuccess(data.user);
      }, 300);
    } catch (error) {
      notifyFn("error", error.response?.data?.message || "Verification failed. Please check your code.");
    } finally {
      setVerifyingRegisterOtp(false);
    }
  };

  // 1.6 Resend Registration 6-Digit OTP
  const handleResendRegisterOtp = async (modalNotify) => {
    const notifyFn = typeof modalNotify === "function" ? modalNotify : showToast;
    if (resendingRegisterOtp || registerResendCooldown > 0) return;

    try {
      setResendingRegisterOtp(true);
      const res = await apiClient.post("/auth/register-request-otp", {
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
      setRegisterResendCooldown(60);
      notifyFn("success", res.data?.message || "A new 6-digit code has been sent.");
    } catch (error) {
      notifyFn("error", error.response?.data?.message || "Could not resend verification code.");
    } finally {
      setResendingRegisterOtp(false);
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
  };
}
