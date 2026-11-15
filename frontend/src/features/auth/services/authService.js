/**
 * @file frontend/src/features/auth/services/authService.js
 * @layer Service (Authentication API & Google OAuth UserInfo Fetcher)
 * @description Handles POST /api/auth/login, POST /api/auth/register, POST /api/auth/google, and official Google OAuth 2.0 UserInfo lookup.
 * @exports loginWithEmailApi, registerWithEmailApi, authenticateGoogleBackendApi, fetchGoogleUserInfoApi
 */

import apiClient from "../../../api/apiClient";

export const loginWithEmailApi = async (email, password) => {
  const response = await apiClient.post("/auth/login", { email, password });
  return response.data;
};

export const registerWithEmailApi = async (username, email, password) => {
  const response = await apiClient.post("/auth/register", {
    username,
    email,
    password,
  });
  return response.data;
};

export const authenticateGoogleBackendApi = async ({ email, username, oauthId }) => {
  const response = await apiClient.post("/auth/google", {
    email,
    username,
    oauthId,
  });
  return response.data;
};

export const fetchGoogleUserInfoApi = async (accessToken) => {
  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error("Failed to fetch Google user profile");
  }
  return await res.json();
};
