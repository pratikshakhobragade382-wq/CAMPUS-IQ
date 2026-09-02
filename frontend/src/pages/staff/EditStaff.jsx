import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosClient from "../../api/axios";
import "./staff.css";

const ROLES = [
  "teacher",
  "accountant",
  "librarian",
  "clerk",
  "receptionist",
  "nurse",
  "counselor",
  "coordinator",
  "lab_assistant",
  "peon",
  "driver",
  "security",
  "other",
];

const GENDERS = ["male", "female", "other"];

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    fallback
  );
}

function extractArray(response) {
  const data = response?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.subjects)) return data.subjects;
  if (Array.isArray(data?.departments)) return data.departments;

  return [];
}

function extractStaff(response) {
  return (
    response?.data?.data ||
    response?.data?.staff ||
    response?.data
  );
}

function getSubjectFromStaffSubject(item) {
  if (!item) return null;

  return item.subject || item;
}

export default function EditStaff() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [departments, setDepartments] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creatingSubject, setCreatingSubject] = useState(false);

  const [error, setError] = useState("");

  const [subjectSelect, setSubjectSelect] = useState("");

  const [newSubject, setNewSubject] = useState({
    name: "",
    code: "",
  });

  const [form, setForm] = useState({
    employeeId: "",
    name: "",
    email: "",
    phone: "",
    gender: "",
    dateOfJoining: "",
    role: "teacher",
    departmentId: "",
    salary: "",
    subjectIds: [],
  });

  /* =========================================================
     LOAD STAFF + DEPARTMENTS + SUBJECTS
  ========================================================= */

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError("");

      try {
        const [
          staffResponse,
          departmentResponse,
          subjectResponse,
        ] = await Promise.all([
          axiosClient.get(`/staff/${id}`),
          axiosClient.get("/departments"),
          axiosClient.get("/subjects"),
        ]);

        const staff = extractStaff(staffResponse);

        if (!staff) {
          throw new Error("Staff member not found.");
        }

        const departmentList =
          extractArray(departmentResponse);

        const subjectList =
          extractArray(subjectResponse);

        const staffSubjects = Array.isArray(
          staff.subjects
        )
          ? staff.subjects
          : [];

        const existingSubjectIds =
          staffSubjects
            .map(getSubjectFromStaffSubject)
            .filter(Boolean)
            .map((subject) => Number(subject.id))
            .filter(Boolean);

        setDepartments(departmentList);
        setSubjects(subjectList);

        setForm({
          employeeId:
            staff.employeeId || "",
          name:
            staff.name || "",
          email:
            staff.email || "",
          phone:
            staff.phone || "",
          gender:
            staff.gender || "",
          dateOfJoining:
            staff.dateOfJoining
              ? String(
                  staff.dateOfJoining
                ).slice(0, 10)
              : "",
          role:
            staff.role || "teacher",
          departmentId:
            staff.departmentId
              ? String(staff.departmentId)
              : "",
          salary:
            staff.salary !== null &&
            staff.salary !== undefined
              ? String(staff.salary)
              : "",
          subjectIds:
            existingSubjectIds,
        });

      } catch (err) {
        console.error(
          "Failed to load staff:",
          err
        );

        setError(
          getErrorMessage(
            err,
            "Unable to load staff."
          )
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadData();
    }
  }, [id]);

  /* =========================================================
     FORM CHANGE
  ========================================================= */

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /* =========================================================
     ADD EXISTING SUBJECT
  ========================================================= */

  const addExistingSubject = (subjectId) => {
    if (!subjectId) return;

    const numericId = Number(subjectId);

    setForm((previous) => {
      if (previous.subjectIds.includes(numericId)) {
        return previous;
      }

      return {
        ...previous,
        subjectIds: [
          ...previous.subjectIds,
          numericId,
        ],
      };
    });

    setSubjectSelect("");
  };

  /* =========================================================
     REMOVE SUBJECT
  ========================================================= */

  const removeSubject = (subjectId) => {
    setForm((previous) => ({
      ...previous,
      subjectIds: previous.subjectIds.filter(
        (item) =>
          Number(item) !== Number(subjectId)
      ),
    }));
  };

  /* =========================================================
     CREATE NEW SUBJECT
  ========================================================= */

  const createNewSubject = async () => {
    const name = newSubject.name.trim();
    const code = newSubject.code.trim().toUpperCase();

    if (!name) {
      setError("Please enter the subject name.");
      return;
    }

    if (!code) {
      setError("Please enter the subject code.");
      return;
    }

    setCreatingSubject(true);
    setError("");

    try {
      const response = await axiosClient.post(
        "/subjects",
        {
          name,
          code,
        }
      );

      const createdSubject =
        response?.data?.data ||
        response?.data?.subject ||
        response?.data;

      if (!createdSubject?.id) {
        throw new Error(
          "Subject was created but the server did not return its ID."
        );
      }

      const normalizedSubject = {
        id: Number(createdSubject.id),
        name:
          createdSubject.name || name,
        code:
          createdSubject.code || code,
      };

      setSubjects((previous) => {
        const exists = previous.some(
          (item) =>
            Number(item.id) ===
            Number(normalizedSubject.id)
        );

        if (exists) return previous;

        return [...previous, normalizedSubject].sort(
          (a, b) =>
            String(a.name).localeCompare(
              String(b.name)
            )
        );
      });

      setForm((previous) => ({
        ...previous,
        subjectIds:
          previous.subjectIds.includes(
            normalizedSubject.id
          )
            ? previous.subjectIds
            : [
                ...previous.subjectIds,
                normalizedSubject.id,
              ],
      }));

      setNewSubject({
        name: "",
        code: "",
      });

      setSubjectSelect("");

    } catch (err) {
      console.error(
        "Failed to create subject:",
        err
      );

      setError(
        getErrorMessage(
          err,
          "Unable to create subject."
        )
      );
    } finally {
      setCreatingSubject(false);
    }
  };

  /* =========================================================
     SAVE
  ========================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!form.employeeId.trim()) {
      setError("Employee ID is required.");
      return;
    }

    if (!form.name.trim()) {
      setError("Staff name is required.");
      return;
    }

    if (!form.email.trim()) {
      setError("Email is required.");
      return;
    }

    if (!form.role) {
      setError("Please select a staff role.");
      return;
    }

    if (
      form.role === "teacher" &&
      form.subjectIds.length === 0
    ) {
      setError(
        "Please assign at least one subject to the teacher."
      );
      return;
    }

    setSaving(true);

    try {
      /* -------------------------------------------------------
         UPDATE STAFF
      ------------------------------------------------------- */

      await axiosClient.put(
        `/staff/${id}`,
        {
          employeeId:
            form.employeeId.trim(),
          name:
            form.name.trim(),
          email:
            form.email.trim(),
          phone:
            form.phone.trim() || null,
          gender:
            form.gender || null,
          dateOfJoining:
            form.dateOfJoining || null,
          role:
            form.role,
          departmentId:
            form.departmentId
              ? Number(form.departmentId)
              : null,
          salary:
            form.salary
              ? Number(form.salary)
              : null,
        }
      );

      /* -------------------------------------------------------
         SYNC SUBJECTS

         The backend replaces the existing assignments with
         the supplied list. Sending [] removes all subjects.
      ------------------------------------------------------- */

      await axiosClient.post(
        `/staff/${id}/subjects`,
        {
          subjectIds:
            form.subjectIds.map(Number),
        }
      );

      navigate("/staff");

    } catch (err) {
      console.error(
        "Failed to update staff:",
        err
      );

      setError(
        getErrorMessage(
          err,
          "Unable to update staff."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     SELECTED SUBJECTS
  ========================================================= */

  const selectedSubjects = form.subjectIds
    .map((subjectId) =>
      subjects.find(
        (subject) =>
          Number(subject.id) ===
          Number(subjectId)
      )
    )
    .filter(Boolean);

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="staff-form-page">
        <div className="staff-loading">
          Loading staff...
        </div>
      </div>
    );
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="staff-form-page">

      {/* HEADER */}
      <div className="staff-form-header">
        <div className="staff-form-title-section">
          <h1>Edit Staff</h1>
          <p>
            Update staff information and assigned subjects.
          </p>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="staff-alert">
          {error}
        </div>
      )}

      {/* FORM CARD */}
      <div className="staff-form-card">

        <div className="staff-form-card-header">
          <h2>Staff Information</h2>
          <p>
            Update the staff member's details.
          </p>
        </div>

        <div className="staff-form-card-body">

          <form
            className="staff-form"
            onSubmit={handleSubmit}
          >

            {/* EMPLOYEE ID */}
            <div className="staff-form-group">
              <label className="staff-form-label">
                Employee ID
                <span className="required">*</span>
              </label>

              <input
                type="text"
                name="employeeId"
                className="staff-form-input"
                value={form.employeeId}
                onChange={handleChange}
                placeholder="Enter employee ID"
                required
              />
            </div>

            {/* NAME */}
            <div className="staff-form-group">
              <label className="staff-form-label">
                Full Name
                <span className="required">*</span>
              </label>

              <input
                type="text"
                name="name"
                className="staff-form-input"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter full name"
                required
              />
            </div>

            {/* EMAIL */}
            <div className="staff-form-group">
              <label className="staff-form-label">
                Email
                <span className="required">*</span>
              </label>

              <input
                type="email"
                name="email"
                className="staff-form-input"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter email address"
                required
              />
            </div>

            {/* PHONE */}
            <div className="staff-form-group">
              <label className="staff-form-label">
                Phone
              </label>

              <input
                type="text"
                name="phone"
                className="staff-form-input"
                value={form.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
              />
            </div>

            {/* GENDER */}
            <div className="staff-form-group">
              <label className="staff-form-label">
                Gender
              </label>

              <select
                name="gender"
                className="staff-form-select"
                value={form.gender}
                onChange={handleChange}
              >
                <option value="">
                  Select gender
                </option>

                {GENDERS.map((gender) => (
                  <option
                    key={gender}
                    value={gender}
                  >
                    {gender.charAt(0).toUpperCase() +
                      gender.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* DATE */}
            <div className="staff-form-group">
              <label className="staff-form-label">
                Date of Joining
              </label>

              <input
                type="date"
                name="dateOfJoining"
                className="staff-form-input"
                value={form.dateOfJoining}
                onChange={handleChange}
              />
            </div>

            {/* ROLE */}
            <div className="staff-form-group">
              <label className="staff-form-label">
                Role
                <span className="required">*</span>
              </label>

              <select
                name="role"
                className="staff-form-select"
                value={form.role}
                onChange={handleChange}
                required
              >
                <option value="">
                  Select role
                </option>

                {ROLES.map((role) => (
                  <option
                    key={role}
                    value={role}
                  >
                    {role
                      .replaceAll("_", " ")
                      .replace(
                        /\b\w/g,
                        (char) =>
                          char.toUpperCase()
                      )}
                  </option>
                ))}
              </select>
            </div>

            {/* DEPARTMENT */}
            <div className="staff-form-group">
              <label className="staff-form-label">
                Department
              </label>

              <select
                name="departmentId"
                className="staff-form-select"
                value={form.departmentId}
                onChange={handleChange}
              >
                <option value="">
                  Select department
                </option>

                {departments.map((department) => (
                  <option
                    key={department.id}
                    value={department.id}
                  >
                    {department.name}
                  </option>
                ))}
              </select>
            </div>

            {/* SALARY */}
            <div className="staff-form-group">
              <label className="staff-form-label">
                Salary
              </label>

              <input
                type="number"
                name="salary"
                className="staff-form-input"
                value={form.salary}
                onChange={handleChange}
                placeholder="Enter salary"
                min="0"
                step="0.01"
              />
            </div>

            {/* =================================================
               SUBJECT BOX
            ================================================= */}

            <div className="staff-subject-box">

              <div className="staff-subject-box-header">
                <div>
                  <h3 className="staff-subject-box-title">
                    Subjects
                    {form.role === "teacher" && (
                      <span className="required"> *</span>
                    )}
                  </h3>

                  <p className="staff-subject-box-help">
                    Select an existing subject or create a
                    new subject here.
                  </p>
                </div>
              </div>

              {/* DROPDOWN */}
              <div className="staff-subject-select-row">

                <select
                  className="staff-subject-select"
                  value={subjectSelect}
                  onChange={(event) => {
                    const value =
                      event.target.value;

                    setSubjectSelect(value);

                    if (value === "__create__") {
                      return;
                    }

                    addExistingSubject(value);
                  }}
                >
                  <option value="">
                    Select existing subject
                  </option>

                  {subjects
                    .filter(
                      (subject) =>
                        !form.subjectIds.includes(
                          Number(subject.id)
                        )
                    )
                    .map((subject) => (
                      <option
                        key={subject.id}
                        value={subject.id}
                      >
                        {subject.name}
                        {subject.code
                          ? ` - ${subject.code}`
                          : ""}
                      </option>
                    ))}

                  <option value="__create__">
                    + Create New Subject
                  </option>
                </select>

              </div>

              {/* CREATE SUBJECT */}
              {subjectSelect === "__create__" && (
                <div className="staff-subject-create-panel">

                  <div className="staff-subject-create-title">
                    Create New Subject
                  </div>

                  <div className="staff-subject-create-grid">

                    <div>
                      <label className="staff-form-label">
                        Subject Name
                        <span className="required">*</span>
                      </label>

                      <input
                        type="text"
                        className="staff-form-input"
                        value={newSubject.name}
                        onChange={(event) =>
                          setNewSubject(
                            (previous) => ({
                              ...previous,
                              name:
                                event.target.value,
                            })
                          )
                        }
                        placeholder="e.g. Computer Science"
                      />
                    </div>

                    <div>
                      <label className="staff-form-label">
                        Subject Code
                        <span className="required">*</span>
                      </label>

                      <input
                        type="text"
                        className="staff-form-input"
                        value={newSubject.code}
                        onChange={(event) =>
                          setNewSubject(
                            (previous) => ({
                              ...previous,
                              code:
                                event.target.value.toUpperCase(),
                            })
                          )
                        }
                        placeholder="e.g. CS"
                      />
                    </div>

                  </div>

                  <div className="staff-subject-create-actions">

                    <button
                      type="button"
                      className="staff-subject-create-btn"
                      onClick={createNewSubject}
                      disabled={creatingSubject}
                    >
                      {creatingSubject
                        ? "Creating..."
                        : "Create & Add Subject"}
                    </button>

                    <button
                      type="button"
                      className="staff-subject-cancel-btn"
                      onClick={() => {
                        setSubjectSelect("");
                        setNewSubject({
                          name: "",
                          code: "",
                        });
                      }}
                    >
                      Cancel
                    </button>

                  </div>
                </div>
              )}

              {/* ASSIGNED */}
              <div className="staff-selected-subject-section">

                <div className="staff-selected-subject-heading">
                  Assigned Subjects
                </div>

                {selectedSubjects.length === 0 ? (
                  <div className="staff-subject-empty">
                    No subjects selected.
                  </div>
                ) : (
                  <div className="staff-selected-subjects">

                    {selectedSubjects.map((subject) => (
                      <div
                        className="staff-selected-subject-chip"
                        key={subject.id}
                      >
                        <span className="staff-selected-subject-name">
                          {subject.name}
                        </span>

                        {subject.code && (
                          <span className="staff-selected-subject-code">
                            {subject.code}
                          </span>
                        )}

                        <button
                          type="button"
                          className="staff-selected-subject-remove"
                          onClick={() =>
                            removeSubject(subject.id)
                          }
                        >
                          ×
                        </button>
                      </div>
                    ))}

                  </div>
                )}

              </div>

            </div>

            {/* ACTIONS */}
            <div className="staff-form-actions">

              <button
                type="button"
                className="staff-cancel-btn"
                onClick={() => navigate("/staff")}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="staff-submit-btn"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : "Update Staff"}
              </button>

            </div>

          </form>

        </div>
      </div>
    </div>
  );
}