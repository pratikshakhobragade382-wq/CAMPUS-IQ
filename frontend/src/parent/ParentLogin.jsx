import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, LogIn, Users } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.png";

import "./ParentLogin.css";

export default function ParentLogin() {
  const { login, loading, error, logout } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [roleError, setRoleError] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

    setRoleError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setRoleError("");

    const loggedInUser = await login(form);

    if (!loggedInUser) return;

    // Only parent accounts can access Parent Portal
    if (loggedInUser.identity !== "parent") {
      logout();

      setRoleError(
        "This account is not registered as a parent."
      );

      return;
    }

    // Parent login successful
    navigate("/parent/dashboard");
  };

  return (
    <div className="parent-login-page">

      <div className="parent-login-card">

        {/* =====================================================
            LOGO
        ===================================================== */}

        <div className="parent-login-logo">
          <img src={logo} alt="CampusIQ" />
        </div>


        {/* =====================================================
            PARENT PORTAL BADGE
        ===================================================== */}

        <div className="parent-portal-badge">
          <Users size={13} />
          <span>Parent Portal</span>
        </div>


        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="parent-login-header">
          <h1>Welcome Back, Parent!</h1>

          <p>
            Sign in to continue to your parent dashboard
          </p>
        </div>


        {/* =====================================================
            LOGIN FORM
        ===================================================== */}

        <form
          className="parent-login-form"
          onSubmit={handleSubmit}
        >

          {/* EMAIL */}

          <div className="parent-form-group">

            <label htmlFor="email">
              Email
            </label>

            <div className="parent-input-wrapper">

              <Mail
                size={16}
                className="parent-input-icon"
              />

              <input
                id="email"
                type="email"
                name="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={handleChange}
                required
              />

            </div>

          </div>


          {/* PASSWORD */}

          <div className="parent-form-group">

            <label htmlFor="password">
              Password
            </label>

            <div className="parent-input-wrapper">

              <Lock
                size={16}
                className="parent-input-icon"
              />

              <input
                id="password"
                type="password"
                name="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                required
              />

            </div>

          </div>


          {/* ERROR */}

          {(error || roleError) && (
            <div className="parent-login-error">
              {roleError || error}
            </div>
          )}


          {/* SIGN IN BUTTON */}

          <button
            type="submit"
            className="parent-login-button"
            disabled={loading}
          >
            <LogIn size={16} />

            <span>
              {loading ? "Signing In..." : "Sign In"}
            </span>
          </button>

        </form>


        {/* =====================================================
            FOOTER
        ===================================================== */}

        <div className="parent-login-footer">

          <span>
            Want to use another portal?
          </span>

          <Link to="/portal-login">
            Choose Portal
          </Link>

        </div>

      </div>

    </div>
  );
}