/**
 * @file frontend/src/features/profile/components/AccountSecurityCard.js
 * @layer Feature Component (Account Security, Google Binding & Popup Password Modal)
 * @description Allows users to Bind/Unbind their Google Account and opens a clean popup Modal to Set or Change their login password.
 * @exports default AccountSecurityCard
 */

import React from "react";
import { View, Text, TouchableOpacity, Modal, TextInput, StyleSheet } from "react-native";
import { Lock, Link2, Unlink, KeyRound, Edit3, X } from "lucide-react-native";
import { COLORS, SHAPES, FONTS } from "../../../theme/colors";
import { playUiSound } from "../../../utils/soundEffects";
import WireBox from "../../../components/shared/WireBox";
import WireInput from "../../../components/shared/WireInput";
import WireButton from "../../../components/shared/WireButton";
import FloatingToast from "../../../components/shared/FloatingToast";
import { useFloatingToast } from "../../../components/shared/useFloatingToast";

export default function AccountSecurityCard({
  profileUser,
  showPasswordModal = false,
  onOpenPasswordModal,
  onClosePasswordModal,
  currentPassword,
  onChangeCurrentPassword,
  newPassword,
  onChangeNewPassword,
  confirmPassword,
  onChangeConfirmPassword,
  savingPassword = false,
  onSavePassword,
  showBindGoogleModal = false,
  onOpenBindGoogleModal,
  onCloseBindGoogleModal,
  bindGoogleEmailInput,
  onChangeBindGoogleEmail,
  bindingGoogle = false,
  onConfirmBindGoogle,
  onUnbindGoogle,
}) {
  const styles = getStyles();
  const { toast: pwdToast, slideAnim: pwdSlideAnim, showToast: pwdNotify } = useFloatingToast();

  const { toast: googleToast, slideAnim: googleSlideAnim, showToast: googleNotify } = useFloatingToast();

  const isGoogleLinked = Boolean(profileUser?.isGoogleLinked) || profileUser?.oauthProvider === "GOOGLE";
  const hasPassword = Boolean(profileUser?.hasPassword);

  return (
    <WireBox style={styles.card}>
      <View style={styles.headerRow}>
        <Lock size={14} color={COLORS.primary} strokeWidth={2.5} />
        <Text style={styles.sectionTitle}>ACCOUNT SECURITY & LOGIN METHODS</Text>
      </View>
      <Text style={styles.sectionSub}>Manage Google OAuth binding and password login so you can sign in either way</Text>

      {/* 1. Google Account Binding Row */}
      <View style={styles.methodRow}>
        <View style={styles.methodIconCircle}>
          {isGoogleLinked ? <Link2 size={15} color="#15803D" strokeWidth={2.5} /> : <Unlink size={15} color={COLORS.textMuted} strokeWidth={2.3} />}
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.methodTitle}>GOOGLE ACCOUNT</Text>
          <Text style={styles.methodDesc}>{isGoogleLinked ? `Bound to ${profileUser?.email}` : "Not bound — bind Google for 1-tap sign in"}</Text>
        </View>

        {isGoogleLinked ? (
          <TouchableOpacity style={styles.unbindBtn} onPress={onUnbindGoogle} disabled={bindingGoogle}>
            <Text style={styles.unbindBtnText}>UNBIND</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.bindBtn}
            onPress={() => {
              playUiSound("pop");
              onOpenBindGoogleModal();
            }}
            disabled={bindingGoogle}
          >
            <Text style={styles.bindBtnText}>BIND GOOGLE</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 2. Set / Change Password Row (Opens Popup Modal) */}
      <TouchableOpacity style={[styles.methodRow, { marginBottom: 0 }]} activeOpacity={0.8} onPress={onOpenPasswordModal}>
        <View style={styles.methodIconCircle}>
          <KeyRound size={15} color={COLORS.primary} strokeWidth={2.4} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.methodTitle}>{hasPassword ? "CHANGE LOGIN PASSWORD" : "SET A LOGIN PASSWORD"}</Text>
          <Text style={styles.methodDesc}>
            {hasPassword ? "Password login is enabled — tap to update in popup" : "Set a password so you can also log in without Google"}
          </Text>
        </View>

        <View style={styles.editMiniBtn}>
          <Edit3 size={14} color={COLORS.text} strokeWidth={2.4} />
        </View>
      </TouchableOpacity>

      {/* Modal 1: Set / Change Login Password */}
      <Modal
        visible={Boolean(showPasswordModal)}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          playUiSound("pop");
          if (onClosePasswordModal) onClosePasswordModal();
        }}
      >
        <View style={styles.modalOverlay}>
          <FloatingToast toast={pwdToast} slideAnim={pwdSlideAnim} />

          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{hasPassword ? "CHANGE LOGIN PASSWORD" : "SET A LOGIN PASSWORD"}</Text>
                <Text style={styles.modalSub}>Minimum 8 characters with both letters and numbers</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  playUiSound("pop");
                  if (onClosePasswordModal) onClosePasswordModal();
                }}
              >
                <X size={18} color={COLORS.text} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            {hasPassword && (
              <WireInput
                label="CURRENT PASSWORD"
                value={currentPassword}
                onChangeText={onChangeCurrentPassword}
                placeholder="Enter current password"
                secureTextEntry={true}
              />
            )}

            <WireInput
              label="NEW PASSWORD (MIN 8 CHARS, LETTERS + NUMBERS)"
              value={newPassword}
              onChangeText={onChangeNewPassword}
              placeholder="e.g. password123"
              secureTextEntry={true}
            />

            <WireInput
              label="CONFIRM NEW PASSWORD"
              value={confirmPassword}
              onChangeText={onChangeConfirmPassword}
              placeholder="Re-enter new password"
              secureTextEntry={true}
            />

            <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
              <WireButton
                label="CANCEL"
                variant="outline"
                onPress={() => {
                  playUiSound("pop");
                  if (onClosePasswordModal) onClosePasswordModal();
                }}
                style={{ flex: 1 }}
              />
              <WireButton
                label={savingPassword ? "SAVING..." : hasPassword ? "UPDATE PASSWORD" : "SET PASSWORD"}
                onPress={() => onSavePassword(pwdNotify)}
                disabled={savingPassword}
                style={{ flex: 1.4 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal 2: Bind Google Account */}
      <Modal visible={Boolean(showBindGoogleModal)} transparent={true} animationType="fade" onRequestClose={onCloseBindGoogleModal}>
        <View style={styles.modalOverlay}>
          <FloatingToast toast={googleToast} slideAnim={googleSlideAnim} />

          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>BIND GOOGLE ACCOUNT</Text>
              <TouchableOpacity onPress={onCloseBindGoogleModal}>
                <X size={18} color={COLORS.text} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSub, { marginBottom: 10 }]}>Enter the Google email address you want to bind to your Ka-Ching! account:</Text>

            <Text style={styles.inputLabel}>GOOGLE EMAIL ADDRESS</Text>
            <TextInput
              style={styles.textInput}
              value={bindGoogleEmailInput}
              onChangeText={onChangeBindGoogleEmail}
              placeholder="yourname@gmail.com"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
              <WireButton label="CANCEL" variant="outline" onPress={onCloseBindGoogleModal} style={{ flex: 1 }} />
              <WireButton
                label={bindingGoogle ? "BINDING..." : "CONFIRM BIND"}
                onPress={() => onConfirmBindGoogle(googleNotify)}
                disabled={bindingGoogle}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </WireBox>
  );
}

const getStyles = () =>
  StyleSheet.create({
    card: {
      padding: 14,
      marginBottom: 14,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    sectionTitle: {
      fontFamily: FONTS.mono,
      fontSize: 10.5,
      fontWeight: "bold",
      color: COLORS.text,
    },
    sectionSub: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      color: COLORS.textMuted,
      marginTop: 2,
      marginBottom: 10,
    },
    methodRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderWidth: 1.5,
      borderColor: COLORS.border,
      borderRadius: SHAPES.inputRadius,
      backgroundColor: COLORS.secondary,
      padding: 11,
      marginBottom: 8,
    },
    methodIconCircle: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: COLORS.card,
      borderWidth: 1.2,
      borderColor: COLORS.border,
      alignItems: "center",
      justifyContent: "center",
    },
    methodTitle: {
      fontFamily: FONTS.mono,
      fontSize: 9.5,
      fontWeight: "bold",
      color: COLORS.text,
    },
    methodDesc: {
      fontFamily: FONTS.mono,
      fontSize: 8,
      color: COLORS.textMuted,
      marginTop: 2,
    },
    editMiniBtn: {
      width: 32,
      height: 32,
      borderRadius: SHAPES.chipRadius,
      backgroundColor: COLORS.card,
      borderWidth: 1.2,
      borderColor: COLORS.border,
      alignItems: "center",
      justifyContent: "center",
    },
    bindBtn: {
      backgroundColor: COLORS.primary,
      borderWidth: 1.2,
      borderColor: COLORS.border,
      borderRadius: SHAPES.chipRadius,
      paddingHorizontal: 9,
      paddingVertical: 6,
    },
    bindBtnText: {
      fontFamily: FONTS.mono,
      fontSize: 8,
      fontWeight: "bold",
      color: COLORS.primaryText,
    },
    unbindBtn: {
      backgroundColor: COLORS.dangerBg,
      borderWidth: 1.2,
      borderColor: COLORS.danger,
      borderRadius: SHAPES.chipRadius,
      paddingHorizontal: 9,
      paddingVertical: 6,
    },
    unbindBtnText: {
      fontFamily: FONTS.mono,
      fontSize: 8,
      fontWeight: "bold",
      color: COLORS.danger,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.55)",
      justifyContent: "center",
      alignItems: "center",
      padding: 18,
      position: "relative",
    },
    modalCard: {
      width: "100%",
      maxWidth: 365,
      backgroundColor: COLORS.card,
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      borderRadius: SHAPES.cardRadius,
      padding: 16,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      borderBottomWidth: 1.5,
      borderColor: COLORS.borderMuted,
      borderStyle: "dashed",
      paddingBottom: 10,
      marginBottom: 12,
    },
    modalTitle: {
      fontFamily: FONTS.mono,
      fontSize: 11.5,
      fontWeight: "bold",
      color: COLORS.text,
    },
    modalSub: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      color: COLORS.textMuted,
      marginTop: 2,
    },
    inputLabel: {
      fontFamily: FONTS.mono,
      fontSize: 9,
      fontWeight: "bold",
      color: COLORS.text,
      marginBottom: 4,
    },
    textInput: {
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      borderRadius: SHAPES.inputRadius,
      backgroundColor: COLORS.inputBg,
      paddingHorizontal: 10,
      paddingVertical: 8,
      fontFamily: FONTS.mono,
      fontSize: 10.5,
      color: COLORS.text,
      marginBottom: 10,
    },
  });
