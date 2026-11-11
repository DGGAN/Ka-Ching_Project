/**
 * @file backend/controllers/budgetController.js
 * @layer Backend Controller (Budget CRUD & Auto Carry-Forward)
 * @description Saves per-month budget setup and returns both current month budget and full monthly history array.
 * @exports setBudget, getBudget
 */

const Budget = require("../models/Budget");
const Notification = require("../models/Notification");

exports.setBudget = async (req, res) => {
  try {
    const { userId, monthlyLimit, savingsTarget, month, year, presetId, presetName, needsPct, wantsPct, savingsPct } = req.body;

    if (!userId || monthlyLimit === undefined) {
      return res.status(400).json({
        success: false,
        message: "userId and monthlyLimit are required",
      });
    }

    const numericLimit = Number(monthlyLimit);
    if (isNaN(numericLimit) || numericLimit <= 0) {
      return res.status(400).json({
        success: false,
        message: "Monthly budget limit must be greater than RM 0.",
      });
    }

    const now = new Date();
    const targetYear = Number(year) || now.getFullYear();
    const targetMonth = Number(month) || now.getMonth() + 1;

    const budget = await Budget.findOneAndUpdate(
      { userId, year: targetYear, month: targetMonth },
      {
        userId,
        year: targetYear,
        month: targetMonth,
        monthlyLimit: numericLimit,
        savingsTarget: Number(savingsTarget) || 0,
        presetId: presetId || "50_30_20",
        presetName: presetName || "Balanced",
        needsPct: Number(needsPct) || 50,
        wantsPct: Number(wantsPct) || 30,
        savingsPct: Number(savingsPct) || 20,
      },
      { new: true, upsert: true },
    );

    await Notification.create({
      userId,
      tag: "GOAL",
      title: "Monthly Budget Updated",
      message: `Your ${budget.presetName} budget limit is set to RM ${numericLimit.toFixed(
        2,
      )} with a savings goal of RM ${Number(savingsTarget || 0).toFixed(2)}.`,
    });

    const history = await Budget.find({ userId }).sort({
      year: -1,
      month: -1,
    });

    return res.status(200).json({
      success: true,
      data: budget,
      history,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to save budget",
      error: error.message,
    });
  }
};

exports.getBudget = async (req, res) => {
  try {
    const { userId } = req.params;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    let history = await Budget.find({ userId }).sort({
      year: -1,
      month: -1,
    });

    for (const doc of history) {
      if (!doc.year || !doc.month) {
        doc.year = currentYear;
        doc.month = currentMonth;
        await doc.save();
      }
    }

    let currentBudget = history.find((b) => Number(b.year) === currentYear && Number(b.month) === currentMonth);

    // Auto carry-forward from most recent prior month if a new month has started
    if (!currentBudget && history.length > 0) {
      const latestPrior = history[0];
      const isLatestFromPast = latestPrior.year < currentYear || (latestPrior.year === currentYear && latestPrior.month < currentMonth);

      if (isLatestFromPast && latestPrior.monthlyLimit > 0) {
        currentBudget = await Budget.create({
          userId,
          year: currentYear,
          month: currentMonth,
          monthlyLimit: latestPrior.monthlyLimit,
          savingsTarget: latestPrior.savingsTarget || 0,
          presetId: latestPrior.presetId || "50_30_20",
          presetName: latestPrior.presetName || "Balanced",
          needsPct: latestPrior.needsPct || 50,
          wantsPct: latestPrior.wantsPct || 30,
          savingsPct: latestPrior.savingsPct || 20,
        });
        history = await Budget.find({ userId }).sort({
          year: -1,
          month: -1,
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: currentBudget || null,
      history,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch budget",
      error: error.message,
    });
  }
};
