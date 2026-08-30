import { createContext, useContext, useState } from "react";
import axiosClient from "../api/axios";
import { STORAGE_KEYS } from "../utils/constants";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_DATA);

    try {
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error("Invalid stored user:", error);
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
      return null;
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isAuthenticated = !!user;

  // =========================================================
  // LOGIN
  // =========================================================

  const login = async ({ email, password }) => {
    setLoading(true);
    setError("");

    try {
      const loginData = {
        email,
        password,
      };

      // Local development
      if (import.meta.env.DEV) {
        loginData.tenantId = 1;
      }

      const res = await axiosClient.post("/auth/login", loginData);

      const responseData = res.data?.data;

      if (!responseData?.user || !responseData?.token) {
        setError("Invalid login response from server.");
        return false;
      }

      const loggedInUser = responseData.user;
      const token = responseData.token;

      // SAVE AUTH DATA (same keys that axios.js reads)
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      localStorage.setItem(
        STORAGE_KEYS.USER_DATA,
        JSON.stringify(loggedInUser)
      );

      setUser(loggedInUser);

      return loggedInUser;
    } catch (err) {
      console.error("Login failed:", err);

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Login failed"
      );

      return false;
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const logout = () => {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);

    setUser(null);
    setError("");
  };

  return (
    <AuthContext.Provider
  value={{
    user,
    login,
    logout,
    loading,
    isLoading: loading,
    isAuthenticated,
    error,
  }}
>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}