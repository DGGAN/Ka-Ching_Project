/**
 * @file frontend/App.js
 * @layer Root Application Entry & Navigation Shell
 * @description Coordinates authentication, theme persistence, unread notifications, toggleable Notification/Profile screens (press to open, press again to close back to previous page), and bottom tab navigation.
 * @exports default App
 */

import React, { useState, useEffect, useRef } from "react";
import { SafeAreaView, StatusBar, Animated, Platform, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Import refactored theme configuration, API client, sound effects, and shared navigation components
import { COLORS, applyTheme, ACTIVE_THEME } from "./src/theme/colors";
import apiClient from "./src/api/apiClient";
import { playUiSound } from "./src/utils/soundEffects";
import TopHeader from "./src/components/shared/TopHeader";
import BottomNav from "./src/components/shared/BottomNav";
import IngestionModal from "./src/components/shared/IngestionModal";

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

export default function App() {
  // 1. Track authenticated user, active tab, previous tab (for toggle return), OCR mode, modal state, unread count, and active theme key
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("home");
  const [previousTab, setPreviousTab] = useState("home");
  const [ocrMode, setOcrMode] = useState("ocr_batch");
  const [showIngestionModal, setShowIngestionModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
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

  // 5. Poll unread notifications count when user logs in or switches tabs
  const fetchUnreadNotifications = async (userId) => {
    if (!userId) return;
    try {
      const res = await apiClient.get(`/notifications/${userId}`);
      if (res.data && Array.isArray(res.data.data)) {
        const count = res.data.data.filter((item) => !item.isRead).length;
        setUnreadCount(count);
      }
    } catch (error) {
      console.log("Notification badge sync notice:", error.message);
    }
  };

  useEffect(() => {
    if (currentUser?.id) {
      fetchUnreadNotifications(currentUser.id);
    }
  }, [currentUser, activeTab]);

  // 6. Helper: Navigate to main bottom tabs and remember the tab so Bell/Profile can return to it
  const handleSelectMainTab = (nextTab) => {
    setPreviousTab(nextTab);
    setActiveTab(nextTab);
  };

  // 7. Toggle Notification Screen: Press once to open, press again to close back to previous page!
  const handleToggleNotifications = () => {
    if (activeTab === "notifications") {
      setActiveTab(previousTab || "home");
    } else {
      if (activeTab !== "profile") {
        setPreviousTab(activeTab);
      }
      setActiveTab("notifications");
    }
  };

  // 8. Toggle Profile Screen: Press once to open, press again to close back to previous page!
  const handleToggleProfile = () => {
    if (activeTab === "profile") {
      setActiveTab(previousTab || "home");
    } else {
      if (activeTab !== "notifications") {
        setPreviousTab(activeTab);
      }
      setActiveTab("profile");
    }
  };

  // 9. Handle runtime theme switching and persist choice to AsyncStorage
  const handleThemeChange = async (newThemeKey) => {
    applyTheme(newThemeKey);
    playUiSound("success");
    setThemeKey(`${newThemeKey}_${Date.now()}`);
    try {
      await AsyncStorage.setItem("kaching_selected_theme", newThemeKey);
    } catch (e) {
      console.log("Failed to save theme preference:", e.message);
    }
  };

  // 10. Route user to Manual Entry or OCR Scanner when a method is picked from the "+" modal
  const handleSelectIngestionMethod = (methodId) => {
    setShowIngestionModal(false);
    if (activeTab !== "add" && activeTab !== "ocr") {
      setPreviousTab(activeTab);
    }
    if (methodId === "manual") {
      setActiveTab("add");
    } else {
      setOcrMode(methodId || "ocr_batch");
      setActiveTab("ocr");
    }
  };

  // 11. Determine dynamic header title based on active screen
  const getHeaderTitle = () => {
    if (activeTab === "home" || activeTab === "dashboard") return "Ka-Ching!";
    if (activeTab === "transactions") return "Transaction History";
    if (activeTab === "add") return "Add Transaction";
    if (activeTab === "ocr") return "Receipt Scanner";
    if (activeTab === "budget") return "Budget Planner";
    if (activeTab === "insights") return "Smart Insights";
    if (activeTab === "notifications") return "Notifications";
    if (activeTab === "profile") return "Profile & Theme";
    return "Ka-Ching!";
  };

  // 12. Render screen content corresponding to the currently active tab
  const renderMainContent = () => {
    if (activeTab === "home" || activeTab === "dashboard") {
      return (
        <DashboardScreen
          user={currentUser}
          onNavigateToTransactions={() => {
            playUiSound("tab");
            handleSelectMainTab("transactions");
          }}
          onNavigateToBudget={() => {
            playUiSound("tab");
            handleSelectMainTab("budget");
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
            playUiSound("kaching");
            fetchUnreadNotifications(currentUser.id);
            handleSelectMainTab("home");
          }}
          onCancel={() => {
            playUiSound("pop");
            setActiveTab(previousTab || "home");
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
            playUiSound("kaching");
            fetchUnreadNotifications(currentUser.id);
            handleSelectMainTab("home");
          }}
          onCancel={() => {
            playUiSound("pop");
            setActiveTab(previousTab || "home");
          }}
        />
      );
    }
    if (activeTab === "budget") {
      return <BudgetScreen user={currentUser} onBudgetUpdated={() => fetchUnreadNotifications(currentUser.id)} />;
    }
    if (activeTab === "insights") {
      return (
        <InsightsScreen
          user={currentUser}
          onNavigateToBudget={() => {
            playUiSound("tab");
            handleSelectMainTab("budget");
          }}
        />
      );
    }
    if (activeTab === "notifications") {
      return <NotificationsScreen user={currentUser} onUnreadChange={(newCount) => setUnreadCount(newCount)} />;
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
            setPreviousTab("home");
          }}
        />
      );
    }
    return null;
  };

  // 13. Show Authentication Screen if user is not logged in
  if (!currentUser) {
    return (
      <SafeAreaView key={themeKey} style={[styles.safeArea, { backgroundColor: COLORS.background }]}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <AuthScreen
          onLoginSuccess={(userData) => {
            playUiSound("success");
            setCurrentUser(userData);
            setActiveTab("home");
            setPreviousTab("home");
          }}
        />
      </SafeAreaView>
    );
  }

  const isSubScreen = ["add", "ocr", "notifications", "profile"].includes(activeTab);

  return (
    <SafeAreaView key={themeKey} style={[styles.safeArea, { backgroundColor: COLORS.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.card} />

      {/* Top Navigation Bar with Logo, Back button, Toggleable Bell button, and Toggleable Profile button */}
      <TopHeader
        title={getHeaderTitle()}
        unreadCount={unreadCount}
        activeTab={activeTab}
        showBack={isSubScreen}
        onBackPress={() => setActiveTab(previousTab || "home")}
        onBellPress={handleToggleNotifications}
        onProfilePress={handleToggleProfile}
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
      <BottomNav
        activeTab={isSubScreen ? previousTab : activeTab}
        onSelectTab={handleSelectMainTab}
        onChangeTab={handleSelectMainTab}
        onPressAdd={() => setShowIngestionModal(true)}
        onOpenAddModal={() => setShowIngestionModal(true)}
      />

      {/* "+" Add Transaction Method Selection Modal */}
      <IngestionModal
        visible={showIngestionModal}
        onClose={() => setShowIngestionModal(false)}
        onSelectMethod={handleSelectIngestionMethod}
        onSelectManual={() => handleSelectIngestionMethod("manual")}
        onSelectOCR={() => handleSelectIngestionMethod("ocr_batch")}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
});
