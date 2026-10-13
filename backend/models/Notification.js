// Import the mongoose core library
const mongoose = require('mongoose');

// Strictly define the notification model according to Table 4.5
const notificationSchema = new mongoose.Schema({
    // Foreign Key referencing the Users collection
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Bold text layout header summary text
    title: {
        type: String,
        required: true
    },
    // Detailed explanatory alert body
    message: {
        type: String,
        required: true
    },
    // Architectural dispatch pipeline router flag
    tag: {
        type: String,
        required: true,
        enum: ['ALERT', 'OCR', 'AI', 'TXN', 'GOAL']
    },
    // UI layout color sorting switch parameter tracking user interaction
    isRead: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('Notification', notificationSchema);