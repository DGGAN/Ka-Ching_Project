/**
 * @file frontend/src/features/budget/services/budgetService.js
 * @layer Service (API Communication — 100% Original Budget Logic)
 * @description Fetches user transactions + budget history in parallel and saves monthly budget updates.
 * @exports fetchBudgetAndTransactionsApi, saveBudgetApi
 */

import apiClient from "../../../api/apiClient";

export const fetchBudgetAndTransactionsApi = async (userId) => {
  const [txRes, budgetRes] = await Promise.all([apiClient.get(`/transactions/${userId}`), apiClient.get(`/budgets/${userId}`)]);

  return {
    txList: txRes.data?.data || [],
    currentBudget: budgetRes.data?.data || null,
    historyList: budgetRes.data?.history || [],
  };
};

export const saveBudgetApi = async (payload) => {
  const res = await apiClient.post("/budgets", payload);
  return res.data?.data;
};
