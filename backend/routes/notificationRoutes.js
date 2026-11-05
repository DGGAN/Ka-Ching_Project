// Import Express router and the notification controller
const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");

// Route to get all notifications for a specific user
router.get("/:userId", notificationController.getNotifications);

// Route to mark a single notification as read by its MongoDB _id
router.put("/:id/read", notificationController.markAsRead);

// Route to mark all notifications for a user as read in bulk
router.post("/read-all", notificationController.markAllAsRead);

// Route to delete a specific notification by its MongoDB _id
router.delete("/:id", notificationController.deleteNotification);

// Export the router to be mounted in server.js
module.exports = router;
