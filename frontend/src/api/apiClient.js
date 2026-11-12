/**
 * @file frontend/src/api/apiClient.js
 * @layer API Client (Axios Instance with Automatic LAN IP Resolution for Android/iOS Expo Go)
 * @description Automatically replaces "localhost" with the PC's LAN IP when running on a physical Android/iOS device via Expo Go.
 * @exports default apiClient, getResolvedApiBaseUrl
 */

import axios from "axios";
import { Platform } from "react-native";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Dynamically resolve the correct backend URL for both Web (localhost) and Physical Phone (LAN IP)
export const getResolvedApiBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000/api";

  if (Platform.OS === "web") {
    return envUrl;
  }

  if (envUrl.includes("localhost") || envUrl.includes("127.0.0.1")) {
    const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.debuggerHost || Constants.manifest?.debuggerHost;

    if (debuggerHost) {
      const lanIp = debuggerHost.split(":")[0];
      if (lanIp) {
        return envUrl.replace("localhost", lanIp).replace("127.0.0.1", lanIp);
      }
    }
  }

  return envUrl;
};

const apiClient = axios.create({
  baseURL: getResolvedApiBaseUrl(),
  timeout: 12000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      // Ignore storage read error
    }
    return config;
  },
  (error) => Promise.reject(error),
);

export default apiClient;
