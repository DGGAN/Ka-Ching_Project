// Import Express router and the analytics controller
const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");

// 1. Route to compute and retrieve AI analytics for a user (GET /api/analytics/:userId)
router.get("/:userId", analyticsController.getAnalytics);

// Export the router module
module.exports = router;
