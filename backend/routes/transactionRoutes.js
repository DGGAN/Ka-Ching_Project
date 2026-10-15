// Import the express Router tool
const express = require('express');
const router = express.Router();

// Import the transaction controller
const transactionController = require('../controllers/transactionController');

// Save new transaction
router.post('/', transactionController.createTransaction);

// Get transactions for a specific user
router.get('/:userId', transactionController.getTransactions);

// Export this router so server.js can use it
module.exports = router;