/**
 * @file backend/controllers/transactionController.js
 * @layer Backend Controller (Transaction CRUD + Smart Notification Auto-Capture & 4-Tier Categorizer)
 * @description Manages manual and OCR transaction creation, multi-filter paginated retrieval, updates, deletions, PDPA opt-in auto-capture toggles, and background payment notification ingestion via the shared 4-Tier merchantCategorizer engine.
 * @exports createTransaction, getTransactions, updateTransaction, deleteTransaction, getAutoCaptureStatus, toggleAutoCaptureSetting, autoCaptureNotification
 */

// Import the Transaction model, AI analytics engine, notification trigger helpers, and clean logger
const Transaction = require("../models/Transaction");
const { runAnalyticsEngine } = require("./analyticsController");
const { triggerTransactionNotifications, evaluateAndSyncBudgetAlert } = require("./notificationController");
const logger = require("../utils/logger");

// 1. Create a new manual or OCR transaction (POST /api/transactions)
exports.createTransaction = async (req, res) => {
  try {
    // Step 1: Destructure transaction parameters from request body
    const { userId, amount, type, category, merchantName, description, date, source, status, confidenceScore } = req.body;

    // Validation 1: Check mandatory fields (userId, amount, type, and category are required)
    if (!userId || amount === undefined || !type || !category) {
      logger.warn("TX_CREATE", "Blocked createTransaction: Missing required fields", {
        userId,
        amount,
        type,
        category,
      });
      return res.status(400).json({
        message: "Missing required fields: userId, amount, type, and category are mandatory.",
      });
    }

    // Step 2: Parse numeric amount and confidence score
    const parsedAmount = Number(amount);
    const parsedConfidence = confidenceScore !== undefined ? Number(confidenceScore) : 1.0;

    // Validation 2: Ensure transaction amount is a valid number greater than RM 0
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      logger.warn("TX_CREATE", `Blocked createTransaction: Invalid amount (${amount})`);
      return res.status(400).json({
        message: "Transaction amount must be a valid number greater than RM 0.00.",
      });
    }

    // Validation 3: Ensure transaction amount does not exceed RM 1,000,000 per entry
    if (parsedAmount > 1000000) {
      logger.warn("TX_CREATE", `Blocked createTransaction: Amount exceeds RM 1,000,000 (${parsedAmount})`);
      return res.status(400).json({
        message: "Transaction amount cannot exceed RM 1,000,000.00.",
      });
    }

    // Validation 4: Ensure transaction type is strictly EXPENSE or INCOME
    if (!["EXPENSE", "INCOME"].includes(type)) {
      logger.warn("TX_CREATE", `Blocked createTransaction: Invalid transaction type (${type})`);
      return res.status(400).json({
        message: "Invalid transaction type. Must be EXPENSE or INCOME.",
      });
    }

    // Auto-map 50/30/20 budgetType (NEEDS / WANTS / NONE) for manual & OCR transactions
    const resolvedBudgetType = type === "EXPENSE" ? Transaction.BUDGET_TYPE_MAP?.[category] || "WANTS" : "NONE";

    // Step 3: Instantiate and save the new transaction document in MongoDB
    const newTransaction = new Transaction({
      userId,
      amount: Number(parsedAmount.toFixed(2)),
      type,
      category,
      budgetType: resolvedBudgetType,
      merchantName: merchantName ? merchantName.trim() : "General",
      description: description ? description.trim() : null,
      date: date ? new Date(date) : new Date(),
      source: source || "MANUAL",
      status: status || "VERIFIED",
      confidenceScore: parsedConfidence,
    });

    const savedTransaction = await newTransaction.save();

    logger.info(
      "TX_CREATE",
      `Created ${savedTransaction.type} (${savedTransaction.source}) -> Merchant: "${savedTransaction.merchantName}", Amount: RM ${savedTransaction.amount.toFixed(2)}, Category: ${savedTransaction.category} (${savedTransaction.budgetType})`,
    );

    // Step 4: Trigger AI analytics engine to recalculate linear regression forecast
    try {
      await runAnalyticsEngine(userId);
    } catch (analyticsErr) {
      logger.warn("TX_CREATE", "Background analytics update warning", analyticsErr.message);
    }

    // Step 5: Trigger automatic TXN, smart-merged OCR, or Budget Overrun (80% / 100%) notifications
    try {
      await triggerTransactionNotifications(savedTransaction, false);
    } catch (notifyErr) {
      logger.warn("TX_CREATE", "Background notification trigger warning", notifyErr.message);
    }

    // Step 6: Return HTTP 201 Created response with saved transaction
    res.status(201).json({
      message: "Transaction created successfully.",
      data: savedTransaction,
    });
  } catch (error) {
    logger.error("TX_CREATE", "Failed to create transaction", error);
    res.status(500).json({
      message: "Failed to create transaction.",
      error: error.message,
    });
  }
};

// 2. Fetch transactions with multi-filters and pagination (GET /api/transactions/:userId)
exports.getTransactions = async (req, res) => {
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
      const catList = String(category)
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
      query.category = catList.length > 1 ? { $in: catList } : catList[0];
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

      logger.debug("TX_FETCH", `Fetched page ${pageNum} (${items.length}/${totalCount} records) for userId=${userId}`);

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

    logger.debug("TX_FETCH", `Fetched ${transactions.length} transactions for userId=${userId}`);

    res.status(200).json({
      message: "Transactions fetched successfully.",
      data: transactions,
      totalCount: transactions.length,
      hasMore: false,
    });
  } catch (error) {
    logger.error("TX_FETCH", "Failed to fetch transactions", error);
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

    // Step 3: Execute findByIdAndUpdate in MongoDB using returnDocument: 'after'
    const updatedTransaction = await Transaction.findByIdAndUpdate(id, updateFields, {
      returnDocument: "after",
      runValidators: true,
    });

    // Validation 3: Check if the transaction document existed
    if (!updatedTransaction) {
      return res.status(404).json({
        message: "Transaction not found.",
      });
    }

    logger.info(
      "TX_UPDATE",
      `Updated transaction ${id} -> Merchant: "${updatedTransaction.merchantName}", Amount: RM ${updatedTransaction.amount.toFixed(2)}, Category: ${updatedTransaction.category}`,
    );

    // Step 4: Re-run AI analytics engine and sync budget alert notifications
    try {
      await runAnalyticsEngine(updatedTransaction.userId);
      await triggerTransactionNotifications(updatedTransaction, true);
    } catch (bgErr) {
      logger.warn("TX_UPDATE", "Background update sync warning", bgErr.message);
    }

    // Step 5: Return updated transaction document
    res.status(200).json({
      message: "Transaction updated successfully.",
      data: updatedTransaction,
    });
  } catch (error) {
    logger.error("TX_UPDATE", `Failed to update transaction ${req.params.id}`, error);
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

    logger.info("TX_DELETE", `Deleted transaction ${id} ("${deletedTransaction.merchantName}", RM ${Number(deletedTransaction.amount).toFixed(2)})`);

    // Step 3: Re-run AI analytics engine and sync budget alert notifications after deletion
    try {
      await runAnalyticsEngine(deletedTransaction.userId);
      await triggerTransactionNotifications(deletedTransaction, true);
    } catch (bgErr) {
      logger.warn("TX_DELETE", "Background delete sync warning", bgErr.message);
    }

    // Step 4: Return deletion confirmation
    res.status(200).json({
      message: "Transaction deleted successfully.",
    });
  } catch (error) {
    logger.error("TX_DELETE", `Failed to delete transaction ${req.params.id}`, error);
    res.status(500).json({
      message: "Failed to delete transaction.",
      error: error.message,
    });
  }
};

// ============================================================================
// SMART NOTIFICATION AUTO-CAPTURE (Uses Shared 4-Tier merchantCategorizer.js)
// ============================================================================
const User = require("../models/User");
const Notification = require("../models/Notification");
const { parsePaymentNotificationText } = require("../utils/merchantCategorizer");

exports.getAutoCaptureStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      logger.warn("AUTO_CAPTURE", `getAutoCaptureStatus: User not found for userId=${userId}`);
      return res.status(404).json({ success: false, message: "User not found." });
    }
    logger.debug("AUTO_CAPTURE", `Fetched status for ${user.email} -> autoCaptureEnabled=${Boolean(user.autoCaptureEnabled)}`);
    return res.status(200).json({
      success: true,
      autoCaptureEnabled: Boolean(user.autoCaptureEnabled),
    });
  } catch (error) {
    logger.error("AUTO_CAPTURE", "Failed to fetch auto-capture status", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch auto-capture status.",
      error: error.message,
    });
  }
};

exports.toggleAutoCaptureSetting = async (req, res) => {
  try {
    const { userId } = req.params;
    const { enabled } = req.body;

    const user = await User.findByIdAndUpdate(userId, { autoCaptureEnabled: Boolean(enabled) }, { new: true });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    logger.info("AUTO_CAPTURE", `User ${user.email} toggled Smart Auto-Capture -> ${user.autoCaptureEnabled ? "ENABLED" : "DISABLED"}`);

    return res.status(200).json({
      success: true,
      autoCaptureEnabled: Boolean(user.autoCaptureEnabled),
      message: user.autoCaptureEnabled ? "Smart Auto-Capture is now ENABLED." : "Smart Auto-Capture is now DISABLED.",
    });
  } catch (error) {
    logger.error("AUTO_CAPTURE", "Failed to toggle auto-capture setting", error);
    return res.status(500).json({
      success: false,
      message: "Failed to toggle auto-capture setting.",
      error: error.message,
    });
  }
};

exports.autoCaptureNotification = async (req, res) => {
  try {
    // Support both standard JSON body AND query/form parameters
    let userId = req.body?.userId || req.query?.userId;
    const title = String(req.body?.title || req.query?.title || "").trim();
    const text = String(req.body?.text || req.query?.text || "").trim();
    const packageName = String(req.body?.packageName || req.query?.packageName || "").trim();
    const platform = req.body?.platform || req.query?.platform || "ANDROID_LISTENER";

    // 1. Concise INFO milestone (always visible even if DEBUG_LOGS=false)
    logger.info("AUTO_CAPTURE_HIT", `Incoming [${platform}] userId="${userId}" pkg="${packageName}" title="${title}" text="${text.slice(0, 140)}"`);

    // 2. Full raw payload dump for DEBUG_LOGS=true
    logger.debug("AUTO_CAPTURE_PAYLOAD", "Full incoming notification payload:", {
      userId,
      title,
      text,
      packageName,
      platform,
    });

    if (!text && !title) {
      logger.warn("AUTO_CAPTURE", "Rejected: notification text and title are both empty");
      return res.status(400).json({
        success: false,
        message: "Notification text is required.",
      });
    }

    // GATE 1: Resolve User & Verify opt-in consent (PDPA 2010 Privacy Gatekeeper)
    let user = null;
    if (userId && userId !== "AUTO_ACTIVE_USER" && /^[0-9a-fA-F]{24}$/.test(String(userId))) {
      user = await User.findById(userId);
    }
    if (!user) {
      user = await User.findOne({ autoCaptureEnabled: true }).sort({ updatedAt: -1 });
      if (user) {
        userId = String(user._id);
        logger.debug("AUTO_CAPTURE", `Resolved active auto-capture user -> ${user.email} (${userId})`);
      }
    }

    if (!user) {
      logger.warn("AUTO_CAPTURE", `No user found with autoCaptureEnabled=true (requested userId=${userId})`);
      return res.status(404).json({
        success: false,
        message: "User not found or Auto-Capture is not enabled on any account.",
      });
    }
    if (!user.autoCaptureEnabled) {
      logger.warn("AUTO_CAPTURE", `Blocked notification for ${user.email}: autoCaptureEnabled is FALSE in MongoDB`);
      return res.status(403).json({
        success: false,
        autoCaptureEnabled: false,
        message: "Auto-Capture is currently DISABLED in your Profile settings. Enable it first to capture payment notifications.",
      });
    }

    // GATE 2: Parse notification & classify category via shared 4-Tier engine
    const parsed = await parsePaymentNotificationText({
      userId,
      title,
      text: text || title,
      packageName,
    });
    if (!parsed) {
      logger.debug("AUTO_CAPTURE", `Ignored notification (no valid RM payment amount detected): "${title} | ${text}"`);
      return res.status(422).json({
        success: false,
        message: "No valid RM payment amount detected in notification text.",
      });
    }

    // GATE 3: 60-Second Idempotency Guard against duplicate OS notification broadcasts
    const sixtySecondsAgo = new Date(Date.now() - 60 * 1000);
    const duplicate = await Transaction.findOne({
      userId,
      amount: parsed.amount,
      merchantName: parsed.merchantName,
      createdAt: { $gte: sixtySecondsAgo },
    });

    if (duplicate) {
      logger.debug("AUTO_CAPTURE", `Skipped duplicate notification within 60s: ${parsed.merchantName} (RM ${parsed.amount})`);
      return res.status(200).json({
        success: true,
        duplicateSkipped: true,
        data: duplicate,
        message: "Duplicate notification ignored (already logged within 60s).",
      });
    }

    // STEP 4: Create verified transaction with source: "NOTIFICATION"
    const now = new Date();
    const newTx = await Transaction.create({
      userId,
      amount: parsed.amount,
      type: parsed.type,
      category: parsed.category,
      budgetType: parsed.budgetType,
      merchantName: parsed.merchantName,
      description: `Auto-captured via ${platform === "IOS_27_SHORTCUT" ? "iOS 27 Shortcut" : parsed.sourceApp}`,
      date: now,
      source: "NOTIFICATION",
      status: "VERIFIED",
      confidenceScore: 0.98,
    });

    logger.info(
      "AUTO_CAPTURE",
      `Auto-captured ${parsed.type} -> Merchant: "${parsed.merchantName}", Amount: RM ${parsed.amount.toFixed(2)}, Category: ${parsed.category} (${parsed.matchedTier})`,
    );

    // STEP 5: Upsert/Create Auto-Capture TXN notification, sync AI analytics, and upsert Budget ALERT (no duplicate ALERT spam)
    try {
      await Notification.findOneAndUpdate(
        { userId, tag: "TXN", isRead: false, title: /^Auto-Captured:/i },
        {
          userId,
          tag: "TXN",
          title: `Auto-Captured: ${parsed.merchantName}`,
          message: `${parsed.sourceApp} payment of RM ${parsed.amount.toFixed(2)} (${parsed.category.replace(/_/g, " ")}) was automatically logged.`,
          isRead: false,
        },
        { upsert: true, returnDocument: "after", sort: { createdAt: -1 } },
      );

      await runAnalyticsEngine(userId);
      await evaluateAndSyncBudgetAlert(userId);
    } catch (nonCriticalErr) {
      logger.warn("AUTO_CAPTURE", "Auto-capture notification notice", nonCriticalErr.message);
    }

    return res.status(201).json({
      success: true,
      data: newTx,
      matchedTier: parsed.matchedTier,
      message: `Auto-captured RM ${parsed.amount.toFixed(2)} at ${parsed.merchantName} (${parsed.category.replace(/_/g, " ")})!`,
    });
  } catch (error) {
    logger.error("AUTO_CAPTURE", "Failed to process auto-captured notification", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process auto-captured notification.",
      error: error.message,
    });
  }
};
