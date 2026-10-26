// 导入 express 路由工具与交易控制器
// Import express Router and transaction controller
const express = require("express");
const router = express.Router();
const transactionController = require("../controllers/transactionController");

// Endpoint to create a new transaction record
router.post("/", transactionController.createTransaction);

// Endpoint to fetch all transactions for a specific user
router.get("/:userId", transactionController.getTransactions);

// Endpoint to edit/update a single transaction record by its _id
router.put("/:id", transactionController.updateTransaction);

// Endpoint to delete a single transaction record by its _id
router.delete("/:id", transactionController.deleteTransaction);

// 导出路由模块
// Export router module
module.exports = router;
