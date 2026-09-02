import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axiosClient from "../api/axios";
import {
  changeSettingsPassword,
  getSettingsProfile,
  updateSettingsProfile,
} from "../api/settings.api";
import "./TeacherDashboard.css";
import "./TeacherProfile.css";
import "./TeacherSettings.css";

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

  if (
    status === 400 &&
    Array.isArray(data.details) &&
    data.details.length > 0
  ) {
    const messages = data.details
      .map((item) => item?.message)
      .filter(Boolean);

    if (messages.length > 0) {
      return messages.join(" ");
    }
  }

  if (
    typeof data.error === "string" &&
    data.error &&
    data.error !== "Something went wrong"
  ) {
    return data.error;
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

function SettingsSection({
  icon,
  title,
  description,
  children,
}) {
  return (
    <section className="teacher-dashboard-card teacher-profile-section teacher-settings-card">
      <div className="teacher-card-header">
        <div className="teacher-profile-section-title">
          <div className="teacher-profile-section-icon">
            <i className={icon}></i>
          </div>

          <div>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
        </div>
      </div>

      {children}
    </section>
  );
}

export default function TeacherSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const headerName =
    user?.staff?.name ||
    user?.name ||
    user?.fullName ||
    "Teacher";

  const formattedDate = new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

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

  const [accountMessage, setAccountMessage] = useState({
    type: "",
    text: "",
  });

  const [passwordMessage, setPasswordMessage] = useState({
    type: "",
    text: "",
  });

  /*
   * ============================================================
   * REAL NOTIFICATION UNREAD COUNT
   * ============================================================
   *
   * This comes from:
   *
   * GET /api/v1/notifications/unread-count
   *
   * The axios client already handles the API base URL/auth.
   */

  const [unreadNotificationCount, setUnreadNotificationCount] =
    useState(0);

  const loadUnreadNotificationCount = useCallback(async () => {
    try {
      const response = await axiosClient.get(
        "/notifications/unread-count"
      );

      const count = Number(
        response?.data?.data?.count ?? 0
      );

      setUnreadNotificationCount(
        Number.isFinite(count) && count > 0 ? count : 0
      );
    } catch (error) {
      console.error(
        "Failed to load notification unread count:",
        error
      );

      /*
       * Do not show fake data if the API fails.
       */
      setUnreadNotificationCount(0);
    }
  }, []);

  /*
   * Load unread count when Settings opens.
   */
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await axiosClient.get(
          "/notifications/unread-count"
        );

        if (cancelled) {
          return;
        }

        const count = Number(
          response?.data?.data?.count ?? 0
        );

        setUnreadNotificationCount(
          Number.isFinite(count) && count > 0 ? count : 0
        );
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error(
          "Failed to load notification unread count:",
          error
        );

        setUnreadNotificationCount(0);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * Refresh unread count periodically and when the
   * user returns to the browser tab.
   */
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      loadUnreadNotificationCount();
    }, 15000);

    const handleFocus = () => {
      loadUnreadNotificationCount();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
  }, [loadUnreadNotificationCount]);

  /*
   * ============================================================
   * LOAD SETTINGS
   * ============================================================
   */

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    setAccountMessage({
      type: "",
      text: "",
    });

    try {
      const response = await getSettingsProfile();
      const profile = response?.data;

      if (!profile) {
        setLoadError("Unable to load settings.");
        return;
      }

      setIdentity(profile.identity || "");

      setAccount({
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        avatarUrl: profile.avatarUrl || "",
      });
    } catch (err) {
      console.error(
        "Failed to load teacher settings:",
        err
      );

      setLoadError(
        getSettingsErrorMessage(
          err,
          "Unable to load settings."
        )
      );
    } finally {
      setLoading(false);
    }
  }, []);

  /*
   * ============================================================
   * INITIAL SETTINGS LOAD
   * ============================================================
   */

  useEffect(() => {
    let cancelled = false;

    const fetchSettings = async () => {
      try {
        const response = await getSettingsProfile();

        if (cancelled) {
          return;
        }

        const profile = response?.data;

        if (!profile) {
          setLoadError("Unable to load settings.");
          setLoading(false);
          return;
        }

        setIdentity(profile.identity || "");

        setAccount({
          name: profile.name || "",
          email: profile.email || "",
          phone: profile.phone || "",
          avatarUrl: profile.avatarUrl || "",
        });

        setLoading(false);
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error(
          "Failed to load teacher settings:",
          err
        );

        setLoadError(
          getSettingsErrorMessage(
            err,
            "Unable to load settings."
          )
        );

        setLoading(false);
      }
    };

    fetchSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * ============================================================
   * ACCOUNT FORM
   * ============================================================
   */

  const handleAccountChange = (field) => (event) => {
    const value = event.target.value;

    setAccount((prev) => ({
      ...prev,
      [field]: value,
    }));

    setAccountMessage({
      type: "",
      text: "",
    });
  };

  /*
   * ============================================================
   * PASSWORD FORM
   * ============================================================
   */

  const handlePasswordChange = (field) => (event) => {
    const value = event.target.value;

    setPassword((prev) => ({
      ...prev,
      [field]: value,
    }));

    setPasswordMessage({
      type: "",
      text: "",
    });
  };

  /*
   * ============================================================
   * SAVE ACCOUNT
   * ============================================================
   */

  const handleSaveAccount = async (event) => {
    event.preventDefault();

    const validationError = validateAccount(account);

    if (validationError) {
      setAccountMessage({
        type: "error",
        text: validationError,
      });

      return;
    }

    setSavingAccount(true);

    setAccountMessage({
      type: "",
      text: "",
    });

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
      }

      setAccountMessage({
        type: "success",
        text: "Settings updated successfully.",
      });
    } catch (err) {
      console.error(
        "Failed to save teacher settings:",
        err
      );

      setAccountMessage({
        type: "error",
        text: getSettingsErrorMessage(
          err,
          "Unable to save settings."
        ),
      });
    } finally {
      setSavingAccount(false);
    }
  };

  /*
   * ============================================================
   * CHANGE PASSWORD
   * ============================================================
   */

  const handleChangePassword = async (event) => {
    event.preventDefault();

    const validationError = validatePassword(password);

    if (validationError) {
      setPasswordMessage({
        type: "error",
        text: validationError,
      });

      return;
    }

    setSavingPassword(true);

    setPasswordMessage({
      type: "",
      text: "",
    });

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
      console.error(
        "Failed to change teacher password:",
        err
      );

      setPasswordMessage({
        type: "error",
        text: getSettingsErrorMessage(
          err,
          "Unable to change password."
        ),
      });
    } finally {
      setSavingPassword(false);
    }
  };

  const displayName = account.name || headerName;

  return (
    <div className="teacher-panel teacher-settings-page">
      {/* ======================================================
          TOP BAR
      ====================================================== */}

      <header className="teacher-topbar">
        <div className="teacher-search">
          <i className="fa-solid fa-magnifying-glass"></i>

          <input
            type="text"
            placeholder="Search anything..."
          />
        </div>

        <div className="teacher-topbar-actions">

          {/* ==================================================
              NOTIFICATION BUTTON
          ================================================== */}

          <button
            type="button"
            className="teacher-topbar-icon"
            onClick={() => navigate("/teacher/notifications")}
            aria-label="Notifications"
            title="Notifications"
          >
            <i className="fa-regular fa-bell"></i>

            {unreadNotificationCount > 0 && (
              <span
                className="teacher-notification-dot"
                aria-label={`${unreadNotificationCount} unread notifications`}
              >
                {unreadNotificationCount > 99
                  ? "99+"
                  : unreadNotificationCount}
              </span>
            )}
          </button>

          {/* ==================================================
              SETTINGS BUTTON
          ================================================== */}

          <button
            type="button"
            className="teacher-topbar-icon"
            onClick={() => navigate("/teacher/settings")}
            aria-label="Settings"
            title="Settings"
          >
            <i className="fa-solid fa-gear"></i>
          </button>

          <div className="teacher-topbar-divider"></div>

          {/* ==================================================
              MINI PROFILE
          ================================================== */}

          <div className="teacher-mini-profile">
            <div className="teacher-mini-avatar">
              {displayName.charAt(0).toUpperCase()}
            </div>

            <div className="teacher-mini-info">
              <strong>{displayName}</strong>
              <span>Teacher</span>
            </div>
          </div>
        </div>
      </header>

      {/* ======================================================
          MAIN CONTENT
      ====================================================== */}

      <main className="teacher-main-content">

        {/* ====================================================
            PAGE HEADING
        ==================================================== */}

        <div className="teacher-page-heading">
          <div>
            <h1>Settings</h1>

            <p>
              Manage your account details and password.
            </p>
          </div>

          <div className="teacher-current-date">
            <i className="fa-regular fa-calendar"></i>

            <span>{formattedDate}</span>
          </div>
        </div>

        {/* ====================================================
            LOADING
        ==================================================== */}

        {loading && (
          <div
            className="teacher-profile-loading"
            aria-busy="true"
          >
            <div className="teacher-profile-skeleton-grid">
              <div className="teacher-profile-skeleton"></div>
              <div className="teacher-profile-skeleton"></div>
            </div>

            <p>Loading your settings...</p>
          </div>
        )}

        {/* ====================================================
            ERROR
        ==================================================== */}

        {!loading && loadError && (
          <section className="teacher-dashboard-card teacher-profile-error">
            <div className="teacher-empty-content">

              <div className="teacher-empty-icon blue">
                <i className="fa-solid fa-circle-exclamation"></i>
              </div>

              <h3>Unable to load settings</h3>

              <p>{loadError}</p>

              <button
                type="button"
                className="teacher-profile-retry"
                onClick={loadSettings}
              >
                <i className="fa-solid fa-rotate-right"></i>

                Try again
              </button>

            </div>
          </section>
        )}

        {/* ====================================================
            SETTINGS CONTENT
        ==================================================== */}

        {!loading && !loadError && (
          <div className="teacher-settings-grid">

            {/* ==================================================
                ACCOUNT SETTINGS
            ================================================== */}

            <SettingsSection
              icon="fa-regular fa-user"
              title="Account Settings"
              description="Update the personal details on your login account"
            >
              <form
                className="teacher-settings-form"
                onSubmit={handleSaveAccount}
                noValidate
              >

                {accountMessage.text && (
                  <div
                    className={`teacher-settings-banner ${accountMessage.type}`}
                    role="status"
                  >
                    <i
                      className={
                        accountMessage.type === "success"
                          ? "fa-solid fa-circle-check"
                          : "fa-solid fa-circle-exclamation"
                      }
                    ></i>

                    <span>
                      {accountMessage.text}
                    </span>
                  </div>
                )}

                <div className="teacher-profile-fields">
                  <div className="teacher-profile-field">
                    <span>Account type</span>

                    <strong>
                      {formatIdentity(identity)}
                    </strong>
                  </div>
                </div>

                {/* NAME */}

                <label className="teacher-settings-field">
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

                {/* EMAIL */}

                <label className="teacher-settings-field">
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

                {/* PHONE */}

                <label className="teacher-settings-field">
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

                {/* AVATAR URL */}

                <label className="teacher-settings-field">
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

                {/* SAVE */}

                <button
                  type="submit"
                  className="teacher-settings-submit"
                  disabled={savingAccount}
                >
                  {savingAccount ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-floppy-disk"></i>
                      Save account settings
                    </>
                  )}
                </button>

              </form>
            </SettingsSection>

            {/* ==================================================
                PASSWORD & SECURITY
            ================================================== */}

            <SettingsSection
              icon="fa-solid fa-lock"
              title="Password & Security"
              description="Change the password you use to sign in"
            >
              <form
                className="teacher-settings-form"
                onSubmit={handleChangePassword}
                noValidate
              >

                {passwordMessage.text && (
                  <div
                    className={`teacher-settings-banner ${passwordMessage.type}`}
                    role="status"
                  >
                    <i
                      className={
                        passwordMessage.type === "success"
                          ? "fa-solid fa-circle-check"
                          : "fa-solid fa-circle-exclamation"
                      }
                    ></i>

                    <span>
                      {passwordMessage.text}
                    </span>
                  </div>
                )}

                {/* CURRENT PASSWORD */}

                <label className="teacher-settings-field">
                  <span>Current password</span>

                  <input
                    type="password"
                    name="currentPassword"
                    maxLength={72}
                    autoComplete="current-password"
                    value={password.currentPassword}
                    onChange={handlePasswordChange(
                      "currentPassword"
                    )}
                    disabled={savingPassword}
                  />
                </label>

                {/* NEW PASSWORD */}

                <label className="teacher-settings-field">
                  <span>New password</span>

                  <input
                    type="password"
                    name="newPassword"
                    maxLength={72}
                    autoComplete="new-password"
                    value={password.newPassword}
                    onChange={handlePasswordChange(
                      "newPassword"
                    )}
                    disabled={savingPassword}
                  />
                </label>

                {/* CONFIRM PASSWORD */}

                <label className="teacher-settings-field">
                  <span>Confirm new password</span>

                  <input
                    type="password"
                    name="confirmPassword"
                    maxLength={72}
                    autoComplete="new-password"
                    value={password.confirmPassword}
                    onChange={handlePasswordChange(
                      "confirmPassword"
                    )}
                    disabled={savingPassword}
                  />
                </label>

                <p className="teacher-settings-hint">
                  New password must be at least 8
                  characters. Confirmation is checked here
                  and is not sent to the server.
                </p>

                {/* CHANGE PASSWORD */}

                <button
                  type="submit"
                  className="teacher-settings-submit"
                  disabled={savingPassword}
                >
                  {savingPassword ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-key"></i>
                      Change password
                    </>
                  )}
                </button>

              </form>
            </SettingsSection>

          </div>
        )}
      </main>
    </div>
  );
}