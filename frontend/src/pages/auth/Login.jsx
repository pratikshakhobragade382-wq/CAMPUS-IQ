import { useState } from "react";
import {
  useNavigate,
  Link,
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

import logo from "../../assets/logo.png";

import "./Login.css";

export default function Login() {
  const {
    login,
    loading,
    error,
  } = useAuth();

  const navigate =
    useNavigate();

  const [form, setForm] =
    useState({
      email: "",
      password: "",
      tenantId:
        Number(
          import.meta.env
            .VITE_TENANT_ID
        ) || 1,
    });

  /*
============================================================
 HANDLE INPUT
============================================================
*/

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /*
============================================================
 HANDLE LOGIN
============================================================
*/

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    const loggedInUser =
      await login({
        email: form.email,
        password: form.password,
        tenantId: form.tenantId,
      });

    /*
     * Login failed.
     */
    if (!loggedInUser) {
      return;
    }

    /*
==========================================================
 DETERMINE TEACHER
==========================================================
*/

    const isTeacher =
      loggedInUser.identity ===
        "staff" &&
      (
        loggedInUser.role ===
          "teacher" ||
        loggedInUser.staff?.role ===
          "teacher" ||
        loggedInUser.staffRole ===
          "teacher"
      );

    /*
==========================================================
 DETERMINE PARENT
==========================================================
*/

    const isParent =
      loggedInUser.identity ===
      "parent";

    /*
==========================================================
 NAVIGATION
==========================================================
*/

    if (isTeacher) {
      navigate(
        "/teacher/dashboard",
        {
          replace: true,
        }
      );

      return;
    }

    if (isParent) {
      navigate(
        "/parent/dashboard",
        {
          replace: true,
        }
      );

      return;
    }

    /*
     * Default admin dashboard.
     */

    navigate(
      "/dashboard",
      {
        replace: true,
      }
    );
  };

  /*
============================================================
 UI
============================================================
*/

  return (
    <div className="login-page">

      <div className="login-card">

        {/* ==================================================
            LOGO
        ================================================== */}

        <div className="login-logo-wrapper">
          <img
            src={logo}
            alt="Campus IQ"
            className="login-logo"
          />
        </div>

        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="login-header">
          <h2>
            Welcome Back!
          </h2>

          <p>
            Sign in to continue to Campus IQ
          </p>
        </div>

        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (
          <div className="auth-error">

            <i className="fa-solid fa-circle-exclamation"></i>

            <span>
              {error}
            </span>

          </div>
        )}

        {/* ==================================================
            FORM
        ================================================== */}

        <form
          onSubmit={handleSubmit}
        >

          {/* ================= EMAIL ================= */}

          <div className="form-group">

            <label htmlFor="email">
              Email
            </label>

            <div className="input-wrapper">

              <i className="fa-solid fa-envelope input-icon"></i>

              <input
                id="email"
                type="email"
                name="email"
                value={form.email}
                onChange={
                  handleChange
                }
                placeholder="Enter your email"
                autoComplete="email"
                required
              />

            </div>

          </div>

          {/* ================= PASSWORD ================= */}

          <div className="form-group">

            <label htmlFor="password">
              Password
            </label>

            <div className="input-wrapper">

              <i className="fa-solid fa-lock input-icon"></i>

              <input
                id="password"
                type="password"
                name="password"
                value={form.password}
                onChange={
                  handleChange
                }
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />

            </div>

          </div>

          {/* ================= TENANT ================= */}

          <div className="form-group">

            <label htmlFor="tenantId">
              Tenant ID
            </label>

            <div className="input-wrapper">

              <i className="fa-solid fa-building input-icon"></i>

              <input
                id="tenantId"
                type="number"
                name="tenantId"
                value={form.tenantId}
                onChange={
                  handleChange
                }
                placeholder="Enter tenant ID"
                min="1"
                required
              />

            </div>

          </div>

          {/* ==================================================
              BUTTON
          ================================================== */}

          <button
            className="login-submit-btn"
            type="submit"
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

        {/* ==================================================
            REGISTER
        ================================================== */}

        <p className="auth-footer">

          No account?{" "}

          <Link to="/register">
            Register
          </Link>

        </p>

      </div>

    </div>
  );
}