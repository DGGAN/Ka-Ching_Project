/**
 * @file frontend/src/features/ocr/services/ocrService.js
 * @layer Service (API Communication — 100% Original OCR Payload Format)
 * @description Sends batch/single images array to POST /api/ocr/scan and saves verified OCR receipts via POST /api/transactions.
 * @exports scanReceiptImagesApi, saveVerifiedReceiptApi
 */

import apiClient from "../../../api/apiClient";

export const scanReceiptImagesApi = async (payloadImages) => {
  const response = await apiClient.post("/ocr/scan", {
    images: payloadImages,
  });
  return response.data?.data || [];
};

export const saveVerifiedReceiptApi = async (txPayload) => {
  const response = await apiClient.post("/transactions", txPayload);
  return response.data;
};
