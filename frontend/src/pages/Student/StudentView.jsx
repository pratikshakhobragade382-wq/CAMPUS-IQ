import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";

import { Button } from "../../components/ui/Button";
import { StatusBadge } from "../../components/ui/Badge";
import { deleteStudent, getStudentById } from "../../api/student.api";
import { getInitials, stringToColor } from "../../utils/helpers";

import "./Student.css";

function Field({ label, value }) {
  return (
    <div className="student-view-item">
      <label>{label}</label>
      <p>{value || "—"}</p>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("en-GB");
  } catch {
    return "—";
  }
}

export default function StudentView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await getStudentById(id);
        setStudent(response?.data || null);
      } catch (err) {
        setError(
          err.response?.data?.error ||
            err.response?.data?.message ||
            "Failed to load student."
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const handleDelete = async () => {
    if (!student) return;

    const confirmed = window.confirm(
      `Deactivate student "${student.studentName}"? This performs a soft delete.`
    );
    if (!confirmed) return;

    try {
      setError("");
      const response = await deleteStudent(student.id);
      setSuccess(response?.message || "Student deleted successfully");
      setTimeout(() => navigate("/student"), 800);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to delete student."
      );
    }
  };

  if (loading) {
    return (
      <div className="student-view-page">
        <div className="student-loading">Loading student details...</div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="student-view-page">
        <div className="student-alert error">
          {error || "Student not found."}
        </div>
        <Button variant="outline" onClick={() => navigate("/student")}>
          <ArrowLeft size={16} className="mr-2" />
          Back to list
        </Button>
      </div>
    );
  }

  const parents = student.parents || [];
  const father = parents.find((p) => p.relation === "father");
  const mother = parents.find((p) => p.relation === "mother");
  const guardian = parents.find((p) => p.relation === "guardian");

  return (
    <div className="student-view-page">
      <div className="student-view-header">
        <div className="student-view-profile">
          {student.photoUrl ? (
            <img
              src={student.photoUrl}
              alt={student.studentName}
              className="student-avatar"
              style={{ width: 56, height: 56 }}
            />
          ) : (
            <span
              className="student-avatar-fallback"
              style={{
                width: 56,
                height: 56,
                fontSize: 16,
                background: stringToColor(student.studentName),
              }}
            >
              {getInitials(student.studentName)}
            </span>
          )}
          <div>
            <h1>{student.studentName}</h1>
            <p>
              {student.admissionNo}
              {student.class?.name ? ` · ${student.class.name}` : ""}
              {student.section?.name ? ` · Sec ${student.section.name}` : ""}
            </p>
            <div className="mt-2">
              <StatusBadge status="active">Active</StatusBadge>
            </div>
          </div>
        </div>

        <div className="student-view-actions">
          <Button variant="outline" onClick={() => navigate("/student")}>
            <ArrowLeft size={16} className="mr-2" />
            Back
          </Button>
          <Button
            variant="primary"
            onClick={() => navigate(`/student/${student.id}/edit`)}
          >
            <Pencil size={16} className="mr-2" />
            Edit
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            <Trash2 size={16} className="mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {error && <div className="student-alert error">{error}</div>}
      {success && <div className="student-alert success">{success}</div>}

      <div className="student-view-card">
        <section className="student-view-section">
          <h3>Basic Information</h3>
          <div className="student-view-grid">
            <Field label="Admission No" value={student.admissionNo} />
            <Field label="Student Name" value={student.studentName} />
            <Field label="Fee No" value={student.feeNo} />
            <Field label="Sibling Admission No" value={student.siblingAdmNo} />
            <Field label="Child Living With" value={student.childLivingWith} />
            <Field label="Gender" value={student.gender} />
          </div>
        </section>

        <section className="student-view-section">
          <h3>Academic Information</h3>
          <div className="student-view-grid">
            <Field label="Class" value={student.class?.name} />
            <Field label="Section" value={student.section?.name} />
            <Field label="Roll No" value={student.rollNo} />
            <Field label="Stream" value={student.stream} />
            <Field label="Fee Group" value={student.feeGroup} />
            <Field label="Admission Type" value={student.admissionType} />
            <Field label="Class Admitted" value={student.classAdmitted} />
            <Field label="Board" value={student.board} />
            <Field label="Medium" value={student.medium} />
            <Field label="House" value={student.house} />
            <Field label="Boarding Category" value={student.boardingCategory} />
            <Field
              label="Board Registration No"
              value={student.boardRegistrationNo}
            />
          </div>
        </section>

        <section className="student-view-section">
          <h3>Personal Information</h3>
          <div className="student-view-grid">
            <Field label="Date of Birth" value={formatDate(student.dateOfBirth)} />
            <Field
              label="Date of Admission"
              value={formatDate(student.dateOfAdmission)}
            />
            <Field label="Date of Join" value={formatDate(student.dateOfJoin)} />
            <Field label="Blood Group" value={student.bloodGroup} />
            <Field label="Religion" value={student.religion} />
            <Field label="Category" value={student.category} />
            <Field label="Mother Tongue" value={student.motherTongue} />
            <Field label="Nationality" value={student.nationality} />
            <Field label="Marital Status" value={student.maritalStatus} />
          </div>
        </section>

        <section className="student-view-section">
          <h3>Father Information</h3>
          <div className="student-view-grid">
            <Field
              label="Name"
              value={father?.name || student.fatherName}
            />
            <Field label="Title" value={student.fatherTitle} />
            <Field label="Mobile" value={father?.mobile} />
            <Field label="Email" value={father?.email} />
            <Field label="Occupation" value={father?.occupation} />
            <Field label="Qualification" value={father?.qualification} />
            <Field label="Aadhar No" value={father?.aadharNo} />
            <Field label="Annual Income" value={father?.annualIncome} />
          </div>
        </section>

        <section className="student-view-section">
          <h3>Mother Information</h3>
          <div className="student-view-grid">
            <Field
              label="Name"
              value={mother?.name || student.motherName}
            />
            <Field label="Title" value={student.motherTitle} />
            <Field label="Mobile" value={mother?.mobile} />
            <Field label="Email" value={mother?.email} />
            <Field label="Occupation" value={mother?.occupation} />
            <Field label="Qualification" value={mother?.qualification} />
            <Field label="Aadhar No" value={mother?.aadharNo} />
            <Field label="Annual Income" value={mother?.annualIncome} />
          </div>
        </section>

        <section className="student-view-section">
          <h3>Guardian Information</h3>
          <div className="student-view-grid">
            <Field label="Name" value={guardian?.name} />
            <Field label="Mobile" value={guardian?.mobile} />
            <Field label="Relation" value={guardian?.relation} />
          </div>
        </section>

        <section className="student-view-section">
          <h3>Contact Information</h3>
          <div className="student-view-grid">
            <Field label="Student Email" value={student.studentEmail} />
            <Field label="Country Code" value={student.countryCode} />
            <Field
              label="Communication Mobile"
              value={student.communicationMobile}
            />
            <Field
              label="Communication Email"
              value={student.communicationEmail}
            />
            <Field label="Emergency Phone" value={student.emergencyPhoneNo} />
          </div>
        </section>

        <section className="student-view-section">
          <h3>Identification</h3>
          <div className="student-view-grid">
            <Field label="Aadhar No" value={student.aadharNo} />
            <Field label="Unique No" value={student.uniqueNo} />
            <Field label="GR No" value={student.grNo} />
            <Field label="RFID No" value={student.rfidNo} />
            <Field label="APAAR ID" value={student.apaarId} />
            <Field label="SRN No" value={student.srnNo} />
          </div>
        </section>

        <section className="student-view-section">
          <h3>Bank Information</h3>
          <div className="student-view-grid">
            <Field label="Bank Name" value={student.bankName} />
            <Field label="Account No" value={student.accountNo} />
            <Field label="IFSC" value={student.ifsc} />
            <Field label="Virtual Account No" value={student.virtualAccountNo} />
            <Field label="eNACH" value={student.eNach} />
          </div>
        </section>

        <section className="student-view-section">
          <h3>Other Information</h3>
          <div className="student-view-grid">
            <Field label="Remark" value={student.remark} />
            <Field label="Fee Remark" value={student.feeRemark} />
          </div>
        </section>
      </div>
    </div>
  );
}
