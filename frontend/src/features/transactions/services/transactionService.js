/**
 * @file frontend/src/features/transactions/services/transactionService.js
 * @layer Service (Transactions API Communication)
 * @description Provides the 3 standardized API functions: fetchTransactions, updateTransaction, and deleteTransaction.
 * @exports fetchTransactions, updateTransaction, deleteTransaction
 */

import apiClient from "../../../api/apiClient";

export const fetchTransactions = async (userId, params = {}) => {
  const response = await apiClient.get(`/transactions/${userId}`, {
    params,
  });
  return response.data;
};

export const updateTransaction = async (txId, payload) => {
  const response = await apiClient.put(`/transactions/${txId}`, payload);
  return response.data?.data;
};

export const deleteTransaction = async (txId) => {
  const response = await apiClient.delete(`/transactions/${txId}`);
  return response.data;
};
