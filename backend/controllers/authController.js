/**
 * @file backend/controllers/authController.js
 * @layer Backend Controller (Authentication & Account Security Management)
 * @description Handles registration, dual-mode login (Email/Password + Google OAuth), profile updates (username & email), password setup/change, and Google account binding/unbinding.
 * @exports register, login, googleAuth, getUserProfile, updateUserProfile
 */

const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Generate a JWT token valid for 30 days
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || "kaching_secret_key", {
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
// 1. Standard User Registration
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

    return res.status(201).json({
      message: "User registered successfully.",
      token,
      user: formatUserPayload(savedUser),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Registration failed.",
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

    // Explicitly include passwordHash even if User model sets select: false
    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user) {
      return res.status(404).json({
        message: "Invalid email or password.",
      });
    }

    // Only block password login if the account truly has NO passwordHash set yet
    if (!user.passwordHash) {
      return res.status(400).json({
        message: "This Google account has no password set yet. Please login with Google first, then set a password in Profile.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid email or password.",
      });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      message: "Login successful.",
      token,
      user: formatUserPayload(user),
    });
  } catch (error) {
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

    let user = await User.findOne({ email }).select("+passwordHash");

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
    } else {
      // Link Google OAuth ID if not linked yet while preserving any existing passwordHash
      if (!user.oauthId || user.oauthProvider !== "GOOGLE") {
        user.oauthId = String(oauthId);
        user.oauthProvider = "GOOGLE";
        await user.save();
      }
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      message: "Google authentication successful.",
      token,
      user: formatUserPayload(user),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Google authentication failed.",
      error: error.message,
    });
  }
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
      const targetOauthId = bindGoogle.oauthId || `google_${targetGoogleEmail}`;

      if (!isValidEmail(targetGoogleEmail)) {
        return res.status(400).json({
          message: "Please provide a valid Google email to bind.",
        });
      }

      const emailConflict = await User.findOne({
        email: targetGoogleEmail,
        _id: { $ne: user._id },
      });
      if (emailConflict) {
        return res.status(400).json({
          message: "That Google email is already linked to another user.",
        });
      }

      user.email = targetGoogleEmail;
      user.oauthProvider = "GOOGLE";
      user.oauthId = String(targetOauthId);
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

    return res.status(200).json({
      message: "Account settings updated successfully.",
      user: formatUserPayload(updatedUser),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update profile settings.",
      error: error.message,
    });
  }
};
