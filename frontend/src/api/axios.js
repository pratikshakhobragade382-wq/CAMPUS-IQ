/**
 * Axios configuration for CampusIQ API
 * Central setup for all HTTP requests
 */

import axios from "axios";
import { STORAGE_KEYS } from "../utils/constants";

/*
 * Vite uses import.meta.env instead of process.env.
 *
 * Backend:
 * http://localhost:8000/api/v1
 */
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

/**
 * Create axios instance
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Request interceptor - Add auth token
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - Handle errors
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If 401, redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);

      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;