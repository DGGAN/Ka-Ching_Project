/**
 * @file frontend/src/features/profile/services/profileService.js
 * @layer Service (Profile & Account Security API Calls)
 * @description Communicates with /api/auth/profile/:userId and /api/transactions/auto-capture-status/:userId.
 * @exports fetchUserProfileApi, updateUserProfileApi, fetchAutoCaptureStatusApi
 */

import apiClient from "../../../api/apiClient";

export const fetchUserProfileApi = async (userId) => {
  const response = await apiClient.get(`/auth/profile/${userId}`);
  return response.data?.user || null;
};

export const updateUserProfileApi = async (userId, payload) => {
  const response = await apiClient.put(`/auth/profile/${userId}`, payload);
  return response.data;
};

export const fetchAutoCaptureStatusApi = async (userId) => {
  const response = await apiClient.get(`/transactions/auto-capture-status/${userId}`);
  return Boolean(response.data?.autoCaptureEnabled);
};
