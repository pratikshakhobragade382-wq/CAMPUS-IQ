import axios from "axios";

const axiosClient = axios.create({
  baseURL: "http://localhost:8000/api/v1",
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error(
      "CampusIQ API Error:",
      error?.response?.status,
      error?.response?.data || error.message
    );

    if (error?.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      const currentPath = window.location.pathname;

      if (currentPath.startsWith("/teacher")) {
        window.location.href = "/teacher-login";
      } else if (currentPath.startsWith("/parent")) {
        window.location.href = "/parent-login";
      } else {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;