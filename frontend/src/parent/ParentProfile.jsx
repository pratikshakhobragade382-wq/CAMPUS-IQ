import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Loader2,
  Mail,
  Pencil,
  Phone,
  RefreshCw,
  Shield,
  User,
  X,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import {
  getSettingsProfile,
  updateSettingsProfile,
} from "../api/settings.api";

import "./ParentProfile.css";

const HTML_RE = /[<>]/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMPTY = "—";

function displayValue(value) {
  if (value === null || value === undefined || value === "") {
    return EMPTY;
  }

  return String(value);
}

function formatIdentity(value) {
  if (!value) {
    return EMPTY;
  }

  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getApiErrorMessage(error, fallback) {
  if (!error?.response) {
    return fallback;
  }

  const status = error.response.status;
  const data = error.response.data || {};

  if (status === 401) {
    return "Your session has expired. Please sign in again.";
  }

  if (status === 403) {
    return "You do not have permission to update this profile.";
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

function validateProfile(form) {
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

function Field({ label, value }) {
  return (
    <div className="parent-profile-field">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function ParentProfile() {
  const { user, setUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    avatarUrl: "",
  });
  const [formMessage, setFormMessage] = useState({ type: "", text: "" });

  const syncAuthUser = useCallback(
    (updated) => {
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
    },
    [setUser, user]
  );

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError("");
    setFormMessage({ type: "", text: "" });

    try {
      const response = await getSettingsProfile();
      const data = response?.data;

      if (!data) {
        setProfile(null);
        setError("Profile information is not available yet.");
        return;
      }

      setProfile(data);
      setForm({
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        avatarUrl: data.avatarUrl || "",
      });
    } catch (err) {
      console.error("Failed to load parent profile:", err);
      setProfile(null);
      setError(
        getApiErrorMessage(
          err,
          "Unable to load your profile. Please try again."
        )
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
    setFormMessage({ type: "", text: "" });
  };

  const startEditing = () => {
    if (!profile) {
      return;
    }

    setForm({
      name: profile.name || "",
      email: profile.email || "",
      phone: profile.phone || "",
      avatarUrl: profile.avatarUrl || "",
    });
    setFormMessage({ type: "", text: "" });
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setFormMessage({ type: "", text: "" });

    if (profile) {
      setForm({
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        avatarUrl: profile.avatarUrl || "",
      });
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();

    const validationError = validateProfile(form);
    if (validationError) {
      setFormMessage({ type: "error", text: validationError });
      return;
    }

    setSaving(true);
    setFormMessage({ type: "", text: "" });

    try {
      const response = await updateSettingsProfile({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        avatarUrl: form.avatarUrl.trim(),
      });

      const updated = response?.data;
      if (updated) {
        setProfile(updated);
        setForm({
          name: updated.name || "",
          email: updated.email || "",
          phone: updated.phone || "",
          avatarUrl: updated.avatarUrl || "",
        });
        syncAuthUser(updated);
      }

      setEditing(false);
      setFormMessage({
        type: "success",
        text: "Profile updated successfully.",
      });
    } catch (err) {
      console.error("Failed to update parent profile:", err);
      setFormMessage({
        type: "error",
        text: getApiErrorMessage(err, "Unable to save your profile."),
      });
    } finally {
      setSaving(false);
    }
  };

  const parentName = profile?.name || user?.name || "Parent";
  const avatarUrl = editing ? form.avatarUrl.trim() : profile?.avatarUrl;

  return (
    <div className="parent-profile-page">
      <div className="parent-profile-topbar">
        <div>
          <h1>My Profile</h1>
          <p>View and update the account details linked to your parent login.</p>
        </div>

        {!loading && !error && profile && !editing && (
          <button type="button" className="parent-profile-edit-btn" onClick={startEditing}>
            <Pencil size={16} />
            Edit profile
          </button>
        )}
      </div>

      {loading && (
        <div className="parent-module-status" aria-busy="true">
          <div className="parent-module-spinner" />
          <p>Loading your profile...</p>
        </div>
      )}

      {!loading && error && (
        <div className="parent-module-status error">
          <div className="parent-module-status-icon error">
            <AlertCircle size={28} />
          </div>
          <h3>Unable to load profile</h3>
          <p>{error}</p>
          <button type="button" className="parent-profile-retry-btn" onClick={loadProfile}>
            <RefreshCw size={15} />
            Try again
          </button>
        </div>
      )}

      {!loading && !error && !profile && (
        <div className="parent-module-status">
          <div className="parent-module-status-icon">
            <User size={28} />
          </div>
          <h3>No profile data</h3>
          <p>Your profile information is not available yet.</p>
        </div>
      )}

      {!loading && !error && profile && (
        <>
          {formMessage.text && !editing && (
            <div className={`parent-profile-banner ${formMessage.type}`} role="status">
              {formMessage.type === "success" ? (
                <CheckCircle2 size={16} />
              ) : (
                <AlertCircle size={16} />
              )}
              <span>{formMessage.text}</span>
            </div>
          )}

          <section className="parent-profile-hero">
            {avatarUrl ? (
              <img
                className="parent-profile-photo"
                src={avatarUrl}
                alt={parentName}
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div className="parent-profile-photo-fallback">
                {parentName.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="parent-profile-hero-info">
              <span>Parent Profile</span>
              <h2>{parentName}</h2>
              <p>{formatIdentity(profile.identity)}</p>

              <div className="parent-profile-hero-meta">
                <span>
                  <Mail size={14} />
                  {displayValue(profile.email)}
                </span>
                <span>
                  <Phone size={14} />
                  {displayValue(profile.phone)}
                </span>
              </div>
            </div>
          </section>

          <section className="parent-profile-card">
            <div className="parent-profile-card-header">
              <div className="parent-profile-card-icon">
                <User size={18} />
              </div>
              <div>
                <h2>Account information</h2>
                <p>
                  {editing
                    ? "Update the fields supported by your CampusIQ account."
                    : "These details come from your parent account."}
                </p>
              </div>
            </div>

            {!editing ? (
              <div className="parent-profile-fields">
                <Field label="Full name" value={displayValue(profile.name)} />
                <Field label="Email" value={displayValue(profile.email)} />
                <Field label="Mobile number" value={displayValue(profile.phone)} />
                <Field label="Role / identity" value={formatIdentity(profile.identity)} />
                <Field
                  label="Profile photo"
                  value={profile.avatarUrl ? "Photo available" : "No photo added"}
                />
              </div>
            ) : (
              <form className="parent-profile-form" onSubmit={handleSave} noValidate>
                {formMessage.text && (
                  <div className={`parent-profile-banner ${formMessage.type}`} role="status">
                    {formMessage.type === "success" ? (
                      <CheckCircle2 size={16} />
                    ) : (
                      <AlertCircle size={16} />
                    )}
                    <span>{formMessage.text}</span>
                  </div>
                )}

                <label className="parent-profile-input">
                  <span>Name</span>
                  <input
                    type="text"
                    name="name"
                    maxLength={100}
                    autoComplete="name"
                    value={form.name}
                    onChange={handleChange("name")}
                    disabled={saving}
                  />
                </label>

                <label className="parent-profile-input">
                  <span>Email</span>
                  <input
                    type="email"
                    name="email"
                    maxLength={254}
                    autoComplete="email"
                    value={form.email}
                    onChange={handleChange("email")}
                    disabled={saving}
                  />
                </label>

                <label className="parent-profile-input">
                  <span>Mobile number</span>
                  <input
                    type="text"
                    name="phone"
                    maxLength={20}
                    autoComplete="tel"
                    value={form.phone}
                    onChange={handleChange("phone")}
                    disabled={saving}
                  />
                </label>

                <label className="parent-profile-input">
                  <span>
                    <Camera size={12} />
                    Profile photo URL
                  </span>
                  <input
                    type="text"
                    name="avatarUrl"
                    maxLength={500}
                    autoComplete="off"
                    placeholder="https://"
                    value={form.avatarUrl}
                    onChange={handleChange("avatarUrl")}
                    disabled={saving}
                  />
                </label>

                <div className="parent-profile-identity-note">
                  <Shield size={14} />
                  <span>
                    Role / identity is <strong>{formatIdentity(profile.identity)}</strong> and
                    cannot be changed here.
                  </span>
                </div>

                <div className="parent-profile-form-actions">
                  <button
                    type="button"
                    className="parent-profile-cancel-btn"
                    onClick={cancelEditing}
                    disabled={saving}
                  >
                    <X size={15} />
                    Cancel
                  </button>
                  <button type="submit" className="parent-profile-save-btn" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 size={15} className="parent-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save changes"
                    )}
                  </button>
                </div>
              </form>
            )}
          </section>
        </>
      )}
    </div>
  );
}
