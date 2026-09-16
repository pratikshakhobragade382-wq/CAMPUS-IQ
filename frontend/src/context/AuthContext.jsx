import { createContext, useContext, useEffect, useState } from "react";
import axiosClient from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      console.error("Unable to read saved user:", error);
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setUser(null);
    }
  }, []);

  const login = async (formOrEmail, passwordArg, tenantIdArg = 1) => {
    setLoading(true);

    try {
      /*
       * Supports both:
       *
       * login({
       *   email,
       *   password,
       *   tenantId
       * })
       *
       * and:
       *
       * login(email, password, tenantId)
       */

      let email;
      let password;
      let tenantId;

      if (
        typeof formOrEmail === "object" &&
        formOrEmail !== null
      ) {
        email = formOrEmail.email;
        password = formOrEmail.password;
        tenantId = formOrEmail.tenantId ?? 1;
      } else {
        email = formOrEmail;
        password = passwordArg;
        tenantId = tenantIdArg ?? 1;
      }

      email = typeof email === "string" ? email.trim() : "";
      password = typeof password === "string" ? password : "";

      if (!email) {
        throw new Error("Please enter your email.");
      }

      if (!password) {
        throw new Error("Please enter your password.");
      }

      const response = await axiosClient.post("/auth/login", {
        email,
        password,
        tenantId: Number(tenantId) || 1,
      });

      const data = response?.data?.data;

      if (!data?.token || !data?.user) {
        throw new Error(
          "Invalid login response received from CampusIQ backend."
        );
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setUser(data.user);

      return {
        success: true,
        user: data.user,
        token: data.token,
      };
    } catch (error) {
      console.error("CampusIQ LOGIN ERROR:", error);

      if (error?.response) {
        const backendMessage =
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Login failed.";

        throw new Error(backendMessage);
      }

      if (error instanceof Error) {
        throw error;
      }

      throw new Error("Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
  };

  const value = {
    user,
    setUser,
    loading,
    login,
    logout,
    isAuthenticated: !!localStorage.getItem("token"),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
};

export default AuthContext;