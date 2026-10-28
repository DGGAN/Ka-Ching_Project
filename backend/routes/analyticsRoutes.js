// Import express Router and AI analytics controller
const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");

// Endpoint to get user's linear regression month-end forecast and 90-day habit insights
router.get("/:userId", analyticsController.getUserAnalytics);

// Export router module
module.exports = router;
