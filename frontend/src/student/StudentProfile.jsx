import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  GraduationCap,
  Heart,
  Mail,
  Phone,
  RefreshCw,
  User,
  Users,
} from "lucide-react";

import { getMyStudentProfile } from "../api/studentPortal.api";

import "./StudentProfile.css";

const EMPTY = "—";

const HIDDEN_STUDENT_KEYS = new Set([
  "id",
  "classId",
  "sectionId",
  "tenantId",
  "isDeleted",
  "createdAt",
  "updatedAt",
  "aadharNo",
  "accountNo",
  "ifsc",
  "bankName",
  "virtualAccountNo",
  "eNach",
  "rfidNo",
  "signatureUrl",
  "remark",
  "feeRemark",
  "customFieldValues",
  "examMarks",
  "feeCollections",
  "studentAttendances",
  "user",
  "tenant",
  "class",
  "section",
  "parents",
  "photoUrl",
  "studentName",
]);

function displayValue(value) {
  if (value === null || value === undefined || value === "") {
    return EMPTY;
  }

  return String(value);
}

function formatLabel(value) {
  if (value === null || value === undefined || value === "") {
    return EMPTY;
  }

  return String(value)
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDateValue(value) {
  if (!value) {
    return EMPTY;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return EMPTY;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
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
    return "You do not have permission to view this profile.";
  }

  if (status === 404) {
    return "Student profile was not found.";
  }

  if (typeof data.error === "string" && data.error && data.error !== "Something went wrong") {
    return data.error;
  }

  if (typeof data.message === "string" && data.message) {
    return data.message;
  }

  return fallback;
}

function Field({ label, value }) {
  return (
    <div className="student-profile-field">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function hasMeaningfulValue(value) {
  if (value === null || value === undefined || value === "") {
    return false;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === "object") {
    return Object.keys(value).length > 0;
  }

  return true;
}

export default function StudentProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProfile = useCallback(async () => {
    try {
      const response = await getMyStudentProfile();
      const data = response?.data;

      if (!data) {
        setProfile(null);
        setError("Profile information is not available yet.");
        return;
      }

      setProfile(data);
      setError("");
    } catch (err) {
      console.error("Failed to load student profile:", err);
      setProfile(null);
      setError(
        getApiErrorMessage(err, "Unable to load your profile. Please try again.")
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await getMyStudentProfile();
        if (cancelled) {
          return;
        }

        const data = response?.data;

        if (!data) {
          setProfile(null);
          setError("Profile information is not available yet.");
          return;
        }

        setProfile(data);
        setError("");
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error("Failed to load student profile:", err);
        setProfile(null);
        setError(
          getApiErrorMessage(err, "Unable to load your profile. Please try again.")
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
    setError("");
    loadProfile();
  };

  const studentName = profile?.studentName || "Student";
  const photoUrl = profile?.photoUrl;
  const className = profile?.class?.name;
  const sectionName = profile?.section?.name;
  const parents = Array.isArray(profile?.parents) ? profile.parents : [];

  const extraFields = profile
    ? Object.entries(profile).filter(
        ([key, value]) =>
          !HIDDEN_STUDENT_KEYS.has(key) && hasMeaningfulValue(value)
      )
    : [];

  const extraPersonalKeys = new Set([
    "gender",
    "dateOfBirth",
    "bloodGroup",
    "category",
    "religion",
    "nationality",
    "motherTongue",
    "maritalStatus",
    "childLivingWith",
    "fatherTitle",
    "fatherName",
    "motherTitle",
    "motherName",
  ]);

  const extraAcademicKeys = new Set([
    "admissionNo",
    "rollNo",
    "feeNo",
    "uniqueNo",
    "grNo",
    "srnNo",
    "apaarId",
    "boardRegistrationNo",
    "classAdmitted",
    "admissionType",
    "dateOfAdmission",
    "dateOfJoin",
    "stream",
    "house",
    "boardingCategory",
    "board",
    "medium",
    "feeGroup",
    "feePaymentStartFrom",
    "siblingAdmNo",
  ]);

  const extraContactKeys = new Set([
    "studentEmail",
    "communicationEmail",
    "communicationMobile",
    "emergencyPhoneNo",
    "countryCode",
  ]);

  const dateKeys = new Set([
    "dateOfBirth",
    "dateOfAdmission",
    "dateOfJoin",
  ]);

  const personalFields = extraFields.filter(([key]) => extraPersonalKeys.has(key));
  const academicFields = extraFields.filter(([key]) => extraAcademicKeys.has(key));
  const contactFields = extraFields.filter(([key]) => extraContactKeys.has(key));
  const remainingFields = extraFields.filter(
    ([key, value]) =>
      !extraPersonalKeys.has(key) &&
      !extraAcademicKeys.has(key) &&
      !extraContactKeys.has(key) &&
      typeof value !== "object"
  );

  const formatFieldValue = (key, value) => {
    if (dateKeys.has(key)) {
      return formatDateValue(value);
    }

    if (key === "gender" || key === "admissionType") {
      return formatLabel(value);
    }

    if (typeof value === "object") {
      return EMPTY;
    }

    return displayValue(value);
  };

  return (
    <div className="student-profile-page">
      {loading && (
        <div className="student-module-status" aria-busy="true">
          <div className="student-module-spinner" />
          <p>Loading your profile...</p>
        </div>
      )}

      {!loading && error && (
        <div className="student-module-status error">
          <div className="student-module-status-icon error">
            <AlertCircle size={28} />
          </div>
          <h3>Unable to load profile</h3>
          <p>{error}</p>
          <button type="button" className="student-profile-retry-btn" onClick={retryLoad}>
            <RefreshCw size={15} />
            Try again
          </button>
        </div>
      )}

      {!loading && !error && !profile && (
        <div className="student-module-status">
          <div className="student-module-status-icon">
            <User size={28} />
          </div>
          <h3>No profile data</h3>
          <p>Your profile information is not available yet.</p>
        </div>
      )}

      {!loading && !error && profile && (
        <>
          <section className="student-profile-hero">
            {photoUrl ? (
              <img
                className="student-profile-photo"
                src={photoUrl}
                alt={studentName}
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div className="student-profile-photo-fallback">
                {studentName.trim().charAt(0).toUpperCase()}
              </div>
            )}

            <div className="student-profile-hero-info">
              <span>Student Profile</span>
              <h2>{studentName}</h2>
              <p>
                {[className, sectionName].filter(Boolean).join(" · ") || "Student"}
              </p>

              <div className="student-profile-hero-meta">
                <span>
                  <GraduationCap size={14} />
                  {displayValue(profile.admissionNo)}
                </span>
                <span>
                  <BookOpen size={14} />
                  Roll {displayValue(profile.rollNo)}
                </span>
                {profile.studentEmail || profile.communicationEmail ? (
                  <span>
                    <Mail size={14} />
                    {displayValue(profile.studentEmail || profile.communicationEmail)}
                  </span>
                ) : null}
                {profile.communicationMobile || profile.emergencyPhoneNo ? (
                  <span>
                    <Phone size={14} />
                    {displayValue(
                      profile.communicationMobile || profile.emergencyPhoneNo
                    )}
                  </span>
                ) : null}
              </div>
            </div>
          </section>

          <p className="student-profile-readonly-note">
            School records on this page are read-only. Login account details can be
            updated in Settings.
          </p>

          {(academicFields.length > 0 || className || sectionName) && (
            <section className="student-profile-card">
              <div className="student-profile-card-header">
                <div className="student-profile-card-icon">
                  <GraduationCap size={18} />
                </div>
                <div>
                  <h2>Academic information</h2>
                  <p>Class, admission, and school identifiers from your student record.</p>
                </div>
              </div>

              <div className="student-profile-fields">
                <Field label="Class" value={displayValue(className)} />
                <Field label="Section" value={displayValue(sectionName)} />
                {academicFields.map(([key, value]) => (
                  <Field
                    key={key}
                    label={formatLabel(key)}
                    value={formatFieldValue(key, value)}
                  />
                ))}
              </div>
            </section>
          )}

          {personalFields.length > 0 && (
            <section className="student-profile-card">
              <div className="student-profile-card-header">
                <div className="student-profile-card-icon">
                  <Heart size={18} />
                </div>
                <div>
                  <h2>Personal information</h2>
                  <p>Details stored on your student profile.</p>
                </div>
              </div>

              <div className="student-profile-fields">
                {personalFields.map(([key, value]) => (
                  <Field
                    key={key}
                    label={formatLabel(key)}
                    value={formatFieldValue(key, value)}
                  />
                ))}
              </div>
            </section>
          )}

          {contactFields.length > 0 && (
            <section className="student-profile-card">
              <div className="student-profile-card-header">
                <div className="student-profile-card-icon">
                  <Phone size={18} />
                </div>
                <div>
                  <h2>Contact information</h2>
                  <p>Email and phone numbers from your student record.</p>
                </div>
              </div>

              <div className="student-profile-fields">
                {contactFields.map(([key, value]) => (
                  <Field
                    key={key}
                    label={formatLabel(key)}
                    value={formatFieldValue(key, value)}
                  />
                ))}
              </div>
            </section>
          )}

          {parents.length > 0 && (
            <section className="student-profile-card">
              <div className="student-profile-card-header">
                <div className="student-profile-card-icon">
                  <Users size={18} />
                </div>
                <div>
                  <h2>Parent / guardian</h2>
                  <p>Linked parent contacts from your student record.</p>
                </div>
              </div>

              <div className="student-profile-parent-list">
                {parents.map((parent) => (
                  <div key={parent.id || `${parent.relation}-${parent.name}`} className="student-profile-parent-card">
                    <strong>{displayValue(parent.name)}</strong>
                    <span>{formatLabel(parent.relation)}</span>
                    <p>
                      <Mail size={13} />
                      {displayValue(parent.email)}
                    </p>
                    <p>
                      <Phone size={13} />
                      {displayValue(parent.mobile)}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {remainingFields.length > 0 && (
            <section className="student-profile-card">
              <div className="student-profile-card-header">
                <div className="student-profile-card-icon">
                  <User size={18} />
                </div>
                <div>
                  <h2>Other information</h2>
                  <p>Additional fields returned by your student profile.</p>
                </div>
              </div>

              <div className="student-profile-fields">
                {remainingFields.map(([key, value]) => (
                  <Field
                    key={key}
                    label={formatLabel(key)}
                    value={formatFieldValue(key, value)}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
