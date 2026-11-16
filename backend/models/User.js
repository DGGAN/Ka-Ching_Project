/**
 * @file backend/models/User.js
 * @layer Backend Mongoose Schema (Users Collection)
 * @description User schema with support for dual-mode authentication (Password + Google OAuth), PDPA auto-capture toggle, and secure Forgot Password OTP fields.  */

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 5,
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
    resetPasswordOtpHash: {
      type: String,
      default: null,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
    resetPasswordRequestedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
