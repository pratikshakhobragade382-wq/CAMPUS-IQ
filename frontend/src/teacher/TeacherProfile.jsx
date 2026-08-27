import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getStaffById } from "../api/staff.api";
import "./TeacherDashboard.css";
import "./TeacherProfile.css";

const EMPTY = "—";

function displayValue(value) {
  if (value === null || value === undefined || value === "") {
    return EMPTY;
  }

  if (typeof value === "number" && Number.isNaN(value)) {
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

function formatSalary(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return String(value);
  }

  return amount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });
}

const NON_DISPLAY_KEYS = new Set([
  "id",
  "staffId",
  "tenantId",
  "createdAt",
  "updatedAt",
]);

function hasMeaningfulValue(value) {
  if (value === null || value === undefined || value === "") {
    return false;
  }

  if (Array.isArray(value)) {
    return value.some(hasMeaningfulValue);
  }

  if (typeof value === "object") {
    return Object.entries(value).some(
      ([key, nested]) => !NON_DISPLAY_KEYS.has(key) && hasMeaningfulValue(nested)
    );
  }

  return true;
}

function getProfileErrorMessage(error, staffId) {
  if (!staffId) {
    return "Your teacher profile could not be loaded because no staff ID is linked to this account. Please contact the school administration.";
  }

  if (!error?.response) {
    return "Unable to load your profile. Please check your connection and try again.";
  }

  const status = error.response.status;

  if (status === 401) {
    return "Your session has expired. Please sign in again.";
  }

  if (status === 403) {
    return "You do not have permission to view this profile.";
  }

  if (status === 404) {
    return "Staff profile was not found.";
  }

  return "Unable to load your profile right now. Please try again later.";
}

function Field({ label, value }) {
  return (
    <div className="teacher-profile-field">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ProfileSection({ icon, title, description, children }) {
  return (
    <section className="teacher-dashboard-card teacher-profile-section">
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

export default function TeacherProfile() {
  const { user } = useAuth();

  const staffId = user?.staffId ?? user?.staff?.id ?? null;

  const headerName =
    user?.staff?.name ||
    user?.name ||
    user?.fullName ||
    "Teacher";

  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProfile = useCallback(async () => {
    if (!staffId) {
      setStaff(null);
      setError(getProfileErrorMessage(null, null));
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await getStaffById(staffId);
      const profile = response?.data;

      if (!profile) {
        setStaff(null);
        setError("Profile information is not available yet.");
        return;
      }

      setStaff(profile);
    } catch (err) {
      console.error("Failed to load teacher profile:", err);
      setStaff(null);
      setError(getProfileErrorMessage(err, staffId));
    } finally {
      setLoading(false);
    }
  }, [staffId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const subjects = useMemo(() => {
    if (!Array.isArray(staff?.subjects)) {
      return [];
    }

    return staff.subjects
      .map((item) => item?.subject || item)
      .filter((subject) => subject?.name || subject?.code);
  }, [staff]);

  const spouseHasData = hasMeaningfulValue(staff?.spouse);
  const children = Array.isArray(staff?.children)
    ? staff.children.filter(hasMeaningfulValue)
    : [];
  const familyHasData = spouseHasData || children.length > 0;

  const address = staff?.address || null;
  const otherDetails = staff?.otherDetails || null;
  const departmentName = staff?.department?.name;
  const designation =
    otherDetails?.designation || formatLabel(staff?.role);

  const salaryDisplay = formatSalary(staff?.salary);

  const teacherName = staff?.name || headerName;
  const teacherEmail = staff?.email || user?.email || EMPTY;
  const teacherPhone = staff?.phone || staff?.mobileNo || EMPTY;
  const employeeId = staff?.employeeId || EMPTY;
  const isDeleted = Boolean(staff?.isDeleted);

  const formattedDate = new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const presentAddressParts = [
    address?.presentAddress,
    address?.presentCity,
    address?.presentState,
    address?.presentCountry,
    address?.presentPinCode,
  ].filter(Boolean);

  const permanentAddressParts = [
    address?.permanentAddress,
    address?.permanentCity,
    address?.permanentState,
    address?.permanentCountry,
    address?.permanentPinCode,
  ].filter(Boolean);

  const addressHasData = hasMeaningfulValue(address);
  const otherDetailsHasData = hasMeaningfulValue(otherDetails);

  return (
    <div className="teacher-panel teacher-profile-page">
      <header className="teacher-topbar">
        <div className="teacher-search">
          <i className="fa-solid fa-magnifying-glass"></i>
          <input type="text" placeholder="Search anything..." />
        </div>

        <div className="teacher-topbar-actions">
          <button type="button" className="teacher-topbar-icon">
            <i className="fa-regular fa-bell"></i>
            <span className="teacher-notification-dot">1</span>
          </button>

          <button type="button" className="teacher-topbar-icon">
            <i className="fa-solid fa-gear"></i>
          </button>

          <div className="teacher-topbar-divider"></div>

          <div className="teacher-mini-profile">
            <div className="teacher-mini-avatar">
              {teacherName.charAt(0).toUpperCase()}
            </div>

            <div className="teacher-mini-info">
              <strong>{teacherName}</strong>
              <span>Teacher</span>
            </div>
          </div>
        </div>
      </header>

      <main className="teacher-main-content">
        <div className="teacher-page-heading">
          <div>
            <h1>My Profile</h1>
            <p>View and manage your personal and professional information.</p>
          </div>

          <div className="teacher-current-date">
            <i className="fa-regular fa-calendar"></i>
            <span>{formattedDate}</span>
          </div>
        </div>

        <div className="teacher-profile-notice">
          <i className="fa-solid fa-lock"></i>
          <div>
            <strong>View only</strong>
            <p>
              Profile information is managed by the school administration.
            </p>
          </div>
        </div>

        {loading && (
          <div className="teacher-profile-loading" aria-busy="true">
            <div className="teacher-profile-skeleton hero"></div>
            <div className="teacher-profile-skeleton-grid">
              <div className="teacher-profile-skeleton"></div>
              <div className="teacher-profile-skeleton"></div>
              <div className="teacher-profile-skeleton"></div>
              <div className="teacher-profile-skeleton"></div>
            </div>
            <p>Loading your profile...</p>
          </div>
        )}

        {!loading && error && (
          <section className="teacher-dashboard-card teacher-profile-error">
            <div className="teacher-empty-content">
              <div className="teacher-empty-icon blue">
                <i className="fa-solid fa-circle-exclamation"></i>
              </div>

              <h3>Unable to load profile</h3>
              <p>{error}</p>

              {staffId && (
                <button
                  type="button"
                  className="teacher-profile-retry"
                  onClick={loadProfile}
                >
                  <i className="fa-solid fa-rotate-right"></i>
                  Try again
                </button>
              )}
            </div>
          </section>
        )}

        {!loading && !error && staff && (
          <>
            <section className="teacher-welcome-card teacher-profile-hero">
              <div className="teacher-welcome-left">
                {staff.photoUrl ? (
                  <img
                    className="teacher-large-avatar teacher-profile-photo"
                    src={staff.photoUrl}
                    alt={teacherName}
                  />
                ) : (
                  <div className="teacher-large-avatar">
                    {teacherName.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="teacher-welcome-info">
                  <span className="teacher-welcome-label">Teacher Profile</span>
                  <h2>{teacherName}</h2>
                  <p>Teacher</p>

                  <div className="teacher-profile-hero-meta">
                    <span>
                      <i className="fa-solid fa-id-card"></i>
                      {employeeId}
                    </span>
                    <span>
                      <i className="fa-solid fa-envelope"></i>
                      {teacherEmail}
                    </span>
                    <span>
                      <i className="fa-solid fa-phone"></i>
                      {teacherPhone}
                    </span>
                  </div>

                  <div
                    className={`teacher-active-status ${
                      isDeleted ? "inactive" : ""
                    }`}
                  >
                    <span></span>
                    {isDeleted ? "Inactive" : "Active"}
                  </div>
                </div>
              </div>

              <div className="teacher-welcome-decoration">
                <i className="fa-solid fa-chalkboard-user"></i>
              </div>
            </section>

            <div className="teacher-profile-grid">
              <ProfileSection
                icon="fa-regular fa-user"
                title="Personal Information"
                description="Your personal details on record"
              >
                <div className="teacher-profile-fields">
                  <Field label="Full Name" value={displayValue(staff.name)} />
                  <Field label="Gender" value={formatLabel(staff.gender)} />
                  <Field
                    label="Date of Birth"
                    value={formatDateValue(staff.dateOfBirth)}
                  />
                  <Field label="Phone" value={displayValue(staff.phone)} />
                  <Field label="Email" value={displayValue(staff.email)} />
                  <Field
                    label="Employee ID"
                    value={displayValue(staff.employeeId)}
                  />
                  <Field
                    label="Date of Joining"
                    value={formatDateValue(staff.dateOfJoining)}
                  />
                  <Field
                    label="Designation / Role"
                    value={designation}
                  />
                  {staff.mobileNo && (
                    <Field
                      label="Mobile No"
                      value={displayValue(staff.mobileNo)}
                    />
                  )}
                  {staff.officialEmail && (
                    <Field
                      label="Official Email"
                      value={displayValue(staff.officialEmail)}
                    />
                  )}
                  {staff.fatherName && (
                    <Field
                      label="Father's Name"
                      value={displayValue(staff.fatherName)}
                    />
                  )}
                  {staff.motherName && (
                    <Field
                      label="Mother's Name"
                      value={displayValue(staff.motherName)}
                    />
                  )}
                  {staff.bloodGroup && (
                    <Field
                      label="Blood Group"
                      value={displayValue(staff.bloodGroup)}
                    />
                  )}
                  {staff.nationality && (
                    <Field
                      label="Nationality"
                      value={displayValue(staff.nationality)}
                    />
                  )}
                  {staff.maritalStatus && (
                    <Field
                      label="Marital Status"
                      value={displayValue(staff.maritalStatus)}
                    />
                  )}
                </div>
              </ProfileSection>

              <ProfileSection
                icon="fa-solid fa-briefcase"
                title="Professional Information"
                description="Your role and department details"
              >
                <div className="teacher-profile-fields">
                  <Field
                    label="Employee ID"
                    value={displayValue(staff.employeeId)}
                  />
                  <Field
                    label="Department"
                    value={displayValue(departmentName)}
                  />
                  <Field
                    label="Designation / Role"
                    value={designation}
                  />
                  <Field
                    label="Date of Joining"
                    value={formatDateValue(staff.dateOfJoining)}
                  />
                  {staff.experience && (
                    <Field
                      label="Experience"
                      value={displayValue(staff.experience)}
                    />
                  )}
                  {staff.highQualification && (
                    <Field
                      label="Highest Qualification"
                      value={displayValue(staff.highQualification)}
                    />
                  )}
                  {staff.staffCategory && (
                    <Field
                      label="Staff Category"
                      value={displayValue(staff.staffCategory)}
                    />
                  )}
                  {salaryDisplay && (
                    <Field label="Salary" value={salaryDisplay} />
                  )}
                </div>
              </ProfileSection>

              <ProfileSection
                icon="fa-solid fa-location-dot"
                title="Address"
                description="Present and permanent address"
              >
                {!addressHasData ? (
                  <div className="teacher-profile-empty">
                    <p>No address information is available.</p>
                  </div>
                ) : (
                  <div className="teacher-profile-address-grid">
                    <div>
                      <h3>Present Address</h3>
                      <p>
                        {presentAddressParts.length
                          ? presentAddressParts.join(", ")
                          : EMPTY}
                      </p>
                      {address.presentTelephoneNo && (
                        <small>
                          Tel: {displayValue(address.presentTelephoneNo)}
                        </small>
                      )}
                    </div>

                    <div>
                      <h3>Permanent Address</h3>
                      <p>
                        {permanentAddressParts.length
                          ? permanentAddressParts.join(", ")
                          : EMPTY}
                      </p>
                      {address.permanentTelephoneNo && (
                        <small>
                          Tel: {displayValue(address.permanentTelephoneNo)}
                        </small>
                      )}
                    </div>
                  </div>
                )}
              </ProfileSection>

              <ProfileSection
                icon="fa-solid fa-file-lines"
                title="Other Details"
                description="Appointment and additional records"
              >
                {!otherDetailsHasData ? (
                  <div className="teacher-profile-empty">
                    <p>No additional details are available.</p>
                  </div>
                ) : (
                  <div className="teacher-profile-fields">
                    {otherDetails.designation && (
                      <Field
                        label="Designation"
                        value={displayValue(otherDetails.designation)}
                      />
                    )}
                    {otherDetails.natureOfAppointment && (
                      <Field
                        label="Nature of Appointment"
                        value={displayValue(otherDetails.natureOfAppointment)}
                      />
                    )}
                    {otherDetails.dateOfAppointment && (
                      <Field
                        label="Date of Appointment"
                        value={formatDateValue(otherDetails.dateOfAppointment)}
                      />
                    )}
                    {otherDetails.probationUpto && (
                      <Field
                        label="Probation Upto"
                        value={formatDateValue(otherDetails.probationUpto)}
                      />
                    )}
                    {otherDetails.dateOfConfirmation && (
                      <Field
                        label="Date of Confirmation"
                        value={formatDateValue(otherDetails.dateOfConfirmation)}
                      />
                    )}
                    {otherDetails.fromDate && (
                      <Field
                        label="From Date"
                        value={formatDateValue(otherDetails.fromDate)}
                      />
                    )}
                  </div>
                )}
              </ProfileSection>
            </div>

            <ProfileSection
              icon="fa-solid fa-book-open"
              title="Subjects"
              description="Subjects assigned to you"
            >
              {subjects.length === 0 ? (
                <div className="teacher-profile-empty">
                  <p>No subjects have been assigned yet.</p>
                </div>
              ) : (
                <div className="teacher-profile-tags">
                  {subjects.map((subject) => (
                    <span
                      key={subject.id || `${subject.code}-${subject.name}`}
                      className="teacher-profile-tag"
                    >
                      <i className="fa-solid fa-bookmark"></i>
                      {subject.name}
                      {subject.code ? (
                        <em>{subject.code}</em>
                      ) : null}
                    </span>
                  ))}
                </div>
              )}
            </ProfileSection>

            <ProfileSection
              icon="fa-solid fa-people-roof"
              title="Family Information"
              description="Spouse and children on record"
            >
              {!familyHasData ? (
                <div className="teacher-empty-content small">
                  <div className="teacher-empty-icon sky">
                    <i className="fa-regular fa-heart"></i>
                  </div>
                  <h3>No family information</h3>
                  <p>
                    Spouse or children details have not been added by the
                    school administration.
                  </p>
                </div>
              ) : (
                <div className="teacher-profile-family">
                  {spouseHasData && (
                    <div className="teacher-profile-family-card">
                      <h3>Spouse</h3>
                      <div className="teacher-profile-fields">
                        <Field
                          label="Name"
                          value={displayValue(staff.spouse.name)}
                        />
                        <Field
                          label="Date of Birth"
                          value={formatDateValue(staff.spouse.dateOfBirth)}
                        />
                        <Field
                          label="Mobile No"
                          value={displayValue(staff.spouse.mobileNo)}
                        />
                        <Field
                          label="Marriage Date"
                          value={formatDateValue(staff.spouse.marriageDate)}
                        />
                        {staff.spouse.qualification && (
                          <Field
                            label="Qualification"
                            value={displayValue(staff.spouse.qualification)}
                          />
                        )}
                        {staff.spouse.employerDetails && (
                          <Field
                            label="Employer Details"
                            value={displayValue(staff.spouse.employerDetails)}
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {children.length > 0 && (
                    <div className="teacher-profile-family-card">
                      <h3>Children</h3>
                      <div className="teacher-profile-children">
                        {children.map((child, index) => (
                          <div
                            key={child.id || `${child.name}-${index}`}
                            className="teacher-profile-child"
                          >
                            <strong>
                              {displayValue(child.name)}
                            </strong>
                            <span>
                              {formatLabel(child.gender)}
                              {child.dateOfBirth
                                ? ` · ${formatDateValue(child.dateOfBirth)}`
                                : ""}
                            </span>
                            {child.schoolName && (
                              <small>{child.schoolName}</small>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ProfileSection>
          </>
        )}
      </main>
    </div>
  );
}
