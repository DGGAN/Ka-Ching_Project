/**
 * @file frontend/src/services/autoCaptureService.js
 * @layer Frontend Service (Smart Auto-Capture Pipeline & Live OS Notification Simulator)
 * @description Clean, zero-crash service that simulates real OS payment notifications via expo-notifications and posts payment text to POST /api/transactions/auto-capture.
 * @exports triggerLivePaymentNotificationCapture, flushPendingAutoCaptureQueue, registerAndroidHeadlessNotificationListener
 */

import apiClient from "../api/apiClient";
import { sendSystemBannerNotification } from "../utils/systemNotifications";

/**
 * 1. Fires a REAL OS top banner notification (simulating TNG/MAE/GrabPay) AND sends it through
 *    POST /api/transactions/auto-capture, then pops the Ka-Ching! Auto-Captured confirmation banner.
 */
export async function triggerLivePaymentNotificationCapture({
  userId,
  title = "Touch 'n Go eWallet",
  text = "",
  packageName = "my.com.tngdigital.ewallet",
  platform = "ANDROID_LISTENER",
  isUserNotificationEnabled = true,
}) {
  // Step 1: Pop the incoming eWallet/Bank payment banner at the top of the phone screen
  try {
    await sendSystemBannerNotification({
      isUserNotificationEnabled: true,
      title: title,
      body: text,
      data: { tag: "SIMULATED_BANK_ALERT" },
    });
  } catch (e) {
    // Non-blocking on web
  }

  // Step 2: Send to Render backend POST /api/transactions/auto-capture
  const response = await apiClient.post(
    "/transactions/auto-capture",
    {
      userId,
      title,
      text,
      packageName,
      platform,
    },
    { timeout: 60000 },
  );

  const capturedTx = response.data?.data || null;

  // Step 3: Pop the Ka-Ching! Auto-Captured confirmation banner in the phone status bar
  if (capturedTx && !response.data?.duplicateSkipped) {
    try {
      await sendSystemBannerNotification({
        isUserNotificationEnabled,
        title: `Ka-Ching! Auto-Captured RM ${Number(capturedTx.amount).toFixed(2)}`,
        body: `${capturedTx.merchantName} (${capturedTx.category.replace(/_/g, " ")}) was saved with AUTO badge.`,
        data: { transactionId: capturedTx._id, tag: "AUTO_CAPTURE" },
      });
    } catch (e) {
      // Non-blocking
    }
  }

  return response;
}

// Keep no-op exports so App.js or any existing import never breaks
export async function flushPendingAutoCaptureQueue() {
  return;
}

export function registerAndroidHeadlessNotificationListener() {
  return;
}
