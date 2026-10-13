// Import the mongoose core library
const mongoose = require('mongoose');

// Strictly define the insights and prediction model according to Table 4.4
const allInsightsPredictionSchema = new mongoose.Schema({
    // Foreign Key referencing the Users collection
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Action routing profile category sorting the analytical data blocks
    insightType: {
        type: String,
        required: true,
        enum: ['RECOMMENDATION', 'WARNING', 'ADVICE', 'ACTION_CHECKLIST']
    },
    // The actual context-aware text string advice
    message: {
        type: String,
        required: true
    },
    // Embedded array storing interactive checklist tasks
    checklistItems: [{
        itemId: String,
        text: String,
        isCompleted: Boolean
    }],
    // Calculated month-end expenditure forecast returned by linear regression
    predictedAmount: {
        type: Number,
        default: null
    },
    // ISO date string logging the exact runtime execution timeline
    generatedAt: {
        type: Date,
        default: Date.now,
        required: true
    }
});

module.exports = mongoose.model('AllInsightsPrediction', allInsightsPredictionSchema);