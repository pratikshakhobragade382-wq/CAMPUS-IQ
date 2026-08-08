import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/logo.png";
import "./Login.css";

export default function Login() {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
    tenantId: 1,
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const ok = await login(form);

    if (ok) {
      navigate("/dashboard");
    }
  };

  return (
    <div className="login-page">

      <div className="login-card">

        {/* Campus IQ Logo */}
        <div className="login-logo-wrapper">
          <img
            src={logo}
            alt="Campus IQ"
            className="login-logo"
          />
        </div>

        {/* Login Heading */}
        <div className="login-header">
          <h2>Welcome Back!</h2>
          <p>Sign in to continue to Campus IQ</p>
        </div>

        {/* Error */}
        {error && (
          <div className="auth-error">
            <i className="fa-solid fa-circle-exclamation"></i>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* Email */}
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
                onChange={handleChange}
                placeholder="Enter your email"
                required
              />

            </div>

          </div>


          {/* Password */}
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
                onChange={handleChange}
                placeholder="Enter your password"
                required
              />

            </div>

          </div>


          {/* Tenant ID */}
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
                onChange={handleChange}
                placeholder="Enter tenant ID"
                required
              />

            </div>

          </div>


          {/* Login Button */}
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


        {/* Register */}
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
