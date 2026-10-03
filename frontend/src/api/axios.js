import axios from "axios";

/*
============================================================
 CAMPUS-IQ AXIOS CLIENT
============================================================

 Production (Render/same-origin deployment):
   VITE_API_URL is NOT needed — relative "/api/v1" is used
   automatically because the frontend is served by the backend.

 Local development override:
   VITE_API_URL=http://localhost:8000/api/v1

============================================================
*/

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "/api/v1";

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

  /*
   * Default content type for normal JSON requests.
   *
   * IMPORTANT:
   * For FormData requests, the request interceptor below
   * removes this header so the browser can automatically
   * create the correct multipart/form-data boundary.
   */
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
    /*
     * Attach JWT token.
     */
    const token = localStorage.getItem("token");

    if (token) {
      config.headers = config.headers || {};

      config.headers.Authorization =
        `Bearer ${token}`;
    }

    /*
     * ======================================================
     * IMPORTANT FOR FILE UPLOADS
     * ======================================================
     *
     * Student photos are sent using FormData.
     *
     * We MUST NOT manually set:
     *
     * Content-Type: multipart/form-data
     *
     * because the browser needs to add:
     *
     * multipart/form-data; boundary=....
     *
     * Without the boundary, multer may receive:
     *
     * req.file === undefined
     *
     * which causes:
     *
     * "Please select an image to upload."
     */

    if (
      typeof FormData !== "undefined" &&
      config.data instanceof FormData
    ) {
      if (config.headers) {
        delete config.headers["Content-Type"];
        delete config.headers["content-type"];
      }
    } else {
      /*
       * Normal API requests continue using JSON.
       */
      config.headers = config.headers || {};

      if (!config.headers["Content-Type"]) {
        config.headers["Content-Type"] =
          "application/json";
      }
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
    const requestUrl =
      String(error?.config?.url || "");

    const isAuthCall =
      requestUrl.includes("/auth/login") ||
      requestUrl.includes(
        "/auth/change-password"
      );

    /*
     * Password change required.
     */
    if (
      error?.response?.status === 403 &&
      error?.response?.data?.code ===
        "PASSWORD_CHANGE_REQUIRED" &&
      window.location.pathname !==
        "/change-password"
    ) {
      window.location.href =
        "/change-password";

      return Promise.reject(error);
    }

    /*
     * Real unauthorized request.
     */
    if (
      error?.response?.status === 401 &&
      !isAuthCall
    ) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      const currentPath =
        window.location.pathname;

      if (
        currentPath.startsWith(
          "/teacher"
        )
      ) {
        window.location.href =
          "/teacher-login";
      } else if (
        currentPath.startsWith(
          "/parent"
        )
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