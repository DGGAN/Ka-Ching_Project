const express = require('express');
const router = express.Router();
const budgetController = require('../controllers/budgetController');

// Set or update budget (POST)
router.post('/', budgetController.setBudget);

// Get budget for specific user and period (GET，Example：/api/budgets/用户ID/2026-10)
router.get('/:userId/:period', budgetController.getBudget);

module.exports = router;