/**
 * @file frontend/src/screens/ProfileScreen.js
 * @layer Screen (Top-Level Page Skeleton)
 * @description Assembles ProfileIdentityCard (with popup edit modal), AccountSecurityCard (with popup password & Google modals), PreferencesCard, AutoCaptureModal, and Sign Out button.
 * @exports default ProfileScreen
 */

import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LogOut } from "lucide-react-native";
import { COLORS, SHAPES, FONTS } from "../theme/colors";
import { playUiSound } from "../utils/soundEffects";
import FloatingToast from "../components/shared/FloatingToast";
import { useFloatingToast } from "../components/shared/useFloatingToast";
import AutoCaptureModal from "../components/shared/AutoCaptureModal";

import { useProfileSettings } from "../features/profile/hooks/useProfileSettings";
import ProfileIdentityCard from "../features/profile/components/ProfileIdentityCard";
import AccountSecurityCard from "../features/profile/components/AccountSecurityCard";
import PreferencesCard from "../features/profile/components/PreferencesCard";

export default function ProfileScreen({ user, activeThemeKey, onChangeTheme, onUserUpdated, onLogout }) {
  const styles = getStyles();
  const { toast, slideAnim, showToast } = useFloatingToast();

  const {
    profileUser,
    showEditIdentityModal,
    setShowEditIdentityModal,
    handleOpenEditIdentityModal,
    usernameInput,
    setUsernameInput,
    emailInput,
    setEmailInput,
    savingProfile,
    showPasswordModal,
    setShowPasswordModal,
    handleOpenPasswordModal,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    savingPassword,
    showBindGoogleModal,
    setShowBindGoogleModal,
    bindGoogleEmailInput,
    setBindGoogleEmailInput,
    bindingGoogle,
    notificationsEnabled,
    autoCaptureEnabled,
    setAutoCaptureEnabled,
    showAutoCaptureModal,
    setShowAutoCaptureModal,
    showThemeModal,
    setShowThemeModal,
    handleSaveIdentity,
    handleSavePassword,
    handleBindGoogle,
    handleUnbindGoogle,
    handleToggleNotifications,
  } = useProfileSettings(user, onUserUpdated, showToast);

  const handleSelectTheme = (themeKey) => {
    setShowThemeModal(false);
    if (typeof onChangeTheme === "function") {
      onChangeTheme(themeKey);
    }
    showToast("success", "App theme updated!");
  };

  const handlePressLogout = async () => {
    playUiSound("pop");
    try {
      await AsyncStorage.multiRemove(["userToken", "userData"]);
    } catch (e) {
      // Ignore storage error
    }
    if (typeof onLogout === "function") {
      onLogout();
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.background,
        position: "relative",
      }}
    >
      <FloatingToast toast={toast} slideAnim={slideAnim} />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* 1. Compact Identity Card with Right-Side Edit Icon -> Opens Edit Modal */}
        <ProfileIdentityCard
          profileUser={profileUser}
          showEditModal={showEditIdentityModal}
          onOpenEditModal={handleOpenEditIdentityModal}
          onCloseEditModal={() => setShowEditIdentityModal(false)}
          usernameInput={usernameInput}
          onChangeUsername={setUsernameInput}
          emailInput={emailInput}
          onChangeEmail={setEmailInput}
          savingProfile={savingProfile}
          onSaveIdentity={handleSaveIdentity}
        />

        {/* 2. Account Security Card (Bind/Unbind Google & Popup Set/Change Password Modal) */}
        <AccountSecurityCard
          profileUser={profileUser}
          showPasswordModal={showPasswordModal}
          onOpenPasswordModal={handleOpenPasswordModal}
          onClosePasswordModal={() => setShowPasswordModal(false)}
          currentPassword={currentPassword}
          onChangeCurrentPassword={setCurrentPassword}
          newPassword={newPassword}
          onChangeNewPassword={setNewPassword}
          confirmPassword={confirmPassword}
          onChangeConfirmPassword={setConfirmPassword}
          savingPassword={savingPassword}
          onSavePassword={handleSavePassword}
          showBindGoogleModal={showBindGoogleModal}
          onOpenBindGoogleModal={() => setShowBindGoogleModal(true)}
          onCloseBindGoogleModal={() => setShowBindGoogleModal(false)}
          bindGoogleEmailInput={bindGoogleEmailInput}
          onChangeBindGoogleEmail={setBindGoogleEmailInput}
          bindingGoogle={bindingGoogle}
          onConfirmBindGoogle={handleBindGoogle}
          onUnbindGoogle={handleUnbindGoogle}
        />

        {/* 3. Automation & App Preferences Card */}
        <PreferencesCard
          autoCaptureEnabled={autoCaptureEnabled}
          onOpenAutoCaptureModal={() => setShowAutoCaptureModal(true)}
          activeThemeKey={activeThemeKey}
          showThemeModal={showThemeModal}
          onOpenThemeModal={() => setShowThemeModal(true)}
          onCloseThemeModal={() => setShowThemeModal(false)}
          onSelectTheme={handleSelectTheme}
          notificationsEnabled={notificationsEnabled}
          onToggleNotifications={handleToggleNotifications}
        />

        {/* 4. Sign Out Button */}
        <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.85} onPress={handlePressLogout}>
          <LogOut size={15} color={COLORS.danger} strokeWidth={2.5} />
          <Text style={styles.logoutBtnText}>SIGN OUT OF KA-CHING!</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* 5. Smart Auto-Capture Setup & Verification Modal */}
      <AutoCaptureModal
        visible={showAutoCaptureModal}
        onClose={() => setShowAutoCaptureModal(false)}
        user={profileUser}
        autoCaptureEnabled={autoCaptureEnabled}
        onStatusChanged={(nextState) => setAutoCaptureEnabled(nextState)}
      />
    </View>
  );
}

const getStyles = () =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 36,
    },
    logoutBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.danger,
      borderRadius: SHAPES.buttonRadius,
      backgroundColor: COLORS.dangerBg,
      paddingVertical: 12,
      marginTop: 4,
    },
    logoutBtnText: {
      fontFamily: FONTS.mono,
      fontSize: 10.5,
      fontWeight: "bold",
      color: COLORS.danger,
      letterSpacing: 0.6,
    },
  });
