// Import the Transaction model and the intelligent financial analytics engine
const Transaction = require("../models/Transaction");
const { runAnalyticsEngine } = require("./analyticsController");

// 1. Create a new transaction record (strictly validates all Table 4.2 fields and constraints)
exports.createTransaction = async (req, res) => {
  try {
    // Destructure all fields defined in the Table 4.2 specification from request body
    const { userId, amount, type, category, merchantName, description, date, source, status, confidenceScore } = req.body;

    // Basic non-null validation: check if required fields are missing
    if (!userId || amount === undefined || !type || !category || !merchantName) {
      return res.status(400).json({
        message: "Missing required fields: userId, amount, type, category, and merchantName are required.",
      });
    }

    // Determine ingestion source and default status (OCR defaults to PENDING_VERIFICATION, others to VERIFIED)
    const finalSource = source || "MANUAL";
    const finalStatus = status || (finalSource === "OCR" ? "PENDING_VERIFICATION" : "VERIFIED");
    const finalConfidence = confidenceScore !== undefined ? Number(confidenceScore) : 1.0;

    // Instantiate a new Transaction document
    const newTransaction = new Transaction({
      userId,
      amount: Number(Number(amount).toFixed(2)),
      type,
      category,
      merchantName: merchantName.trim(),
      description: description ? description.trim() : null,
      date: date || new Date(),
      source: finalSource,
      status: finalStatus,
      confidenceScore: finalConfidence,
    });

    const savedTransaction = await newTransaction.save();

    // Write-Trigger: Automatically update AI analytics and predictions in the background after saving
    try {
      await runAnalyticsEngine(userId);
    } catch (analyticsErr) {
      console.log("Background analytics trigger warning:", analyticsErr.message);
    }

    res.status(201).json({
      message: "Transaction saved successfully.",
      data: savedTransaction,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create transaction.",
      error: error.message,
    });
  }
};

// 2. Get user transactions (supports Lazy Loading pagination, date range, month, category, type & search)
exports.getTransactions = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page, limit, type, category, search, period, monthKey } = req.query;

    // Build dynamic MongoDB query filter object
    const query = { userId };

    // Filter 1: Filter by transaction type (INCOME / EXPENSE)
    if (type && type !== "ALL") {
      query.type = type;
    }

    // Filter 2: Filter by specific category
    if (category && category !== "ALL") {
      query.category = category;
    }

    // Filter 3: Case-insensitive regex search on merchantName, category, or description
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [{ merchantName: regex }, { category: regex }, { description: regex }];
    }

    // Filter 4: Filter by quick time period or specific month (YYYY-MM)
    const now = new Date();
    if (monthKey && /^\d{4}-\d{2}$/.test(monthKey)) {
      const [y, m] = monthKey.split("-").map(Number);
      const startOfMonth = new Date(y, m - 1, 1, 0, 0, 0);
      const endOfMonth = new Date(y, m, 0, 23, 59, 59, 999);
      query.date = { $gte: startOfMonth, $lte: endOfMonth };
    } else if (period && period !== "ALL") {
      if (period === "TODAY") {
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        query.date = { $gte: startOfToday, $lte: endOfToday };
      } else if (period === "THIS_WEEK") {
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);
        query.date = { $gte: sevenDaysAgo, $lte: now };
      } else if (period === "THIS_MONTH") {
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        query.date = { $gte: startOfThisMonth, $lte: now };
      } else if (period === "THIS_YEAR") {
        const startOfThisYear = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
        query.date = { $gte: startOfThisYear, $lte: now };
      }
    }

    // If page and limit are provided, enable high-performance Lazy Loading pagination
    if (page && limit) {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
      const skipCount = (pageNum - 1) * limitNum;

      // 并行查询：获取当前页账单列表 + 符合条件的总记录数
      // Parallel query: fetch current page items + total matching document count
      const [transactions, totalCount] = await Promise.all([
        Transaction.find(query).sort({ date: -1, createdAt: -1 }).skip(skipCount).limit(limitNum),
        Transaction.countDocuments(query),
      ]);

      const totalPages = Math.ceil(totalCount / limitNum) || 1;

      return res.status(200).json({
        message: "Paginated transactions fetched successfully.",
        count: transactions.length,
        totalCount,
        currentPage: pageNum,
        totalPages,
        hasMore: pageNum < totalPages,
        data: transactions,
      });
    }

    // Compatibility mode: If no pagination params (e.g., Dashboard), cap at 500 recent records
    const transactions = await Transaction.find(query).sort({ date: -1, createdAt: -1 }).limit(500);

    res.status(200).json({
      message: "Transactions fetched successfully.",
      count: transactions.length,
      totalCount: transactions.length,
      hasMore: false,
      data: transactions,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch transactions.",
      error: error.message,
    });
  }
};

// 3. Update/Edit a single transaction record
exports.updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, type, category, merchantName, description, date, status } = req.body;

    const tx = await Transaction.findById(id);
    if (!tx) {
      return res.status(404).json({
        message: "Transaction record not found.",
      });
    }

    if (amount !== undefined) {
      const parsedAmt = Number(amount);
      if (isNaN(parsedAmt) || parsedAmt <= 0) {
        return res.status(400).json({
          message: "Transaction amount must be a valid number greater than 0.",
        });
      }
      tx.amount = Number(parsedAmt.toFixed(2));
    }

    if (type) tx.type = type;
    if (category) tx.category = category;
    if (merchantName !== undefined) {
      if (!merchantName.trim()) {
        return res.status(400).json({
          message: "Merchant or Payee name cannot be empty.",
        });
      }
      tx.merchantName = merchantName.trim();
    }
    if (description !== undefined) {
      tx.description = description && description.trim() ? description.trim() : null;
    }
    if (date) tx.date = new Date(date);
    if (status) tx.status = status;

    const updatedTx = await tx.save();

    try {
      await runAnalyticsEngine(tx.userId);
    } catch (analyticsErr) {
      console.log("Background analytics update warning:", analyticsErr.message);
    }

    res.status(200).json({
      message: "Transaction updated successfully.",
      data: updatedTx,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update transaction.",
      error: error.message,
    });
  }
};

// 4. Delete a single transaction record
exports.deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    const tx = await Transaction.findById(id);
    if (!tx) {
      return res.status(404).json({
        message: "Transaction record not found.",
      });
    }

    const ownerUserId = tx.userId;
    await Transaction.findByIdAndDelete(id);

    try {
      await runAnalyticsEngine(ownerUserId);
    } catch (analyticsErr) {
      console.log("Background analytics recalculation warning:", analyticsErr.message);
    }

    res.status(200).json({
      message: "Transaction deleted successfully.",
      deletedId: id,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete transaction.",
      error: error.message,
    });
  }
};
