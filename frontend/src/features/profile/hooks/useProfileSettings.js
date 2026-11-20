/**
 * @file frontend/src/features/profile/hooks/useProfileSettings.js
 * @layer Custom Hook (Profile & Account Security State Management + Real Google OAuth 2.0 Binding & OS Push Sync)
 * @description Manages popup modals for editing Username/Email, setting/changing Password, real Google OAuth 2.0 binding/unbinding, Auto-Capture sync, and real-time OS push notification preferences.
 * @exports useProfileSettings
 */

import { useState, useEffect } from "react";
import { AppState, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import apiClient from "../../../api/apiClient";
import { playUiSound } from "../../../utils/soundEffects";
import { fetchGoogleUserInfoApi } from "../../auth/services/authService";
import {
  checkActualOsNotificationPermission,
  syncNotificationStatusWithOS,
  handleTogglePushNotificationSwitch,
} from "../../../utils/systemNotifications";
import { fetchUserProfileApi, updateUserProfileApi, fetchAutoCaptureStatusApi } from "../services/profileService";

WebBrowser.maybeCompleteAuthSession();

export function useProfileSettings(user, onUserUpdated, showToast) {
  const [profileUser, setProfileUser] = useState(user || {});

  // Edit Identity (Username & Email) Modal State
  const [showEditIdentityModal, setShowEditIdentityModal] = useState(false);
  const [usernameInput, setUsernameInput] = useState(user?.username || "");
  const [emailInput, setEmailInput] = useState(user?.email || "");
  const [savingProfile, setSavingProfile] = useState(false);

  // Set / Change Password Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Google Bind Modal State
  const [showBindGoogleModal, setShowBindGoogleModal] = useState(false);
  const [bindGoogleEmailInput, setBindGoogleEmailInput] = useState(user?.email || "");
  const [bindingGoogle, setBindingGoogle] = useState(false);

  // Preferences & Modals State
  const [notificationsEnabled, setNotificationsEnabled] = useState(user?.isNotificationEnabled !== false);
  const [autoCaptureEnabled, setAutoCaptureEnabled] = useState(Boolean(user?.autoCaptureEnabled));
  const [showAutoCaptureModal, setShowAutoCaptureModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);

  useEffect(() => {
    if (user?.id) {
      refreshProfileFromServer(user.id);
    }
  }, [user?.id]);

  // Keep local state in sync if parent App.js updates user flags
  useEffect(() => {
    if (user) {
      setProfileUser((prev) => ({ ...prev, ...user }));
      if (typeof user.isNotificationEnabled === "boolean") {
        setNotificationsEnabled(user.isNotificationEnabled);
      }
      if (typeof user.autoCaptureEnabled === "boolean") {
        setAutoCaptureEnabled(user.autoCaptureEnabled);
      }
    }
  }, [user?.isNotificationEnabled, user?.autoCaptureEnabled]);

  // Re-verify real OS notification permission whenever user returns from Phone Settings
  useEffect(() => {
    const subscription = AppState.addEventListener("change", async (nextAppState) => {
      if (nextAppState === "active" && profileUser?.id) {
        const effectiveEnabled = await syncNotificationStatusWithOS(profileUser, async (syncedUser) => {
          await syncUserToStorageAndParent({
            ...syncedUser,
            autoCaptureEnabled,
          });
        });
        setNotificationsEnabled(effectiveEnabled);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [profileUser, autoCaptureEnabled]);

  const syncUserToStorageAndParent = async (updatedUserObj) => {
    const osPerm = await checkActualOsNotificationPermission();
    const effectiveNotifEnabled = updatedUserObj.isNotificationEnabled !== false && osPerm === "granted";

    const normalizedUser = {
      ...updatedUserObj,
      isNotificationEnabled: effectiveNotifEnabled,
      autoCaptureEnabled: Boolean(updatedUserObj.autoCaptureEnabled),
    };

    setProfileUser(normalizedUser);
    setUsernameInput(normalizedUser.username || "");
    setEmailInput(normalizedUser.email || "");
    setBindGoogleEmailInput(normalizedUser.email || "");
    setNotificationsEnabled(effectiveNotifEnabled);
    setAutoCaptureEnabled(Boolean(normalizedUser.autoCaptureEnabled));

    try {
      await AsyncStorage.setItem("userData", JSON.stringify(normalizedUser));
      await AsyncStorage.setItem("kaching_autocapture_enabled", normalizedUser.autoCaptureEnabled ? "true" : "false");
    } catch (e) {
      // Ignore storage error
    }

    if (typeof onUserUpdated === "function") {
      onUserUpdated(normalizedUser);
    }
  };

  const refreshProfileFromServer = async (userId) => {
    try {
      const [freshUser, autoCapStatus, osPerm] = await Promise.all([
        fetchUserProfileApi(userId).catch(() => null),
        fetchAutoCaptureStatusApi(userId).catch(() => false),
        checkActualOsNotificationPermission(),
      ]);

      if (freshUser) {
        const effectiveNotifState = freshUser.isNotificationEnabled !== false && osPerm === "granted";

        // If DB had default true, but THIS device has OS permission denied, sync false back to DB
        if (freshUser.isNotificationEnabled !== false && osPerm !== "granted") {
          updateUserProfileApi(userId, { isNotificationEnabled: false }).catch(() => {});
        }

        await syncUserToStorageAndParent({
          ...freshUser,
          isNotificationEnabled: effectiveNotifState,
          autoCaptureEnabled: typeof freshUser.autoCaptureEnabled === "boolean" ? freshUser.autoCaptureEnabled : autoCapStatus,
        });
      } else {
        setAutoCaptureEnabled(autoCapStatus);
      }
    } catch (e) {
      // Fallback to local user prop
    }
  };

  // Sync AutoCaptureModal toggle directly into profileUser, AsyncStorage, and App.js parent state
  const handleAutoCaptureStatusChanged = async (nextState) => {
    const boolState = Boolean(nextState);
    setAutoCaptureEnabled(boolState);
    await syncUserToStorageAndParent({
      ...profileUser,
      autoCaptureEnabled: boolState,
    });
  };

  // Open Identity Edit Modal and pre-fill current values
  const handleOpenEditIdentityModal = () => {
    playUiSound("pop");
    setUsernameInput(profileUser?.username || "");
    setEmailInput(profileUser?.email || "");
    setShowEditIdentityModal(true);
  };

  // 1. Save Username & Email Changes from Modal
  const handleSaveIdentity = async (modalNotify) => {
    const notifyFn = typeof modalNotify === "function" ? modalNotify : showToast;
    const cleanName = usernameInput.trim();
    const cleanEmail = emailInput.trim().toLowerCase();

    if (!cleanName || cleanName.length < 3) {
      notifyFn("error", "Username must be at least 3 characters.");
      return;
    }
    if (!cleanEmail || !cleanEmail.includes("@")) {
      notifyFn("error", "Please enter a valid email address.");
      return;
    }

    try {
      setSavingProfile(true);
      const res = await updateUserProfileApi(user.id, {
        username: cleanName,
        email: cleanEmail,
      });

      if (res?.user) {
        await syncUserToStorageAndParent(res.user);
      }
      setShowEditIdentityModal(false);
      playUiSound("edit");
      showToast("success", "Username and email updated!");
    } catch (error) {
      notifyFn("error", error.response?.data?.message || "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  // Open Password Modal and clear inputs
  const handleOpenPasswordModal = () => {
    playUiSound("pop");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowPasswordModal(true);
  };

  // 2. Set or Change Password from Modal
  const handleSavePassword = async (modalNotify) => {
    const notifyFn = typeof modalNotify === "function" ? modalNotify : showToast;
    const hasExistingPassword = Boolean(profileUser?.hasPassword);

    if (hasExistingPassword && !currentPassword) {
      notifyFn("error", "Please enter your current password.");
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      notifyFn("error", "New password must be at least 8 characters with letters & numbers.");
      return;
    }
    if (newPassword !== confirmPassword) {
      notifyFn("error", "New password and confirmation do not match.");
      return;
    }

    try {
      setSavingPassword(true);
      const res = await updateUserProfileApi(user.id, {
        currentPassword: hasExistingPassword ? currentPassword : "",
        newPassword,
      });

      if (res?.user) {
        await syncUserToStorageAndParent(res.user);
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordModal(false);
      playUiSound("edit");
      showToast("success", hasExistingPassword ? "Password changed successfully!" : "Login password set! You can now log in with email & password.");
    } catch (error) {
      notifyFn("error", error.response?.data?.message || "Failed to update password.");
    } finally {
      setSavingPassword(false);
    }
  };

  // Helper: Verify real Google access_token and bind verified email + sub to current user
  const completeVerifiedGoogleBind = async (accessToken) => {
    const profile = await fetchGoogleUserInfoApi(accessToken);
    if (!profile?.email || !profile?.sub) {
      throw new Error("Could not verify your Google account details.");
    }

    const res = await updateUserProfileApi(user.id, {
      bindGoogle: {
        email: profile.email.trim().toLowerCase(),
        oauthId: String(profile.sub),
      },
    });

    if (res?.user) {
      await syncUserToStorageAndParent(res.user);
    }
    setShowBindGoogleModal(false);
    playUiSound("edit");
    showToast("success", `Bound to Google (${profile.email})!`);
  };

  // 3. Bind Google Account via Real Google OAuth 2.0 (Web Popup + Mobile System Browser)
  const handleBindGoogle = async (modalNotify) => {
    const notifyFn = typeof modalNotify === "function" ? modalNotify : showToast;
    playUiSound("pop");

    const rawClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "";
    const clientId = rawClientId.replace(/['"\s]/g, "").trim();

    if (!clientId.endsWith(".apps.googleusercontent.com")) {
      notifyFn("error", "Google OAuth Client ID is not configured.");
      return;
    }

    const scope = encodeURIComponent("openid email profile");

    // A. Web Browser OAuth Popup Flow
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const redirectUri = window.location.origin;
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(
        redirectUri,
      )}&response_type=token&scope=${scope}&prompt=select_account`;

      const width = 500;
      const height = 620;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(authUrl, "google_bind_popup", `width=${width},height=${height},left=${left},top=${top}`);

      if (popup) {
        setBindingGoogle(true);
        const pollTimer = setInterval(async () => {
          try {
            if (popup.closed) {
              clearInterval(pollTimer);
              setBindingGoogle(false);
              return;
            }
            if (popup.location.href.includes("error=")) {
              popup.close();
              clearInterval(pollTimer);
              setBindingGoogle(false);
              notifyFn("error", "Google authorization was cancelled.");
              return;
            }
            if (popup.location.href.includes("access_token=")) {
              const hash = popup.location.hash.substring(1);
              const params = new URLSearchParams(hash);
              const accessToken = params.get("access_token");
              popup.close();
              clearInterval(pollTimer);

              if (accessToken) {
                try {
                  await completeVerifiedGoogleBind(accessToken);
                } catch (err) {
                  notifyFn("error", err.response?.data?.message || err.message || "Failed to bind Google account.");
                } finally {
                  setBindingGoogle(false);
                }
              } else {
                setBindingGoogle(false);
              }
            }
          } catch (err) {
            // Ignore cross-origin frame errors while user is on accounts.google.com
          }
        }, 400);
        return;
      }
    }

    // B. Mobile (Android / iOS) Real Google OAuth Flow via Render Callback Bridge
    try {
      setBindingGoogle(true);
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
          await completeVerifiedGoogleBind(accessToken);
          return;
        }
      }

      if (result.type !== "cancel" && result.type !== "dismiss") {
        notifyFn("error", "Google verification did not complete. Please try again.");
      }
    } catch (error) {
      notifyFn("error", error.response?.data?.message || error.message || "Failed to bind Google account.");
    } finally {
      setBindingGoogle(false);
    }
  };

  // 4. Unbind Google Account (Requires password set first)
  const handleUnbindGoogle = async () => {
    if (!profileUser?.hasPassword) {
      handleOpenPasswordModal();
      showToast("error", "Please set a login password first before unbinding Google!");
      return false;
    }

    try {
      setBindingGoogle(true);
      const res = await updateUserProfileApi(user.id, {
        unbindGoogle: true,
      });

      if (res?.user) {
        await syncUserToStorageAndParent(res.user);
      }
      playUiSound("delete");
      showToast("info", "Google account unbound. You can now log in using your email & password.");
      return true;
    } catch (error) {
      showToast("error", error.response?.data?.message || "Could not unbind Google account.");
      return false;
    } finally {
      setBindingGoogle(false);
    }
  };

  // 5. Toggle Push Notification Alerts (Verifies actual OS/Browser permission before enabling!)
  const handleToggleNotifications = async () => {
    const nextVal = !notificationsEnabled;
    playUiSound("pop");

    const finalEnabled = await handleTogglePushNotificationSwitch({
      user: profileUser,
      nextValue: nextVal,
      onUserSynced: async (syncedUser) => {
        await syncUserToStorageAndParent(syncedUser);
      },
      showToast,
    });

    setNotificationsEnabled(finalEnabled);
  };

  return {
    profileUser,
    showEditIdentityModal,
    setShowEditIdentityModal,
    handleOpenEditIdentityModal,
    usernameInput,
    setUsernameInput,
    emailInput,
    setEmailInput,
    savingProfile,
    showPasswordModal,
    setShowPasswordModal,
    handleOpenPasswordModal,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    savingPassword,
    showBindGoogleModal,
    setShowBindGoogleModal,
    bindGoogleEmailInput,
    setBindGoogleEmailInput,
    bindingGoogle,
    notificationsEnabled,
    autoCaptureEnabled,
    setAutoCaptureEnabled,
    handleAutoCaptureStatusChanged,
    showAutoCaptureModal,
    setShowAutoCaptureModal,
    showThemeModal,
    setShowThemeModal,
    handleSaveIdentity,
    handleSavePassword,
    handleBindGoogle,
    handleUnbindGoogle,
    handleToggleNotifications,
  };
}
