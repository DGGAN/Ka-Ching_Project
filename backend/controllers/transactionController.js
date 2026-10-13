// Import the Transaction model
const Transaction = require('../models/Transaction');

// Function to handle the "add new transaction" request
exports.createTransaction = async (req, res) => {
    try {
        // Extract data: added source, status, and confidenceScore to support OCR and Notifications
        const { 
            userId, amount, type, category, merchantName, 
            description, date, source, status, confidenceScore 
        } = req.body;

        // Create a new transaction record object
        const newTransaction = new Transaction({
            userId,
            amount,
            type,
            category,
            merchantName,
            description,
            date: date || Date.now(), // Use current time if not provided
            
            // Flexible source: use provided source, or default to MANUAL
            source: source || 'MANUAL',
            
            // Flexible status: use provided status, or default to VERIFIED
            status: status || 'VERIFIED',
            
            // Handle OCR confidence score: default to 1.0 (100% accurate) if not provided
            confidenceScore: confidenceScore || 1.0 
        });

        // Officially save this record into the MongoDB database
        const savedTransaction = await newTransaction.save();

        // On success, return a success message and the saved data to the frontend
        res.status(201).json({
            message: 'Transaction saved successfully!',
            data: savedTransaction
        });

    } catch (error) {
        // If an error occurs, return an error message to the frontend
        res.status(500).json({
            message: 'Failed to save transaction.',
            error: error.message
        });
    }
};