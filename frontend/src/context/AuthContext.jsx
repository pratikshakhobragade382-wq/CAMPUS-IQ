import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import axiosClient from "../api/axios";

const AuthContext = createContext(null);

/*
============================================================
 DEFAULT TENANT
============================================================

 For local development:

 VITE_TENANT_ID=1

 If VITE_TENANT_ID is not present,
 tenant 1 will be used.

============================================================
*/

const DEFAULT_TENANT_ID =
  Number(import.meta.env.VITE_TENANT_ID) || 1;

/*
============================================================
 AUTH PROVIDER
============================================================
*/

export const AuthProvider = ({ children }) => {
  /*
   * --------------------------------------------------------
   * USER
   * --------------------------------------------------------
   */

  const [user, setUser] = useState(() => {
    try {
      const savedUser =
        localStorage.getItem("user");

      return savedUser
        ? JSON.parse(savedUser)
        : null;
    } catch (error) {
      console.error(
        "Unable to read saved user:",
        error
      );

      return null;
    }
  });

  /*
   * --------------------------------------------------------
   * LOADING
   * --------------------------------------------------------
   */

  const [loading, setLoading] =
    useState(false);

  /*
   * --------------------------------------------------------
   * ERROR
   * --------------------------------------------------------
   */

  const [error, setError] =
    useState("");

  /*
   * --------------------------------------------------------
   * CHECK EXISTING SESSION
   * --------------------------------------------------------
   */

  useEffect(() => {
    const token =
      localStorage.getItem("token");

    const savedUser =
      localStorage.getItem("user");

    if (!token || !savedUser) {
      setUser(null);
    }
  }, []);

  /*
============================================================
 LOGIN
============================================================

 Supports both:

 login({
   email,
   password,
   tenantId
 })

 and:

 login(
   email,
   password,
   tenantId
 )

 Returns:

 user object on success
 null on failure

============================================================
*/

  const login = async (
    formOrEmail,
    passwordArg,
    tenantIdArg =
      DEFAULT_TENANT_ID
  ) => {
    setLoading(true);
    setError("");

    try {
      let email = "";
      let password = "";
      let tenantId =
        DEFAULT_TENANT_ID;

      /*
       * ------------------------------------------------------
       * OBJECT FORM
       * ------------------------------------------------------
       */

      if (
        typeof formOrEmail === "object" &&
        formOrEmail !== null
      ) {
        email =
          formOrEmail.email || "";

        password =
          formOrEmail.password || "";

        tenantId =
          formOrEmail.tenantId ??
          DEFAULT_TENANT_ID;
      }

      /*
       * ------------------------------------------------------
       * EMAIL + PASSWORD FORM
       * ------------------------------------------------------
       */

      else {
        email =
          formOrEmail || "";

        password =
          passwordArg || "";

        tenantId =
          tenantIdArg ??
          DEFAULT_TENANT_ID;
      }

      /*
       * ------------------------------------------------------
       * NORMALIZE
       * ------------------------------------------------------
       */

      email =
        typeof email === "string"
          ? email.trim()
          : "";

      password =
        typeof password === "string"
          ? password
          : "";

      tenantId =
        Number(tenantId) ||
        DEFAULT_TENANT_ID;

      /*
       * ------------------------------------------------------
       * VALIDATION
       * ------------------------------------------------------
       */

      if (!email) {
        throw new Error(
          "Please enter your email."
        );
      }

      if (!password) {
        throw new Error(
          "Please enter your password."
        );
      }

      /*
       * ------------------------------------------------------
       * BACKEND LOGIN
       * ------------------------------------------------------
       */

      const response =
        await axiosClient.post(
          "/auth/login",
          {
            email,
            password,
            tenantId,
          }
        );

      const data =
        response?.data?.data;

      /*
       * ------------------------------------------------------
       * VALIDATE RESPONSE
       * ------------------------------------------------------
       */

      if (
        !data?.token ||
        !data?.user
      ) {
        throw new Error(
          "Invalid login response received from CampusIQ backend."
        );
      }

      /*
       * ------------------------------------------------------
       * SAVE SESSION
       * ------------------------------------------------------
       */

      localStorage.setItem(
        "token",
        data.token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      /*
       * ------------------------------------------------------
       * UPDATE REACT STATE
       * ------------------------------------------------------
       */

      setUser(data.user);

      /*
       * ------------------------------------------------------
       * IMPORTANT
       *
       * Return the USER directly.
       *
       * ParentLogin.jsx and TeacherLogin.jsx
       * expect:
       *
       * loggedInUser.identity
       *
       * not:
       *
       * loggedInUser.user.identity
       * ------------------------------------------------------
       */

      return data.user;
    } catch (loginError) {
      console.error(
        "CampusIQ LOGIN ERROR:",
        loginError
      );

      let message =
        "Login failed. Please check your credentials.";

      /*
       * Backend error
       */

      if (loginError?.response) {
        message =
          loginError.response?.data?.message ||
          loginError.response?.data?.error ||
          message;
      }

      /*
       * Frontend validation error
       */

      else if (
        loginError instanceof Error
      ) {
        message =
          loginError.message;
      }

      setError(message);

      /*
       * ParentLogin / TeacherLogin
       * already handle null as failed login.
       */

      return null;
    } finally {
      setLoading(false);
    }
  };

  /*
============================================================
 LOGOUT
============================================================
*/

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
    setError("");
  };

  /*
============================================================
 CONTEXT VALUE
============================================================
*/

  const token =
    localStorage.getItem("token");

  const isAuthenticated =
    !!token && !!user;

  const value = {
    user,

    setUser,

    loading,

    /*
     * Used by Login components
     */
    isLoading: loading,

    error,

    login,

    logout,

    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/*
============================================================
 USE AUTH
============================================================
*/

export const useAuth = () => {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
};

export default AuthContext;