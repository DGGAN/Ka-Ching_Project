/**
 * @file backend/controllers/authController.js
 * @layer Backend Controller (Authentication & Account Security Management)
 * @description Handles 2-step OTP registration, dual-mode login (Email/Password + Google OAuth), mobile Google OAuth redirect callback, profile updates, password setup/change, Google account binding/unbinding, and 2-step OTP password recovery.
 * @exports register, requestRegisterOtp, verifyRegisterOtp, login, googleAuth, googleOAuthCallback, getUserProfile, updateUserProfile, forgotPasswordRequest, resetPasswordWithOtp
 */

const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const emailSender = require("../utils/emailSender");
const { isEmailServiceConfigured, sendPasswordResetEmail } = emailSender;
const logger = require("../utils/logger");

// Temporary in-memory store for pending email-verified registrations (10-minute TTL)
const pendingRegistrations = new Map();

// Generate a JWT token valid for 30 days
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// Validate email format using Regular Expression
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate password strength (at least 8 chars, containing letters and numbers)
const isValidPassword = (password) => {
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
};

// Format standardized user payload for frontend consumption
const formatUserPayload = (userDoc) => ({
  id: userDoc._id,
  username: userDoc.username,
  email: userDoc.email,
  oauthProvider: userDoc.oauthProvider || "NONE",
  oauthId: userDoc.oauthId || null,
  hasPassword: Boolean(userDoc.passwordHash),
  isGoogleLinked: Boolean(userDoc.oauthProvider === "GOOGLE" && userDoc.oauthId),
  isNotificationEnabled: typeof userDoc.isNotificationEnabled === "boolean" ? userDoc.isNotificationEnabled : true,
  autoCaptureEnabled: Boolean(userDoc.autoCaptureEnabled),
});

// ==========================================
// 1. Standard User Registration (Direct Fallback)
// ==========================================
exports.register = async (req, res) => {
  try {
    let { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        message: "All fields (username, email, password) are required.",
      });
    }

    username = username.trim();
    email = email.trim().toLowerCase();

    if (username.length < 3) {
      return res.status(400).json({
        message: "Username must be at least 3 characters long.",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        message: "Please provide a valid email address.",
      });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long and contain both letters and numbers.",
      });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        message: "Email is already registered. Please login instead.",
      });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({
        message: "Username is already taken. Please choose another one.",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      email,
      passwordHash,
      oauthProvider: "NONE",
      oauthId: null,
      isNotificationEnabled: true,
      autoCaptureEnabled: false,
    });

    const savedUser = await newUser.save();
    const token = generateToken(savedUser._id);

    logger.info("AUTH_REGISTER", `New user registered: ${savedUser.email} (${savedUser.username})`);

    return res.status(201).json({
      message: "User registered successfully.",
      token,
      user: formatUserPayload(savedUser),
    });
  } catch (error) {
    logger.error("AUTH_REGISTER", "Registration failed", error);
    return res.status(500).json({
      message: "Registration failed.",
      error: error.message,
    });
  }
};

// ==========================================
// 1.5 Step 1 of Registration: Validate Details & Send 6-Digit Email OTP
// ==========================================
exports.requestRegisterOtp = async (req, res) => {
  try {
    if (!isEmailServiceConfigured()) {
      logger.warn("AUTH_REG_OTP", "Registration OTP requested while email service is unconfigured");
      return res.status(503).json({
        message: "Verification email service is currently unavailable. Please try again later.",
      });
    }

    let { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        message: "All fields (username, email, password) are required.",
      });
    }

    username = username.trim();
    email = email.trim().toLowerCase();

    if (username.length < 3) {
      return res.status(400).json({
        message: "Username must be at least 3 characters long.",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        message: "Please provide a valid email address.",
      });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long and contain both letters and numbers.",
      });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        message: "Email is already registered. Please login instead.",
      });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({
        message: "Username is already taken. Please choose another one.",
      });
    }

    // Enforce 60-second anti-spam cooldown per email
    const now = Date.now();
    const existingPending = pendingRegistrations.get(email);
    if (existingPending && now - existingPending.requestedAt < 60 * 1000) {
      const waitSec = Math.ceil((60 * 1000 - (now - existingPending.requestedAt)) / 1000);
      return res.status(429).json({
        message: `Please wait ${waitSec}s before requesting another verification code.`,
      });
    }

    // Generate 6-digit numeric OTP and hash password beforehand
    const otpCode = String(Math.floor(100000 + Math.random() * 900000));
    const otpHash = crypto.createHash("sha256").update(otpCode).digest("hex");
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Send verification email (uses dedicated sendRegistrationOtpEmail if available, else falls back cleanly)
    const sendVerifyFn = typeof emailSender.sendRegistrationOtpEmail === "function" ? emailSender.sendRegistrationOtpEmail : sendPasswordResetEmail;

    await sendVerifyFn({
      toEmail: email,
      username,
      otpCode,
    });

    // Save pending registration for 10 minutes
    pendingRegistrations.set(email, {
      username,
      email,
      passwordHash,
      otpHash,
      requestedAt: now,
      expiresAt: now + 10 * 60 * 1000,
    });

    // Periodically prune expired pending entries
    if (pendingRegistrations.size > 200) {
      for (const [key, entry] of pendingRegistrations.entries()) {
        if (entry.expiresAt < now) {
          pendingRegistrations.delete(key);
        }
      }
    }

    logger.info("AUTH_REG_OTP", `Sent 6-digit registration OTP to ${email}`);

    return res.status(200).json({
      message: `A 6-digit verification code has been sent to ${email}.`,
    });
  } catch (error) {
    logger.error("AUTH_REG_OTP", "Failed to send registration OTP", error);
    return res.status(503).json({
      message: "Failed to send verification email. Please check your email address and try again.",
    });
  }
};

// ==========================================
// 1.6 Step 2 of Registration: Verify 6-Digit OTP & Create User Account
// ==========================================
exports.verifyRegisterOtp = async (req, res) => {
  try {
    let { email, otpCode } = req.body;

    if (!email || !otpCode) {
      return res.status(400).json({
        message: "Email and 6-digit verification code are required.",
      });
    }

    email = email.trim().toLowerCase();
    const cleanOtp = String(otpCode).trim();

    const pending = pendingRegistrations.get(email);
    if (!pending) {
      return res.status(400).json({
        message: "No pending registration found for this email. Please request a new code.",
      });
    }

    if (Date.now() > pending.expiresAt) {
      pendingRegistrations.delete(email);
      return res.status(400).json({
        message: "Verification code has expired. Please request a new 6-digit code.",
      });
    }

    const incomingHash = crypto.createHash("sha256").update(cleanOtp).digest("hex");
    if (incomingHash !== pending.otpHash) {
      logger.debug("AUTH_REG_OTP", `Invalid registration OTP attempt for ${email}`);
      return res.status(400).json({
        message: "Invalid 6-digit verification code. Please check your inbox and try again.",
      });
    }

    // Re-check uniqueness before creating the permanent MongoDB document
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      pendingRegistrations.delete(email);
      return res.status(400).json({
        message: "Email is already registered. Please login instead.",
      });
    }

    const existingUsername = await User.findOne({ username: pending.username });
    if (existingUsername) {
      pendingRegistrations.delete(email);
      return res.status(400).json({
        message: "Username was just taken. Please choose another username and try again.",
      });
    }

    const newUser = new User({
      username: pending.username,
      email: pending.email,
      passwordHash: pending.passwordHash,
      oauthProvider: "NONE",
      oauthId: null,
      isNotificationEnabled: true,
      autoCaptureEnabled: false,
    });

    const savedUser = await newUser.save();
    pendingRegistrations.delete(email);

    const token = generateToken(savedUser._id);
    logger.info("AUTH_REGISTER", `Verified & created new account: ${savedUser.email} (${savedUser.username})`);

    return res.status(201).json({
      message: "Email verified! Your Ka-Ching! account has been created.",
      token,
      user: formatUserPayload(savedUser),
    });
  } catch (error) {
    logger.error("AUTH_REG_OTP", "Failed to verify registration OTP", error);
    return res.status(500).json({
      message: "Account verification failed. Please try again.",
      error: error.message,
    });
  }
};

// ==========================================
// 2. Standard Email & Password Login (Dual-Mode Ready)
// ==========================================
exports.login = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Please provide both email and password.",
      });
    }

    email = email.trim().toLowerCase();

    const user = await User.findOne({ email }).select("+passwordHash");

    if (!user) {
      logger.debug("AUTH_LOGIN", `Login failed: email not found (${email})`);
      return res.status(404).json({
        message: "Invalid email or password.",
      });
    }

    if (!user.passwordHash) {
      return res.status(400).json({
        message: "This Google account has no password set yet. Please login with Google first, then set a password in Profile.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      logger.debug("AUTH_LOGIN", `Login failed: invalid password for ${email}`);
      return res.status(400).json({
        message: "Invalid email or password.",
      });
    }

    const token = generateToken(user._id);
    logger.info("AUTH_LOGIN", `User logged in via password: ${user.email}`);

    return res.status(200).json({
      message: "Login successful.",
      token,
      user: formatUserPayload(user),
    });
  } catch (error) {
    logger.error("AUTH_LOGIN", "Password login error", error);
    return res.status(500).json({
      message: "Login failed.",
      error: error.message,
    });
  }
};

// ==========================================
// 3. Google OAuth Login & Auto-Registration
// ==========================================
exports.googleAuth = async (req, res) => {
  try {
    let { email, username, oauthId } = req.body;

    if (!email || !oauthId) {
      return res.status(400).json({
        message: "Missing Google authentication data.",
      });
    }

    email = email.trim().toLowerCase();

    let user = await User.findOne({
      $or: [{ oauthId: String(oauthId) }, { email }],
    }).select("+passwordHash");

    if (!user) {
      let baseUsername = username ? username.trim() : email.split("@")[0];

      if (baseUsername.length < 3) {
        baseUsername = `${baseUsername}_user`;
      }

      const existingUsername = await User.findOne({ username: baseUsername });
      if (existingUsername) {
        baseUsername = `${baseUsername}_${Math.floor(1000 + Math.random() * 9000)}`;
      }

      user = new User({
        username: baseUsername,
        email,
        passwordHash: null,
        oauthProvider: "GOOGLE",
        oauthId: String(oauthId),
        isNotificationEnabled: true,
        autoCaptureEnabled: false,
      });

      await user.save();
      logger.info("AUTH_GOOGLE", `New Google OAuth account created: ${user.email}`);
    } else {
      if (!user.oauthId || user.oauthProvider !== "GOOGLE") {
        user.oauthId = String(oauthId);
        user.oauthProvider = "GOOGLE";
        await user.save();
      }
      logger.info("AUTH_GOOGLE", `User logged in via Google OAuth: ${user.email}`);
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      message: "Google authentication successful.",
      token,
      user: formatUserPayload(user),
    });
  } catch (error) {
    logger.error("AUTH_GOOGLE", "Google authentication failed", error);
    return res.status(500).json({
      message: "Google authentication failed.",
      error: error.message,
    });
  }
};

// ==========================================
// 3.5 Mobile Google OAuth Redirect Bridge (GET /api/auth/google/callback)
// ==========================================
exports.googleOAuthCallback = (req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  return res.send(`<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Redirecting to Ka-Ching!...</title></head>
<body style="font-family:monospace;text-align:center;padding-top:40px;background:#FAF6F0;color:#121212;">
  <p>Completing Google Sign-In...</p>
  <script>
    (function() {
      var hash = window.location.hash.substring(1);
      var params = new URLSearchParams(hash);
      var state = params.get("state");
      var returnUrl = state ? decodeURIComponent(state) : "kaching://auth";
      var sep = returnUrl.indexOf("?") !== -1 ? "&" : "?";
      window.location.replace(returnUrl + (hash ? sep + hash : ""));
    })();
  </script>
</body>
</html>`);
};

// ==========================================
// 4. Get Latest User Profile Details
// ==========================================
exports.getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select("+passwordHash");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    return res.status(200).json({
      user: formatUserPayload(user),
    });
  } catch (error) {
    logger.error("AUTH_PROFILE", `Failed to fetch profile for userId=${req.params.userId}`, error);
    return res.status(500).json({
      message: "Failed to fetch user profile.",
      error: error.message,
    });
  }
};

// ==========================================
// 5. Update Profile, Email, Password & Google Bind/Unbind
// ==========================================
exports.updateUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const { username, email, currentPassword, newPassword, bindGoogle, unbindGoogle, isNotificationEnabled, autoCaptureEnabled } = req.body;

    const user = await User.findById(userId).select("+passwordHash");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // A. Update Username
    if (typeof username === "string" && username.trim() !== user.username) {
      const cleanUsername = username.trim();
      if (cleanUsername.length < 3) {
        return res.status(400).json({
          message: "Username must be at least 3 characters.",
        });
      }
      const takenUser = await User.findOne({
        username: cleanUsername,
        _id: { $ne: user._id },
      });
      if (takenUser) {
        return res.status(400).json({
          message: "Username is already taken by another user.",
        });
      }
      user.username = cleanUsername;
    }

    // B. Update Email Address
    if (typeof email === "string" && email.trim().toLowerCase() !== user.email.toLowerCase()) {
      const cleanEmail = email.trim().toLowerCase();
      if (!isValidEmail(cleanEmail)) {
        return res.status(400).json({
          message: "Please enter a valid email address.",
        });
      }
      const takenEmail = await User.findOne({
        email: cleanEmail,
        _id: { $ne: user._id },
      });
      if (takenEmail) {
        return res.status(400).json({
          message: "This email address is already in use by another account.",
        });
      }
      user.email = cleanEmail;
    }

    // C. Set or Change Password
    if (typeof newPassword === "string" && newPassword.length > 0) {
      if (user.passwordHash) {
        if (!currentPassword) {
          return res.status(400).json({
            message: "Please enter your current password to set a new password.",
          });
        }
        const isCurrentMatch = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isCurrentMatch) {
          return res.status(400).json({
            message: "Current password is incorrect.",
          });
        }
      }

      if (!isValidPassword(newPassword)) {
        return res.status(400).json({
          message: "New password must be at least 8 characters and contain both letters and numbers.",
        });
      }

      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(newPassword, salt);
    }

    // D. Bind Google Account
    if (bindGoogle && typeof bindGoogle === "object") {
      const targetGoogleEmail = (bindGoogle.email || user.email).trim().toLowerCase();
      const targetOauthId = String(bindGoogle.oauthId || "").trim();

      if (!isValidEmail(targetGoogleEmail) || !targetOauthId) {
        return res.status(400).json({
          message: "Valid Google account verification is required to bind.",
        });
      }

      const conflictUser = await User.findOne({
        $or: [{ email: targetGoogleEmail }, { oauthId: targetOauthId }],
        _id: { $ne: user._id },
      });
      if (conflictUser) {
        return res.status(409).json({
          message: `This Google account (${targetGoogleEmail}) is already linked to another Ka-Ching! user. Please use a different Google account.`,
        });
      }

      user.email = targetGoogleEmail;
      user.oauthProvider = "GOOGLE";
      user.oauthId = targetOauthId;
    }

    // E. Unbind Google Account (Safety Lock: Requires password to be set first)
    if (unbindGoogle === true) {
      if (!user.passwordHash) {
        return res.status(400).json({
          message: "Safety Lock: Please set a login password first before unbinding Google, so you do not lose access to your account.",
        });
      }
      user.oauthProvider = "NONE";
      user.oauthId = null;
    }

    // F. Update Notification & Auto-Capture Preferences
    if (typeof isNotificationEnabled === "boolean") {
      user.isNotificationEnabled = isNotificationEnabled;
    }
    if (typeof autoCaptureEnabled === "boolean") {
      user.autoCaptureEnabled = autoCaptureEnabled;
    }

    const updatedUser = await user.save();
    logger.info("AUTH_PROFILE", `Account settings updated for user: ${updatedUser.email}`);

    return res.status(200).json({
      message: "Account settings updated successfully.",
      user: formatUserPayload(updatedUser),
    });
  } catch (error) {
    logger.error("AUTH_PROFILE", "Failed to update profile settings", error);
    return res.status(500).json({
      message: "Failed to update profile settings.",
      error: error.message,
    });
  }
};

// ==========================================
// 6. Request Password Reset OTP
// ==========================================
exports.forgotPasswordRequest = async (req, res) => {
  try {
    if (!isEmailServiceConfigured()) {
      logger.warn("AUTH_OTP", "Password reset requested while SMTP is unconfigured");
      return res.status(503).json({
        message: "Password recovery email service is currently unavailable. Please try again later.",
      });
    }

    let { email } = req.body;
    if (!email || !isValidEmail(email.trim())) {
      return res.status(400).json({
        message: "Please enter a valid email address.",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      logger.debug("AUTH_OTP", `Password reset blocked: unregistered email (${cleanEmail})`);
      return res.status(404).json({
        message: "No account was found with this email address.",
      });
    }

    const now = Date.now();
    if (user.resetPasswordRequestedAt && now - new Date(user.resetPasswordRequestedAt).getTime() < 60 * 1000) {
      const waitSec = Math.ceil((60 * 1000 - (now - new Date(user.resetPasswordRequestedAt).getTime())) / 1000);
      return res.status(429).json({
        message: `Please wait ${waitSec}s before requesting another reset code.`,
      });
    }

    const otpCode = String(Math.floor(100000 + Math.random() * 900000));
    const otpHash = crypto.createHash("sha256").update(otpCode).digest("hex");

    await sendPasswordResetEmail({
      toEmail: user.email,
      username: user.username,
      otpCode,
    });

    user.resetPasswordOtpHash = otpHash;
    user.resetPasswordExpires = new Date(now + 10 * 60 * 1000);
    user.resetPasswordRequestedAt = new Date(now);
    await user.save();

    return res.status(200).json({
      message: `A 6-digit verification code has been sent to ${user.email}.`,
    });
  } catch (error) {
    logger.error("AUTH_OTP", "Failed to process forgot-password request", error);
    return res.status(503).json({
      message: "Password recovery email service is currently unavailable. Please try again later.",
    });
  }
};

// ==========================================
// 7. Verify 6-Digit OTP & Reset Password
// ==========================================
exports.resetPasswordWithOtp = async (req, res) => {
  try {
    let { email, otpCode, newPassword } = req.body;

    if (!email || !otpCode || !newPassword) {
      return res.status(400).json({
        message: "Email, 6-digit verification code, and new password are required.",
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = String(otpCode).trim();

    if (!isValidPassword(newPassword)) {
      return res.status(400).json({
        message: "New password must be at least 8 characters and include both letters and numbers.",
      });
    }

    const user = await User.findOne({ email: cleanEmail }).select("+passwordHash");
    if (!user || !user.resetPasswordOtpHash || !user.resetPasswordExpires) {
      return res.status(400).json({
        message: "No active password reset request found. Please request a new code.",
      });
    }

    if (new Date() > new Date(user.resetPasswordExpires)) {
      user.resetPasswordOtpHash = null;
      user.resetPasswordExpires = null;
      await user.save();
      return res.status(400).json({
        message: "Verification code has expired. Please request a new 6-digit code.",
      });
    }

    const incomingHash = crypto.createHash("sha256").update(cleanOtp).digest("hex");
    if (incomingHash !== user.resetPasswordOtpHash) {
      logger.debug("AUTH_OTP", `Invalid OTP attempt for ${cleanEmail}`);
      return res.status(400).json({
        message: "Invalid 6-digit verification code. Please check and try again.",
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.resetPasswordOtpHash = null;
    user.resetPasswordExpires = null;
    user.resetPasswordRequestedAt = null;
    await user.save();

    logger.info("AUTH_OTP", `Password successfully reset via OTP for ${user.email}`);

    return res.status(200).json({
      message: "Password reset successful! You can now login with your new password.",
    });
  } catch (error) {
    logger.error("AUTH_OTP", "Failed to reset password with OTP", error);
    return res.status(500).json({
      message: "Failed to reset password.",
      error: error.message,
    });
  }
};
