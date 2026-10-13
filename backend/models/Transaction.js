// Import the mongoose core library
const mongoose = require('mongoose');

// Strictly define the transaction model according to Table 4.2 of the document
const transactionSchema = new mongoose.Schema({
    // Foreign Key referencing the Users collection
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Numerical transaction cost value
    amount: {
        type: Number,
        required: true
    },
    // Direction flow tracking parameter (Income / Expense)
    type: {
        type: String,
        required: true,
        enum: ['INCOME', 'EXPENSE']
    },
    // Fixed category choice tracking spending patterns
    category: {
        type: String,
        required: true,
        enum: [
            'SALARY', 'ALLOWANCE', 'INVESTMENT', 'GIFT', 'OTHER_INCOME', // Income categories
            'FOOD_AND_BEVERAGE', 'TRANSPORT', 'SHOPPING', 'LEISURE_AND_ENTERTAINMENT', 
            'BILLS_AND_UTILITIES', 'HEALTH_AND_EDUCATION', 'SAVINGS_AND_INVESTMENT', 'OTHER_EXPENSE' // Expense categories
        ]
    },
    // Identified retail store name
    merchantName: {
        type: String,
        required: true
    },
    // Optional custom notes
    description: {
        type: String,
        default: null
    },
    // True historical calendar day when the transaction took place
    date: {
        type: Date,
        required: true
    },
    // Ingestion pathway channel
    source: {
        type: String,
        required: true,
        enum: ['MANUAL', 'NOTIFICATION', 'OCR']
    },
    // System state flag for verification workflows
    status: {
        type: String,
        required: true,
        enum: ['PENDING_VERIFICATION', 'VERIFIED'],

        // Ensure only OCR-scanned transactions (e.g., batch imports) can have a 'PENDING_VERIFICATION' status for user approval.
        // Manual entries and notification captures have explicit data and must strictly be 'VERIFIED'.
        validate: {
            validator: function(value) {
                // If source is MANUAL or NOTIFICATION, status must be VERIFIED
                if (this.source === 'MANUAL' || this.source === 'NOTIFICATION') {
                    return value === 'VERIFIED';
                }
                // If source is OCR, both are allowed
                return true; 
            },
            message: 'Transactions from MANUAL or NOTIFICATION sources must have VERIFIED status.'
        }
    },
    // Optical recognition reliability rating
    confidenceScore: {
        type: Number,
        default: 1.0
    }
});

module.exports = mongoose.model('Transaction', transactionSchema);