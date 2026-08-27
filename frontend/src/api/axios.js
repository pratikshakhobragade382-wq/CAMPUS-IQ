/**
 * Axios configuration for CampusIQ API
 * Single source of truth for all HTTP requests.
 *
 * Supports:
 * - Normal JSON requests
 * - FormData requests such as AI image uploads
 */

import axios from "axios";
import { STORAGE_KEYS } from "../utils/constants";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000/api/v1";

if (import.meta.env.PROD && !import.meta.env.VITE_API_URL) {
  // Fail loudly in a production build rather than silently calling localhost.
  console.error(
    "[CampusIQ] VITE_API_URL is not set. The app will try to call localhost, " +
      "which will not work in production. Set VITE_API_URL in your deployment environment."
  );
}

const api = axios.create({
  baseURL: API_BASE_URL,

  timeout: 15000,

  headers: {
    "Content-Type": "application/json",
  },
});

// =====================================================
// REQUEST INTERCEPTOR
// =====================================================

api.interceptors.request.use(
  (config) => {
    // -------------------------------------------------
    // Attach JWT
    // -------------------------------------------------

    const token = localStorage.getItem(
      STORAGE_KEYS.AUTH_TOKEN
    );

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // -------------------------------------------------
    // IMPORTANT:
    // Let the browser/Axios set Content-Type automatically
    // when sending FormData.
    //
    // This is required for image uploads.
    // -------------------------------------------------

    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    return config;
  },

  (error) => Promise.reject(error)
);

// =====================================================
// RESPONSE INTERCEPTOR
// =====================================================

api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response?.status === 401) {
      // Clear authentication data
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);

      // -------------------------------------------------
      // Redirect based on the current portal
      //
      // Teacher -> Teacher Login
      // Admin   -> Admin Login
      // -------------------------------------------------

      const loginPath = window.location.pathname.startsWith("/teacher")
        ? "/teacher-login"
        : "/login";

      if (window.location.pathname !== loginPath) {
        window.location.href = loginPath;
      }
    }

    return Promise.reject(error);
  }
);

export default api;