// Import the Transaction model, AI analytics engine, and notification trigger helper
const Transaction = require("../models/Transaction");
const { runAnalyticsEngine } = require("./analyticsController");
const { triggerTransactionNotifications } = require("./notificationController");

// 1. Create a new manual or OCR transaction (POST /api/transactions)
exports.createTransaction = async (req, res) => {
  try {
    // Step 1: Destructure transaction parameters from request body
    const { userId, amount, type, category, merchantName, description, date, source, status, confidenceScore } = req.body;

    // Validation 1: Check mandatory fields (userId, amount, type, and category are required)
    if (!userId || amount === undefined || !type || !category) {
      return res.status(400).json({
        message: "Missing required fields: userId, amount, type, and category are mandatory.",
      });
    }

    // Step 2: Parse numeric amount and confidence score
    const parsedAmount = Number(amount);
    const parsedConfidence = confidenceScore !== undefined ? Number(confidenceScore) : 1.0;

    // Validation 2: Ensure transaction amount is a valid number greater than RM 0
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        message: "Transaction amount must be a valid number greater than RM 0.00.",
      });
    }

    // Validation 3: Ensure transaction amount does not exceed RM 1,000,000 per entry
    if (parsedAmount > 1000000) {
      return res.status(400).json({
        message: "Transaction amount cannot exceed RM 1,000,000.00.",
      });
    }

    // Validation 4: Ensure transaction type is strictly EXPENSE or INCOME
    if (!["EXPENSE", "INCOME"].includes(type)) {
      return res.status(400).json({
        message: "Invalid transaction type. Must be EXPENSE or INCOME.",
      });
    }

    // Step 3: Instantiate and save the new transaction document in MongoDB
    const newTransaction = new Transaction({
      userId,
      amount: Number(parsedAmount.toFixed(2)),
      type,
      category,
      merchantName: merchantName ? merchantName.trim() : "General",
      description: description ? description.trim() : null,
      date: date ? new Date(date) : new Date(),
      source: source || "MANUAL",
      status: status || "VERIFIED",
      confidenceScore: parsedConfidence,
    });

    const savedTransaction = await newTransaction.save();

    // Step 4: Trigger AI analytics engine to recalculate linear regression forecast
    try {
      await runAnalyticsEngine(userId);
    } catch (analyticsErr) {
      console.log("Background analytics update warning:", analyticsErr.message);
    }

    // Step 5: Trigger automatic TXN, OCR, or Budget Overrun (80% / 100%) notifications
    try {
      await triggerTransactionNotifications(savedTransaction);
    } catch (notifyErr) {
      console.log("Background notification trigger warning:", notifyErr.message);
    }

    // Step 6: Return HTTP 201 Created response with saved transaction
    res.status(201).json({
      message: "Transaction created successfully.",
      data: savedTransaction,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create transaction.",
      error: error.message,
    });
  }
};

// 2. Fetch transactions for a user with multi-filters and pagination (GET /api/transactions/:userId)
exports.getUserTransactions = async (req, res) => {
  try {
    // Step 1: Extract userId from route params and filter criteria from query string
    const { userId } = req.params;
    const { page, limit, type, category, search, period, monthKey } = req.query;

    // Validation 1: Ensure userId parameter is provided
    if (!userId) {
      return res.status(400).json({
        message: "userId parameter is required.",
      });
    }

    // Step 2: Build base MongoDB filter object
    const query = { userId };

    if (type && type !== "ALL") {
      query.type = type;
    }

    if (category && category !== "ALL") {
      query.category = category;
    }

    if (search && search.trim() !== "") {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [{ merchantName: regex }, { description: regex }, { category: regex }];
    }

    // Step 3: Apply date range filters (specific YYYY-MM monthKey or preset period)
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
        const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 0, 0, 0);
        query.date = { $gte: sevenDaysAgo, $lte: now };
      } else if (period === "THIS_MONTH") {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        query.date = { $gte: startOfMonth, $lte: now };
      } else if (period === "THIS_YEAR") {
        const startOfYear = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
        query.date = { $gte: startOfYear, $lte: now };
      }
    }

    // Step 4: If page and limit are provided, execute paginated query for FlatList lazy loading
    if (page && limit) {
      const pageNum = Math.max(1, parseInt(page, 10));
      const limitNum = Math.max(1, parseInt(limit, 10));
      const skipCount = (pageNum - 1) * limitNum;

      const [items, totalCount] = await Promise.all([
        Transaction.find(query).sort({ date: -1, createdAt: -1 }).skip(skipCount).limit(limitNum),
        Transaction.countDocuments(query),
      ]);

      return res.status(200).json({
        message: "Paginated transactions fetched successfully.",
        data: items,
        page: pageNum,
        limit: limitNum,
        totalCount,
        hasMore: skipCount + items.length < totalCount,
      });
    }

    // Step 5: Otherwise return full matching transaction list sorted newest first
    const transactions = await Transaction.find(query).sort({
      date: -1,
      createdAt: -1,
    });

    res.status(200).json({
      message: "Transactions fetched successfully.",
      data: transactions,
      totalCount: transactions.length,
      hasMore: false,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch transactions.",
      error: error.message,
    });
  }
};

// 3. Update an existing transaction by ID (PUT /api/transactions/:id)
exports.updateTransaction = async (req, res) => {
  try {
    // Step 1: Extract transaction ID from params and updated fields from request body
    const { id } = req.params;
    const { amount, type, category, merchantName, description, date, status } = req.body;

    // Validation 1: Ensure transaction ID is provided
    if (!id) {
      return res.status(400).json({
        message: "Transaction ID is required.",
      });
    }

    // Validation 2: If amount is being updated, ensure it is a valid number > RM 0
    const updateFields = {};
    if (amount !== undefined) {
      const parsedAmount = Number(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({
          message: "Updated amount must be a valid number greater than RM 0.00.",
        });
      }
      updateFields.amount = Number(parsedAmount.toFixed(2));
    }

    // Step 2: Populate remaining fields to update
    if (type !== undefined) updateFields.type = type;
    if (category !== undefined) updateFields.category = category;
    if (merchantName !== undefined) updateFields.merchantName = merchantName.trim();
    if (description !== undefined) updateFields.description = description;
    if (date !== undefined) updateFields.date = new Date(date);
    if (status !== undefined) updateFields.status = status;

    // Step 3: Execute findByIdAndUpdate in MongoDB
    const updatedTransaction = await Transaction.findByIdAndUpdate(id, updateFields, { new: true, runValidators: true });

    // Validation 3: Check if the transaction document existed
    if (!updatedTransaction) {
      return res.status(404).json({
        message: "Transaction not found.",
      });
    }

    // Step 4: Re-run AI analytics engine for the owner of this transaction
    try {
      await runAnalyticsEngine(updatedTransaction.userId);
    } catch (analyticsErr) {
      console.log("Background analytics update warning:", analyticsErr.message);
    }

    // Step 5: Return updated transaction document
    res.status(200).json({
      message: "Transaction updated successfully.",
      data: updatedTransaction,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update transaction.",
      error: error.message,
    });
  }
};

// 4. Delete a transaction permanently by ID (DELETE /api/transactions/:id)
exports.deleteTransaction = async (req, res) => {
  try {
    // Step 1: Extract transaction ID from route parameters
    const { id } = req.params;

    // Validation 1: Ensure transaction ID is provided
    if (!id) {
      return res.status(400).json({
        message: "Transaction ID is required.",
      });
    }

    // Step 2: Delete transaction document from MongoDB
    const deletedTransaction = await Transaction.findByIdAndDelete(id);

    // Validation 2: Ensure transaction existed before deletion
    if (!deletedTransaction) {
      return res.status(404).json({
        message: "Transaction not found.",
      });
    }

    // Step 3: Re-run AI analytics engine after deletion to refresh forecasts
    try {
      await runAnalyticsEngine(deletedTransaction.userId);
    } catch (analyticsErr) {
      console.log("Background analytics update warning:", analyticsErr.message);
    }

    // Step 4: Return deletion confirmation
    res.status(200).json({
      message: "Transaction deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete transaction.",
      error: error.message,
    });
  }
};
