// Import React hooks, core React Native UI components, and Lucide icons
import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, FlatList, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import { Bell, AlertTriangle, Camera, Sparkles, ArrowLeftRight, Award, CheckCheck, Trash2 } from "lucide-react-native";
import apiClient from "../api/client";
import { COLORS, SHAPES, FONTS } from "../theme/theme";
import { WireBox, WireChip, FloatingToast, useFloatingToast } from "../components/WireUI";

// Visual configuration mapping each schema tag enum to its specific icon, label, and badge colors
const TAG_CONFIG = {
  ALERT: { label: "Budget Alert", icon: AlertTriangle, color: COLORS.danger, bg: COLORS.dangerBg },
  OCR: { label: "Receipt OCR", icon: Camera, color: "#0284C7", bg: "#E0F2FE" },
  AI: { label: "Smart Insight", icon: Sparkles, color: "#9333EA", bg: "#F3E8FF" },
  TXN: { label: "Transaction", icon: ArrowLeftRight, color: "#D97706", bg: "#FEF3C7" },
  GOAL: { label: "Savings Goal", icon: Award, color: "#15803D", bg: "#DCFCE7" },
};

// Helper function to convert ISO timestamp into human-readable relative time (e.g. "5m ago")
const formatTimeAgo = (dateString) => {
  if (!dateString) return "Just now";
  const date = new Date(dateString);
  const seconds = Math.floor((new Date() - date) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

// Screen 8: Notification Center displaying system alerts, OCR updates, and AI insights
export default function NotificationsScreen({ user }) {
  // Dynamically generate styles on every render so runtime theme switches apply immediately
  const styles = getStyles();

  // State for storing notifications, active tag filter, and loading spinner status
  const [notifications, setNotifications] = useState([]);
  const [activeTagFilter, setActiveTagFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  // Global floating toast hook for user feedback
  const { toast, slideAnim, showToast } = useFloatingToast();

  // Fetch notifications automatically when the screen mounts
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Retrieve the user's notifications from GET /api/notifications/:userId
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/notifications/${user.id}`);
      setNotifications(res.data?.data || []);
    } catch (error) {
      showToast("error", "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  // Optimistically mark a single notification as read when the user taps it
  const handleMarkAsRead = async (id) => {
    try {
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
      await apiClient.put(`/notifications/${id}/read`);
    } catch (error) {
      console.log("Failed to mark notification as read:", error.message);
    }
  };

  // Mark all unread notifications as read in a single batch action
  const handleMarkAllAsRead = async () => {
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      await apiClient.post("/notifications/read-all", { userId: user.id });
      showToast("success", "All notifications marked as read.");
    } catch (error) {
      showToast("error", "Failed to clear unread status.");
    }
  };

  // Delete a single notification from both the UI list and MongoDB
  const handleDelete = async (id) => {
    try {
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      await apiClient.delete(`/notifications/${id}`);
      showToast("success", "Notification removed.");
    } catch (error) {
      showToast("error", "Failed to delete notification.");
    }
  };

  // Count how many notifications are currently unread and filter list by selected tag
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const filteredNotifications = activeTagFilter === "ALL" ? notifications : notifications.filter((n) => n.tag === activeTagFilter);

  // Render individual notification card row inside the FlatList
  const renderItem = ({ item }) => {
    const config = TAG_CONFIG[item.tag] || TAG_CONFIG.TXN;
    const Icon = config.icon;

    return (
      <TouchableOpacity
        style={[styles.notificationCard, !item.isRead && styles.unreadCard]}
        activeOpacity={0.75}
        onPress={() => !item.isRead && handleMarkAsRead(item._id)}
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
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item._id)}>
          <Trash2 size={14} color={COLORS.textMuted} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background, position: "relative" }}>
      <FloatingToast toast={toast} slideAnim={slideAnim} />

      {/* Top Action Bar showing unread count, tag filter chips, and "Mark All Read" button */}
      <View style={styles.headerBar}>
        <View style={styles.headerTopRow}>
          <View>
            <Text style={styles.headerTitle}>NOTIFICATION CENTER</Text>
            <Text style={styles.headerSub}>
              {unreadCount} unread • {notifications.length} total alerts
            </Text>
          </View>
          {unreadCount > 0 && (
            <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllAsRead}>
              <CheckCheck size={14} color={COLORS.primary} strokeWidth={2.5} />
              <Text style={styles.markAllText}>MARK ALL READ</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Horizontal Filter Chips for the 5 Notification Tags */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsRow}>
          {["ALL", "ALERT", "OCR", "GOAL", "TXN", "AI"].map((tagKey) => (
            <WireChip key={tagKey} label={tagKey} active={activeTagFilter === tagKey} onPress={() => setActiveTagFilter(tagKey)} />
          ))}
        </ScrollView>
      </View>

      {/* Main Notification List or Empty State */}
      {loading ? (
        <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredNotifications}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
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

// Stylesheet bound to theme constants
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
    listContent: {
      padding: 16,
      paddingBottom: 32,
    },
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
