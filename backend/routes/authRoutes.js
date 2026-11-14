/**
 * @file backend/routes/authRoutes.js
 * @layer Backend Express Router
 * @description Defines public authentication routes and JWT-protected profile/security routes.
 */

const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

// Public authentication routes
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/google", authController.googleAuth);

// Protected Profile & Account Security routes (verified by authMiddleware.protect)
router.get("/profile/:userId", protect, authController.getUserProfile);
router.put("/profile/:userId", protect, authController.updateUserProfile);

module.exports = router;
