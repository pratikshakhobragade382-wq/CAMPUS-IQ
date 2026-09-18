import axios from "axios";

/*
============================================================
 CAMPUS-IQ AXIOS CLIENT
============================================================

 Default local backend:
 http://localhost:8000/api/v1

 You can override it with:

 VITE_API_URL=http://localhost:8000/api/v1

============================================================
*/

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000/api/v1";

const axiosClient = axios.create({
  baseURL: API_BASE_URL,

  /*
   * Performance Predictor can perform several database
   * queries before returning the result.
   *
   * 60 seconds prevents the frontend from cancelling a
   * valid but slower request.
   */
  timeout: 60000,

  headers: {
    "Content-Type": "application/json",
  },
});

/*
============================================================
 REQUEST INTERCEPTOR
============================================================
*/

axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers = config.headers || {};

      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },

  (error) => {
    return Promise.reject(error);
  }
);

/*
============================================================
 RESPONSE INTERCEPTOR
============================================================
*/

axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },

  (error) => {
    console.error(
      "CampusIQ API Error:",
      error?.response?.status,
      error?.response?.data ||
        error?.message ||
        error
    );

    /*
     * Only clear authentication for a real 401.
     *
     * Do NOT logout the user for:
     * - timeout
     * - 400
     * - 403
     * - 404
     * - 500
     */
    if (error?.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      const currentPath =
        window.location.pathname;

      if (
        currentPath.startsWith("/teacher")
      ) {
        window.location.href =
          "/teacher-login";
      } else if (
        currentPath.startsWith("/parent")
      ) {
        window.location.href =
          "/parent-login";
      } else {
        window.location.href =
          "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;