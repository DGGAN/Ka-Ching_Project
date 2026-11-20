/**
 * @file frontend/src/features/notifications/components/NotificationHeaderBar.js
 * @layer Feature UI Component (Notification Center Header & Filters)
 * @description Displays unread/total alert counts, "MARK ALL READ" & "CLEAR ALL" action buttons (with confirmation modal), and horizontal tag filter chips.
 * @exports default NotificationHeaderBar
 */

import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Modal, StyleSheet } from "react-native";
import { CheckCheck, Trash2 } from "lucide-react-native";
import { COLORS, SHAPES, FONTS } from "../../../theme/colors";
import { playUiSound } from "../../../utils/soundEffects";
import WireChip from "../../../components/shared/WireChip";
import WireButton from "../../../components/shared/WireButton";

const NOTIFICATION_FILTER_TAGS = ["ALL", "ALERT", "OCR", "GOAL", "TXN", "AI"];

export default function NotificationHeaderBar({
  unreadCount = 0,
  totalCount = 0,
  activeTagFilter = "ALL",
  onSelectTagFilter,
  onMarkAllAsRead,
  onClearAll,
  clearingAll = false,
}) {
  const styles = getStyles();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleConfirmClearAll = () => {
    setShowClearConfirm(false);
    if (onClearAll) {
      onClearAll();
    }
  };

  return (
    <View style={styles.headerBar}>
      <View style={styles.headerTopRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>NOTIFICATION CENTER</Text>
          <Text style={styles.headerSub}>
            {unreadCount} unread • {totalCount} total alerts
          </Text>
        </View>

        <View style={styles.actionsRow}>
          {unreadCount > 0 && (
            <TouchableOpacity style={styles.markAllBtn} onPress={onMarkAllAsRead} activeOpacity={0.8}>
              <CheckCheck size={13} color={COLORS.primary} strokeWidth={2.5} />
              <Text style={styles.markAllText}>READ ALL</Text>
            </TouchableOpacity>
          )}

          {totalCount > 0 && (
            <TouchableOpacity
              style={styles.clearAllBtn}
              disabled={clearingAll}
              activeOpacity={0.8}
              onPress={() => {
                playUiSound("pop");
                setShowClearConfirm(true);
              }}
            >
              <Trash2 size={13} color={COLORS.danger} strokeWidth={2.5} />
              <Text style={styles.clearAllText}>CLEAR ALL</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Horizontal Filter Chips for the 5 Notification Tags */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsRow}>
        {NOTIFICATION_FILTER_TAGS.map((tagKey) => (
          <WireChip
            key={tagKey}
            label={tagKey}
            active={activeTagFilter === tagKey}
            onPress={() => {
              playUiSound("pop");
              if (onSelectTagFilter) onSelectTagFilter(tagKey);
            }}
          />
        ))}
      </ScrollView>

      {/* Confirmation Modal for Clear All Notifications */}
      <Modal
        visible={showClearConfirm}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          playUiSound("pop");
          setShowClearConfirm(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>CLEAR ALL NOTIFICATIONS?</Text>
            <Text style={styles.modalDesc}>
              This will permanently remove all {totalCount} notification{totalCount === 1 ? "" : "s"} from your Notification Center.
            </Text>

            <View style={styles.modalBtnRow}>
              <WireButton
                label="CANCEL"
                variant="outline"
                onPress={() => {
                  playUiSound("pop");
                  setShowClearConfirm(false);
                }}
                style={{ flex: 1 }}
              />
              <TouchableOpacity style={styles.confirmClearBtn} activeOpacity={0.85} onPress={handleConfirmClearAll}>
                <Text style={styles.confirmClearBtnText}>CLEAR ALL</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = () =>
  StyleSheet.create({
    headerBar: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderColor: COLORS.borderMuted,
      backgroundColor: COLORS.card,
    },
    headerTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
      gap: 8,
    },
    headerTitle: {
      fontFamily: FONTS.mono,
      fontSize: 12,
      fontWeight: "bold",
      color: COLORS.text,
      letterSpacing: 1,
    },
    headerSub: {
      fontFamily: FONTS.mono,
      fontSize: 9,
      color: COLORS.textMuted,
      marginTop: 2,
    },
    actionsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    markAllBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: COLORS.secondary,
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: SHAPES.chipRadius,
      borderWidth: 1.5,
      borderColor: COLORS.border,
    },
    markAllText: {
      fontFamily: FONTS.mono,
      fontSize: 8,
      fontWeight: "bold",
      color: COLORS.text,
    },
    clearAllBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: COLORS.dangerBg,
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: SHAPES.chipRadius,
      borderWidth: 1.5,
      borderColor: COLORS.danger,
    },
    clearAllText: {
      fontFamily: FONTS.mono,
      fontSize: 8,
      fontWeight: "bold",
      color: COLORS.danger,
    },
    filterChipsRow: {
      paddingRight: 8,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.55)",
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    modalCard: {
      width: "100%",
      maxWidth: 340,
      backgroundColor: COLORS.card,
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      borderRadius: SHAPES.cardRadius,
      padding: 16,
    },
    modalTitle: {
      fontFamily: FONTS.mono,
      fontSize: 12,
      fontWeight: "bold",
      color: COLORS.text,
      marginBottom: 6,
    },
    modalDesc: {
      fontFamily: FONTS.mono,
      fontSize: 9.5,
      color: COLORS.textMuted,
      lineHeight: 15,
      marginBottom: 14,
    },
    modalBtnRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    confirmClearBtn: {
      flex: 1,
      backgroundColor: COLORS.danger,
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.danger,
      borderRadius: SHAPES.buttonRadius,
      paddingVertical: 11,
      alignItems: "center",
      justifyContent: "center",
    },
    confirmClearBtnText: {
      fontFamily: FONTS.mono,
      fontSize: 10.5,
      fontWeight: "bold",
      color: "#FFFFFF",
      letterSpacing: 0.5,
    },
  });
