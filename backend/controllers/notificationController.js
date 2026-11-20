/**
 * @file backend/controllers/notificationController.js
 * @layer Backend Controller (In-App Notifications & Real-Time Budget Alert Synchronization)
 * @description Manages fetching, marking as read, bulk clearing, and deleting user notifications, while automatically triggering smart-merged OCR notifications, large-expense TXN, GOAL, and 80%/100% budget overrun ALERT notifications without spamming.
 * @exports getNotifications, markAsRead, markAllAsRead, clearAllNotifications, deleteNotification, evaluateAndSyncBudgetAlert, triggerTransactionNotifications, triggerBudgetGoalNotification
 */

// Import Notification, Transaction, Budget models, and clean logger
const Notification = require("../models/Notification");
const Transaction = require("../models/Transaction");
const Budget = require("../models/Budget");
const logger = require("../utils/logger");

// 1. Fetch the latest 50 notifications for a user (GET /api/notifications/:userId)
exports.getNotifications = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        message: "userId parameter is required.",
      });
    }

    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 }).limit(50);

    logger.debug("NOTIF_FETCH", `Fetched ${notifications.length} notifications for userId=${userId}`);

    res.status(200).json({
      message: "Notifications fetched successfully.",
      data: notifications,
    });
  } catch (error) {
    logger.error("NOTIF_FETCH", `Failed to fetch notifications for userId=${req.params.userId}`, error);
    res.status(500).json({
      message: "Failed to fetch notifications.",
      error: error.message,
    });
  }
};

// 2. Mark a single notification as read (PUT /api/notifications/:id/read)
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: "Notification ID is required.",
      });
    }

    const notification = await Notification.findByIdAndUpdate(id, { isRead: true }, { returnDocument: "after" });

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found.",
      });
    }

    logger.debug("NOTIF_READ", `Marked notification ${id} as read`);

    res.status(200).json({
      message: "Notification marked as read.",
      data: notification,
    });
  } catch (error) {
    logger.error("NOTIF_READ", `Failed to mark notification ${req.params.id} as read`, error);
    res.status(500).json({
      message: "Failed to update notification status.",
      error: error.message,
    });
  }
};

// 3. Mark all unread notifications for a user as read (POST /api/notifications/read-all)
exports.markAllAsRead = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: "userId is required to mark all notifications as read.",
      });
    }

    await Notification.updateMany({ userId, isRead: false }, { isRead: true });

    logger.info("NOTIF_READ_ALL", `Marked all unread notifications as read for userId=${userId}`);

    res.status(200).json({
      message: "All notifications marked as read.",
    });
  } catch (error) {
    logger.error("NOTIF_READ_ALL", "Failed to clear unread notifications", error);
    res.status(500).json({
      message: "Failed to clear unread notifications.",
      error: error.message,
    });
  }
};

// 3.5. Permanently clear all notifications for a user (POST /api/notifications/clear-all)
exports.clearAllNotifications = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: "userId is required to clear all notifications.",
      });
    }

    const result = await Notification.deleteMany({ userId });

    logger.info("NOTIF_CLEAR_ALL", `Cleared ${result.deletedCount || 0} notifications for userId=${userId}`);

    res.status(200).json({
      message: "All notifications cleared successfully.",
      deletedCount: result.deletedCount || 0,
    });
  } catch (error) {
    logger.error("NOTIF_CLEAR_ALL", "Failed to clear all notifications", error);
    res.status(500).json({
      message: "Failed to clear all notifications.",
      error: error.message,
    });
  }
};

// 4. Permanently delete a single notification by ID (DELETE /api/notifications/:id)
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: "Notification ID is required.",
      });
    }

    const deleted = await Notification.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        message: "Notification not found.",
      });
    }

    logger.debug("NOTIF_DELETE", `Deleted notification ${id} ("${deleted.title}")`);

    res.status(200).json({
      message: "Notification deleted successfully.",
    });
  } catch (error) {
    logger.error("NOTIF_DELETE", `Failed to delete notification ${req.params.id}`, error);
    res.status(500).json({
      message: "Failed to delete notification.",
      error: error.message,
    });
  }
};

// 5. Internal Helper: Re-evaluate monthly budget status and upsert/clean unread ALERT notification
const evaluateAndSyncBudgetAlert = async (userId) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
  const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

  const [currentMonthBudget, latestBudgetFallback, monthExpenses] = await Promise.all([
    Budget.findOne({ userId, year: currentYear, month: currentMonth }),
    Budget.findOne({ userId }).sort({ year: -1, month: -1, updatedAt: -1 }),
    Transaction.find({
      userId,
      type: "EXPENSE",
      date: { $gte: startOfMonth, $lte: endOfMonth },
    }),
  ]);

  const userBudget = currentMonthBudget || latestBudgetFallback;
  if (!userBudget || userBudget.monthlyLimit <= 0) return;

  const totalSpent = monthExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const limit = Number(userBudget.monthlyLimit);
  const ratio = (totalSpent / limit) * 100;

  if (totalSpent > limit) {
    const nextTitle = "Monthly Budget Exceeded!";
    const nextMessage = `You have spent RM ${totalSpent.toFixed(2)}, which is RM ${(totalSpent - limit).toFixed(2)} over your RM ${limit.toFixed(2)} monthly limit.`;

    const existingAlert = await Notification.findOne({ userId, tag: "ALERT" }).sort({ createdAt: -1 });

    if (existingAlert && existingAlert.title === nextTitle && existingAlert.message === nextMessage) {
      return;
    }

    if (existingAlert) {
      existingAlert.title = nextTitle;
      existingAlert.message = nextMessage;
      existingAlert.isRead = false;
      await existingAlert.save();
    } else {
      await Notification.create({
        userId,
        title: nextTitle,
        message: nextMessage,
        tag: "ALERT",
        isRead: false,
      });
    }
    logger.info("NOTIF_ALERT", `Triggered 100%+ Budget Exceeded alert for userId=${userId} (RM ${totalSpent.toFixed(2)} / RM ${limit.toFixed(2)})`);
  } else if (ratio >= 80) {
    const nextTitle = `Approaching Budget Limit (${ratio.toFixed(0)}%)`;
    const nextMessage = `You have used RM ${totalSpent.toFixed(2)} of your RM ${limit.toFixed(2)} monthly budget. RM ${(limit - totalSpent).toFixed(2)} remaining.`;

    const existingAlert = await Notification.findOne({ userId, tag: "ALERT" }).sort({ createdAt: -1 });

    if (existingAlert && existingAlert.title === nextTitle && existingAlert.message === nextMessage) {
      return;
    }

    if (existingAlert) {
      existingAlert.title = nextTitle;
      existingAlert.message = nextMessage;
      existingAlert.isRead = false;
      await existingAlert.save();
    } else {
      await Notification.create({
        userId,
        title: nextTitle,
        message: nextMessage,
        tag: "ALERT",
        isRead: false,
      });
    }
    logger.info("NOTIF_ALERT", `Triggered ${ratio.toFixed(0)}% Budget Approaching alert for userId=${userId}`);
  } else {
    await Notification.deleteMany({ userId, tag: "ALERT", isRead: false });
  }
};

exports.evaluateAndSyncBudgetAlert = evaluateAndSyncBudgetAlert;

// 6. Internal Helper: Upsert unread OCR notification (prevents batch spam), create Large Expense TXN card, and sync Budget ALERT
exports.triggerTransactionNotifications = async (savedTx, isUpdate = false) => {
  try {
    if (!savedTx || !savedTx.userId) return;

    const isOcr = savedTx.source === "OCR";
    const amtNum = Number(savedTx.amount) || 0;
    const amtFormatted = amtNum.toFixed(2);
    const merchant = savedTx.merchantName || "Merchant";

    if (!isUpdate) {
      if (isOcr) {
        const existingUnreadOcr = await Notification.findOne({
          userId: savedTx.userId,
          tag: "OCR",
          isRead: false,
        }).sort({ createdAt: -1 });

        let nextTitle = `Receipt Scanned: ${merchant}`;
        let nextMessage = `Verified OCR expense of RM ${amtFormatted} at ${merchant} has been added to your records.`;

        if (existingUnreadOcr) {
          const batchMatch = existingUnreadOcr.title.match(/^(\d+)\s+Receipts\s+Scanned\s+\(RM\s+([0-9.]+)\s+Total\)/i);
          const singleAmtMatch = existingUnreadOcr.message.match(/RM\s+([0-9.]+)/i);

          const prevCount = batchMatch ? parseInt(batchMatch[1], 10) : 1;
          const prevTotal = batchMatch ? parseFloat(batchMatch[2]) : singleAmtMatch ? parseFloat(singleAmtMatch[1]) : 0;

          const newCount = prevCount + 1;
          const newTotal = (prevTotal + amtNum).toFixed(2);

          nextTitle = `${newCount} Receipts Scanned (RM ${newTotal} Total)`;
          nextMessage = `Latest: RM ${amtFormatted} at ${merchant}. ${newCount} verified OCR receipts (RM ${newTotal} total) have been added to your records.`;
        }

        await Notification.findOneAndUpdate(
          { userId: savedTx.userId, tag: "OCR", isRead: false },
          {
            userId: savedTx.userId,
            title: nextTitle,
            message: nextMessage,
            tag: "OCR",
            isRead: false,
          },
          { upsert: true, returnDocument: "after", sort: { createdAt: -1 } },
        );
      } else if (savedTx.type === "EXPENSE" && amtNum >= 100) {
        await Notification.create({
          userId: savedTx.userId,
          title: `Large Expense Logged: RM ${amtFormatted}`,
          message: `You recorded an expense of RM ${amtFormatted} at ${merchant}.`,
          tag: "TXN",
        });
      }
    }

    await evaluateAndSyncBudgetAlert(savedTx.userId);
  } catch (error) {
    logger.warn("NOTIF_TRIGGER", "Auto-notification trigger warning", error.message);
  }
};

// 7. Internal Helper: Upsert GOAL notification and re-evaluate Budget ALERT when budget is changed
exports.triggerBudgetGoalNotification = async (userId, monthlyLimit, savingsTarget, presetName = "Balanced") => {
  try {
    if (!userId || monthlyLimit === undefined) return;

    await Notification.findOneAndUpdate(
      { userId, tag: "GOAL", isRead: false },
      {
        userId,
        title: "Monthly Budget Updated",
        message: `Your ${presetName} budget limit is set to RM ${Number(monthlyLimit).toFixed(2)} with a savings goal of RM ${Number(savingsTarget || 0).toFixed(2)}.`,
        tag: "GOAL",
        isRead: false,
      },
      { upsert: true, returnDocument: "after", sort: { createdAt: -1 } },
    );

    await evaluateAndSyncBudgetAlert(userId);
  } catch (error) {
    logger.warn("NOTIF_TRIGGER", "Budget notification trigger warning", error.message);
  }
};
