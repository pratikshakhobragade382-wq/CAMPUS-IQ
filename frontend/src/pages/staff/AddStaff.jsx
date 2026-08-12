import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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

export default function AddStaff() {
  const navigate = useNavigate();

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    employeeId: "",
    name: "",
    email: "",
    password: "",
    phone: "",
    gender: "",
    dateOfJoining: "",
    role: "teacher",
    departmentId: "",
    salary: "",
  });

  useEffect(() => {
    axiosClient
      .get("/departments")
      .then((response) => {
        setDepartments(response.data?.data || []);
      })
      .catch(() => {
        setDepartments([]);
      });
  }, []);

  const change = (e) => {
    setForm((previous) => ({
      ...previous,
      [e.target.name]: e.target.value,
    }));
  };

  const submit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      await axiosClient.post("/staff", {
        ...form,
        identity: "staff",
        departmentId:
          form.departmentId || undefined,
        salary: form.salary || undefined,
        dateOfJoining:
          form.dateOfJoining || undefined,
      });

      navigate("/staff");
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Failed to create staff."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="staff-form-page">

      {/* HEADER */}
      <div className="staff-form-header">

        <div className="staff-form-title-section">
          <h1>Add Staff</h1>

          <p>
            Add a teacher or school staff member.
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

            {/* PASSWORD */}
            <div className="staff-form-group">
              <label className="staff-form-label">
                Login Password
                <span className="required">*</span>
              </label>

              <input
                type="password"
                className="staff-form-input"
                name="password"
                value={form.password}
                onChange={change}
                minLength="8"
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
                <option value="female">Female</option>
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
                disabled={loading}
              >
                {loading
                  ? "Saving..."
                  : "Create Staff"}
              </button>

            </div>

          </form>

        </div>

      </div>

    </div>
  );
}