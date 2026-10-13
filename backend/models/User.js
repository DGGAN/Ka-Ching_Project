// Import the mongoose core library
const mongoose = require('mongoose');

// Strictly define the user model according to Table 4.1 of the document
const userSchema = new mongoose.Schema({
    // Unique display name chosen by the user
    username: {
        type: String,
        required: true,
        unique: true
    },
    // Registered email address used for login authentication
    email: {
        type: String,
        required: true,
        unique: true
    },
    // Encrypted password string, nullable for third-party social logins
    passwordHash: {
        type: String,
        default: null
    },
    // Third-party login service provider, defaults to NONE
    oauthProvider: {
        type: String,
        enum: ['GOOGLE', 'NONE'],
        default: 'NONE'
    },
    // Unique user identification string sent back by Google sign-in
    oauthId: {
        type: String,
        default: null
    },
    // System switch toggle controlling push alerts, defaults to true
    isNotificationEnabled: {
        type: Boolean,
        default: true
    }
}, {
    // Mongoose will automatically generate createdAt and updatedAt timestamps
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);