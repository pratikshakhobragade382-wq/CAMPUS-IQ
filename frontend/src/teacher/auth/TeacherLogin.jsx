import { useState } from "react";
import {
  useNavigate,
  Link,
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

import logo from "../../assets/logo.png";

import "./TeacherLogin.css";

export default function TeacherLogin() {
  const {
    login,
    loading,
    error,
    logout,
  } = useAuth();

  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [roleError, setRoleError] = useState("");
  const [loginError, setLoginError] = useState("");

  // =========================================================
  // HANDLE INPUT CHANGE
  // =========================================================

  const handleChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setRoleError("");
    setLoginError("");
  };

  // =========================================================
  // HANDLE LOGIN
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setRoleError("");
    setLoginError("");

    try {
      /*
       * AuthContext.login() returns the USER directly.
       *
       * Correct:
       *
       * const loggedInUser = await login(form);
       *
       * NOT:
       *
       * const loginResult = await login(form);
       * const loggedInUser = loginResult.user;
       */

      const loggedInUser = await login(form);

      // =====================================================
      // LOGIN FAILED
      // =====================================================

      if (!loggedInUser) {
        setLoginError(
          "Invalid email or password."
        );

        return;
      }

      // =====================================================
      // TEACHER ROLE VALIDATION
      // =====================================================

      const isTeacher =
        loggedInUser?.identity === "staff" &&
        (
          loggedInUser.staff?.role === "teacher" ||
          loggedInUser.role === "teacher" ||
          loggedInUser.staffRole === "teacher"
        );

      // =====================================================
      // WRONG ROLE
      // =====================================================

      if (!isTeacher) {
        logout();

        setRoleError(
          "This account is not registered as a teacher."
        );

        return;
      }

      // =====================================================
      // SUCCESS
      // =====================================================

      navigate("/teacher/dashboard", {
        replace: true,
      });
    } catch (loginError) {
      console.error(
        "Teacher login error:",
        loginError
      );

      setLoginError(
        loginError?.message ||
          "Invalid email or password."
      );
    }
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="teacher-login-page">

      <div className="teacher-login-card">

        {/* =====================================================
            LOGO
        ====================================================== */}

        <div className="teacher-login-logo-wrapper">

          <img
            src={logo}
            alt="Campus IQ"
            className="teacher-login-logo"
          />

        </div>

        {/* =====================================================
            HEADER
        ====================================================== */}

        <div className="teacher-login-header">

          <div className="teacher-login-badge">

            <i className="fa-solid fa-chalkboard-user"></i>

            Teacher Portal

          </div>

          <h2>
            Welcome Back, Teacher!
          </h2>

          <p>
            Sign in to continue to your teacher dashboard
          </p>

        </div>

        {/* =====================================================
            LOGIN ERROR
        ====================================================== */}

        {(loginError || roleError || error) && (

          <div className="teacher-auth-error">

            <i className="fa-solid fa-circle-exclamation"></i>

            <span>
              {roleError || loginError || error}
            </span>

          </div>

        )}

        {/* =====================================================
            LOGIN FORM
        ====================================================== */}

        <form
          onSubmit={handleSubmit}
        >

          {/* ================= EMAIL ================= */}

          <div className="teacher-form-group">

            <label htmlFor="teacher-email">
              Email
            </label>

            <div className="teacher-input-wrapper">

              <i className="fa-solid fa-envelope teacher-input-icon"></i>

              <input
                id="teacher-email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter your email"
                autoComplete="email"
                required
              />

            </div>

          </div>

          {/* ================= PASSWORD ================= */}

          <div className="teacher-form-group">

            <label htmlFor="teacher-password">
              Password
            </label>

            <div className="teacher-input-wrapper">

              <i className="fa-solid fa-lock teacher-input-icon"></i>

              <input
                id="teacher-password"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />

            </div>

          </div>

          {/* =================================================
              LOGIN BUTTON
          ================================================== */}

          <button
            type="submit"
            className="teacher-login-submit-btn"
            disabled={loading}
          >

            {loading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                Signing in...
              </>
            ) : (
              <>
                <i className="fa-solid fa-right-to-bracket"></i>
                Sign In
              </>
            )}

          </button>

        </form>

        {/* =====================================================
            BACK TO PORTALS
        ====================================================== */}

        <p className="teacher-auth-footer">

          Want to use another portal?{" "}

          <Link to="/portal-login">
            Choose Portal
          </Link>

        </p>

      </div>

    </div>
  );
}