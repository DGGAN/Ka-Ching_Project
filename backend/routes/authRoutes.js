// Import express Router tool and auth controller
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

// Standard account registration endpoint
router.post("/register", authController.register);

// Standard account login endpoint
router.post("/login", authController.login);

// Google OAuth login/registration endpoint
router.post("/google", authController.googleAuth);

// Update user profile and notification toggle endpoint
router.put("/profile/:userId", protect, authController.updateUserProfile);
// Export router module
module.exports = router;
