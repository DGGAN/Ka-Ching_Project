// Import React hooks, native UI components with Animated engine, and screen components
import React, { useState, useEffect, useRef } from "react";
import { SafeAreaView, View, Text, Animated, StyleSheet, StatusBar } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LoginScreen from "./src/screens/LoginScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import AddTransactionScreen from "./src/screens/AddTransactionScreen";
import TransactionsScreen from "./src/screens/TransactionsScreen";
import InsightsScreen from "./src/screens/InsightsScreen";
import BudgetScreen from "./src/screens/BudgetScreen";
import OCRScannerScreen from "./src/screens/OCRScannerScreen";
import { COLORS, FONTS } from "./src/theme/theme";
import { TopHeader, BottomNav, IngestionModal, WireBox, WireButton } from "./src/components/WireUI";

// Main App entry component: Includes smooth screen transition animations and global navigation
export default function App() {
  // Currently logged-in user state and active tab key
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("home");
  const [showAddModal, setShowAddModal] = useState(false);

  // Define Animated values for screen fade-in and subtle upward slide on tab change
  const screenFade = useRef(new Animated.Value(1)).current;
  const screenSlide = useRef(new Animated.Value(0)).current;

  const [ocrMode, setOcrMode] = useState("ocr_batch");
  // Trigger a 180ms smooth transition animation whenever activeTab changes
  useEffect(() => {
    screenFade.setValue(0.25);
    screenSlide.setValue(10);
    Animated.parallel([
      Animated.timing(screenFade, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.spring(screenSlide, {
        toValue: 0,
        damping: 20,
        stiffness: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [activeTab]);

  const handleLogout = async () => {
    await AsyncStorage.removeItem("userToken");
    await AsyncStorage.removeItem("userData");
    setCurrentUser(null);
    setActiveTab("home");
  };

  const handleSelectIngestionMethod = (methodId) => {
    if (methodId === "manual") {
      setActiveTab("add");
    } else {
      setOcrMode(methodId);
      setActiveTab("ocr");
    }
  };

  const renderMainContent = () => {
    if (activeTab === "home") {
      return (
        <DashboardScreen user={currentUser} onSeeAllTransactions={() => setActiveTab("transactions")} onPressAddQuick={() => setShowAddModal(true)} />
      );
    }

    if (activeTab === "transactions") {
      return <TransactionsScreen user={currentUser} />;
    }

    if (activeTab === "budget") {
      return <BudgetScreen user={currentUser} />;
    }

    if (activeTab === "add") {
      return <AddTransactionScreen user={currentUser} onTransactionSaved={() => setActiveTab("home")} />;
    }

    if (activeTab === "ocr") {
      return <OCRScannerScreen user={currentUser} initialMode={ocrMode} onTransactionsSaved={() => setActiveTab("home")} />;
    }

    if (activeTab === "insights") {
      return <InsightsScreen user={currentUser} onNavigateToBudget={() => setActiveTab("budget")} />;
    }

    return (
      <View style={styles.placeholderContainer}>
        <WireBox style={{ width: "100%", marginBottom: 20 }}>
          <Text style={styles.placeholderTitle}>Screen: {activeTab.toUpperCase()}</Text>
          <Text style={styles.placeholderSub}>User: {currentUser.username}</Text>
        </WireBox>
        <WireButton label="Sign Out" onPress={handleLogout} variant="outline" />
      </View>
    );
  };

  const getHeaderTitle = () => {
    if (activeTab === "add") return "Add Transaction";
    if (activeTab === "ocr") return "Receipt OCR Scanner";
    if (activeTab === "transactions") return "Transactions";
    if (activeTab === "budget") return "Budget Planning";
    if (activeTab === "insights") return "AI Insights";
    if (activeTab === "profile") return "Profile & Settings";
    return "Ka-Ching!";
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      {!currentUser ? (
        <LoginScreen onLoginSuccess={(user) => setCurrentUser(user)} />
      ) : (
        <View style={styles.mainLayout}>
          <TopHeader
            title={getHeaderTitle()}
            showBack={activeTab !== "home"}
            onBackPress={() => setActiveTab("home")}
            onBellPress={() => setActiveTab("notifications")}
            onProfilePress={() => setActiveTab("profile")}
          />

          {/* Animated main content container with fade and subtle slide transition */}
          <Animated.View
            style={[
              styles.contentArea,
              {
                opacity: screenFade,
                transform: [{ translateY: screenSlide }],
              },
            ]}
          >
            {renderMainContent()}
          </Animated.View>

          <BottomNav
            activeTab={activeTab === "add" ? "home" : activeTab}
            onSelectTab={(tabId) => setActiveTab(tabId)}
            onPressAdd={() => setShowAddModal(true)}
          />
          <IngestionModal visible={showAddModal} onClose={() => setShowAddModal(false)} onSelectMethod={handleSelectIngestionMethod} />
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
  mainLayout: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentArea: {
    flex: 1,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  placeholderTitle: {
    fontFamily: FONTS.mono,
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 8,
  },
  placeholderSub: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.textMuted,
  },
});
