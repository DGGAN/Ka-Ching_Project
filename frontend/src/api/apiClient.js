/**
 * @file frontend/src/api/apiClient.js
 * @layer Infrastructure (HTTP Client)
 * @description Configured Axios instance with base URL and automatic JWT Authorization header interceptor.
 * @exports default apiClient
 */

// Import Axios for HTTP requests
import axios from "axios";

// Create and export a centralized Axios client instance
const apiClient = axios.create({
  baseURL: "http://localhost:5000/api",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

export default apiClient;
