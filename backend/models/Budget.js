// Import the mongoose core library
const mongoose = require('mongoose');

// Strictly define the budget model according to Table 4.3 of the document
const budgetSchema = new mongoose.Schema({
    // Foreign Key referencing the Users collection
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Total maximum allowed expense limit
    limitAmount: {
        type: Number,
        required: true
    },
    // Targeted monthly financial savings milestone
    savingsTarget: {
        type: Number,
        required: true
    },
    // Dynamic scheduling time marker formatted as "YYYY-MM"
    period: {
        type: String,
        required: true
    },
    // The absolute first initialization day of the budget cycle
    startDate: {
        type: Date,
        required: true
    },
    // The final calendar expiration cutoff day of the budget cycle
    endDate: {
        type: Date,
        required: true
    }
});

module.exports = mongoose.model('Budget', budgetSchema);