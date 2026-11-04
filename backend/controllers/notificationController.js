// Import Notification, Transaction, and Budget models
const Notification = require("../models/Notification");
const Transaction = require("../models/Transaction");
const Budget = require("../models/Budget");

// GET /api/notifications/:userId - Fetch the latest 50 notifications for a user (newest first)
exports.getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.params.userId }).sort({ createdAt: -1 }).limit(50);

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

// PUT /api/notifications/:id/read - Mark a single notification as read when tapped
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });

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

// POST /api/notifications/read-all - Mark all unread notifications for a user as read
exports.markAllAsRead = async (req, res) => {
  try {
    const { userId } = req.body;
    await Notification.updateMany({ userId, isRead: false }, { isRead: true });

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

// DELETE /api/notifications/:id - Permanently remove a single notification item
exports.deleteNotification = async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);

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

// Internal Helper 1: Automatically create TXN / OCR / ALERT notifications when a transaction is saved
exports.triggerTransactionNotifications = async (savedTx) => {
  try {
    if (!savedTx || !savedTx.userId) return;

    const isOcr = savedTx.source === "OCR";
    const amtFormatted = Number(savedTx.amount).toFixed(2);
    const merchant = savedTx.merchantName || "Merchant";

    // 1. Create a receipt OCR notification or a large transaction notification (>= RM 100)
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

    // 2. Check if current month's spending has crossed 80% or 100% of the user's monthly budget
    if (savedTx.type === "EXPENSE") {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      const [userBudget, monthExpenses] = await Promise.all([
        Budget.findOne({ userId: savedTx.userId }).sort({ updatedAt: -1 }),
        Transaction.find({
          userId: savedTx.userId,
          type: "EXPENSE",
          date: { $gte: startOfMonth, $lte: endOfMonth },
        }),
      ]);

      if (userBudget && userBudget.monthlyLimit > 0) {
        const totalSpent = monthExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
        const limit = Number(userBudget.monthlyLimit);
        const ratio = (totalSpent / limit) * 100;

        if (totalSpent > limit) {
          await Notification.create({
            userId: savedTx.userId,
            title: "Monthly Budget Exceeded!",
            message: `You have spent RM ${totalSpent.toFixed(2)}, which is RM ${(totalSpent - limit).toFixed(2)} over your RM ${limit.toFixed(0)} monthly limit.`,
            tag: "ALERT",
          });
        } else if (ratio >= 80) {
          await Notification.create({
            userId: savedTx.userId,
            title: `Approaching Budget Limit (${ratio.toFixed(0)}%)`,
            message: `You have used RM ${totalSpent.toFixed(2)} of your RM ${limit.toFixed(0)} monthly budget. RM ${(limit - totalSpent).toFixed(2)} remaining.`,
            tag: "ALERT",
          });
        }
      }
    }
  } catch (error) {
    console.log("Auto-notification trigger error:", error.message);
  }
};

// Internal Helper 2: Automatically create a GOAL notification when the user saves or applies a budget
exports.triggerBudgetGoalNotification = async (userId, monthlyLimit, savingsTarget) => {
  try {
    await Notification.create({
      userId,
      title: "Monthly Budget Goal Updated",
      message: `Your monthly spending limit is set to RM ${Number(monthlyLimit).toFixed(0)} with a savings target of RM ${Number(savingsTarget || 0).toFixed(0)}.`,
      tag: "GOAL",
    });
  } catch (error) {
    console.log("Budget notification trigger error:", error.message);
  }
};
