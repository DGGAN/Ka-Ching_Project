// Import User model, encryption tool, and JWT token tool
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Helper function: Generate a JWT token valid for 30 days
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// Helper function: Validate email format using Regular Expression (Regex)
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// ==========================================
// 1. Standard User Registration (with strict validation)
// ==========================================
exports.register = async (req, res) => {
  try {
    // Extract registration info from frontend request
    let { username, email, password } = req.body;

    // Validation 1: Check if required fields are empty
    if (!username || !email || !password) {
      return res.status(400).json({
        message: "All fields (username, email, password) are required.",
      });
    }

    // Trim whitespace and convert email to lowercase to prevent case-sensitive duplicates
    username = username.trim();
    email = email.trim().toLowerCase();

    // Validation 2: Check username length (at least 3 characters)
    if (username.length < 3) {
      return res.status(400).json({
        message: "Username must be at least 3 characters long.",
      });
    }

    // Validation 3: Check if email format is valid
    if (!isValidEmail(email)) {
      return res.status(400).json({
        message: "Please provide a valid email address.",
      });
    }

    // Validation 4: Check password strength (min 8 chars, must contain letters and numbers)
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$\%^&*]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long and contain both letters and numbers.",
      });
    }

    // Validation 5: Check if email is already registered in database
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        message: "Email is already registered. Please login instead.",
      });
    }

    // Validation 6: Check if username is already taken (complies with Table 4.1 Unique spec)
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({
        message: "Username is already taken. Please choose another one.",
      });
    }

    // Encrypt password using bcrypt hashing (complies with NFR4 security spec)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create and save the new user document
    const newUser = new User({
      username,
      email,
      passwordHash,
      oauthProvider: "NONE",
      oauthId: null,
    });

    const savedUser = await newUser.save();
    const token = generateToken(savedUser._id);

    // Return success status, JWT token, and user profile info
    res.status(201).json({
      message: "User registered successfully.",
      token,
      user: {
        id: savedUser._id,
        username: savedUser.username,
        email: savedUser.email,
        oauthProvider: savedUser.oauthProvider,
        isNotificationEnabled: savedUser.isNotificationEnabled,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Registration failed.", error: error.message });
  }
};

// ==========================================
// 2. Standard Email & Password Login
// ==========================================
exports.login = async (req, res) => {
  try {
    // Extract email and password from request body
    let { email, password } = req.body;

    // Validate that required fields are not empty
    if (!email || !password) {
      return res.status(400).json({
        message: "Please provide both email and password.",
      });
    }

    email = email.trim().toLowerCase();

    // Find the user by email in the database
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        message: "Invalid email or password.",
      });
    }

    // Prevent Google OAuth accounts (without passwordHash) from logging in via standard password
    if (user.oauthProvider === "GOOGLE" && !user.passwordHash) {
      return res.status(400).json({
        message: 'This account was created using Google. Please click "Continue with Google" to login.',
      });
    }

    // Compare input password with the encrypted passwordHash in database
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid email or password.",
      });
    }

    // Login successful, issue JWT token
    const token = generateToken(user._id);

    res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        oauthProvider: user.oauthProvider,
        isNotificationEnabled: user.isNotificationEnabled,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed.", error: error.message });
  }
};

// ==========================================
// 3. Google OAuth Login & Auto-Registration
// ==========================================
exports.googleAuth = async (req, res) => {
  try {
    // Receive user details obtained by the frontend from Google OAuth
    let { email, username, oauthId } = req.body;

    // Validate that core Google OAuth data is complete
    if (!email || !oauthId) {
      return res.status(400).json({
        message: "Missing Google authentication data.",
      });
    }

    email = email.trim().toLowerCase();

    // Check if a user with this email already exists in the database
    let user = await User.findOne({ email });

    if (!user) {
      // Case A: Brand new Google user, automatically create a new account
      let baseUsername = username ? username.trim().replace(/\s+/g, "_").toLowerCase() : email.split("@")[0];

      // Check if generated username conflicts with existing users; append random digits if needed
      const existingUsername = await User.findOne({ username: baseUsername });
      if (existingUsername) {
        baseUsername = `${baseUsername}_${Math.floor(1000 + Math.random() * 9000)}`;
      }

      user = new User({
        username: baseUsername,
        email,
        passwordHash: null, // No password needed for Google login
        oauthProvider: "GOOGLE",
        oauthId: String(oauthId),
      });

      await user.save();
    } else {
      // Case B: Existing user, link Google ID if not already linked
      if (!user.oauthId) {
        user.oauthId = String(oauthId);
        user.oauthProvider = "GOOGLE";
        await user.save();
      }
    }

    // Generate system JWT token and return to frontend
    const token = generateToken(user._id);

    res.status(200).json({
      message: "Google authentication successful.",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        oauthProvider: user.oauthProvider,
        isNotificationEnabled: user.isNotificationEnabled,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Google authentication failed.", error: error.message });
  }
};

// ==========================================
// 4. Get & Update User Profile and Notification Settings
// ==========================================
exports.updateUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const { username, isNotificationEnabled } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // If user wants to change username, check if the new username is already taken by others
    if (username && username.trim() !== user.username) {
      const cleanUsername = username.trim();
      if (cleanUsername.length < 3) {
        return res.status(400).json({ message: "Username must be at least 3 characters." });
      }
      const taken = await User.findOne({ username: cleanUsername });
      if (taken) {
        return res.status(400).json({ message: "Username is already taken." });
      }
      user.username = cleanUsername;
    }

    // If notification toggle boolean is provided, update the setting
    if (typeof isNotificationEnabled === "boolean") {
      user.isNotificationEnabled = isNotificationEnabled;
    }

    const updatedUser = await user.save();

    res.status(200).json({
      message: "Profile updated successfully.",
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        oauthProvider: updatedUser.oauthProvider,
        isNotificationEnabled: updatedUser.isNotificationEnabled,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update profile.", error: error.message });
  }
};
