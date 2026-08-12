import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
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

export default function EditStaff() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      axiosClient.get(`/staff/${id}`),
      axiosClient
        .get("/departments")
        .catch(() => ({
          data: {
            data: [],
          },
        })),
    ])
      .then(([staffResponse, departmentResponse]) => {
        const staff = staffResponse.data?.data;

        setForm({
          employeeId: staff.employeeId || "",
          name: staff.name || "",
          email: staff.email || "",
          phone: staff.phone || "",
          gender: staff.gender || "",
          dateOfJoining:
            staff.dateOfJoining?.slice(0, 10) || "",
          role: staff.role || "teacher",
          departmentId:
            staff.departmentId || "",
          salary: staff.salary ?? "",
        });

        setDepartments(
          departmentResponse.data?.data || []
        );
      })
      .catch((err) => {
        setError(
          err.response?.data?.error ||
            "Failed to load staff."
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const change = (e) => {
    setForm((previous) => ({
      ...previous,
      [e.target.name]: e.target.value,
    }));
  };

  const submit = async (e) => {
    e.preventDefault();

    setSaving(true);
    setError("");

    try {
      await axiosClient.put(`/staff/${id}`, {
        ...form,
        departmentId:
          form.departmentId || null,
        salary:
          form.salary === ""
            ? null
            : Number(form.salary),
        dateOfJoining:
          form.dateOfJoining || null,
      });

      navigate("/staff");
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Failed to update staff."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="staff-form-page">
        <div className="staff-loading">
          Loading staff...
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="staff-form-page">

        <div className="staff-alert">
          {error || "Staff not found."}
        </div>

      </div>
    );
  }

  return (
    <div className="staff-form-page">

      {/* HEADER */}
      <div className="staff-form-header">

        <div className="staff-form-title-section">
          <h1>Edit Staff</h1>

          <p>
            Update teacher or school staff information.
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
        </div>

        <div className="staff-form-card-body">

          <form
            className="staff-form"
            onSubmit={submit}
          >

            {/* EMPLOYEE ID */}
            <div className="staff-form-group">
              <label className="staff-form-label">
                Employee ID
                <span className="required">*</span>
              </label>

              <input
                className="staff-form-input"
                name="employeeId"
                value={form.employeeId}
                onChange={change}
                required
              />
            </div>

            {/* NAME */}
            <div className="staff-form-group">
              <label className="staff-form-label">
                Name
                <span className="required">*</span>
              </label>

              <input
                className="staff-form-input"
                name="name"
                value={form.name}
                onChange={change}
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
                className="staff-form-input"
                name="email"
                value={form.email}
                onChange={change}
                required
              />
            </div>

            {/* PHONE */}
            <div className="staff-form-group">
              <label className="staff-form-label">
                Phone
              </label>

              <input
                className="staff-form-input"
                name="phone"
                value={form.phone}
                onChange={change}
              />
            </div>

            {/* GENDER */}
            <div className="staff-form-group">
              <label className="staff-form-label">
                Gender
              </label>

              <select
                className="staff-form-select"
                name="gender"
                value={form.gender}
                onChange={change}
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">
                  Female
                </option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* DATE OF JOINING */}
            <div className="staff-form-group">
              <label className="staff-form-label">
                Date of Joining
              </label>

              <input
                type="date"
                className="staff-form-input"
                name="dateOfJoining"
                value={form.dateOfJoining}
                onChange={change}
              />
            </div>

            {/* ROLE */}
            <div className="staff-form-group">
              <label className="staff-form-label">
                Role
                <span className="required">*</span>
              </label>

              <select
                className="staff-form-select"
                name="role"
                value={form.role}
                onChange={change}
              >
                {ROLES.map((role) => (
                  <option
                    key={role}
                    value={role}
                  >
                    {role
                      .replaceAll("_", " ")
                      .replace(/\b\w/g, (char) =>
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
                className="staff-form-select"
                name="departmentId"
                value={form.departmentId}
                onChange={change}
              >
                <option value="">
                  No department
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
                className="staff-form-input"
                name="salary"
                value={form.salary}
                onChange={change}
              />
            </div>

            {/* ACTIONS */}
            <div className="staff-form-actions">

              <button
                type="button"
                className="staff-form-cancel"
                onClick={() => navigate("/staff")}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="staff-form-submit"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : "Save Changes"}
              </button>

            </div>

          </form>

        </div>

      </div>

    </div>
  );
}