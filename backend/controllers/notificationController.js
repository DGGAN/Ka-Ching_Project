// Import Notification, Transaction, and Budget models
const Notification = require("../models/Notification");
const Transaction = require("../models/Transaction");
const Budget = require("../models/Budget");

// 1. Fetch the latest 50 notifications for a specific user (GET /api/notifications/:userId)
exports.getUserNotifications = async (req, res) => {
  try {
    // Step 1: Extract userId from route parameters
    const { userId } = req.params;

    // Validation 1: Ensure userId parameter is provided
    if (!userId) {
      return res.status(400).json({
        message: "userId parameter is required.",
      });
    }

    // Step 2: Query latest 50 notifications sorted newest-first
    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 }).limit(50);

    // Step 3: Return notifications list
    res.status(200).json({
      message: "Notifications fetched successfully.",
      data: notifications,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch notifications.",
      error: error.message,
    });
  }
};

// 2. Mark a single notification as read (PUT /api/notifications/:id/read)
exports.markAsRead = async (req, res) => {
  try {
    // Step 1: Extract notification ID from route parameters
    const { id } = req.params;

    // Validation 1: Ensure notification ID is provided
    if (!id) {
      return res.status(400).json({
        message: "Notification ID is required.",
      });
    }

    // Step 2: Update isRead flag to true in MongoDB
    const notification = await Notification.findByIdAndUpdate(id, { isRead: true }, { new: true });

    // Validation 2: Check if the notification document exists
    if (!notification) {
      return res.status(404).json({
        message: "Notification not found.",
      });
    }

    // Step 3: Return updated notification document
    res.status(200).json({
      message: "Notification marked as read.",
      data: notification,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update notification status.",
      error: error.message,
    });
  }
};

// 3. Mark all unread notifications for a user as read (POST /api/notifications/read-all)
exports.markAllAsRead = async (req, res) => {
  try {
    // Step 1: Extract userId from request body
    const { userId } = req.body;

    // Validation 1: Ensure userId is provided in request body
    if (!userId) {
      return res.status(400).json({
        message: "userId is required to mark all notifications as read.",
      });
    }

    // Step 2: Update all unread notifications for this user in bulk
    await Notification.updateMany({ userId, isRead: false }, { isRead: true });

    // Step 3: Return confirmation response
    res.status(200).json({
      message: "All notifications marked as read.",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to clear unread notifications.",
      error: error.message,
    });
  }
};

// 4. Permanently delete a single notification by ID (DELETE /api/notifications/:id)
exports.deleteNotification = async (req, res) => {
  try {
    // Step 1: Extract notification ID from route parameters
    const { id } = req.params;

    // Validation 1: Ensure notification ID is provided
    if (!id) {
      return res.status(400).json({
        message: "Notification ID is required.",
      });
    }

    // Step 2: Delete notification from MongoDB
    const deleted = await Notification.findByIdAndDelete(id);

    // Validation 2: Ensure notification existed
    if (!deleted) {
      return res.status(404).json({
        message: "Notification not found.",
      });
    }

    // Step 3: Return success response
    res.status(200).json({
      message: "Notification deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete notification.",
      error: error.message,
    });
  }
};

// 5. Internal Helper: Re-evaluate monthly budget status and upsert/clean unread ALERT notification
const evaluateAndSyncBudgetAlert = async (userId) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [userBudget, monthExpenses] = await Promise.all([
    Budget.findOne({ userId }).sort({ updatedAt: -1 }),
    Transaction.find({
      userId,
      type: "EXPENSE",
      date: { $gte: startOfMonth, $lte: endOfMonth },
    }),
  ]);

  if (!userBudget || userBudget.monthlyLimit <= 0) return;

  const totalSpent = monthExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const limit = Number(userBudget.monthlyLimit);
  const ratio = (totalSpent / limit) * 100;

  if (totalSpent > limit) {
    // Upsert unread ALERT notification with latest overrun numbers instead of creating duplicates
    await Notification.findOneAndUpdate(
      { userId, tag: "ALERT", isRead: false },
      {
        userId,
        title: "Monthly Budget Exceeded!",
        message: `You have spent RM ${totalSpent.toFixed(2)}, which is RM ${(totalSpent - limit).toFixed(2)} over your RM ${limit.toFixed(0)} monthly limit.`,
        tag: "ALERT",
        isRead: false,
      },
      { upsert: true, new: true, sort: { createdAt: -1 } },
    );
  } else if (ratio >= 80) {
    // Upsert unread ALERT notification with latest 80%+ warning numbers
    await Notification.findOneAndUpdate(
      { userId, tag: "ALERT", isRead: false },
      {
        userId,
        title: `Approaching Budget Limit (${ratio.toFixed(0)}%)`,
        message: `You have used RM ${totalSpent.toFixed(2)} of your RM ${limit.toFixed(0)} monthly budget. RM ${(limit - totalSpent).toFixed(2)} remaining.`,
        tag: "ALERT",
        isRead: false,
      },
      { upsert: true, new: true, sort: { createdAt: -1 } },
    );
  } else {
    // If user raised their budget or edited/deleted an expense and is now safely < 80%, remove outdated unread ALERT
    await Notification.deleteMany({ userId, tag: "ALERT", isRead: false });
  }
};

// 6. Internal Helper: Create TXN / OCR notification and sync Budget ALERT when transaction changes
exports.triggerTransactionNotifications = async (savedTx, isUpdate = false) => {
  try {
    // Validation 1: Ensure valid transaction document with userId
    if (!savedTx || !savedTx.userId) return;

    const isOcr = savedTx.source === "OCR";
    const amtFormatted = Number(savedTx.amount).toFixed(2);
    const merchant = savedTx.merchantName || "Merchant";

    // Step 1: Only create new OCR or Large Expense TXN card on new creation (not on minor edits)
    if (!isUpdate) {
      if (isOcr) {
        await Notification.create({
          userId: savedTx.userId,
          title: `Receipt Scanned: ${merchant}`,
          message: `Verified OCR expense of RM ${amtFormatted} at ${merchant} has been added to your records.`,
          tag: "OCR",
        });
      } else if (savedTx.type === "EXPENSE" && Number(savedTx.amount) >= 100) {
        await Notification.create({
          userId: savedTx.userId,
          title: `Large Expense Logged: RM ${amtFormatted}`,
          message: `You recorded an expense of RM ${amtFormatted} at ${merchant}.`,
          tag: "TXN",
        });
      }
    }

    // Step 2: Re-evaluate and update the monthly budget ALERT status
    await evaluateAndSyncBudgetAlert(savedTx.userId);
  } catch (error) {
    console.log("Auto-notification trigger error:", error.message);
  }
};

// 7. Internal Helper: Upsert GOAL notification and re-evaluate Budget ALERT when budget is changed
exports.triggerBudgetGoalNotification = async (userId, monthlyLimit, savingsTarget) => {
  try {
    // Validation 1: Ensure userId and monthlyLimit are valid
    if (!userId || monthlyLimit === undefined) return;

    // Step 1: Update existing unread GOAL notification if present, otherwise create a new one
    await Notification.findOneAndUpdate(
      { userId, tag: "GOAL", isRead: false },
      {
        userId,
        title: "Monthly Budget Goal Updated",
        message: `Your monthly spending limit is set to RM ${Number(monthlyLimit).toFixed(0)} with a savings target of RM ${Number(savingsTarget || 0).toFixed(0)}.`,
        tag: "GOAL",
        isRead: false,
      },
      { upsert: true, new: true, sort: { createdAt: -1 } },
    );

    // Step 2: Immediately re-check whether the new budget limit triggers or clears an 80%/100% ALERT
    await evaluateAndSyncBudgetAlert(userId);
  } catch (error) {
    console.log("Budget notification trigger error:", error.message);
  }
};
