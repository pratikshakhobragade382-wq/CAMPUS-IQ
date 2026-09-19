import { useCallback, useEffect, useState } from "react";

import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  GraduationCap,
  Hash,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  User,
  UserRound,
  Users,
} from "lucide-react";

import {
  getMyChildren,
  getChildProfile,
} from "../api/parent.api";

import "./MyChildren.css";

/* ============================================================
   MY CHILDREN PAGE
============================================================ */

export default function MyChildren() {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* --------------------------------------------------------
     EXPANDED PROFILE STATE
  -------------------------------------------------------- */

  const [expandedId, setExpandedId] = useState(null);
  const [profileData, setProfileData] = useState({});
  const [profileLoading, setProfileLoading] = useState({});

  /* --------------------------------------------------------
     FETCH CHILDREN
  -------------------------------------------------------- */

  const fetchChildren = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await getMyChildren();
      setChildren(res?.data || []);
    } catch (err) {
      console.error("Failed to load children:", err);
      setError(
        err?.response?.data?.error ||
        err?.message ||
        "Failed to load children."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  /* --------------------------------------------------------
     TOGGLE PROFILE
  -------------------------------------------------------- */

  const toggleProfile = async (studentId) => {
    if (expandedId === studentId) {
      setExpandedId(null);
      return;
    }

    setExpandedId(studentId);

    if (profileData[studentId]) return;

    setProfileLoading((prev) => ({
      ...prev,
      [studentId]: true,
    }));

    try {
      const res = await getChildProfile(studentId);

      setProfileData((prev) => ({
        ...prev,
        [studentId]: res?.data || null,
      }));
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setProfileLoading((prev) => ({
        ...prev,
        [studentId]: false,
      }));
    }
  };

  /* --------------------------------------------------------
     FORMAT DATE
  -------------------------------------------------------- */

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";

    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  };

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div className="my-children-page">

      {/* ======================================================
          TOP HEADER
      ====================================================== */}

      <div className="children-topbar">

        <div>
          <span className="page-eyebrow">
            Parent Portal
          </span>

          <h1>My Children</h1>

          <p>
            View your children&apos;s profiles, class information,
            and academic details all in one place.
          </p>
        </div>

        {!loading && !error && children.length > 0 && (
          <div className="children-count-badge">
            <span className="count-number">
              {children.length}
            </span>
            <span className="count-label">
              {children.length === 1
                ? "Child\nEnrolled"
                : "Children\nEnrolled"}
            </span>
          </div>
        )}

      </div>

      {/* ======================================================
          LOADING STATE
      ====================================================== */}

      {loading && (
        <div className="children-loading">
          <div className="loading-spinner" />
          <p>Loading your children&apos;s information…</p>
        </div>
      )}

      {/* ======================================================
          ERROR STATE
      ====================================================== */}

      {!loading && error && (
        <div className="children-error">
          <div className="children-error-icon">
            <AlertCircle size={28} />
          </div>

          <h3>Unable to Load</h3>

          <p>{error}</p>

          <button
            type="button"
            className="children-retry-btn"
            onClick={fetchChildren}
          >
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      )}

      {/* ======================================================
          EMPTY STATE
      ====================================================== */}

      {!loading && !error && children.length === 0 && (
        <div className="children-empty">
          <div className="children-empty-icon">
            <Users size={36} />
          </div>

          <h3>No Children Found</h3>

          <p>
            No children are currently linked to your account.
            Please contact the school administration for assistance.
          </p>
        </div>
      )}

      {/* ======================================================
          CHILDREN GRID
      ====================================================== */}

      {!loading && !error && children.length > 0 && (
        <div className="children-grid">

          {children.map((child) => {

            const isExpanded = expandedId === child.id;
            const profile = profileData[child.id];
            const isProfileLoading = profileLoading[child.id];

            return (
              <div
                key={child.id}
                className="child-card"
              >

                {/* ==========================================
                    CARD HEADER
                ========================================== */}

                <div className="child-card-header">

                  {child.photoUrl ? (
                    <img
                      src={child.photoUrl}
                      alt={child.studentName}
                      className="child-avatar"
                    />
                  ) : (
                    <div className="child-avatar-placeholder">
                      {(child.studentName || "S")
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}

                  <div className="child-info">

                    <h2 className="child-name">
                      {child.studentName || "Student"}
                    </h2>

                    <div className="child-class-info">

                      <span className="child-class-badge">
                        <GraduationCap size={13} />
                        {child.class?.name || "—"}
                      </span>

                      {child.section?.name && (
                        <span className="child-class-badge">
                          Section {child.section.name}
                        </span>
                      )}

                    </div>

                  </div>

                </div>

                {/* ==========================================
                    DETAILS GRID
                ========================================== */}

                <div className="child-details-grid">

                  <div className="child-detail-item">
                    <div className="child-detail-icon">
                      <Hash size={16} />
                    </div>
                    <div className="child-detail-text">
                      <span className="detail-label">
                        Admission No
                      </span>
                      <span className="detail-value">
                        {child.admissionNo || "—"}
                      </span>
                    </div>
                  </div>

                  <div className="child-detail-item">
                    <div className="child-detail-icon">
                      <BookOpen size={16} />
                    </div>
                    <div className="child-detail-text">
                      <span className="detail-label">
                        Roll No
                      </span>
                      <span className="detail-value">
                        {child.rollNo || "—"}
                      </span>
                    </div>
                  </div>

                  <div className="child-detail-item">
                    <div className="child-detail-icon">
                      <User size={16} />
                    </div>
                    <div className="child-detail-text">
                      <span className="detail-label">
                        Gender
                      </span>
                      <span className="detail-value">
                        {child.gender || "—"}
                      </span>
                    </div>
                  </div>

                  <div className="child-detail-item">
                    <div className="child-detail-icon">
                      <CalendarDays size={16} />
                    </div>
                    <div className="child-detail-text">
                      <span className="detail-label">
                        Date of Birth
                      </span>
                      <span className="detail-value">
                        {formatDate(child.dateOfBirth)}
                      </span>
                    </div>
                  </div>

                </div>

                {/* ==========================================
                    ACTIONS
                ========================================== */}

                <div className="child-card-actions">

                  <button
                    type="button"
                    className="child-view-btn"
                    onClick={() => toggleProfile(child.id)}
                  >
                    <UserRound size={15} />
                    {isExpanded
                      ? "Hide Profile"
                      : "View Profile"}
                    {isExpanded
                      ? <ChevronUp size={15} />
                      : <ChevronDown size={15} />}
                  </button>

                </div>

                {/* ==========================================
                    EXPANDED PROFILE
                ========================================== */}

                {isExpanded && (
                  <div className="child-profile-panel">

                    {isProfileLoading && (
                      <div
                        className="children-loading"
                        style={{ padding: "30px 0" }}
                      >
                        <div className="loading-spinner" />
                        <p>Loading profile details…</p>
                      </div>
                    )}

                    {!isProfileLoading && profile?.parents?.length > 0 && (
                      <>
                        <div className="profile-section-title">
                          <Users size={15} />
                          Guardian Information
                        </div>

                        <div className="parent-info-grid">
                          {profile.parents.map((parent) => (
                            <div
                              key={parent.id}
                              className="parent-info-card"
                            >
                              <div className="parent-info-avatar">
                                {(parent.name || "P")
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div className="parent-info-text">
                                <span className="parent-relation">
                                  {parent.relation || "Guardian"}
                                </span>
                                <span className="parent-name">
                                  {parent.name || "—"}
                                </span>
                                {(parent.mobile || parent.email) && (
                                  <span className="parent-contact">
                                    {parent.mobile && (
                                      <>
                                        <Phone
                                          size={10}
                                          style={{
                                            display: "inline",
                                            marginRight: 4,
                                            verticalAlign: "middle",
                                          }}
                                        />
                                        {parent.mobile}
                                      </>
                                    )}
                                    {parent.mobile && parent.email && " · "}
                                    {parent.email && (
                                      <>
                                        <Mail
                                          size={10}
                                          style={{
                                            display: "inline",
                                            marginRight: 4,
                                            verticalAlign: "middle",
                                          }}
                                        />
                                        {parent.email}
                                      </>
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {!isProfileLoading &&
                      (!profile || !profile.parents?.length) && (
                        <p
                          style={{
                            textAlign: "center",
                            color: "#94a3b8",
                            fontSize: 13,
                            padding: "20px 0",
                          }}
                        >
                          No additional profile information available.
                        </p>
                      )}

                  </div>
                )}

              </div>
            );
          })}

        </div>
      )}

    </div>
  );
}
