import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Modal, ModalFooter } from "../../components/modal/Modal";

import {
  createStudent,
  getStudentById,
  updateStudent,
} from "../../api/student.api";
import { getClasses } from "../../api/class.api";
import { getAllSections, getSectionsByClass } from "../../api/section.api";
import { BLOOD_GROUP, CATEGORIES, RELIGIONS } from "../../utils/constants";

import "./Student.css";

/** Normalize list responses from class/section APIs */
function normalizeList(res) {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.classes)) return res.data.classes;
  if (Array.isArray(res?.data?.sections)) return res.data.sections;
  return [];
}
const EMPTY_FORM = {
  admissionNo: "",
  feeNo: "",
  siblingAdmNo: "",
  studentName: "",
  childLivingWith: "",
  photoUrl: "",
  signatureUrl: "",
  fatherTitle: "",
  fatherName: "",
  motherTitle: "",
  motherName: "",
  classId: "",
  sectionId: "",
  stream: "",
  feeGroup: "",
  feePaymentStartFrom: "",
  dateOfBirth: "",
  dateOfAdmission: "",
  dateOfJoin: "",
  rollNo: "",
  gender: "",
  admissionType: "",
  classAdmitted: "",
  emergencyPhoneNo: "",
  house: "",
  boardingCategory: "",
  board: "",
  medium: "",
  boardRegistrationNo: "",
  studentEmail: "",
  countryCode: "",
  communicationMobile: "",
  communicationEmail: "",
  aadharNo: "",
  remark: "",
  feeRemark: "",
  uniqueNo: "",
  grNo: "",
  rfidNo: "",
  eNach: "",
  bankName: "",
  accountNo: "",
  ifsc: "",
  virtualAccountNo: "",
  apaarId: "",
  srnNo: "",
  bloodGroup: "",
  religion: "",
  category: "",
  motherTongue: "",
  nationality: "",
  maritalStatus: "",
  father: {
    name: "",
    mobile: "",
    email: "",
    occupation: "",
    qualification: "",
    aadharNo: "",
    annualIncome: "",
  },
  mother: {
    name: "",
    mobile: "",
    email: "",
    occupation: "",
    qualification: "",
    aadharNo: "",
    annualIncome: "",
  },
  guardian: {
    name: "",
    mobile: "",
    relation: "",
  },
};

function toDateInput(value) {
  if (!value) return "";
  try {
    return String(value).slice(0, 10);
  } catch {
    return "";
  }
}

// Exact student fields accepted by backend createStudent / updateStudent
const STUDENT_FIELDS = [
  "admissionNo",
  "feeNo",
  "siblingAdmNo",
  "studentName",
  "childLivingWith",
  "photoUrl",
  "signatureUrl",
  "fatherTitle",
  "fatherName",
  "motherTitle",
  "motherName",
  "stream",
  "feeGroup",
  "feePaymentStartFrom",
  "dateOfBirth",
  "dateOfAdmission",
  "dateOfJoin",
  "rollNo",
  "gender",
  "admissionType",
  "classAdmitted",
  "emergencyPhoneNo",
  "house",
  "boardingCategory",
  "board",
  "medium",
  "boardRegistrationNo",
  "studentEmail",
  "countryCode",
  "communicationMobile",
  "communicationEmail",
  "aadharNo",
  "remark",
  "feeRemark",
  "uniqueNo",
  "grNo",
  "rfidNo",
  "eNach",
  "bankName",
  "accountNo",
  "ifsc",
  "virtualAccountNo",
  "apaarId",
  "srnNo",
  "bloodGroup",
  "religion",
  "category",
  "motherTongue",
  "nationality",
  "maritalStatus",
];

function cleanValue(value) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
  }
  return value;
}

function buildParentPayload(parent) {
  if (!parent?.name?.trim()) return undefined;

  // Matches backend StudentParent fields used in create/update
  const payload = {
    name: parent.name.trim(),
    mobile: cleanValue(parent.mobile),
    email: cleanValue(parent.email),
    occupation: cleanValue(parent.occupation),
    qualification: cleanValue(parent.qualification),
    aadharNo: cleanValue(parent.aadharNo),
  };

  if (parent.annualIncome !== "" && parent.annualIncome != null) {
    const income = Number(parent.annualIncome);
    if (!Number.isNaN(income)) {
      payload.annualIncome = income;
    }
  }

  return payload;
}

function buildGuardianPayload(guardian) {
  if (!guardian?.name?.trim()) return undefined;

  // Backend accepts { name, mobile, relation } then forces relation = "guardian"
  return {
    name: guardian.name.trim(),
    mobile: cleanValue(guardian.mobile),
    relation: cleanValue(guardian.relation) || "guardian",
  };
}

function buildStudentPayload(form) {
  const payload = {};

  STUDENT_FIELDS.forEach((key) => {
    const cleaned = cleanValue(form[key]);
    if (cleaned !== undefined) {
      payload[key] = cleaned;
    }
  });

  // Required by backend — never send tenantId (taken from JWT)
  payload.classId = Number(form.classId);

  if (form.sectionId) {
    payload.sectionId = Number(form.sectionId);
  }

  const fatherPayload = buildParentPayload(form.father);
  const motherPayload = buildParentPayload(form.mother);
  const guardianPayload = buildGuardianPayload(form.guardian);

  if (fatherPayload) {
    payload.father = fatherPayload;
    // Keep top-level fatherName in sync with nested parent record
    payload.fatherName = fatherPayload.name;
  }

  if (motherPayload) {
    payload.mother = motherPayload;
    payload.motherName = motherPayload.name;
  }

  if (guardianPayload) {
    payload.guardian = guardianPayload;
  }

  return payload;
}

function mapStudentToForm(student) {
  const parents = student.parents || [];
  const father = parents.find((p) => p.relation === "father");
  const mother = parents.find((p) => p.relation === "mother");
  const guardian = parents.find((p) => p.relation === "guardian");

  return {
    ...EMPTY_FORM,
    admissionNo: student.admissionNo || "",
    feeNo: student.feeNo || "",
    siblingAdmNo: student.siblingAdmNo || "",
    studentName: student.studentName || "",
    childLivingWith: student.childLivingWith || "",
    photoUrl: student.photoUrl || "",
    signatureUrl: student.signatureUrl || "",
    fatherTitle: student.fatherTitle || "",
    fatherName: student.fatherName || father?.name || "",
    motherTitle: student.motherTitle || "",
    motherName: student.motherName || mother?.name || "",
    classId: student.classId ? String(student.classId) : "",
    sectionId: student.sectionId ? String(student.sectionId) : "",
    stream: student.stream || "",
    feeGroup: student.feeGroup || "",
    feePaymentStartFrom: student.feePaymentStartFrom || "",
    dateOfBirth: toDateInput(student.dateOfBirth),
    dateOfAdmission: toDateInput(student.dateOfAdmission),
    dateOfJoin: toDateInput(student.dateOfJoin),
    rollNo: student.rollNo || "",
    gender: student.gender || "",
    admissionType: student.admissionType || "",
    classAdmitted: student.classAdmitted || "",
    emergencyPhoneNo: student.emergencyPhoneNo || "",
    house: student.house || "",
    boardingCategory: student.boardingCategory || "",
    board: student.board || "",
    medium: student.medium || "",
    boardRegistrationNo: student.boardRegistrationNo || "",
    studentEmail: student.studentEmail || "",
    countryCode: student.countryCode || "",
    communicationMobile: student.communicationMobile || "",
    communicationEmail: student.communicationEmail || "",
    aadharNo: student.aadharNo || "",
    remark: student.remark || "",
    feeRemark: student.feeRemark || "",
    uniqueNo: student.uniqueNo || "",
    grNo: student.grNo || "",
    rfidNo: student.rfidNo || "",
    eNach: student.eNach || "",
    bankName: student.bankName || "",
    accountNo: student.accountNo || "",
    ifsc: student.ifsc || "",
    virtualAccountNo: student.virtualAccountNo || "",
    apaarId: student.apaarId || "",
    srnNo: student.srnNo || "",
    bloodGroup: student.bloodGroup || "",
    religion: student.religion || "",
    category: student.category || "",
    motherTongue: student.motherTongue || "",
    nationality: student.nationality || "",
    maritalStatus: student.maritalStatus || "",
    father: {
      name: father?.name || student.fatherName || "",
      mobile: father?.mobile || "",
      email: father?.email || "",
      occupation: father?.occupation || "",
      qualification: father?.qualification || "",
      aadharNo: father?.aadharNo || "",
      annualIncome:
        father?.annualIncome != null ? String(father.annualIncome) : "",
    },
    mother: {
      name: mother?.name || student.motherName || "",
      mobile: mother?.mobile || "",
      email: mother?.email || "",
      occupation: mother?.occupation || "",
      qualification: mother?.qualification || "",
      aadharNo: mother?.aadharNo || "",
      annualIncome:
        mother?.annualIncome != null ? String(mother.annualIncome) : "",
    },
    guardian: {
      name: guardian?.name || "",
      mobile: guardian?.mobile || "",
      relation: guardian?.relation || "",
    },
  };
}

export default function StudentForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [bootLoading, setBootLoading] = useState(true);
  const [credentials, setCredentials] = useState(null);
  const [savedStudentId, setSavedStudentId] = useState(null);

  const filteredSections = useMemo(() => {
    if (!form.classId) return [];

    const fromState = sections.filter(
      (section) => String(section.classId) === String(form.classId)
    );
    if (fromState.length > 0) return fromState;

    // Fallback: sections embedded on the selected class (GET /classes includes them)
    const selectedClass = classes.find(
      (c) => String(c.id) === String(form.classId)
    );
    return selectedClass?.sections || [];
  }, [sections, classes, form.classId]);

  useEffect(() => {
    const load = async () => {
      try {
        setBootLoading(true);
        setError("");

        // Load classes on their own so a sections failure cannot wipe the Class dropdown
        let classList = [];
        try {
          const classesRes = await getClasses();
          classList = normalizeList(classesRes);
          setClasses(classList);
        } catch (classErr) {
          setClasses([]);
          setError(
            classErr.response?.data?.error ||
              classErr.response?.data?.message ||
              "Failed to load classes. Open the Class page and create classes first."
          );
        }

        // Prefer GET /sections; fall back to sections nested under classes
        const embeddedSections = classList.flatMap((c) =>
          (c.sections || []).map((s) => ({
            ...s,
            classId: s.classId ?? c.id,
          }))
        );

        try {
          const sectionsRes = await getAllSections();
          const sectionList = normalizeList(sectionsRes);
          setSections(sectionList.length > 0 ? sectionList : embeddedSections);
        } catch {
          setSections(embeddedSections);
        }

        if (isEdit) {
          const studentRes = await getStudentById(id);
          setForm(mapStudentToForm(studentRes?.data || {}));
        }
      } catch (err) {
        setError(
          err.response?.data?.error ||
            err.response?.data?.message ||
            "Failed to load form data."
        );
      } finally {
        setBootLoading(false);
      }
    };

    load();
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleNestedChange = (group, e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [group]: {
        ...prev[group],
        [name]: value,
      },
    }));
  };

  const handleClassChange = async (e) => {
    const value = e.target.value;

    setForm((prev) => ({
      ...prev,
      classId: value,
      sectionId: "",
    }));
    setErrors((prev) => ({ ...prev, classId: "" }));

    if (!value) return;

    // Refresh sections for the chosen class from backend
    try {
      const res = await getSectionsByClass(value);
      const list = normalizeList(res).map((s) => ({
        ...s,
        classId: s.classId ?? Number(value),
      }));

      if (list.length > 0) {
        setSections((prev) => {
          const others = prev.filter(
            (s) => String(s.classId) !== String(value)
          );
          return [...others, ...list];
        });
      }
    } catch {
      // Keep already-loaded / embedded sections
    }
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.admissionNo.trim()) {
      nextErrors.admissionNo = "Admission number is required.";
    }
    if (!form.studentName.trim()) {
      nextErrors.studentName = "Student name is required.";
    }
    if (!form.classId) {
      nextErrors.classId = "Class is required.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const finishAfterSave = (studentId) => {
    if (studentId) {
      navigate(`/student/${studentId}`);
    } else {
      navigate("/student");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validate()) {
      setError("Please fill all required fields (admissionNo, studentName, classId).");
      return;
    }

    try {
      setLoading(true);
      const payload = buildStudentPayload(form);

      const response = isEdit
        ? await updateStudent(id, payload)
        : await createStudent(payload);

      // Backend: { success, message, data: { ...student, parentCredentials } }
      const saved = response?.data || {};
      const parentCredentials = saved.parentCredentials || [];
      const nextId = saved.id || (isEdit ? Number(id) : null);

      setSuccess(
        response?.message ||
          (isEdit
            ? "Student updated successfully"
            : "Student created successfully")
      );

      if (parentCredentials.length > 0) {
        setSavedStudentId(nextId);
        setCredentials(parentCredentials);
      } else if (nextId) {
        setTimeout(() => finishAfterSave(nextId), 800);
      } else {
        setTimeout(() => navigate("/student"), 800);
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to save student."
      );
    } finally {
      setLoading(false);
    }
  };

  if (bootLoading) {
    return (
      <div className="student-form-page">
        <div className="student-loading">Loading student form...</div>
      </div>
    );
  }

  return (
    <div className="student-form-page">
      <div className="student-form-header">
        <div>
          <h1>{isEdit ? "Edit Student" : "Add Student"}</h1>
          <p>
            {isEdit
              ? "Update student enrolment and related details."
              : "Register a new student with academic and parent details."}
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/student")}>
          <ArrowLeft size={16} className="mr-2" />
          Back to list
        </Button>
      </div>

      {error && <div className="student-alert error">{error}</div>}
      {success && <div className="student-alert success">{success}</div>}

      <form className="student-form-card" onSubmit={handleSubmit}>
        {/* 1. Basic Information */}
        <section className="student-form-section">
          <h3>1. Basic Information</h3>
          <p className="student-form-section-desc">
            Required enrolment identity for the student.
          </p>
          <div className="student-form-grid">
            <div>
              <Input
                label="Admission No"
                name="admissionNo"
                value={form.admissionNo}
                onChange={handleChange}
                required
                error={errors.admissionNo}
              />
            </div>
            <div>
              <Input
                label="Student Name"
                name="studentName"
                value={form.studentName}
                onChange={handleChange}
                required
                error={errors.studentName}
              />
            </div>
            <Input
              label="Fee No"
              name="feeNo"
              value={form.feeNo}
              onChange={handleChange}
            />
            <Input
              label="Sibling Admission No"
              name="siblingAdmNo"
              value={form.siblingAdmNo}
              onChange={handleChange}
            />
            <Select
              label="Child Living With"
              name="childLivingWith"
              value={form.childLivingWith}
              onChange={handleChange}
              options={[
                { value: "Both Father & Mother", label: "Both Father & Mother" },
                { value: "Father", label: "Father" },
                { value: "Mother", label: "Mother" },
                { value: "Guardian", label: "Guardian" },
              ]}
            />
            <Input
              label="Photo URL"
              name="photoUrl"
              value={form.photoUrl}
              onChange={handleChange}
              placeholder="https://..."
            />
            <Input
              label="Signature URL"
              name="signatureUrl"
              value={form.signatureUrl}
              onChange={handleChange}
              placeholder="https://..."
            />
          </div>
        </section>

        {/* 2. Academic Information */}
        <section className="student-form-section">
          <h3>2. Academic Information</h3>
          <p className="student-form-section-desc">
            Class, section, and academic placement details.
          </p>
          <div className="student-form-grid three">
            <div>
              <Select
                label="Class"
                name="classId"
                value={form.classId}
                onChange={handleClassChange}
                required
                error={errors.classId}
                options={classes.map((c) => ({
                  value: String(c.id),
                  label: c.name,
                }))}
              />
              {classes.length === 0 && (
                <p className="student-form-hint">
                  No classes found. Go to <strong>Class</strong> in the sidebar,
                  create a class (and section), then come back here and refresh.
                </p>
              )}
            </div>
            <div>
              <Select
                label="Section"
                name="sectionId"
                value={form.sectionId}
                onChange={handleChange}
                disabled={!form.classId}
                options={filteredSections.map((s) => ({
                  value: String(s.id),
                  label: s.name,
                }))}
              />
              {form.classId && filteredSections.length === 0 && (
                <p className="student-form-hint">
                  No sections for this class. Open <strong>Class</strong> or{" "}
                  <strong>Section</strong>, add a section for this class, then
                  refresh.
                </p>
              )}
            </div>
            <Input
              label="Roll No"
              name="rollNo"
              value={form.rollNo}
              onChange={handleChange}
            />
            <Input
              label="Stream"
              name="stream"
              value={form.stream}
              onChange={handleChange}
            />
            <Input
              label="Fee Group"
              name="feeGroup"
              value={form.feeGroup}
              onChange={handleChange}
            />
            <Input
              label="Fee Payment Start From"
              name="feePaymentStartFrom"
              value={form.feePaymentStartFrom}
              onChange={handleChange}
            />
            <Select
              label="Admission Type"
              name="admissionType"
              value={form.admissionType}
              onChange={handleChange}
              options={[
                { value: "new", label: "New" },
                { value: "transfer", label: "Transfer" },
                { value: "readmission", label: "Readmission" },
              ]}
            />
            <Input
              label="Class Admitted"
              name="classAdmitted"
              value={form.classAdmitted}
              onChange={handleChange}
            />
            <Input
              label="Board"
              name="board"
              value={form.board}
              onChange={handleChange}
            />
            <Input
              label="Medium"
              name="medium"
              value={form.medium}
              onChange={handleChange}
            />
            <Input
              label="Board Registration No"
              name="boardRegistrationNo"
              value={form.boardRegistrationNo}
              onChange={handleChange}
            />
            <Input
              label="House"
              name="house"
              value={form.house}
              onChange={handleChange}
            />
            <Input
              label="Boarding Category"
              name="boardingCategory"
              value={form.boardingCategory}
              onChange={handleChange}
            />
          </div>
        </section>

        {/* 3. Personal Information */}
        <section className="student-form-section">
          <h3>3. Personal Information</h3>
          <p className="student-form-section-desc">
            Personal and demographic details.
          </p>
          <div className="student-form-grid three">
            <Input
              label="Date of Birth"
              type="date"
              name="dateOfBirth"
              value={form.dateOfBirth}
              onChange={handleChange}
            />
            <Input
              label="Date of Admission"
              type="date"
              name="dateOfAdmission"
              value={form.dateOfAdmission}
              onChange={handleChange}
            />
            <Input
              label="Date of Join"
              type="date"
              name="dateOfJoin"
              value={form.dateOfJoin}
              onChange={handleChange}
            />
            <Select
              label="Gender"
              name="gender"
              value={form.gender}
              onChange={handleChange}
              options={[
                { value: "male", label: "Male" },
                { value: "female", label: "Female" },
                { value: "other", label: "Other" },
              ]}
            />
            <Select
              label="Blood Group"
              name="bloodGroup"
              value={form.bloodGroup}
              onChange={handleChange}
              options={BLOOD_GROUP.map((bg) => ({ value: bg, label: bg }))}
            />
            <Select
              label="Religion"
              name="religion"
              value={form.religion}
              onChange={handleChange}
              options={RELIGIONS.map((r) => ({ value: r, label: r }))}
            />
            <Select
              label="Category"
              name="category"
              value={form.category}
              onChange={handleChange}
              options={CATEGORIES.map((c) => ({ value: c, label: c }))}
            />
            <Input
              label="Mother Tongue"
              name="motherTongue"
              value={form.motherTongue}
              onChange={handleChange}
            />
            <Input
              label="Nationality"
              name="nationality"
              value={form.nationality}
              onChange={handleChange}
            />
            <Input
              label="Marital Status"
              name="maritalStatus"
              value={form.maritalStatus}
              onChange={handleChange}
            />
          </div>
        </section>

        {/* 4. Parent / Father Information */}
        <section className="student-form-section">
          <h3>4. Parent / Father Information</h3>
          <p className="student-form-section-desc">
            Provide email and mobile to auto-create parent login credentials.
          </p>
          <div className="student-form-grid three">
            <Select
              label="Father Title"
              name="fatherTitle"
              value={form.fatherTitle}
              onChange={handleChange}
              options={[
                { value: "MR.", label: "MR." },
                { value: "DR.", label: "DR." },
                { value: "PROF.", label: "PROF." },
              ]}
            />
            <Input
              label="Father Name"
              name="name"
              value={form.father.name}
              onChange={(e) => handleNestedChange("father", e)}
            />
            <Input
              label="Father Mobile"
              name="mobile"
              value={form.father.mobile}
              onChange={(e) => handleNestedChange("father", e)}
              placeholder="10-digit mobile"
            />
            <Input
              label="Father Email"
              type="email"
              name="email"
              value={form.father.email}
              onChange={(e) => handleNestedChange("father", e)}
              placeholder="Used for parent login"
            />
            <Input
              label="Occupation"
              name="occupation"
              value={form.father.occupation}
              onChange={(e) => handleNestedChange("father", e)}
            />
            <Input
              label="Qualification"
              name="qualification"
              value={form.father.qualification}
              onChange={(e) => handleNestedChange("father", e)}
            />
            <Input
              label="Aadhar No"
              name="aadharNo"
              value={form.father.aadharNo}
              onChange={(e) => handleNestedChange("father", e)}
            />
            <Input
              label="Annual Income"
              type="number"
              name="annualIncome"
              value={form.father.annualIncome}
              onChange={(e) => handleNestedChange("father", e)}
            />
          </div>
          {form.father.email && form.father.mobile && (
            <p className="student-form-hint">
              A parent login may be created for this email when the student is
              saved.
            </p>
          )}
        </section>

        {/* 5. Mother Information */}
        <section className="student-form-section">
          <h3>5. Mother Information</h3>
          <p className="student-form-section-desc">
            Mother contact details and optional login credentials.
          </p>
          <div className="student-form-grid three">
            <Select
              label="Mother Title"
              name="motherTitle"
              value={form.motherTitle}
              onChange={handleChange}
              options={[
                { value: "MRS.", label: "MRS." },
                { value: "MS.", label: "MS." },
                { value: "DR.", label: "DR." },
                { value: "PROF.", label: "PROF." },
              ]}
            />
            <Input
              label="Mother Name"
              name="name"
              value={form.mother.name}
              onChange={(e) => handleNestedChange("mother", e)}
            />
            <Input
              label="Mother Mobile"
              name="mobile"
              value={form.mother.mobile}
              onChange={(e) => handleNestedChange("mother", e)}
              placeholder="10-digit mobile"
            />
            <Input
              label="Mother Email"
              type="email"
              name="email"
              value={form.mother.email}
              onChange={(e) => handleNestedChange("mother", e)}
              placeholder="Used for parent login"
            />
            <Input
              label="Occupation"
              name="occupation"
              value={form.mother.occupation}
              onChange={(e) => handleNestedChange("mother", e)}
            />
            <Input
              label="Qualification"
              name="qualification"
              value={form.mother.qualification}
              onChange={(e) => handleNestedChange("mother", e)}
            />
            <Input
              label="Aadhar No"
              name="aadharNo"
              value={form.mother.aadharNo}
              onChange={(e) => handleNestedChange("mother", e)}
            />
            <Input
              label="Annual Income"
              type="number"
              name="annualIncome"
              value={form.mother.annualIncome}
              onChange={(e) => handleNestedChange("mother", e)}
            />
          </div>
        </section>

        {/* 6. Guardian Information */}
        <section className="student-form-section">
          <h3>6. Guardian Information</h3>
          <p className="student-form-section-desc">
            Optional guardian details when the student lives with a guardian.
          </p>
          <div className="student-form-grid three">
            <Input
              label="Guardian Name"
              name="name"
              value={form.guardian.name}
              onChange={(e) => handleNestedChange("guardian", e)}
            />
            <Input
              label="Guardian Mobile"
              name="mobile"
              value={form.guardian.mobile}
              onChange={(e) => handleNestedChange("guardian", e)}
            />
            <Input
              label="Relation"
              name="relation"
              value={form.guardian.relation}
              onChange={(e) => handleNestedChange("guardian", e)}
              placeholder="Optional note (backend stores relation as guardian)"
            />
          </div>
        </section>

        {/* 7. Contact Information */}
        <section className="student-form-section">
          <h3>7. Contact Information</h3>
          <p className="student-form-section-desc">
            Communication and emergency contacts.
          </p>
          <div className="student-form-grid three">
            <Input
              label="Student Email"
              type="email"
              name="studentEmail"
              value={form.studentEmail}
              onChange={handleChange}
            />
            <Input
              label="Country Code"
              name="countryCode"
              value={form.countryCode}
              onChange={handleChange}
              placeholder="+91"
            />
            <Input
              label="Communication Mobile"
              name="communicationMobile"
              value={form.communicationMobile}
              onChange={handleChange}
            />
            <Input
              label="Communication Email"
              type="email"
              name="communicationEmail"
              value={form.communicationEmail}
              onChange={handleChange}
            />
            <Input
              label="Emergency Phone"
              name="emergencyPhoneNo"
              value={form.emergencyPhoneNo}
              onChange={handleChange}
            />
          </div>
        </section>

        {/* 8. Identification Information */}
        <section className="student-form-section">
          <h3>8. Identification Information</h3>
          <p className="student-form-section-desc">
            Government and school identification numbers.
          </p>
          <div className="student-form-grid three">
            <Input
              label="Aadhar No"
              name="aadharNo"
              value={form.aadharNo}
              onChange={handleChange}
            />
            <Input
              label="Unique No"
              name="uniqueNo"
              value={form.uniqueNo}
              onChange={handleChange}
            />
            <Input
              label="GR No"
              name="grNo"
              value={form.grNo}
              onChange={handleChange}
            />
            <Input
              label="RFID No"
              name="rfidNo"
              value={form.rfidNo}
              onChange={handleChange}
            />
            <Input
              label="APAAR ID"
              name="apaarId"
              value={form.apaarId}
              onChange={handleChange}
            />
            <Input
              label="SRN No"
              name="srnNo"
              value={form.srnNo}
              onChange={handleChange}
            />
          </div>
        </section>

        {/* 9. Bank Information */}
        <section className="student-form-section">
          <h3>9. Bank Information</h3>
          <p className="student-form-section-desc">
            Bank account details used for fee and refunds.
          </p>
          <div className="student-form-grid three">
            <Input
              label="Bank Name"
              name="bankName"
              value={form.bankName}
              onChange={handleChange}
            />
            <Input
              label="Account No"
              name="accountNo"
              value={form.accountNo}
              onChange={handleChange}
            />
            <Input
              label="IFSC"
              name="ifsc"
              value={form.ifsc}
              onChange={handleChange}
            />
            <Input
              label="Virtual Account No"
              name="virtualAccountNo"
              value={form.virtualAccountNo}
              onChange={handleChange}
            />
            <Input
              label="eNACH"
              name="eNach"
              value={form.eNach}
              onChange={handleChange}
            />
          </div>
        </section>

        {/* 10. Other Information */}
        <section className="student-form-section">
          <h3>10. Other Information</h3>
          <p className="student-form-section-desc">
            Additional remarks for administration and fees.
          </p>
          <div className="student-form-grid">
            <Input
              label="Remark"
              name="remark"
              value={form.remark}
              onChange={handleChange}
            />
            <Input
              label="Fee Remark"
              name="feeRemark"
              value={form.feeRemark}
              onChange={handleChange}
            />
          </div>
        </section>

        <div className="student-form-actions">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/student")}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {isEdit ? "Update Student" : "Create Student"}
          </Button>
        </div>
      </form>

      <Modal
        isOpen={Boolean(credentials)}
        onClose={() => {
          setCredentials(null);
          finishAfterSave(savedStudentId || id || null);
        }}
        title="Parent Login Credentials"
        size="lg"
      >
        <p className="student-credentials-note">
          Parent login credentials were generated by the backend. Share these
          with the parents now — they will not be shown again.
        </p>
        <table className="student-credentials-table">
          <thead>
            <tr>
              <th>Relation</th>
              <th>Name</th>
              <th>Email</th>
              <th>Password</th>
            </tr>
          </thead>
          <tbody>
            {(credentials || []).map((cred) => (
              <tr key={`${cred.relation}-${cred.email}`}>
                <td style={{ textTransform: "capitalize" }}>{cred.relation}</td>
                <td>{cred.name || "—"}</td>
                <td>{cred.email}</td>
                <td className="student-credentials-password">{cred.password}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <ModalFooter>
          <div className="student-credentials-actions">
            <Button
              variant="primary"
              onClick={() => {
                setCredentials(null);
                finishAfterSave(savedStudentId || id || null);
              }}
            >
              Done
            </Button>
          </div>
        </ModalFooter>
      </Modal>
    </div>
  );
}
