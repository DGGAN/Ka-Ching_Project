/**
 * @file frontend/src/features/profile/components/ProfileIdentityCard.js
 * @layer Feature Component (Compact Profile Identity Card + Popup Edit Modal)
 * @description Displays user avatar, username, email, auth status pills, and an Edit icon button on the right that opens a popup modal to edit Username & Email.
 * @exports default ProfileIdentityCard
 */

import React from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet } from "react-native";
import { User, ShieldCheck, Edit3, X } from "lucide-react-native";
import { COLORS, SHAPES, FONTS } from "../../../theme/colors";
import { playUiSound } from "../../../utils/soundEffects";
import WireBox from "../../../components/shared/WireBox";
import WireInput from "../../../components/shared/WireInput";
import WireButton from "../../../components/shared/WireButton";
import FloatingToast from "../../../components/shared/FloatingToast";
import { useFloatingToast } from "../../../components/shared/useFloatingToast";

export default function ProfileIdentityCard({
  profileUser,
  showEditModal = false,
  onOpenEditModal,
  onCloseEditModal,
  usernameInput,
  onChangeUsername,
  emailInput,
  onChangeEmail,
  savingProfile = false,
  onSaveIdentity,
}) {
  const styles = getStyles();
  const { toast: modalToast, slideAnim: modalSlideAnim, showToast: modalNotify } = useFloatingToast();

  const isGoogleLinked = Boolean(profileUser?.isGoogleLinked) || profileUser?.oauthProvider === "GOOGLE";
  const hasPassword = Boolean(profileUser?.hasPassword);

  return (
    <WireBox style={styles.card}>
      {/* Compact Avatar, Identity Info & Right-Side Edit Icon Button */}
      <View style={styles.avatarRow}>
        <View style={styles.avatarCircle}>
          <User size={24} color={COLORS.primaryText} strokeWidth={2.4} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.userNameTitle} numberOfLines={1}>
            {profileUser?.username || "Ka-Ching User"}
          </Text>
          <Text style={styles.userEmailSub} numberOfLines={1}>
            {profileUser?.email || "user@example.com"}
          </Text>

          <View style={styles.badgesWrap}>
            {isGoogleLinked && (
              <View style={styles.googleBadgePill}>
                <ShieldCheck size={10} color="#15803D" strokeWidth={2.5} />
                <Text style={styles.googleBadgeText}>GOOGLE LINKED</Text>
              </View>
            )}
            <View style={[styles.pwdBadgePill, { backgroundColor: hasPassword ? "#FEF3C7" : "#FFE4E6" }]}>
              <Text style={[styles.pwdBadgeText, { color: hasPassword ? "#B45309" : "#E11D48" }]}>
                {hasPassword ? "PASSWORD ACTIVE" : "NO PASSWORD SET"}
              </Text>
            </View>
          </View>
        </View>

        {/* Right-Side Edit Icon Button -> Opens Edit Profile & Email Modal */}
        <TouchableOpacity style={styles.editIconButton} activeOpacity={0.8} onPress={onOpenEditModal}>
          <Edit3 size={16} color={COLORS.text} strokeWidth={2.4} />
        </TouchableOpacity>
      </View>

      {/* Popup Modal: Edit Username & Email */}
      <Modal
        visible={Boolean(showEditModal)}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          playUiSound("pop");
          if (onCloseEditModal) onCloseEditModal();
        }}
      >
        <View style={styles.modalOverlay}>
          <FloatingToast toast={modalToast} slideAnim={modalSlideAnim} />

          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>EDIT PROFILE & EMAIL</Text>
                <Text style={styles.modalSub}>Update your display username or primary login email</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  playUiSound("pop");
                  if (onCloseEditModal) onCloseEditModal();
                }}
              >
                <X size={18} color={COLORS.text} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            <WireInput label="DISPLAY USERNAME" value={usernameInput} onChangeText={onChangeUsername} placeholder="e.g. Darren Google" />

            <WireInput
              label="EMAIL ADDRESS (FOR LOGIN & ALERTS)"
              value={emailInput}
              onChangeText={onChangeEmail}
              placeholder="yourname@gmail.com"
              keyboardType="email-address"
            />

            <View style={styles.modalActionRow}>
              <WireButton
                label="CANCEL"
                variant="outline"
                onPress={() => {
                  playUiSound("pop");
                  if (onCloseEditModal) onCloseEditModal();
                }}
                style={{ flex: 1 }}
              />
              <WireButton
                label={savingProfile ? "SAVING..." : "SAVE CHANGES"}
                onPress={() => onSaveIdentity(modalNotify)}
                disabled={savingProfile}
                style={{ flex: 1.3 }}
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
    avatarRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    avatarCircle: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: COLORS.primary,
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      alignItems: "center",
      justifyContent: "center",
    },
    userNameTitle: {
      fontFamily: FONTS.mono,
      fontSize: 14,
      fontWeight: "bold",
      color: COLORS.text,
    },
    userEmailSub: {
      fontFamily: FONTS.mono,
      fontSize: 9.5,
      color: COLORS.textMuted,
      marginTop: 2,
    },
    badgesWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      marginTop: 6,
    },
    googleBadgePill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: "#DCFCE7",
      borderWidth: 1,
      borderColor: "#15803D",
      borderRadius: SHAPES.chipRadius,
      paddingHorizontal: 7,
      paddingVertical: 2,
    },
    googleBadgeText: {
      fontFamily: FONTS.mono,
      fontSize: 7.5,
      fontWeight: "bold",
      color: "#15803D",
    },
    pwdBadgePill: {
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: SHAPES.chipRadius,
      paddingHorizontal: 7,
      paddingVertical: 2,
    },
    pwdBadgeText: {
      fontFamily: FONTS.mono,
      fontSize: 7.5,
      fontWeight: "bold",
    },
    editIconButton: {
      width: 38,
      height: 38,
      borderRadius: SHAPES.buttonRadius,
      backgroundColor: COLORS.secondary,
      borderWidth: 1.5,
      borderColor: COLORS.border,
      alignItems: "center",
      justifyContent: "center",
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
      fontSize: 12,
      fontWeight: "bold",
      color: COLORS.text,
    },
    modalSub: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      color: COLORS.textMuted,
      marginTop: 2,
    },
    modalActionRow: {
      flexDirection: "row",
      gap: 8,
      marginTop: 6,
    },
  });
