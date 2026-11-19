/**
 * @file frontend/src/utils/systemNotifications.js
 * @layer Utility (Android, iOS & Web OS System Banner Notifications + Real-Time OS Permission Sync)
 * @description Manages one-time post-login notification permission prompts, enforces two-way sync between User.isNotificationEnabled and actual OS/Browser permission status, and dispatches external system banners.
 * @exports checkActualOsNotificationPermission, syncNotificationStatusWithOS, handleTogglePushNotificationSwitch, sendSystemBannerNotification, requestOcrCameraOrLibraryPermission
 */

import { Platform, Linking, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import apiClient from "../api/apiClient";

// Safely load expo-notifications on Android & iOS
let Notifications = null;
if (Platform.OS !== "web") {
  try {
    Notifications = require("expo-notifications");
    if (Notifications && typeof Notifications.setNotificationHandler === "function") {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });
    }
  } catch (e) {
    // Graceful fallback if expo-notifications is not installed yet
  }
}

// Configure Android 8.0+ High-Priority Notification Channel
async function ensureAndroidChannelAsync() {
  if (Platform.OS !== "android" || !Notifications) return;
  try {
    await Notifications.setNotificationChannelAsync("kaching_alerts", {
      name: "Ka-Ching! Budget & Expense Alerts",
      importance: Notifications.AndroidImportance?.HIGH || 4,
      vibrationPattern: [0, 200, 150, 200],
      lightColor: "#5F4E34",
      sound: "default",
    });
  } catch (e) {
    // Non-blocking
  }
}

// Helper: Persist updated isNotificationEnabled to Backend DB & AsyncStorage
async function persistUserNotificationPref(user, nextEnabled, onUserSynced) {
  if (!user?.id) return;
  const normalizedBool = Boolean(nextEnabled);
  const updatedUser = { ...user, isNotificationEnabled: normalizedBool };
  try {
    await AsyncStorage.setItem("userData", JSON.stringify(updatedUser));
    if (typeof onUserSynced === "function") {
      onUserSynced(updatedUser);
    }
    await apiClient.put(`/auth/profile/${user.id}`, {
      isNotificationEnabled: normalizedBool,
    });
  } catch (err) {
    // Non-blocking fallback
  }
}

/**
 * 1. Check actual OS (Android/iOS) or Browser (Web) permission status on THIS device
 * @returns {Promise<"granted" | "denied" | "undetermined">}
 */
export async function checkActualOsNotificationPermission() {
  if (Platform.OS === "web") {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "denied";
    }
    if (window.Notification.permission === "granted") return "granted";
    if (window.Notification.permission === "denied") return "denied";
    return "undetermined";
  }

  if (!Notifications) return "granted";
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status; // "granted", "denied", or "undetermined"
  } catch (e) {
    return "undetermined";
  }
}

/**
 * 2. Two-Way Sync Between OS Settings & App Database (Runs on Login & whenever App returns from Phone Settings)
 * - Solves the issue where default isNotificationEnabled is true (or user went to Settings)
 *   but OS permission was NOT actually granted on this device!
 */
export async function syncNotificationStatusWithOS(user, onUserSynced) {
  if (!user?.id) return false;

  try {
    await ensureAndroidChannelAsync();

    const promptKey = `kaching_notif_perm_prompted_${user.id}`;
    const waitingSettingsKey = `kaching_notif_waiting_settings_${user.id}`;

    const [alreadyPrompted, waitingForSettings] = await Promise.all([AsyncStorage.getItem(promptKey), AsyncStorage.getItem(waitingSettingsKey)]);

    let osStatus = await checkActualOsNotificationPermission();

    // Case A: User just returned from Phone OS Settings after clicking "Open Settings"
    if (waitingForSettings === "true") {
      await AsyncStorage.removeItem(waitingSettingsKey);
      if (osStatus === "granted") {
        await persistUserNotificationPref(user, true, onUserSynced);
        await sendSystemBannerNotification({
          isUserNotificationEnabled: true,
          title: "Ka-Ching! Notifications Active",
          body: "System push notifications are now enabled for your account.",
        });
        return true;
      } else {
        // User went to OS Settings but did NOT enable it -> Force switch OFF (false)!
        await persistUserNotificationPref(user, false, onUserSynced);
        return false;
      }
    }

    // Case B: First time after account login & default isNotificationEnabled is true -> Ask ONCE
    if (user.isNotificationEnabled !== false && !alreadyPrompted && osStatus !== "granted") {
      await AsyncStorage.setItem(promptKey, "true");

      if (Platform.OS === "web") {
        if (typeof window !== "undefined" && "Notification" in window && window.Notification.permission === "default") {
          const webPerm = await window.Notification.requestPermission();
          osStatus = webPerm === "granted" ? "granted" : "denied";
        }
      } else if (Notifications) {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: { allowAlert: true, allowBadge: true, allowSound: true },
        });
        osStatus = status;
      }
    }

    // Case C: If app database says ON (true), but OS permission on this device is DENIED/UNDETERMINED -> Force OFF (false)!
    if (user.isNotificationEnabled !== false && osStatus !== "granted") {
      await persistUserNotificationPref(user, false, onUserSynced);
      return false;
    }

    return user.isNotificationEnabled !== false && osStatus === "granted";
  } catch (e) {
    return false;
  }
}

/**
 * 3. Interactive Handler When User Flips the Push Notification Switch in ProfileScreen
 * - If turning OFF -> immediately saves false.
 * - If turning ON -> verifies OS/Browser permission first; if blocked in OS Settings,
 *   keeps switch OFF (false) and offers 1-tap jump to OS Settings!
 */
export async function handleTogglePushNotificationSwitch({ user, nextValue, onUserSynced, showToast }) {
  if (!user?.id) return false;

  // Turning OFF: Always allowed immediately
  if (!nextValue) {
    await persistUserNotificationPref(user, false, onUserSynced);
    if (showToast) {
      showToast("info", "Outside push notifications muted.");
    }
    return false;
  }

  // Turning ON: Must verify or request real OS/Browser permission!
  await ensureAndroidChannelAsync();

  // Web Browser Handling
  if (Platform.OS === "web") {
    if (typeof window === "undefined" || !("Notification" in window)) {
      await persistUserNotificationPref(user, false, onUserSynced);
      if (showToast) {
        showToast("error", "This browser does not support desktop push notifications.");
      }
      return false;
    }

    let perm = window.Notification.permission;
    if (perm === "default") {
      perm = await window.Notification.requestPermission();
    }

    if (perm === "granted") {
      await persistUserNotificationPref(user, true, onUserSynced);
      await sendSystemBannerNotification({
        isUserNotificationEnabled: true,
        title: "Push Notifications Enabled",
        body: "You will now receive budget and transaction alerts outside the app.",
      });
      if (showToast) {
        showToast("success", "Desktop push notifications enabled!");
      }
      return true;
    } else {
      await persistUserNotificationPref(user, false, onUserSynced);
      if (showToast) {
        showToast("error", "Browser notifications are blocked. Click the lock icon in your browser address bar to allow notifications.");
      }
      return false;
    }
  }

  // Android & iOS Native Handling
  if (!Notifications) {
    await persistUserNotificationPref(user, true, onUserSynced);
    return true;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: true, allowSound: true },
    });
    finalStatus = status;
  }

  if (finalStatus === "granted") {
    await persistUserNotificationPref(user, true, onUserSynced);
    await sendSystemBannerNotification({
      isUserNotificationEnabled: true,
      title: "Ka-Ching! Push Notifications Enabled",
      body: "You will now receive budget & expense alerts outside the app.",
    });
    if (showToast) {
      showToast("success", "System push notifications enabled!");
    }
    return true;
  }

  // User denied in OS Settings -> Keep switch OFF (false) & prompt to open Settings
  await persistUserNotificationPref(user, false, onUserSynced);

  Alert.alert(
    "Enable Notifications in Settings",
    "System notifications are currently turned off in your phone settings. Turn them on in Settings, and Ka-Ching! will automatically enable this switch when you return.",
    [
      { text: "Not Now", style: "cancel" },
      {
        text: "Open Settings",
        onPress: async () => {
          await AsyncStorage.setItem(`kaching_notif_waiting_settings_${user.id}`, "true");
          Linking.openSettings();
        },
      },
    ],
  );

  return false;
}

/**
 * 4. Trigger External OS / Browser System Banner Notification
 * - Fires ONLY when user.isNotificationEnabled === true AND OS permission is granted!
 */
export async function sendSystemBannerNotification({ isUserNotificationEnabled = true, title = "Ka-Ching! Alert", body = "", data = {} }) {
  if (!isUserNotificationEnabled || !body) return;

  try {
    // Web Desktop Banner Notification
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && "Notification" in window && window.Notification.permission === "granted") {
        new window.Notification(title, {
          body,
          icon: "/favicon.ico",
        });
      }
      return;
    }

    // Android & iOS System Status Bar / Lock Screen Banner
    if (!Notifications) return;
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") return;

    await ensureAndroidChannelAsync();

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: "default",
        ...(Platform.OS === "android" ? { channelId: "kaching_alerts" } : {}),
      },
      trigger: null, // Immediate OS banner
    });
  } catch (e) {
    // Non-blocking
  }
}

/**
 * 5. Just-In-Time Camera & Photo Library Permission for OCR Scanner (Android & iOS)
 */
export async function requestOcrCameraOrLibraryPermission(mode = "camera") {
  if (Platform.OS === "web") return true;

  try {
    const ImagePicker = require("expo-image-picker");
    const permResult =
      mode === "camera" ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permResult.status === "granted") {
      return true;
    }

    const featureLabel = mode === "camera" ? "Camera" : "Photo Library";
    Alert.alert(
      `${featureLabel} Access Required`,
      `Ka-Ching! needs ${featureLabel.toLowerCase()} permission to scan your receipts. Please enable it in your device settings.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Open Settings", onPress: () => Linking.openSettings() },
      ],
    );
    return false;
  } catch (e) {
    return true;
  }
}
