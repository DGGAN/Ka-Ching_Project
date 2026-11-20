/**
 * @file frontend/src/features/addTransaction/services/addTransactionService.js
 * @layer Feature Service (Manual Transaction Creation API)
 * @description Encapsulates the POST /api/transactions request for creating a new verified manual transaction.
 * @exports createTransactionApi
 */

import apiClient from "../../../api/apiClient";

/**
 * Create a new manual transaction in MongoDB via the backend API
 * @param {object} payload - Standardized transaction payload
 * @returns {Promise<object>} Backend response data
 */
export async function createTransactionApi(payload) {
  const res = await apiClient.post("/transactions", payload);
  return res.data;
}
