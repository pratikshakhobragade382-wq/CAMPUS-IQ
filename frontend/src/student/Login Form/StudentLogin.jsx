import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, LogIn, Eye, EyeOff, GraduationCap } from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/logo.png";

import "./StudentLogin.css";

export default function StudentLogin() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email.trim() || !formData.password) {
      setError("Please enter your admission number (or email) and password.");
      return;
    }

    try {
      setError("");

      const result = await login({
        email: formData.email.trim(),
        password: formData.password,
      });

      /*
       * The existing AuthContext/backend remains responsible for
       * authentication. After successful login, send students to
       * their student dashboard.
       */
      const identity =
        result?.user?.identity ||
        result?.identity ||
        result?.data?.user?.identity ||
        result?.data?.identity;

      if (identity && identity !== "student") {
        setError("This account is not registered as a student account.");
        return;
      }

      navigate("/student/dashboard", { replace: true });
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          "Invalid email or password. Please try again."
      );
    }
  };

  return (
    <div className="student-login-page">
      <div className="student-login-glow student-login-glow-one" />
      <div className="student-login-glow student-login-glow-two" />

      <main className="student-login-card">
        <div className="student-login-brand">
          <img src={logo} alt="Campus IQ" className="student-login-logo" />
        </div>

        <div className="student-portal-badge">
          <span className="student-portal-badge-icon">
            <GraduationCap size={15} strokeWidth={2.5} />
          </span>
          Student Portal
        </div>

        <div className="student-login-heading">
          <h1>Welcome Back, Student!</h1>
          <p>Sign in to continue to your student dashboard</p>
        </div>

        <form className="student-login-form" onSubmit={handleSubmit}>
          <div className="student-form-group">
            <label htmlFor="student-email">Admission number or email</label>

            <div className="student-input-wrapper">
              <Mail
                className="student-input-icon"
                size={17}
                strokeWidth={2.3}
              />

              <input
                id="student-email"
                name="email"
                type="text"
                value={formData.email}
                onChange={handleChange}
                placeholder="Admission number or email"
                autoComplete="username"
                disabled={loading}
              />
            </div>
          </div>

          <div className="student-form-group">
            <label htmlFor="student-password">Password</label>

            <div className="student-input-wrapper">
              <Lock
                className="student-input-icon"
                size={17}
                strokeWidth={2.3}
              />

              <input
                id="student-password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={loading}
              />

              <button
                type="button"
                className="student-password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={loading}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="student-login-error" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="student-login-button"
            disabled={loading}
          >
            <LogIn size={17} strokeWidth={2.5} />
            <span>{loading ? "Signing In..." : "Sign In"}</span>
          </button>
        </form>

        <div className="student-login-footer">
          <span>Want to use another portal?</span>{" "}
          <button
            type="button"
            className="student-choose-portal"
            onClick={() => navigate("/portal")}
          >
            Choose Portal
          </button>
        </div>
      </main>
    </div>
  );
}
