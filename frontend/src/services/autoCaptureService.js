/**
 * @file frontend/src/services/autoCaptureService.js
 * @layer Frontend Native Service (Android System Notification Listener Bridge)
 * @description Connects Android's native NotificationListenerService (react-native-android-notification-listener) to POST /api/transactions/auto-capture so Ka-Ching! captures TNG eWallet, MAE, GrabPay & DuitNow alerts directly from Android OS without any third-party app.
 * @exports checkAndroidNotificationListenerPermission, openAndroidNotificationListenerSettings, processIncomingNativeNotification, registerAndroidHeadlessNotificationListener
 */

import { Platform, AppRegistry, Linking } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import apiClient from "../api/apiClient";

// Safely load native module (only present in Android APK builds, gracefully degrades in Web/Expo Go)
let RNAndroidNotificationListener = null;
let RNAndroidNotificationListenerHeadlessJsName = "RNAndroidNotificationListenerHeadlessJs";

if (Platform.OS === "android") {
  try {
    const mod = require("react-native-android-notification-listener");
    RNAndroidNotificationListener = mod?.default || mod;
    if (mod?.RNAndroidNotificationListenerHeadlessJsName) {
      RNAndroidNotificationListenerHeadlessJsName = mod.RNAndroidNotificationListenerHeadlessJsName;
    }
  } catch (e) {
    // Module not compiled in current runtime (e.g. Web or Expo Go)
  }
}

// Target Malaysian financial & e-wallet package names (plus RM keyword filter so personal chats are ignored)
const FINANCIAL_PACKAGE_HINTS = [
  "tngdigital",
  "touchngo",
  "maybank",
  "mae",
  "grab",
  "cimb",
  "publicbank",
  "pbengage",
  "rhb",
  "hlb",
  "hongleong",
  "ambank",
  "bankislam",
  "boost",
  "shopeepay",
  "shopee",
  "bigpay",
  "gxbank",
  "aeonbank",
  "rytbank",
  "duitnow",
];

/**
 * 1. Check if Android OS "Notification Access" is currently granted to Ka-Ching!
 * @returns {Promise<"authorized" | "denied" | "unavailable">}
 */
export async function checkAndroidNotificationListenerPermission() {
  if (Platform.OS !== "android" || !RNAndroidNotificationListener) {
    return "unavailable";
  }
  try {
    const status = await RNAndroidNotificationListener.getPermissionStatus();
    // Returns "authorized", "denied", or "unknown"
    return status === "authorized" ? "authorized" : "denied";
  } catch (e) {
    return "unavailable";
  }
}

/**
 * 2. Open Android's exact "Special App Access -> Notification Access" system screen
 */
export async function openAndroidNotificationListenerSettings() {
  if (Platform.OS !== "android") return false;
  try {
    if (RNAndroidNotificationListener && typeof RNAndroidNotificationListener.requestPermission === "function") {
      RNAndroidNotificationListener.requestPermission();
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
 * 3. Process an incoming Android status bar notification and forward payment alerts to backend
 */
export async function processIncomingNativeNotification(rawNotifEvent) {
  try {
    if (!rawNotifEvent) return null;

    const payload = typeof rawNotifEvent === "string" ? JSON.parse(rawNotifEvent) : rawNotifEvent;

    const appPkg = String(payload.app || payload.packageName || "").toLowerCase();
    const title = String(payload.title || payload.titleBig || payload["android.title"] || "").trim();
    const text = String(
      payload.text ||
        payload.bigText ||
        payload.subText ||
        payload.summaryText ||
        payload.extraText ||
        payload["android.text"] ||
        payload["android.bigText"] ||
        "",
    ).trim();

    // Ignore Ka-Ching!'s own notifications to prevent infinite loops!
    if (appPkg.includes("com.dggan.kaching") || /ka-ching/i.test(title)) {
      return null;
    }

    const combinedText = `${title} ${text}`;
    // Quick pre-filter: Must contain "RM" or "MYR" currency amount
    if (!/(?:RM|MYR)\s*[0-9]/i.test(combinedText)) {
      return null;
    }

    const isKnownFinanceApp = FINANCIAL_PACKAGE_HINTS.some((kw) => appPkg.includes(kw));
    const hasPaymentVerb = /(?:paid|payment|transferred|transfer|received|credited|deducted|duitnow|tng|ewallet|qr|sent)/i.test(combinedText);

    if (!isKnownFinanceApp && !hasPaymentVerb) {
      return null;
    }

    // Load logged-in user from AsyncStorage
    const savedUserJson = await AsyncStorage.getItem("userData");
    if (!savedUserJson) return null;

    const currentUser = JSON.parse(savedUserJson);
    if (!currentUser?.id || !currentUser?.autoCaptureEnabled) {
      return null;
    }

    const response = await apiClient.post("/transactions/auto-capture", {
      userId: currentUser.id,
      title: title || "Payment Notification",
      text: text || combinedText,
      packageName: appPkg,
      platform: "ANDROID_LISTENER",
    });

    const capturedTx = response.data?.data || null;

    // Immediately fire an OS confirmation banner so the user sees it live while inside TNG / MAE!
    if (capturedTx && !response.data?.duplicateSkipped) {
      try {
        const { sendSystemBannerNotification } = require("../utils/systemNotifications");
        await sendSystemBannerNotification({
          isUserNotificationEnabled: currentUser?.isNotificationEnabled !== false,
          title: `Ka-Ching! Auto-Captured RM ${Number(capturedTx.amount).toFixed(2)}`,
          body: `${capturedTx.merchantName} (${capturedTx.category.replace(/_/g, " ")}) was saved automatically.`,
          data: { transactionId: capturedTx._id, tag: "AUTO_CAPTURE" },
        });
      } catch (bannerErr) {
        // Non-blocking
      }
    }

    return capturedTx;
  } catch (err) {
    // Non-blocking background listener
    return null;
  }
}

/**
 * 4. Register Android HeadlessJS task so notifications are captured even when Ka-Ching! is in the background
 */
let isHeadlessRegistered = false;
export function registerAndroidHeadlessNotificationListener() {
  if (Platform.OS !== "android" || isHeadlessRegistered) return;
  try {
    isHeadlessRegistered = true;
    AppRegistry.registerHeadlessTask(RNAndroidNotificationListenerHeadlessJsName, () => async ({ notification }) => {
      if (notification) {
        await processIncomingNativeNotification(notification);
      }
    });
  } catch (e) {
    // Ignore if already registered
  }
}
