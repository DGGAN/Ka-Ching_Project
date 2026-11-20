/**
 * @file backend/routes/notificationRoutes.js
 * @layer Backend Express Router
 * @description Defines REST endpoints for fetching, reading, bulk clearing, and deleting user notifications.
 */

const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");

// Fetch latest 50 notifications for a user
router.get("/:userId", notificationController.getNotifications);

// Mark a single notification as read
router.put("/:id/read", notificationController.markAsRead);

// Mark all unread notifications as read
router.post("/read-all", notificationController.markAllAsRead);

// Permanently clear all notifications for a user (1 single DB query)
router.post("/clear-all", notificationController.clearAllNotifications);

// Permanently delete a single notification
router.delete("/:id", notificationController.deleteNotification);

module.exports = router;
