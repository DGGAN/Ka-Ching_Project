// Import axios HTTP client and mobile local storage library
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Set backend server base URL (use localhost for Web testing, 10.0.2.2 for Android Emulator)
const API_BASE_URL = "http://localhost:5000/api";

// Create axios instance and configure default JSON headers
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: Automatically read saved JWT Token and attach to Authorization header
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("userToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Export configured API client
export default apiClient;
