/**
 * @file backend/models/User.js
 * @layer Backend Mongoose Schema (Users Collection)
 * @description Defines User schema supporting both standard Email/Password authentication and Google OAuth binding, plus notification and Smart Auto-Capture preferences.
 */

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      default: null,
    },
    oauthProvider: {
      type: String,
      enum: ["NONE", "GOOGLE"],
      default: "NONE",
    },
    oauthId: {
      type: String,
      default: null,
    },
    isNotificationEnabled: {
      type: Boolean,
      default: true,
    },
    autoCaptureEnabled: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("User", userSchema);
