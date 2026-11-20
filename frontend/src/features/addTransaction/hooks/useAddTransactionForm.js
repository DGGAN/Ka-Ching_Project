/**
 * @file frontend/src/features/addTransaction/hooks/useAddTransactionForm.js
 * @layer Feature Hook (Manual Transaction Form State & Validation)
 * @description Manages amount validation, EXPENSE/INCOME type switching, category/date modal state, and submission to POST /api/transactions.
 * @exports useAddTransactionForm
 */

import { useState } from "react";
import { playUiSound } from "../../../utils/soundEffects";
import { EXPENSE_CATEGORY_KEYS, INCOME_CATEGORY_KEYS, getCategoryMeta } from "../../../utils/categoryConfig";
import { createTransactionApi } from "../services/addTransactionService";

export function useAddTransactionForm(user, onTransactionSaved, showToast) {
  const [type, setType] = useState("EXPENSE");
  const [amount, setAmount] = useState("");
  const [amountHintError, setAmountHintError] = useState("");
  const [category, setCategory] = useState("FOOD_AND_BEVERAGE");
  const [merchant, setMerchant] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const [showCategoryPopup, setShowCategoryPopup] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  // Switch between EXPENSE and INCOME and reset default category accordingly
  const handleSwitchType = (newType) => {
    playUiSound("pop");
    setType(newType);
    setCategory(newType === "EXPENSE" ? "FOOD_AND_BEVERAGE" : "SALARY");
    setAmountHintError("");
  };

  // Validate numeric input (digits + single decimal point + max 2 decimal places)
  const handleAmountChange = (rawText) => {
    if (/[^0-9.]/.test(rawText)) {
      setAmountHintError("Only numbers and a decimal point are allowed.");
      showToast("error", "Amount: Only numbers and a decimal point are allowed.");
      return;
    }

    const parts = rawText.split(".");
    if (parts.length > 2) {
      setAmountHintError("Only one decimal point is allowed.");
      showToast("error", "Amount: Only one decimal point is allowed.");
      return;
    }

    if (parts.length === 2 && parts[1].length > 2) {
      setAmountHintError("Maximum 2 decimal places allowed (e.g. 15.90).");
      showToast("error", "Amount: Maximum 2 decimal places allowed.");
      return;
    }

    setAmountHintError("");
    setAmount(rawText);
  };

  // Validate all fields and submit transaction to backend
  const handleSaveTransaction = async () => {
    setAmountHintError("");

    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount)) {
      showToast("error", "Please enter a valid numeric amount.");
      return;
    }

    if (parsedAmount <= 0) {
      showToast("error", "Transaction amount must be greater than RM 0.00.");
      return;
    }

    if (parsedAmount > 1000000) {
      showToast("error", "Amount cannot exceed RM 1,000,000.00 per transaction.");
      return;
    }

    if (!merchant.trim()) {
      showToast("error", "Please enter a Merchant or Payee name.");
      return;
    }

    try {
      setSaving(true);

      await createTransactionApi({
        userId: user.id,
        amount: Number(parsedAmount.toFixed(2)),
        type,
        category,
        merchantName: merchant.trim(),
        description: description.trim() ? description.trim() : null,
        date: selectedDate.toISOString(),
        source: "MANUAL",
        status: "VERIFIED",
        confidenceScore: 1.0,
      });

      showToast("success", "Transaction saved successfully!");
      setTimeout(() => {
        if (typeof onTransactionSaved === "function") {
          // Pass `type` ("EXPENSE" | "INCOME") so App.js plays "expense" or "income"
          onTransactionSaved(type);
        }
      }, 450);
    } catch (error) {
      const backendMsg = error.response?.data?.message || "Failed to save transaction. Please try again.";
      showToast("error", backendMsg);
    } finally {
      setSaving(false);
    }
  };

  const activeCategoryKeys = type === "EXPENSE" ? EXPENSE_CATEGORY_KEYS : INCOME_CATEGORY_KEYS;
  const currentCategoryConfig = getCategoryMeta(category);

  return {
    type,
    amount,
    amountHintError,
    category,
    setCategory,
    merchant,
    setMerchant,
    description,
    setDescription,
    saving,
    showCategoryPopup,
    setShowCategoryPopup,
    selectedDate,
    setSelectedDate,
    showCalendarModal,
    setShowCalendarModal,
    activeCategoryKeys,
    currentCategoryConfig,
    handleSwitchType,
    handleAmountChange,
    handleSaveTransaction,
  };
}
