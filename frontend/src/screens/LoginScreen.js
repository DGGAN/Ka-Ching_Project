// 导入 React 钩子、原生界面组件与本地存储工具
// Import React hooks, native UI components, and local storage tool
import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// 导入 Expo 官方的 Google OAuth 认证组件与浏览器弹窗工具
// Import Expo official Google OAuth provider and web browser popup session handler
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";

import apiClient from "../api/client";
import { COLORS, FONTS } from "../theme/theme";
import { WireInput, WireButton } from "../components/WireUI";

// 确保浏览器授权弹窗在登录完成后能自动关闭并返回 App
// Ensure the web browser auth popup closes automatically and returns to App after login
WebBrowser.maybeCompleteAuthSession();

// 登录与注册屏幕（接入真实 Google OAuth 2.0 弹窗与后端验证）
// Login & Register Screen (Integrated with real Google OAuth 2.0 popup and backend auth)
export default function LoginScreen({ onLoginSuccess }) {
  // 控制当前是“登录模式 (false)”还是“注册模式 (true)”
  // State to toggle between "Login mode (false)" and "Register mode (true)"
  const [isRegistering, setIsRegistering] = useState(false);

  // 绑定输入框的真实数据状态
  // Bind state variables for text inputs
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // 配置 Google OAuth 请求（请将下方的字符串替换为你从 Google Cloud 复制的 Client ID）
  // Configure Google OAuth request (Replace the string below with your Client ID from Google Cloud)
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: "832646306135-k27ush5jap4r3feca7gqn75himbuuon6.apps.googleusercontent.com",
    // 如果以后打包成独立 Android APK，可以在这里加上 androidClientId
    // If building standalone Android APK later, you can add androidClientId here
  });

  // 监听 Google 授权弹窗返回的结果
  // Listen for the response returned from the Google OAuth popup
  useEffect(() => {
    if (response?.type === "success") {
      // 当用户在 Google 弹窗点击同意后，拿着 Google 给的 accessToken 去换取真实个人资料
      // Once user approves in Google popup, use Google's accessToken to fetch real user profile
      const { authentication } = response;
      fetchGoogleUserInfoAndLogin(authentication.accessToken);
    } else if (response?.type === "error") {
      setErrorMsg("Google authorization failed.");
    }
  }, [response]);

  // 向 Google 官方接口获取用户的真实姓名、邮箱和 Google ID，并发送给我们的 Node.js 后端
  // Fetch user's real name, email, and Google ID from Google API, then send to our Node.js backend
  const fetchGoogleUserInfoAndLogin = async (accessToken) => {
    setErrorMsg("");
    try {
      // 1. 请求 Google 官方 UserInfo 接口获取真实账号信息
      // 1. Call official Google UserInfo API to get real account details
      const googleRes = await fetch("https://www.googleapis.com/userinfo/v2/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const googleUser = await googleRes.json();

      // 2. 将真实的 Google 邮箱、名字和唯一 ID 发给我们的后端 /api/auth/google
      // 2. Send real Google email, name, and unique ID to our backend /api/auth/google
      const backendRes = await apiClient.post("/auth/google", {
        email: googleUser.email,
        username: googleUser.name,
        oauthId: googleUser.id,
      });

      // 3. 保存我们后端签发的 JWT Token 并进入主页
      // 3. Save JWT Token issued by our backend and navigate to Dashboard
      await AsyncStorage.setItem("userToken", backendRes.data.token);
      await AsyncStorage.setItem("userData", JSON.stringify(backendRes.data.user));
      onLoginSuccess(backendRes.data.user);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || "Google login failed.");
    }
  };

  // 处理普通邮箱与密码的登录或注册
  // Handle standard email and password Login or Registration
  const handleSubmit = async () => {
    setErrorMsg("");

    // 前端基础验证：确保必填项不为空
    // Frontend basic validation: ensure required fields are not empty
    if (!email || !password || (isRegistering && !username)) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }

    try {
      const endpoint = isRegistering ? "/auth/register" : "/auth/login";
      const payload = isRegistering ? { username, email, password } : { email, password };

      const res = await apiClient.post(endpoint, payload);

      await AsyncStorage.setItem("userToken", res.data.token);
      await AsyncStorage.setItem("userData", JSON.stringify(res.data.user));
      onLoginSuccess(res.data.user);
    } catch (error) {
      const backendMessage = error.response?.data?.message || "Cannot connect to server.";
      setErrorMsg(backendMessage);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* 顶部 Logo 与标题区域（还原设计稿 Screen 1） */}
      {/* Top Logo & Title Section (Matches Screen 1 from design) */}
      <View style={styles.headerSection}>
        <View style={styles.logoPlaceholder}>
          <Text style={styles.logoText}>LOGO</Text>
        </View>
        <Text style={styles.appTitle}>Ka-Ching!</Text>
        <Text style={styles.subtitle1}>Your personal finance companion.</Text>
        <Text style={styles.subtitle2}>Track smarter. Save better.</Text>
      </View>

      {/* 表单输入区域 */}
      {/* Form Input Section */}
      <View style={styles.formSection}>
        {errorMsg ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {isRegistering && <WireInput label="Username" placeholder="darren_gan" value={username} onChangeText={setUsername} />}

        <WireInput label="Email Address" placeholder="user@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" />

        <WireInput label="Password" placeholder="••••••••" value={password} onChangeText={setPassword} secureTextEntry={true} />

        {!isRegistering && (
          <View style={styles.forgotRow}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </View>
        )}

        <WireButton label={isRegistering ? "Register Account" : "Login"} onPress={handleSubmit} variant="filled" />

        <View style={styles.dividerRow}>
          <View style={styles.dashedLine} />
          <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
          <View style={styles.dashedLine} />
        </View>

        {/* 点击按钮直接唤醒真实的 Google OAuth 登录窗口 (promptAsync) */}
        {/* Pressing button triggers the real Google OAuth login window (promptAsync) */}
        <TouchableOpacity style={[styles.oauthBtn, !request && { opacity: 0.5 }]} disabled={!request} onPress={() => promptAsync()}>
          <View style={styles.googleIconBox}>
            <Text style={styles.googleIconText}>G</Text>
          </View>
          <Text style={styles.oauthBtnText}>Continue with Google</Text>
        </TouchableOpacity>

        <View style={styles.bottomSwitchRow}>
          <Text style={styles.switchHint}>{isRegistering ? "Already have an account?" : "No account yet?"}</Text>
          <TouchableOpacity
            onPress={() => {
              setIsRegistering(!isRegistering);
              setErrorMsg("");
            }}
          >
            <Text style={styles.switchLink}>{isRegistering ? "Login here" : "Register here"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
    paddingBottom: 30,
  },
  headerSection: {
    alignItems: "center",
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomWidth: 2,
    borderColor: COLORS.borderMuted,
    borderStyle: "dashed",
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.secondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  logoText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.textMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  appTitle: {
    fontSize: 24,
    fontFamily: FONTS.mono,
    fontWeight: "bold",
    color: COLORS.text,
  },
  subtitle1: {
    fontSize: 11,
    fontFamily: FONTS.mono,
    fontWeight: "bold",
    color: COLORS.text,
    marginTop: 8,
  },
  subtitle2: {
    fontSize: 10,
    fontFamily: FONTS.mono,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  formSection: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  errorBox: {
    borderWidth: 2,
    borderColor: COLORS.danger,
    backgroundColor: COLORS.dangerBg,
    padding: 10,
    marginBottom: 14,
  },
  errorText: {
    color: COLORS.danger,
    fontFamily: FONTS.mono,
    fontSize: 11,
  },
  forgotRow: {
    alignItems: "flex-end",
    marginBottom: 16,
    marginTop: -6,
  },
  forgotText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.textMuted,
    textDecorationLine: "underline",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 18,
  },
  dashedLine: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: COLORS.borderMuted,
    borderStyle: "dashed",
  },
  dividerText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.textMuted,
    marginHorizontal: 10,
  },
  oauthBtn: {
    borderWidth: 2,
    borderColor: COLORS.border,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    marginBottom: 20,
  },
  googleIconBox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  googleIconText: {
    fontFamily: FONTS.mono,
    fontWeight: "bold",
    fontSize: 12,
    color: COLORS.text,
  },
  oauthBtnText: {
    flex: 1,
    textAlign: "center",
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.text,
  },
  bottomSwitchRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 2,
    borderColor: COLORS.borderMuted,
    borderStyle: "dashed",
  },
  switchHint: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.textMuted,
    marginRight: 6,
  },
  switchLink: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    fontWeight: "bold",
    color: COLORS.text,
    textDecorationLine: "underline",
  },
});
