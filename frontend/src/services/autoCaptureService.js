/**
 * @file frontend/src/services/autoCaptureService.js
 * @layer Frontend Native Service (Android System Notification Listener Bridge)
 * @description Bridges Ka-Ching!'s built-in Android KaChingAutoCapture native module to check Notification Access permission, open Android's Notification Access settings screen, sync the logged-in userId to native SharedPreferences, and scan active status bar notifications on app resume.
 * @exports checkAndroidNotificationListenerPermission, openAndroidNotificationListenerSettings, syncAutoCaptureUserToNative, scanActiveStatusBarNotifications
 */

import { Platform, NativeModules, Linking } from "react-native";

/**
 * 1. Check if Android OS "Notification Access" is currently granted to Ka-Ching!
 * @returns {Promise<"authorized" | "denied" | "unavailable">}
 */
export async function checkAndroidNotificationListenerPermission() {
  if (Platform.OS !== "android") {
    return "unavailable";
  }
  try {
    const nativeMod = NativeModules?.KaChingAutoCapture;
    if (nativeMod && typeof nativeMod.getPermissionStatus === "function") {
      const status = await nativeMod.getPermissionStatus();
      return status === "authorized" ? "authorized" : "denied";
    }
    return "denied";
  } catch (e) {
    return "denied";
  }
}

/**
 * 2. Open Android's exact "Special App Access -> Notification Access" system screen
 */
export async function openAndroidNotificationListenerSettings() {
  if (Platform.OS !== "android") return false;
  try {
    const nativeMod = NativeModules?.KaChingAutoCapture;
    if (nativeMod && typeof nativeMod.requestPermission === "function") {
      nativeMod.requestPermission();
      return true;
    }
    await Linking.openSettings();
    return true;
  } catch (e) {
    await Linking.openSettings().catch(() => {});
    return false;
  }
}

/**
 * 3. Sync logged-in userId & autoCaptureEnabled state to Android native SharedPreferences
 *    so background KaChingNotificationListener.java knows which user account to post to.
 */
export async function syncAutoCaptureUserToNative(userId, enabled = true) {
  if (Platform.OS !== "android" || !userId) return false;
  try {
    const nativeMod = NativeModules?.KaChingAutoCapture;
    if (nativeMod && typeof nativeMod.setActiveUser === "function") {
      await nativeMod.setActiveUser(String(userId), Boolean(enabled));
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}

/**
 * 4. Scan any active TNG / MAE / GrabPay notifications currently sitting in the phone's top status bar
 *    (Called automatically when user switches back to Ka-Ching! from TNG eWallet)
 */
export async function scanActiveStatusBarNotifications() {
  if (Platform.OS !== "android") return false;
  try {
    const nativeMod = NativeModules?.KaChingAutoCapture;
    if (nativeMod && typeof nativeMod.scanActiveNotifications === "function") {
      return await nativeMod.scanActiveNotifications();
    }
    return false;
  } catch (e) {
    return false;
  }
}
