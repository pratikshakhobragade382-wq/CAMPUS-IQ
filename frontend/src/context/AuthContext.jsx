import { createContext, useContext, useState } from "react";
import axiosClient from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");

    try {
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error("Invalid stored user:", error);
      localStorage.removeItem("user");
      return null;
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // =========================================================
  // LOGIN
  // =========================================================
  //
  // Local development:
  // Backend cannot determine the school from localhost.
  // Therefore tenantId = 1 is sent while developing locally.
  //
  // Production:
  // Backend can resolve the tenant from the school's subdomain.
  // =========================================================

  const login = async ({ email, password }) => {
    setLoading(true);
    setError("");

    try {
      const loginData = {
        email,
        password,
      };

      // -----------------------------------------------------
      // LOCAL DEVELOPMENT
      // -----------------------------------------------------

      if (import.meta.env.DEV) {
        loginData.tenantId = 1;
      }

      // -----------------------------------------------------
      // LOGIN REQUEST
      // -----------------------------------------------------

      const res = await axiosClient.post(
        "/auth/login",
        loginData
      );

      const responseData = res.data?.data;

      if (!responseData?.user || !responseData?.token) {
        setError("Invalid login response from server.");
        return false;
      }

      const loggedInUser = responseData.user;
      const token = responseData.token;

      // -----------------------------------------------------
      // SAVE AUTHENTICATION
      // -----------------------------------------------------

      localStorage.setItem("token", token);
      localStorage.setItem(
        "user",
        JSON.stringify(loggedInUser)
      );

      // -----------------------------------------------------
      // UPDATE REACT STATE
      // -----------------------------------------------------

      setUser(loggedInUser);

      // Return the user so login pages can perform
      // portal-specific validation and navigation.
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
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
    setError("");
  };

  // =========================================================
  // AUTH CONTEXT
  // =========================================================

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        loading,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// =========================================================
// CUSTOM HOOK
// =========================================================

export function useAuth() {
  return useContext(AuthContext);
}