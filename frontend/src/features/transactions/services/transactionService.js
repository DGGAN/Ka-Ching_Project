/**
 * @file frontend/src/features/transactions/services/transactionService.js
 * @layer Service (API Communication — 100% Original Transactions Logic)
 * @description Handles fetching all dates for the 6-month window, paginated filtered transactions, updating, and deleting records.
 * @exports fetchAllUserTransactionsForWindow, fetchTransactionsPageApi, updateTransactionApi, deleteTransactionApi
 */

import apiClient from "../../../api/apiClient";

export const fetchAllUserTransactionsForWindow = async (userId) => {
  const res = await apiClient.get(`/transactions/${userId}`);
  return res.data?.data || [];
};

export const fetchTransactionsPageApi = async (userId, params) => {
  const response = await apiClient.get(`/transactions/${userId}`, { params });
  return response.data;
};

export const updateTransactionApi = async (transactionId, payload) => {
  const response = await apiClient.put(`/transactions/${transactionId}`, payload);
  return response.data;
};

export const deleteTransactionApi = async (transactionId) => {
  const response = await apiClient.delete(`/transactions/${transactionId}`);
  return response.data;
};
