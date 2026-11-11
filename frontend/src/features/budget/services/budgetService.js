/**
 * @file frontend/src/features/budget/services/budgetService.js
 * @layer Service (API Communication)
 * @description Handles GET /api/budgets/:userId + GET /api/transactions/:userId and POST /api/budgets.
 * @exports fetchBudgetData, saveMonthlyBudget
 */

import apiClient from "../../../api/apiClient";

export const fetchBudgetData = async (userId) => {
  const [txRes, budgetRes] = await Promise.all([apiClient.get(`/transactions/${userId}`), apiClient.get(`/budgets/${userId}`)]);

  return {
    transactions: txRes.data?.data || [],
    currentBudget: budgetRes.data?.data || null,
    historyList: budgetRes.data?.history || [],
  };
};

export const saveMonthlyBudget = async (payload) => {
  const response = await apiClient.post("/budgets", payload);
  return response.data?.data;
};
