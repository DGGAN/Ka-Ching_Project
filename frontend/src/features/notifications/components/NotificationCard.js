/**
 * @file frontend/src/features/notifications/components/NotificationCard.js
 * @layer Feature UI Component (Single Notification Row)
 * @description Renders an individual notification card with tag-colored icon badge, relative timestamp, unread styling, tap-to-mark-read, and delete action.
 * @exports default NotificationCard
 */

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { AlertTriangle, Camera, Sparkles, ArrowLeftRight, Award, Trash2 } from "lucide-react-native";
import { COLORS, SHAPES, FONTS } from "../../../theme/colors";

// Build TAG_CONFIG dynamically so active theme danger colors apply immediately
const getTagConfig = () => ({
  ALERT: {
    label: "Budget Alert",
    icon: AlertTriangle,
    color: COLORS.danger,
    bg: COLORS.dangerBg,
  },
  OCR: {
    label: "Receipt OCR",
    icon: Camera,
    color: "#0284C7",
    bg: "#E0F2FE",
  },
  AI: {
    label: "Smart Insight",
    icon: Sparkles,
    color: "#9333EA",
    bg: "#F3E8FF",
  },
  TXN: {
    label: "Transaction",
    icon: ArrowLeftRight,
    color: "#D97706",
    bg: "#FEF3C7",
  },
  GOAL: {
    label: "Savings Goal",
    icon: Award,
    color: "#15803D",
    bg: "#DCFCE7",
  },
});

// Convert ISO timestamp into human-readable relative time (e.g. "5m ago")
const formatTimeAgo = (dateString) => {
  if (!dateString) return "Just now";
  const date = new Date(dateString);
  const seconds = Math.floor((new Date() - date) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

export default function NotificationCard({ item, onMarkAsRead, onDelete }) {
  const styles = getStyles();
  const TAG_CONFIG = getTagConfig();
  const config = TAG_CONFIG[item.tag] || TAG_CONFIG.TXN;
  const Icon = config.icon;

  return (
    <TouchableOpacity
      style={[styles.notificationCard, !item.isRead && styles.unreadCard]}
      activeOpacity={0.75}
      onPress={() => {
        if (!item.isRead && onMarkAsRead) {
          onMarkAsRead(item._id);
        }
      }}
    >
      {/* Left Tag Icon Badge */}
      <View style={[styles.iconBox, { backgroundColor: config.bg, borderColor: config.color }]}>
        <Icon size={16} color={config.color} strokeWidth={2.5} />
      </View>

      {/* Center Title, Tag Pill, Timestamp, and Message Body */}
      <View style={styles.textCol}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, !item.isRead && styles.unreadText]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.timeText}>{formatTimeAgo(item.createdAt)}</Text>
        </View>

        <Text style={styles.message} numberOfLines={3}>
          {item.message}
        </Text>

        <View style={styles.bottomMetaRow}>
          <View style={[styles.tagPill, { backgroundColor: config.bg, borderColor: config.color }]}>
            <Text style={[styles.tagPillText, { color: config.color }]}>{config.label}</Text>
          </View>
          {!item.isRead && <Text style={styles.tapToReadHint}>• Tap to mark read</Text>}
        </View>
      </View>

      {/* Right Delete Trash Button */}
      <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete && onDelete(item._id)}>
        <Trash2 size={14} color={COLORS.textMuted} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const getStyles = () =>
  StyleSheet.create({
    notificationCard: {
      flexDirection: "row",
      alignItems: "flex-start",
      backgroundColor: COLORS.card,
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.borderMuted,
      borderRadius: SHAPES.inputRadius,
      padding: 12,
      marginBottom: 10,
      gap: 12,
    },
    unreadCard: {
      backgroundColor: COLORS.secondary,
      borderColor: COLORS.primary,
    },
    iconBox: {
      width: 34,
      height: 34,
      borderRadius: 17,
      borderWidth: 1.5,
      alignItems: "center",
      justifyContent: "center",
    },
    textCol: {
      flex: 1,
    },
    titleRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 4,
      gap: 6,
    },
    title: {
      fontFamily: FONTS.mono,
      fontSize: 10.5,
      color: COLORS.text,
      flex: 1,
    },
    unreadText: {
      fontWeight: "bold",
    },
    timeText: {
      fontFamily: FONTS.mono,
      fontSize: 8,
      color: COLORS.textMuted,
    },
    message: {
      fontFamily: FONTS.mono,
      fontSize: 9.5,
      color: COLORS.textMuted,
      lineHeight: 14,
    },
    bottomMetaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 7,
    },
    tagPill: {
      borderWidth: 1,
      borderRadius: 4,
      paddingHorizontal: 6,
      paddingVertical: 1.5,
    },
    tagPillText: {
      fontFamily: FONTS.mono,
      fontSize: 7.5,
      fontWeight: "bold",
    },
    tapToReadHint: {
      fontFamily: FONTS.mono,
      fontSize: 8,
      color: COLORS.primary,
      fontWeight: "bold",
    },
    deleteBtn: {
      padding: 4,
    },
  });
