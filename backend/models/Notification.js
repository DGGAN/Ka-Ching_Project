// Import the Mongoose library to define the database schema
const mongoose = require("mongoose");

// Define the Notification schema according to Table 4.5 specifications
const notificationSchema = new mongoose.Schema(
  {
    // Foreign key referencing the User who owns this notification
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Short bold header summarizing the alert
    title: {
      type: String,
      required: true,
    },
    // Detailed message body explaining the financial event or alert
    message: {
      type: String,
      required: true,
    },
    // Category tag used by the frontend to render specific icons and colors
    tag: {
      type: String,
      required: true,
      enum: ["ALERT", "OCR", "AI", "TXN", "GOAL"],
    },
    // Tracks whether the user has tapped/viewed this notification
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    // Automatically adds createdAt and updatedAt timestamps for chronological sorting
    timestamps: true,
  },
);

// Export the compiled Notification model
module.exports = mongoose.model("Notification", notificationSchema);
