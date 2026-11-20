/**
 * @file frontend/src/features/notifications/hooks/useNotifications.js
 * @layer Feature Hook (Notification Center State Management)
 * @description Manages notification fetching, tag filtering, optimistic read/delete actions, and real-time unread badge synchronization with App.js.
 * @exports useNotifications
 */

import { useState, useEffect, useCallback } from "react";
import { playUiSound } from "../../../utils/soundEffects";
import { fetchNotificationsApi, markNotificationReadApi, markAllNotificationsReadApi, deleteNotificationApi } from "../services/notificationService";

export function useNotifications(user, onUnreadChange, showToast) {
  const [notifications, setNotifications] = useState([]);
  const [activeTagFilter, setActiveTagFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  // Retrieve the user's notifications from the backend
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await fetchNotificationsApi(user.id);
      setNotifications(data);
    } catch (error) {
      if (typeof showToast === "function") {
        showToast("error", "Failed to load notifications.");
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id, showToast]);

  // Fetch notifications automatically when the screen mounts or user changes
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Sync unread count with parent App.js whenever notifications state changes
  useEffect(() => {
    const unread = notifications.filter((n) => !n.isRead).length;
    if (typeof onUnreadChange === "function") {
      onUnreadChange(unread);
    }
  }, [notifications, onUnreadChange]);

  // Optimistically mark a single notification as read when the user taps it
  const handleMarkAsRead = async (id) => {
    try {
      playUiSound("pop");
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
      await markNotificationReadApi(id);
    } catch (error) {
      console.log("Failed to mark notification as read:", error.message);
    }
  };

  // Mark all unread notifications as read in a single batch action
  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;
    try {
      playUiSound("pop");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      await markAllNotificationsReadApi(user.id);
      if (typeof showToast === "function") {
        showToast("success", "All notifications marked as read.");
      }
    } catch (error) {
      if (typeof showToast === "function") {
        showToast("error", "Failed to clear unread status.");
      }
    }
  };

  // Delete a single notification from both the UI list and MongoDB
  const handleDelete = async (id) => {
    try {
      playUiSound("delete");
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      await deleteNotificationApi(id);
      if (typeof showToast === "function") {
        showToast("success", "Notification removed.");
      }
    } catch (error) {
      if (typeof showToast === "function") {
        showToast("error", "Failed to delete notification.");
      }
    }
  };

  // Derived unread count and tag-filtered list
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const filteredNotifications = activeTagFilter === "ALL" ? notifications : notifications.filter((n) => n.tag === activeTagFilter);

  return {
    notifications,
    filteredNotifications,
    unreadCount,
    activeTagFilter,
    setActiveTagFilter,
    loading,
    fetchNotifications,
    handleMarkAsRead,
    handleMarkAllAsRead,
    handleDelete,
  };
}
