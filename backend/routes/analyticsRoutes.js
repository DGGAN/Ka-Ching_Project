const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

// 获取特定用户的 AI 分析与预测数据 (GET)
// Get AI analytics and predictions for a specific user (GET)
router.get('/:userId', analyticsController.getFinancialAnalytics);

module.exports = router;