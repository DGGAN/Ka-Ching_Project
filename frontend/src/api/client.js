// 导入 axios 网络请求工具和手机本地存储库
// Import axios HTTP client and mobile local storage library
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// 设置后端服务器基础地址（网页测试用 localhost，Android 模拟器用 10.0.2.2）
// Set backend server base URL (use localhost for Web testing, 10.0.2.2 for Android Emulator)
const API_BASE_URL = "http://localhost:5000/api";

// 创建 axios 实例并配置默认 JSON 请求头
// Create axios instance and configure default JSON headers
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// 请求拦截器：每次发送请求前，自动读取本地保存的 JWT Token 并放入 Authorization 头
// Request interceptor: Automatically read saved JWT Token and attach to Authorization header
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("userToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 导出配置好的 API 客户端
// Export configured API client
export default apiClient;
