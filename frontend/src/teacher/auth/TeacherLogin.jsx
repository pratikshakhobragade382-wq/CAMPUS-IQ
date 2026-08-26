import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/logo.png";
import "./TeacherLogin.css";

export default function TeacherLogin() {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [roleError, setRoleError] = useState("");

  // =========================================================
  // HANDLE INPUT CHANGE
  // =========================================================

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

    // Clear teacher-specific error when user starts typing again
    setRoleError("");
  };

  // =========================================================
  // HANDLE LOGIN
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear previous teacher role error
    setRoleError("");

    /*
      login() returns:

      - loggedInUser → when login is successful
      - false        → when login fails

      The returned user is used directly instead of reading
      localStorage immediately after login.
    */

    const loggedInUser = await login(form);

    // Login failed
    if (!loggedInUser) {
      return;
    }

    // =======================================================
    // TEACHER ROLE VALIDATION
    // =======================================================
    //
    // Teacher accounts must satisfy BOTH conditions:
    //
    // identity = "staff"
    // staff.role = "teacher"
    //
    // This prevents Admin/Student accounts from entering
    // through the Teacher Portal.
    // =======================================================

    const isTeacher =
      loggedInUser?.identity === "staff" &&
      loggedInUser?.staff?.role === "teacher";

    // =======================================================
    // WRONG ROLE
    // =======================================================

    if (!isTeacher) {
      /*
        The credentials were valid, but this account does not
        belong to the Teacher Portal.

        Remove the authentication created by login().
      */

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      setRoleError(
        "This account is not registered as a teacher."
      );

      return;
    }

    // =======================================================
    // SUCCESS
    // =======================================================

    // Teacher authentication successful.
    // Send the teacher to the new Teacher Dashboard.
    navigate("/teacher/dashboard", {
      replace: true,
    });
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

        {(error || roleError) && (
          <div className="teacher-auth-error">

            <i className="fa-solid fa-circle-exclamation"></i>

            <span>
              {roleError || error}
            </span>

          </div>
        )}

        {/* =====================================================
            LOGIN FORM
        ====================================================== */}

        <form onSubmit={handleSubmit}>

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