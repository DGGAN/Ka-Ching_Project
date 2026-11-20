/**
 * @file frontend/src/features/notifications/services/notificationService.js
 * @layer Feature Service (Notifications API Communication)
 * @description Encapsulates all REST API requests for fetching, marking as read, bulk clearing, and deleting user notifications.
 * @exports fetchNotificationsApi, markNotificationReadApi, markAllNotificationsReadApi, deleteNotificationApi
 */

import apiClient from "../../../api/apiClient";

/**
 * Fetch the latest notifications for a specific user
 * @param {string} userId
 * @returns {Promise<Array>} Array of notification documents
 */
export async function fetchNotificationsApi(userId) {
  const res = await apiClient.get(`/notifications/${userId}`);
  return res.data?.data || [];
}

/**
 * Mark a single notification document as read
 * @param {string} id - Notification MongoDB _id
 */
export async function markNotificationReadApi(id) {
  const res = await apiClient.put(`/notifications/${id}/read`);
  return res.data;
}

/**
 * Mark all unread notifications for a user as read
 * @param {string} userId
 */
export async function markAllNotificationsReadApi(userId) {
  const res = await apiClient.post("/notifications/read-all", { userId });
  return res.data;
}

/**
 * Permanently delete a single notification by ID
 * @param {string} id - Notification MongoDB _id
 */
export async function deleteNotificationApi(id) {
  const res = await apiClient.delete(`/notifications/${id}`);
  return res.data;
}
