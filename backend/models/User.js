/**
 * @file backend/models/User.js
 * @description User schema with autoCaptureEnabled master switch (defaults to false until user explicitly enables it in ProfileScreen).
 */

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      default: null,
    },
    oauthProvider: {
      type: String,
      default: null,
    },
    oauthId: {
      type: String,
      default: null,
    },
    // Master toggle controlled exclusively in ProfileScreen (Default FALSE for PDPA privacy compliance)
    autoCaptureEnabled: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
