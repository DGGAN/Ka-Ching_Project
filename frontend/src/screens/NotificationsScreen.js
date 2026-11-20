/**
 * @file frontend/src/screens/NotificationsScreen.js
 * @layer Screen (Top-Level Page Skeleton — Notification Center)
 * @description Assembles NotificationHeaderBar, NotificationCard list, and empty state using the useNotifications hook.
 * @props {object} user - Logged-in user object
 * @props {function} [onUnreadChange] - Optional callback to sync unread badge count in TopHeader
 * @exports default NotificationsScreen
 */

import React from "react";
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from "react-native";
import { Bell } from "lucide-react-native";
import { COLORS, FONTS } from "../theme/colors";
import WireBox from "../components/shared/WireBox";
import FloatingToast from "../components/shared/FloatingToast";
import { useFloatingToast } from "../components/shared/useFloatingToast";

import { useNotifications } from "../features/notifications/hooks/useNotifications";
import NotificationHeaderBar from "../features/notifications/components/NotificationHeaderBar";
import NotificationCard from "../features/notifications/components/NotificationCard";

export default function NotificationsScreen({ user, onUnreadChange }) {
  const styles = getStyles();
  const { toast, slideAnim, showToast } = useFloatingToast();

  const {
    notifications,
    filteredNotifications,
    unreadCount,
    activeTagFilter,
    setActiveTagFilter,
    loading,
    clearingAll,
    handleMarkAsRead,
    handleMarkAllAsRead,
    handleDelete,
    handleClearAll,
  } = useNotifications(user, onUnreadChange, showToast);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.background,
        position: "relative",
      }}
    >
      <FloatingToast toast={toast} slideAnim={slideAnim} />

      {/* Top Action Bar with Unread Summary, Mark All Read, Clear All & Tag Filter Chips */}
      <NotificationHeaderBar
        unreadCount={unreadCount}
        totalCount={notifications.length}
        activeTagFilter={activeTagFilter}
        onSelectTagFilter={setActiveTagFilter}
        onMarkAllAsRead={handleMarkAllAsRead}
        onClearAll={handleClearAll}
        clearingAll={clearingAll}
      />

      {/* Main Notification List or Empty State */}
      {loading ? (
        <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredNotifications}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <NotificationCard item={item} onMarkAsRead={handleMarkAsRead} onDelete={handleDelete} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <WireBox style={styles.emptyBox}>
              <Bell size={28} color={COLORS.textMuted} strokeWidth={1.5} />
              <Text style={styles.emptyTitle}>You're all caught up!</Text>
              <Text style={styles.emptySub}>
                {activeTagFilter === "ALL"
                  ? "New budget alerts, scanned receipt confirmations, and goal updates will appear here automatically."
                  : `No notifications under the "${activeTagFilter}" category yet.`}
              </Text>
            </WireBox>
          }
        />
      )}
    </View>
  );
}

const getStyles = () =>
  StyleSheet.create({
    listContent: {
      padding: 16,
      paddingBottom: 32,
    },
    emptyBox: {
      alignItems: "center",
      paddingVertical: 36,
      paddingHorizontal: 18,
      marginTop: 16,
    },
    emptyTitle: {
      fontFamily: FONTS.mono,
      fontSize: 12,
      fontWeight: "bold",
      color: COLORS.text,
      marginTop: 10,
    },
    emptySub: {
      fontFamily: FONTS.mono,
      fontSize: 9.5,
      color: COLORS.textMuted,
      textAlign: "center",
      marginTop: 4,
      lineHeight: 15,
    },
  });
