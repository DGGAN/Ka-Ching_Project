// Import React hooks, core status bar/safe area components, Animated API, and AsyncStorage
import React, { useState, useEffect, useRef } from "react";
import { SafeAreaView, StatusBar, Animated, Platform, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Import theme configuration and global navigation/modal components
import { COLORS, applyTheme, ACTIVE_THEME } from "./src/theme/theme";
import { TopHeader, BottomNav, IngestionModal, playUiSound } from "./src/components/WireUI";

// Import all application screens
import AuthScreen from "./src/screens/AuthScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import TransactionsScreen from "./src/screens/TransactionsScreen";
import AddTransactionScreen from "./src/screens/AddTransactionScreen";
import OCRScannerScreen from "./src/screens/OCRScannerScreen";
import BudgetScreen from "./src/screens/BudgetScreen";
import InsightsScreen from "./src/screens/InsightsScreen";
import NotificationsScreen from "./src/screens/NotificationsScreen";
import ProfileScreen from "./src/screens/ProfileScreen";

// Root Application Component coordinating navigation, animations, and theme state
export default function App() {
  // 1. Track authenticated user, active tab, OCR mode, modal state, and active theme key
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("home");
  const [ocrMode, setOcrMode] = useState("ocr_batch");
  const [showIngestionModal, setShowIngestionModal] = useState(false);
  const [themeKey, setThemeKey] = useState(ACTIVE_THEME);

  // 2. Animated values for smooth screen fade and vertical slide transitions
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // 3. Load saved visual theme preference from AsyncStorage when app starts
  useEffect(() => {
    const loadSavedTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem("kaching_selected_theme");
        if (saved) {
          applyTheme(saved);
          setThemeKey(saved);
        }
      } catch (e) {
        console.log("Failed to load saved theme:", e.message);
      }
    };
    loadSavedTheme();
  }, []);

  // 4. Trigger smooth fade-and-slide transition whenever activeTab changes
  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(10);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: Platform.OS !== "web",
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: Platform.OS !== "web",
      }),
    ]).start();
  }, [activeTab]);

  // 5. Handle runtime theme switching and persist choice to AsyncStorage
  const handleThemeChange = async (newThemeKey) => {
    applyTheme(newThemeKey);
    setThemeKey(newThemeKey);
    try {
      await AsyncStorage.setItem("kaching_selected_theme", newThemeKey);
    } catch (e) {
      console.log("Failed to save theme preference:", e.message);
    }
  };

  // 6. Route user to Manual Entry or OCR Scanner when a method is picked from the "+" modal
  const handleSelectIngestionMethod = (methodId) => {
    if (methodId === "manual") {
      setActiveTab("add");
    } else {
      setOcrMode(methodId);
      setActiveTab("ocr");
    }
  };

  // 7. Determine dynamic header title based on active screen
  const getHeaderTitle = () => {
    if (activeTab === "home") return "Ka-Ching!";
    if (activeTab === "transactions") return "Transaction History";
    if (activeTab === "add") return "Add Transaction";
    if (activeTab === "ocr") return "Receipt Scanner";
    if (activeTab === "budget") return "Budget Planner";
    if (activeTab === "insights") return "Smart Insights";
    if (activeTab === "notifications") return "Notifications";
    if (activeTab === "profile") return "Profile & Theme";
    return "Ka-Ching!";
  };

  // 8. Render screen content corresponding to the currently active tab
  const renderMainContent = () => {
    if (activeTab === "home") {
      return (
        <DashboardScreen
          user={currentUser}
          onNavigateToTransactions={() => {
            playUiSound("tab");
            setActiveTab("transactions");
          }}
        />
      );
    }
    if (activeTab === "transactions") {
      return <TransactionsScreen user={currentUser} />;
    }
    if (activeTab === "add") {
      return (
        <AddTransactionScreen
          user={currentUser}
          onTransactionSaved={() => {
            // Play signature "Ka-Ching!" cash register sound when a manual transaction is created
            playUiSound("kaching");
            setActiveTab("home");
          }}
        />
      );
    }
    if (activeTab === "ocr") {
      return (
        <OCRScannerScreen
          user={currentUser}
          initialMode={ocrMode}
          onTransactionsSaved={() => {
            // Play signature "Ka-Ching!" cash register sound when OCR transactions are created
            playUiSound("kaching");
            setActiveTab("home");
          }}
        />
      );
    }
    if (activeTab === "budget") {
      return <BudgetScreen user={currentUser} />;
    }
    if (activeTab === "insights") {
      return (
        <InsightsScreen
          user={currentUser}
          onNavigateToBudget={() => {
            playUiSound("tab");
            setActiveTab("budget");
          }}
        />
      );
    }
    if (activeTab === "notifications") {
      return <NotificationsScreen user={currentUser} />;
    }
    if (activeTab === "profile") {
      return (
        <ProfileScreen
          user={currentUser}
          onChangeTheme={handleThemeChange}
          onLogout={() => {
            playUiSound("tab");
            setCurrentUser(null);
            setActiveTab("home");
          }}
        />
      );
    }
    return null;
  };

  // 9. Show Authentication Screen if user is not logged in
  if (!currentUser) {
    return (
      <SafeAreaView key={themeKey} style={[styles.safeArea, { backgroundColor: COLORS.background }]}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <AuthScreen
          onLoginSuccess={(userData) => {
            playUiSound("success");
            setCurrentUser(userData);
          }}
        />
      </SafeAreaView>
    );
  }

  const isSubScreen = ["add", "ocr", "notifications", "profile"].includes(activeTab);

  return (
    <SafeAreaView key={themeKey} style={[styles.safeArea, { backgroundColor: COLORS.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.card} />

      {/* Top Navigation Bar with Logo, Back button, Bell button, and Profile button */}
      <TopHeader
        title={getHeaderTitle()}
        showBack={isSubScreen}
        onBackPress={() => setActiveTab("home")}
        onBellPress={() => setActiveTab("notifications")}
        onProfilePress={() => setActiveTab("profile")}
      />

      {/* Animated Main Screen Container */}
      <Animated.View
        style={{
          flex: 1,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        {renderMainContent()}
      </Animated.View>

      {/* Bottom 5-Button Navigation Bar */}
      <BottomNav activeTab={activeTab} onSelectTab={(tabId) => setActiveTab(tabId)} onPressAdd={() => setShowIngestionModal(true)} />

      {/* "+" Add Transaction Method Selection Modal */}
      <IngestionModal visible={showIngestionModal} onClose={() => setShowIngestionModal(false)} onSelectMethod={handleSelectIngestionMethod} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
});
