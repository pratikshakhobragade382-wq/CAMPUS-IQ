import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Loader2,
  Lock,
  RefreshCw,
  UserRound,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import {
  changeSettingsPassword,
  getSettingsProfile,
  updateSettingsProfile,
} from "../api/settings.api";

import "./StudentProfile.css";

const HTML_RE = /[<>]/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function formatIdentity(value) {
  if (!value) {
    return "—";
  }

  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getSettingsErrorMessage(error, fallback) {
  if (!error?.response) {
    return fallback;
  }

  const status = error.response.status;
  const data = error.response.data || {};
  const code = data.code;

  if (status === 401) {
    if (code === "INVALID_CREDENTIALS") {
      return "Current password is incorrect.";
    }

    return "Your session has expired. Please sign in again.";
  }

  if (status === 403) {
    return "You do not have permission to update these settings.";
  }

  if (status === 409) {
    return "That email is already in use.";
  }

  if (status === 400 && Array.isArray(data.details) && data.details.length > 0) {
    const messages = data.details.map((item) => item?.message).filter(Boolean);
    if (messages.length > 0) {
      return messages.join(" ");
    }
  }

  if (typeof data.error === "string" && data.error && data.error !== "Something went wrong") {
    return data.error;
  }

  if (typeof data.message === "string" && data.message) {
    return data.message;
  }

  return fallback;
}

function validateAccount(form) {
  const name = form.name.trim();
  const email = form.email.trim();
  const phone = form.phone.trim();
  const avatarUrl = form.avatarUrl.trim();

  if (!name) {
    return "Name is required.";
  }

  if (name.length > 100) {
    return "Name must be at most 100 characters.";
  }

  if (HTML_RE.test(name)) {
    return "Name must not contain HTML tags.";
  }

  if (!email) {
    return "Email is required.";
  }

  if (email.length > 254 || !EMAIL_RE.test(email)) {
    return "Please enter a valid email address.";
  }

  if (phone.length > 20) {
    return "Phone must be at most 20 characters.";
  }

  if (HTML_RE.test(phone)) {
    return "Phone must not contain HTML tags.";
  }

  if (avatarUrl.length > 500) {
    return "Avatar URL must be at most 500 characters.";
  }

  if (HTML_RE.test(avatarUrl)) {
    return "Avatar URL must not contain HTML tags.";
  }

  return "";
}

function validatePassword(form) {
  if (!form.currentPassword) {
    return "Current password is required.";
  }

  if (form.currentPassword.length > 72) {
    return "Current password is too long.";
  }

  if (!form.newPassword) {
    return "New password is required.";
  }

  if (form.newPassword.length < 8) {
    return "Password must be at least 8 characters.";
  }

  if (form.newPassword.length > 72) {
    return "Password must be at most 72 characters.";
  }

  if (form.newPassword !== form.confirmPassword) {
    return "New password and confirmation do not match.";
  }

  return "";
}

export default function StudentSettings() {
  const { user, setUser } = useAuth();

  const [identity, setIdentity] = useState("");
  const [account, setAccount] = useState({
    name: "",
    email: "",
    phone: "",
    avatarUrl: "",
  });
  const [password, setPassword] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [savingAccount, setSavingAccount] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [accountMessage, setAccountMessage] = useState({ type: "", text: "" });
  const [passwordMessage, setPasswordMessage] = useState({ type: "", text: "" });

  const syncAuthUser = (updated) => {
    if (!updated || !setUser) {
      return;
    }

    const nextUser = {
      ...(user || {}),
      name: updated.name ?? user?.name,
      email: updated.email ?? user?.email,
      phone: updated.phone ?? user?.phone,
      avatarUrl: updated.avatarUrl ?? user?.avatarUrl,
      identity: updated.identity ?? user?.identity,
    };

    setUser(nextUser);
    localStorage.setItem("user", JSON.stringify(nextUser));
  };

  const applyProfile = (profile) => {
    setIdentity(profile.identity || "");
    setAccount({
      name: profile.name || "",
      email: profile.email || "",
      phone: profile.phone || "",
      avatarUrl: profile.avatarUrl || "",
    });
  };

  const loadSettings = useCallback(async () => {
    try {
      const response = await getSettingsProfile();
      const profile = response?.data;

      if (!profile) {
        setLoadError("Unable to load settings.");
        return;
      }

      applyProfile(profile);
      setLoadError("");
    } catch (err) {
      console.error("Failed to load student settings:", err);
      setLoadError(
        getSettingsErrorMessage(err, "Unable to load settings. Please try again.")
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await getSettingsProfile();
        if (cancelled) {
          return;
        }

        const profile = response?.data;

        if (!profile) {
          setLoadError("Unable to load settings.");
          return;
        }

        applyProfile(profile);
        setLoadError("");
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error("Failed to load student settings:", err);
        setLoadError(
          getSettingsErrorMessage(err, "Unable to load settings. Please try again.")
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const retryLoad = () => {
    setLoading(true);
    setLoadError("");
    setAccountMessage({ type: "", text: "" });
    loadSettings();
  };

  const handleAccountChange = (field) => (event) => {
    setAccount((prev) => ({ ...prev, [field]: event.target.value }));
    setAccountMessage({ type: "", text: "" });
  };

  const handlePasswordChange = (field) => (event) => {
    setPassword((prev) => ({ ...prev, [field]: event.target.value }));
    setPasswordMessage({ type: "", text: "" });
  };

  const handleSaveAccount = async (event) => {
    event.preventDefault();

    const validationError = validateAccount(account);
    if (validationError) {
      setAccountMessage({ type: "error", text: validationError });
      return;
    }

    setSavingAccount(true);
    setAccountMessage({ type: "", text: "" });

    try {
      const response = await updateSettingsProfile({
        name: account.name.trim(),
        email: account.email.trim(),
        phone: account.phone.trim(),
        avatarUrl: account.avatarUrl.trim(),
      });

      const updated = response?.data;
      if (updated) {
        setIdentity(updated.identity || identity);
        setAccount({
          name: updated.name || "",
          email: updated.email || "",
          phone: updated.phone || "",
          avatarUrl: updated.avatarUrl || "",
        });
        syncAuthUser(updated);
      }

      setAccountMessage({
        type: "success",
        text: "Account settings saved successfully.",
      });
    } catch (err) {
      console.error("Failed to save student settings:", err);
      setAccountMessage({
        type: "error",
        text: getSettingsErrorMessage(err, "Unable to save settings."),
      });
    } finally {
      setSavingAccount(false);
    }
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();

    const validationError = validatePassword(password);
    if (validationError) {
      setPasswordMessage({ type: "error", text: validationError });
      return;
    }

    setSavingPassword(true);
    setPasswordMessage({ type: "", text: "" });

    try {
      await changeSettingsPassword({
        currentPassword: password.currentPassword,
        newPassword: password.newPassword,
      });

      setPassword({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setPasswordMessage({
        type: "success",
        text: "Password changed successfully.",
      });
    } catch (err) {
      console.error("Failed to change student password:", err);
      setPasswordMessage({
        type: "error",
        text: getSettingsErrorMessage(err, "Unable to change password."),
      });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="student-settings-page">
      {loading && (
        <div className="student-module-status" aria-busy="true">
          <div className="student-module-spinner" />
          <p>Loading your settings...</p>
        </div>
      )}

      {!loading && loadError && (
        <div className="student-module-status error">
          <div className="student-module-status-icon error">
            <AlertCircle size={28} />
          </div>
          <h3>Unable to load settings</h3>
          <p>{loadError}</p>
          <button type="button" className="student-settings-retry-btn" onClick={retryLoad}>
            <RefreshCw size={15} />
            Try again
          </button>
        </div>
      )}

      {!loading && !loadError && (
        <div className="student-settings-grid">
          <section className="student-settings-card">
            <div className="student-settings-card-header">
              <div className="student-settings-card-icon">
                <UserRound size={18} />
              </div>
              <div>
                <h2>Account settings</h2>
                <p>Update the login account details used to sign in to the Student Portal.</p>
              </div>
            </div>

            <form className="student-settings-form" onSubmit={handleSaveAccount} noValidate>
              {accountMessage.text && (
                <div className={`student-settings-banner ${accountMessage.type}`} role="status">
                  {accountMessage.type === "success" ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <AlertCircle size={16} />
                  )}
                  <span>{accountMessage.text}</span>
                </div>
              )}

              <div className="student-settings-readonly">
                <span>Account type</span>
                <strong>{formatIdentity(identity)}</strong>
              </div>

              <label className="student-settings-field">
                <span>Name</span>
                <input
                  type="text"
                  name="name"
                  maxLength={100}
                  autoComplete="name"
                  value={account.name}
                  onChange={handleAccountChange("name")}
                  disabled={savingAccount}
                />
              </label>

              <label className="student-settings-field">
                <span>Email</span>
                <input
                  type="email"
                  name="email"
                  maxLength={254}
                  autoComplete="email"
                  value={account.email}
                  onChange={handleAccountChange("email")}
                  disabled={savingAccount}
                />
              </label>

              <label className="student-settings-field">
                <span>Phone</span>
                <input
                  type="text"
                  name="phone"
                  maxLength={20}
                  autoComplete="tel"
                  value={account.phone}
                  onChange={handleAccountChange("phone")}
                  disabled={savingAccount}
                />
              </label>

              <label className="student-settings-field">
                <span>Avatar URL</span>
                <input
                  type="text"
                  name="avatarUrl"
                  maxLength={500}
                  autoComplete="off"
                  placeholder="https://"
                  value={account.avatarUrl}
                  onChange={handleAccountChange("avatarUrl")}
                  disabled={savingAccount}
                />
              </label>

              <p className="student-settings-hint">
                These fields update your login account. School student records on My Profile
                stay unchanged.
              </p>

              <button type="submit" className="student-settings-submit" disabled={savingAccount}>
                {savingAccount ? (
                  <>
                    <Loader2 size={15} className="student-spin" />
                    Saving...
                  </>
                ) : (
                  "Save account settings"
                )}
              </button>
            </form>
          </section>

          <section className="student-settings-card">
            <div className="student-settings-card-header">
              <div className="student-settings-card-icon lock">
                <Lock size={18} />
              </div>
              <div>
                <h2>Password & security</h2>
                <p>Change the password you use to sign in to the Student Portal.</p>
              </div>
            </div>

            <form className="student-settings-form" onSubmit={handleChangePassword} noValidate>
              {passwordMessage.text && (
                <div className={`student-settings-banner ${passwordMessage.type}`} role="status">
                  {passwordMessage.type === "success" ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <AlertCircle size={16} />
                  )}
                  <span>{passwordMessage.text}</span>
                </div>
              )}

              <label className="student-settings-field">
                <span>Current password</span>
                <input
                  type="password"
                  name="currentPassword"
                  maxLength={72}
                  autoComplete="current-password"
                  value={password.currentPassword}
                  onChange={handlePasswordChange("currentPassword")}
                  disabled={savingPassword}
                />
              </label>

              <label className="student-settings-field">
                <span>New password</span>
                <input
                  type="password"
                  name="newPassword"
                  maxLength={72}
                  autoComplete="new-password"
                  value={password.newPassword}
                  onChange={handlePasswordChange("newPassword")}
                  disabled={savingPassword}
                />
              </label>

              <label className="student-settings-field">
                <span>Confirm new password</span>
                <input
                  type="password"
                  name="confirmPassword"
                  maxLength={72}
                  autoComplete="new-password"
                  value={password.confirmPassword}
                  onChange={handlePasswordChange("confirmPassword")}
                  disabled={savingPassword}
                />
              </label>

              <p className="student-settings-hint">
                New password must be at least 8 characters. Confirmation is checked in the
                browser and is not sent to the server.
              </p>

              <button type="submit" className="student-settings-submit" disabled={savingPassword}>
                {savingPassword ? (
                  <>
                    <Loader2 size={15} className="student-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <KeyRound size={15} />
                    Change password
                  </>
                )}
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
