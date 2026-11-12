/**
 * @file frontend/src/services/autoCaptureService.js
 * @layer Service (Cross-Platform Android Notification Listener & iOS 27 Shortcuts Webhook Client)
 * @description Provides API methods to read/toggle the Profile Auto-Capture master switch and send live or simulated payment notifications to the backend.
 * @exports fetchAutoCaptureStatusApi, updateAutoCaptureToggleApi, sendAutoCaptureNotification, SAMPLE_MALAYSIAN_NOTIFICATIONS
 */

import { Platform } from "react-native";
import apiClient from "../api/apiClient";

export const SAMPLE_MALAYSIAN_NOTIFICATIONS = [
  {
    id: "tng_familymart",
    app: "Touch 'n Go eWallet",
    packageName: "my.com.tngdigital.ewallet",
    title: "Touch 'n Go eWallet",
    text: "You have paid RM 15.90 to FAMILYMART SUNWAY PYRAMID using Touch 'n Go eWallet.",
  },
  {
    id: "tng_zus",
    app: "Touch 'n Go eWallet",
    packageName: "my.com.tngdigital.ewallet",
    title: "DuitNow QR Payment",
    text: "Payment of RM 11.50 to ZUS COFFEE AMPANG was successful.",
  },
  {
    id: "mae_uniqlo",
    app: "MAE by Maybank2u",
    packageName: "com.maybank2u.life",
    title: "MAE QRPay",
    text: "MAE: You've spent RM 79.90 at UNIQLO MID VALLEY.",
  },
  {
    id: "grab_petronas",
    app: "GrabPay",
    packageName: "com.grabtaxi.passenger",
    title: "GrabPay Transaction",
    text: "You paid RM 50.00 to PETRONAS STATION SUBANG JAYA via GrabPay.",
  },
  {
    id: "tng_income",
    app: "Touch 'n Go eWallet",
    packageName: "my.com.tngdigital.ewallet",
    title: "Money Received",
    text: "You have received RM 120.00 from TAN WEI MING via DuitNow.",
  },
];

export const fetchAutoCaptureStatusApi = async (userId) => {
  const response = await apiClient.get(`/transactions/auto-capture-status/${userId}`);
  return Boolean(response.data?.autoCaptureEnabled);
};

export const updateAutoCaptureToggleApi = async (userId, enabled) => {
  const response = await apiClient.put(`/transactions/auto-capture-toggle/${userId}`, {
    enabled: Boolean(enabled),
  });
  return response.data;
};

export const sendAutoCaptureNotification = async ({
  userId,
  title,
  text,
  packageName = "my.com.tngdigital.ewallet",
  platform = Platform.OS === "ios" ? "IOS_27_SHORTCUT" : "ANDROID_LISTENER",
}) => {
  const response = await apiClient.post("/transactions/auto-capture", {
    userId,
    title,
    text,
    packageName,
    platform,
  });
  return response.data;
};
