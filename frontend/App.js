// 导入 React、原生组件与我们编写的 LoginScreen
// Import React, native UI components, and our LoginScreen
import React, { useState } from "react";
import { SafeAreaView, View, Text, StyleSheet, StatusBar } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LoginScreen from "./src/screens/LoginScreen";
import { COLORS, FONTS } from "./src/theme/theme";
import { WireBox, WireButton } from "./src/components/WireUI";

// App 主入口组件：控制用户登录状态与页面切换
// Main App entry component: Controls user authentication state and screen switching
export default function App() {
  // 保存当前已登录的用户信息（若为 null 则显示登录页）
  // Store currently logged-in user info (shows LoginScreen if null)
  const [currentUser, setCurrentUser] = useState(null);

  // 退出登录函数：清除本地 Token 并退回登录页
  // Logout function: Clear local Token and return to LoginScreen
  const handleLogout = async () => {
    await AsyncStorage.removeItem("userToken");
    await AsyncStorage.removeItem("userData");
    setCurrentUser(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      {!currentUser ? (
        // 未登录时：显示 Screen 1 登录/注册页
        // When not logged in: Display Screen 1 Login/Register screen
        <LoginScreen onLoginSuccess={(user) => setCurrentUser(user)} />
      ) : (
        // 登录成功后：显示成功提示（下一步我们将这里替换成完整的 Screen 2 Dashboard！）
        // After login success: Show welcome card (Next we will replace this with full Screen 2 Dashboard!)
        <View style={styles.loggedInContainer}>
          <WireBox style={{ width: "100%", marginBottom: 20 }}>
            <Text style={styles.welcomeTitle}>🎉 Ka-Ching! Connected!</Text>
            <Text style={styles.userInfo}>Username: {currentUser.username}</Text>
            <Text style={styles.userInfo}>Email: {currentUser.email}</Text>
            <Text style={styles.userInfo}>User ID: {currentUser.id}</Text>
          </WireBox>
          <WireButton label="Sign Out" onPress={handleLogout} variant="outline" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loggedInContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  welcomeTitle: {
    fontFamily: FONTS.mono,
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 12,
  },
  userInfo: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 6,
  },
});
