// import axios from "axios";

// const axiosClient = axios.create({
//   baseURL: "http://localhost:8000/api/v1",
// });

// axiosClient.interceptors.request.use((config) => {
//   const token = localStorage.getItem("token");

//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }

//   return config;
// });

// axiosClient.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response && error.response.status === 401) {
//       localStorage.removeItem("token");
//       localStorage.removeItem("user");

//       window.location.href = "/login";
//     }

//     return Promise.reject(error);
//   }
// );

// export default axiosClient;








import axios from "axios";

// Base URL of our Campus IQ backend
const axiosClient = axios.create({
  baseURL: "http://localhost:8000/api/v1",
});

// Add JWT token to every request
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Handle common API errors
axiosClient.interceptors.response.use(
  (response) => response,

  (error) => {
    // If token is expired or invalid, send user back to login
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default axiosClient;