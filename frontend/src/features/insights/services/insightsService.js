/**
 * @file frontend/src/features/insights/services/insightsService.js
 * @layer Service (API Communication — 100% Original Insights Logic)
 * @description Fetches computed AI linear regression forecasts, spending habits, and checklist items from GET /api/analytics/:userId.
 * @exports fetchInsightsAnalyticsApi
 */

import apiClient from "../../../api/apiClient";

export const fetchInsightsAnalyticsApi = async (userId) => {
  const response = await apiClient.get(`/analytics/${userId}`);
  return response.data?.data || null;
};
