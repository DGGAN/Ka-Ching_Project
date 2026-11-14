/**
 * @file frontend/src/features/profile/hooks/useProfileSettings.js
 * @layer Custom Hook (Profile & Account Security State Management)
 * @description Manages popup modals for editing Username/Email, setting/changing Password, binding/unbinding Google OAuth, and notification preferences.
 * @exports useProfileSettings
 */

import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { playUiSound } from "../../../utils/soundEffects";
import { fetchUserProfileApi, updateUserProfileApi, fetchAutoCaptureStatusApi } from "../services/profileService";

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

  const syncUserToStorageAndParent = async (updatedUserObj) => {
    setProfileUser(updatedUserObj);
    setUsernameInput(updatedUserObj.username || "");
    setEmailInput(updatedUserObj.email || "");
    setBindGoogleEmailInput(updatedUserObj.email || "");
    setNotificationsEnabled(updatedUserObj.isNotificationEnabled !== false);
    setAutoCaptureEnabled(Boolean(updatedUserObj.autoCaptureEnabled));

    try {
      await AsyncStorage.setItem("userData", JSON.stringify(updatedUserObj));
    } catch (e) {
      // Ignore storage error
    }

    if (typeof onUserUpdated === "function") {
      onUserUpdated(updatedUserObj);
    }
  };

  const refreshProfileFromServer = async (userId) => {
    try {
      const [freshUser, autoCapStatus] = await Promise.all([
        fetchUserProfileApi(userId).catch(() => null),
        fetchAutoCaptureStatusApi(userId).catch(() => false),
      ]);

      if (freshUser) {
        await syncUserToStorageAndParent({
          ...freshUser,
          autoCaptureEnabled: typeof freshUser.autoCaptureEnabled === "boolean" ? freshUser.autoCaptureEnabled : autoCapStatus,
        });
      } else {
        setAutoCaptureEnabled(autoCapStatus);
      }
    } catch (e) {
      // Fallback to local user prop
    }
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

  // 3. Bind Google Account
  const handleBindGoogle = async (modalNotify) => {
    const notifyFn = typeof modalNotify === "function" ? modalNotify : showToast;
    const cleanGoogleEmail = bindGoogleEmailInput.trim().toLowerCase();
    if (!cleanGoogleEmail || !cleanGoogleEmail.includes("@")) {
      notifyFn("error", "Please enter a valid Google email address.");
      return;
    }

    try {
      setBindingGoogle(true);
      const res = await updateUserProfileApi(user.id, {
        bindGoogle: {
          email: cleanGoogleEmail,
          oauthId: `google_${cleanGoogleEmail}`,
        },
      });

      if (res?.user) {
        await syncUserToStorageAndParent(res.user);
      }
      setShowBindGoogleModal(false);
      playUiSound("edit");
      showToast("success", `Bound to Google (${cleanGoogleEmail})!`);
    } catch (error) {
      notifyFn("error", error.response?.data?.message || "Failed to bind Google account.");
    } finally {
      setBindingGoogle(false);
    }
  };

  // 4. Unbind Google Account
  const handleUnbindGoogle = async () => {
    if (!profileUser?.hasPassword) {
      handleOpenPasswordModal();
      showToast("error", "Please set a login password first before unbinding Google!");
      return;
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
      showToast("info", "Google account unbound. You can log in via password.");
    } catch (error) {
      showToast("error", error.response?.data?.message || "Could not unbind Google account.");
    } finally {
      setBindingGoogle(false);
    }
  };

  // 5. Toggle In-App Notification Alerts
  const handleToggleNotifications = async () => {
    const nextVal = !notificationsEnabled;
    playUiSound("pop");
    setNotificationsEnabled(nextVal);

    try {
      const res = await updateUserProfileApi(user.id, {
        isNotificationEnabled: nextVal,
      });
      if (res?.user) {
        await syncUserToStorageAndParent(res.user);
      }
      showToast("info", nextVal ? "In-app notifications enabled." : "Notifications muted.");
    } catch (error) {
      setNotificationsEnabled(!nextVal);
      showToast("error", "Failed to update notification preference.");
    }
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
