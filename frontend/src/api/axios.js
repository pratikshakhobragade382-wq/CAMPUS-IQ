/**
 * Axios configuration for CampusIQ API
 * Single source of truth for all HTTP requests.
 *
 * The backend URL comes from VITE_API_URL (set in .env / .env.production).
 * This is what lets the SAME frontend build talk to a local backend during
 * development and to the live, hosted backend once deployed — without any
 * code changes.
 */

import axios from "axios";
import { STORAGE_KEYS } from "../utils/constants";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

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

// Request interceptor — attach the JWT (if we have one) to every call.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — on 401, the session is dead: clear it and bounce to login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
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
