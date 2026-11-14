/**
 * @file frontend/src/api/apiClient.js
 * @layer API Client (Auto LAN IP Resolution & JWT Bearer Token Interceptor)
 * @description Automatically resolves LAN IP on physical Android/iOS devices and attaches the stored JWT token to Authorization headers for protected routes.
 */

import axios from "axios";
import { Platform } from "react-native";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";

const resolveBaseApiUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000/api";

  if (Platform.OS === "web") {
    return envUrl;
  }

  if (envUrl.includes("localhost") || envUrl.includes("127.0.0.1")) {
    const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.debuggerHost || Constants.manifest?.debuggerHost;

    if (debuggerHost) {
      const lanIp = debuggerHost.split(":")[0];
      if (lanIp) {
        return `http://${lanIp}:5000/api`;
      }
    }
  }

  return envUrl;
};

const apiClient = axios.create({
  baseURL: resolveBaseApiUrl(),
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically attach JWT Bearer token from AsyncStorage to every outgoing request
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
