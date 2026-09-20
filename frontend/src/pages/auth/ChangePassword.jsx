import { useState } from "react";
import { Navigate } from "react-router-dom";
import axiosClient from "../../api/axios";

function homePathFor(user) {
  const identity = String(user?.identity || "").toLowerCase();
  if (identity === "student") return "/student/dashboard";
  if (identity === "parent") return "/parent/dashboard";
  if (identity === "staff") {
    const role = user?.staff?.role || user?.staffRole || user?.role;
    return role === "teacher" ? "/teacher/dashboard" : "/dashboard";
  }
  return "/dashboard";
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f8f7ff",
    padding: 16,
    fontFamily: "inherit",
  },
  card: {
    width: "100%",
    maxWidth: 420,
    background: "#fff",
    borderRadius: 16,
    padding: 32,
    boxShadow: "0 8px 30px rgba(80, 60, 160, 0.12)",
  },
  title: { margin: "0 0 6px", fontSize: 22, color: "#2d1b69" },
  sub: { margin: "0 0 20px", fontSize: 14, color: "#64607a" },
  label: { display: "block", fontSize: 13, fontWeight: 600, margin: "14px 0 6px", color: "#3b3556" },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px 12px",
    border: "1px solid #d9d5ee",
    borderRadius: 10,
    fontSize: 14,
    outline: "none",
  },
  error: {
    marginTop: 14,
    padding: "10px 12px",
    background: "#fdecec",
    color: "#b42318",
    borderRadius: 8,
    fontSize: 13,
  },
  button: {
    width: "100%",
    marginTop: 20,
    padding: "12px 0",
    border: "none",
    borderRadius: 10,
    background: "#6d3fe0",
    color: "#fff",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
  },
  link: {
    display: "block",
    margin: "14px auto 0",
    background: "none",
    border: "none",
    color: "#6d3fe0",
    fontSize: 13,
    cursor: "pointer",
  },
};

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  if (!localStorage.getItem("token")) {
    return <Navigate to="/portal-login" replace />;
  }

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.replace("/portal-login");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!currentPassword) return setError("Enter your current password.");
    if (newPassword.length < 8) return setError("New password must be at least 8 characters.");
    if (newPassword.length > 72) return setError("New password must be at most 72 characters.");
    if (newPassword === currentPassword) return setError("New password must be different from the current one.");
    if (newPassword !== confirmPassword) return setError("New password and confirmation do not match.");

    try {
      setSaving(true);

      const res = await axiosClient.post("/auth/change-password", {
        currentPassword,
        newPassword,
      });

      const { token, user: newUser } = res.data.data;

      let stored = {};
      try {
        stored = JSON.parse(localStorage.getItem("user") || "{}") || {};
      } catch {
        stored = {};
      }
      const merged = { ...stored, ...newUser };

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(merged));

      // Full reload so AuthContext re-reads the new token and user.
      window.location.replace(homePathFor(merged));
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Could not change the password. Please try again."
      );
      setSaving(false);
    }
  };

  const type = show ? "text" : "password";

  return (
    <div style={styles.page}>
      <form style={styles.card} onSubmit={handleSubmit}>
        <h1 style={styles.title}>Set a new password</h1>
        <p style={styles.sub}>
          For your security, you must choose your own password before continuing.
        </p>

        <label style={styles.label} htmlFor="cp-current">Current (temporary) password</label>
        <input
          id="cp-current"
          style={styles.input}
          type={type}
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          autoComplete="current-password"
          disabled={saving}
        />

        <label style={styles.label} htmlFor="cp-new">New password (min. 8 characters)</label>
        <input
          id="cp-new"
          style={styles.input}
          type={type}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
          disabled={saving}
        />

        <label style={styles.label} htmlFor="cp-confirm">Confirm new password</label>
        <input
          id="cp-confirm"
          style={styles.input}
          type={type}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          disabled={saving}
        />

        <label style={{ ...styles.label, fontWeight: 400, display: "flex", gap: 8, alignItems: "center" }}>
          <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} />
          Show passwords
        </label>

        {error && <div style={styles.error} role="alert">{error}</div>}

        <button type="submit" style={styles.button} disabled={saving}>
          {saving ? "Saving..." : "Change password"}
        </button>

        <button type="button" style={styles.link} onClick={logout}>
          Log out
        </button>
      </form>
    </div>
  );
}
