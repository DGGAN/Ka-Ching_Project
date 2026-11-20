/**
 * @file frontend/src/features/notifications/components/NotificationHeaderBar.js
 * @layer Feature UI Component (Notification Center Header & Filters)
 * @description Displays unread/total alert counts, the "MARK ALL READ" action button, and horizontal tag filter chips.
 * @exports default NotificationHeaderBar
 */

import React from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { CheckCheck } from "lucide-react-native";
import { COLORS, SHAPES, FONTS } from "../../../theme/colors";
import { playUiSound } from "../../../utils/soundEffects";
import WireChip from "../../../components/shared/WireChip";

const NOTIFICATION_FILTER_TAGS = ["ALL", "ALERT", "OCR", "GOAL", "TXN", "AI"];

export default function NotificationHeaderBar({ unreadCount = 0, totalCount = 0, activeTagFilter = "ALL", onSelectTagFilter, onMarkAllAsRead }) {
  const styles = getStyles();

  return (
    <View style={styles.headerBar}>
      <View style={styles.headerTopRow}>
        <View>
          <Text style={styles.headerTitle}>NOTIFICATION CENTER</Text>
          <Text style={styles.headerSub}>
            {unreadCount} unread • {totalCount} total alerts
          </Text>
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllBtn} onPress={onMarkAllAsRead}>
            <CheckCheck size={14} color={COLORS.primary} strokeWidth={2.5} />
            <Text style={styles.markAllText}>MARK ALL READ</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Horizontal Filter Chips for the 5 Notification Tags */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsRow}>
        {NOTIFICATION_FILTER_TAGS.map((tagKey) => (
          <WireChip
            key={tagKey}
            label={tagKey}
            active={activeTagFilter === tagKey}
            onPress={() => {
              playUiSound("tab");
              if (onSelectTagFilter) onSelectTagFilter(tagKey);
            }}
          />
        ))}
      </ScrollView>
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
    markAllBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: COLORS.secondary,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: SHAPES.chipRadius,
      borderWidth: 1.5,
      borderColor: COLORS.border,
    },
    markAllText: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      fontWeight: "bold",
      color: COLORS.text,
    },
    filterChipsRow: {
      paddingRight: 8,
    },
  });
