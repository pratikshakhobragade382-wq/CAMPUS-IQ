import { useState } from "react";
import {
  useNavigate,
  Link,
} from "react-router-dom";

import axiosClient from "../../api/axios";

import logo from "../../assets/logo.png";

import "./Register.css";

export default function Register() {
  const navigate = useNavigate();

  /*
  ============================================================
   REGISTRATION FORM
  ============================================================

   Identity is intentionally NOT included here.

   Public registration creates a normal student account.
   Admin / Principal / Management accounts should be created
   through the controlled admin-side process.

   Tenant ID is also kept internally as tenant 1 and is not
   shown as a field to the user.
  ============================================================
  */

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    tenantId: 1,
  });

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  /*
  ============================================================
   HANDLE INPUT CHANGE
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
   HANDLE REGISTER
  ============================================================
  */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      /*
      ----------------------------------------------------------
       Public registration
      ----------------------------------------------------------

       We only send the information required to create a
       normal account.

       Identity is NOT sent from the frontend.
      ----------------------------------------------------------
      */

      await axiosClient.post(
        "/auth/register",
        {
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          tenantId: 1,
        },
        {
          headers: {
            "X-Registration-Key": "dev-reg-key-123",
          },
        }
      );

      setSuccess(
        "Account created successfully. Redirecting to login..."
      );

      /*
      ----------------------------------------------------------
       Redirect to login after successful registration
      ----------------------------------------------------------
      */

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  };

  /*
  ============================================================
   UI
  ============================================================
  */

  return (
    <div className="register-page">

      <div className="register-card">

        {/* ==================================================
            LOGO
        ================================================== */}

        <div className="register-logo-wrapper">

          <img
            src={logo}
            alt="Campus IQ"
            className="register-logo"
          />

        </div>

        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="register-header">

          <h2>
            Create Account
          </h2>

          <p>
            Register to get started with Campus IQ
          </p>

        </div>

        {/* ==================================================
            ERROR MESSAGE
        ================================================== */}

        {error && (
          <div className="register-message register-error">

            <i className="fa-solid fa-circle-exclamation"></i>

            <span>
              {error}
            </span>

          </div>
        )}

        {/* ==================================================
            SUCCESS MESSAGE
        ================================================== */}

        {success && (
          <div className="register-message register-success">

            <i className="fa-solid fa-circle-check"></i>

            <span>
              {success}
            </span>

          </div>
        )}

        {/* ==================================================
            FORM
        ================================================== */}

        <form onSubmit={handleSubmit}>

          {/* ================= NAME ================= */}

          <div className="register-form-group">

            <label htmlFor="name">
              Full Name
            </label>

            <div className="register-input-wrapper">

              <i className="fa-solid fa-user register-input-icon"></i>

              <input
                id="name"
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                autoComplete="name"
                required
              />

            </div>

          </div>

          {/* ================= EMAIL ================= */}

          <div className="register-form-group">

            <label htmlFor="email">
              Email
            </label>

            <div className="register-input-wrapper">

              <i className="fa-solid fa-envelope register-input-icon"></i>

              <input
                id="email"
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

          <div className="register-form-group">

            <label htmlFor="password">
              Password
            </label>

            <div className="register-input-wrapper">

              <i className="fa-solid fa-lock register-input-icon"></i>

              <input
                id="password"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Create a password"
                autoComplete="new-password"
                minLength={8}
                required
              />

            </div>

            <small className="register-help-text">
              Password must be at least 8 characters.
            </small>

          </div>

          {/* ==================================================
              REGISTER BUTTON
          ================================================== */}

          <button
            className="register-submit-btn"
            type="submit"
            disabled={loading}
          >

            {loading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>

                Creating Account...
              </>
            ) : (
              <>
                <i className="fa-solid fa-user-plus"></i>

                Create Account
              </>
            )}

          </button>

        </form>

        {/* ==================================================
            LOGIN LINK
        ================================================== */}

        <p className="register-footer">

          Already have an account?{" "}

          <Link to="/login">
            Login
          </Link>

        </p>

      </div>

    </div>
  );
}