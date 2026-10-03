import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  ArrowLeft,
  ImagePlus,
  Upload,
  X,
} from "lucide-react";

import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import {
  Modal,
  ModalFooter,
} from "../../components/modal/Modal";

import axiosClient from "../../api/axios";

import {
  createStudent,
  getStudentById,
  updateStudent,
} from "../../api/student.api";

import { getClasses } from "../../api/class.api";

import {
  getAllSections,
  getSectionsByClass,
} from "../../api/section.api";

import {
  getCustomFieldForms,
  getCustomFieldsByForm,
  getCustomFieldValues,
  saveCustomFieldValues,
} from "../../api/customFields.api";

import {
  CUSTOM_FIELD_CONTROLS,
  BLOOD_GROUP,
  CATEGORIES,
  RELIGIONS,
} from "../../utils/constants";

import "./Student.css";

/* =========================================================
   HELPERS
========================================================= */

function normalizeList(res) {
  if (Array.isArray(res)) {
    return res;
  }

  if (Array.isArray(res?.data)) {
    return res.data;
  }

  if (
    Array.isArray(
      res?.data?.classes
    )
  ) {
    return res.data.classes;
  }

  if (
    Array.isArray(
      res?.data?.sections
    )
  ) {
    return res.data.sections;
  }

  return [];
}

const EMPTY_FORM = {
  admissionNo: "",
  feeNo: "",
  siblingAdmNo: "",
  studentName: "",
  childLivingWith: "",

  /*
   * IMPORTANT:
   * This now stores the uploaded server path.
   *
   * Example:
   * /uploads/students/student-123.jpg
   */
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
    email: "",
  },
};

function toDateInput(value) {
  if (!value) {
    return "";
  }

  try {
    return String(value).slice(
      0,
      10
    );
  } catch {
    return "";
  }
}

function cleanValue(value) {
  if (typeof value === "string") {
    const trimmed =
      value.trim();

    return trimmed === ""
      ? undefined
      : trimmed;
  }

  return value;
}

/* =========================================================
   STUDENT FIELDS
========================================================= */

const STUDENT_FIELDS = [
  "admissionNo",
  "feeNo",
  "siblingAdmNo",
  "studentName",
  "childLivingWith",

  /*
   * photoUrl remains part of the
   * normal student payload.
   */
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

/* =========================================================
   PARENT PAYLOAD
========================================================= */

function buildParentPayload(parent) {
  if (!parent) {
    return undefined;
  }

  const name =
    cleanValue(
      parent.name
    );

  const email =
    cleanValue(
      parent.email
    );

  const mobile =
    cleanValue(
      parent.mobile
    );

  if (
    !name &&
    !email &&
    !mobile
  ) {
    return undefined;
  }

  const payload = {
    name: name || "",
    mobile,
    email,
    occupation:
      cleanValue(
        parent.occupation
      ),
    qualification:
      cleanValue(
        parent.qualification
      ),
    aadharNo:
      cleanValue(
        parent.aadharNo
      ),
  };

  if (
    parent.annualIncome !==
      "" &&
    parent.annualIncome != null
  ) {
    const income =
      Number(
        parent.annualIncome
      );

    if (
      !Number.isNaN(income)
    ) {
      payload.annualIncome =
        income;
    }
  }

  return payload;
}

/* =========================================================
   GUARDIAN PAYLOAD
========================================================= */

function buildGuardianPayload(
  guardian
) {
  if (!guardian) {
    return undefined;
  }

  const name =
    cleanValue(
      guardian.name
    );

  const mobile =
    cleanValue(
      guardian.mobile
    );

  const email =
    cleanValue(
      guardian.email
    );

  if (
    !name &&
    !mobile &&
    !email
  ) {
    return undefined;
  }

  return {
    name: name || "",
    mobile,
    email,
    relation:
      cleanValue(
        guardian.relation
      ) || "guardian",
  };
}

/* =========================================================
   BUILD STUDENT PAYLOAD
========================================================= */

function buildStudentPayload(
  form
) {
  const payload = {};

  STUDENT_FIELDS.forEach(
    (key) => {
      const cleaned =
        cleanValue(
          form[key]
        );

      if (
        cleaned !==
        undefined
      ) {
        payload[key] =
          cleaned;
      }
    }
  );

  /*
   * Class
   */
  if (form.classId) {
    payload.classId =
      Number(
        form.classId
      );
  }

  /*
   * Section
   */
  if (form.sectionId) {
    payload.sectionId =
      Number(
        form.sectionId
      );
  }

  /*
   * Father
   */
  const fatherPayload =
    buildParentPayload(
      form.father
    );

  if (fatherPayload) {
    payload.father =
      fatherPayload;

    payload.fatherName =
      fatherPayload.name ||
      undefined;

    payload.fatherMobile =
      fatherPayload.mobile ||
      undefined;

    payload.fatherEmail =
      fatherPayload.email ||
      undefined;

    payload.fatherOccupation =
      fatherPayload.occupation ||
      undefined;

    payload.fatherQualification =
      fatherPayload.qualification ||
      undefined;

    payload.fatherAadharNo =
      fatherPayload.aadharNo ||
      undefined;

    if (
      fatherPayload.annualIncome !==
      undefined
    ) {
      payload.fatherAnnualIncome =
        fatherPayload.annualIncome;
    }
  }

  /*
   * Mother
   */
  const motherPayload =
    buildParentPayload(
      form.mother
    );

  if (motherPayload) {
    payload.mother =
      motherPayload;

    payload.motherName =
      motherPayload.name ||
      undefined;

    payload.motherMobile =
      motherPayload.mobile ||
      undefined;

    payload.motherEmail =
      motherPayload.email ||
      undefined;

    payload.motherOccupation =
      motherPayload.occupation ||
      undefined;

    payload.motherQualification =
      motherPayload.qualification ||
      undefined;

    payload.motherAadharNo =
      motherPayload.aadharNo ||
      undefined;

    if (
      motherPayload.annualIncome !==
      undefined
    ) {
      payload.motherAnnualIncome =
        motherPayload.annualIncome;
    }
  }

  /*
   * Guardian
   */
  const guardianPayload =
    buildGuardianPayload(
      form.guardian
    );

  if (guardianPayload) {
    payload.guardian =
      guardianPayload;

    payload.guardianName =
      guardianPayload.name ||
      undefined;

    payload.guardianMobile =
      guardianPayload.mobile ||
      undefined;

    payload.guardianEmail =
      guardianPayload.email ||
      undefined;

    payload.guardianRelation =
      guardianPayload.relation ||
      "guardian";
  }

  return payload;
}

/* =========================================================
   CUSTOM FIELDS
========================================================= */

async function loadCustomFieldsGrouped() {
  const formsRes =
    await getCustomFieldForms();

  const formNames =
    Array.isArray(
      formsRes?.data
    )
      ? formsRes.data
      : [];

  const groups = [];

  for (
    const formName of formNames
  ) {
    try {
      const fieldsRes =
        await getCustomFieldsByForm(
          formName
        );

      const fields =
        Array.isArray(
          fieldsRes?.data
        )
          ? fieldsRes.data
          : [];

      if (
        fields.length > 0
      ) {
        groups.push({
          formName,
          fields,
        });
      }
    } catch (err) {
      console.error(
        `Failed to load custom fields for "${formName}":`,
        err
      );
    }
  }

  return groups;
}

/* =========================================================
   CUSTOM FIELD VALUES
========================================================= */

function mapCustomFieldValues(
  list = []
) {
  const values = {};

  list.forEach(
    (item) => {
      const fieldId =
        item.customFieldId ??
        item.customField?.id;

      if (
        fieldId != null
      ) {
        values[fieldId] =
          item.value ??
          "";
      }
    }
  );

  return values;
}

/* =========================================================
   STUDENT -> FORM
========================================================= */

function mapStudentToForm(
  student
) {
  const parents =
    student.parents ||
    [];

  const father =
    parents.find(
      (p) =>
        String(
          p.relation
        ).toLowerCase() ===
        "father"
    );

  const mother =
    parents.find(
      (p) =>
        String(
          p.relation
        ).toLowerCase() ===
        "mother"
    );

  const guardian =
    parents.find(
      (p) =>
        String(
          p.relation
        ).toLowerCase() ===
        "guardian"
    );

  return {
    ...EMPTY_FORM,

    admissionNo:
      student.admissionNo ||
      "",

    feeNo:
      student.feeNo ||
      "",

    siblingAdmNo:
      student.siblingAdmNo ||
      "",

    studentName:
      student.studentName ||
      "",

    childLivingWith:
      student.childLivingWith ||
      "",

    /*
     * Existing photo is loaded
     * directly into StudentPhoto.
     */
    photoUrl:
      student.photoUrl ||
      "",

    signatureUrl:
      student.signatureUrl ||
      "",

    fatherTitle:
      student.fatherTitle ||
      "",

    fatherName:
      student.fatherName ||
      father?.name ||
      "",

    motherTitle:
      student.motherTitle ||
      "",

    motherName:
      student.motherName ||
      mother?.name ||
      "",

    classId:
      student.classId
        ? String(
            student.classId
          )
        : "",

    sectionId:
      student.sectionId
        ? String(
            student.sectionId
          )
        : "",

    stream:
      student.stream ||
      "",

    feeGroup:
      student.feeGroup ||
      "",

    feePaymentStartFrom:
      student.feePaymentStartFrom ||
      "",

    dateOfBirth:
      toDateInput(
        student.dateOfBirth
      ),

    dateOfAdmission:
      toDateInput(
        student.dateOfAdmission
      ),

    dateOfJoin:
      toDateInput(
        student.dateOfJoin
      ),

    rollNo:
      student.rollNo ||
      "",

    gender:
      student.gender ||
      "",

    admissionType:
      student.admissionType ||
      "",

    classAdmitted:
      student.classAdmitted ||
      "",

    emergencyPhoneNo:
      student.emergencyPhoneNo ||
      "",

    house:
      student.house ||
      "",

    boardingCategory:
      student.boardingCategory ||
      "",

    board:
      student.board ||
      "",

    medium:
      student.medium ||
      "",

    boardRegistrationNo:
      student.boardRegistrationNo ||
      "",

    studentEmail:
      student.studentEmail ||
      "",

    countryCode:
      student.countryCode ||
      "",

    communicationMobile:
      student.communicationMobile ||
      "",

    communicationEmail:
      student.communicationEmail ||
      "",

    aadharNo:
      student.aadharNo ||
      "",

    remark:
      student.remark ||
      "",

    feeRemark:
      student.feeRemark ||
      "",

    uniqueNo:
      student.uniqueNo ||
      "",

    grNo:
      student.grNo ||
      "",

    rfidNo:
      student.rfidNo ||
      "",

    eNach:
      student.eNach ||
      "",

    bankName:
      student.bankName ||
      "",

    accountNo:
      student.accountNo ||
      "",

    ifsc:
      student.ifsc ||
      "",

    virtualAccountNo:
      student.virtualAccountNo ||
      "",

    apaarId:
      student.apaarId ||
      "",

    srnNo:
      student.srnNo ||
      "",

    bloodGroup:
      student.bloodGroup ||
      "",

    religion:
      student.religion ||
      "",

    category:
      student.category ||
      "",

    motherTongue:
      student.motherTongue ||
      "",

    nationality:
      student.nationality ||
      "",

    maritalStatus:
      student.maritalStatus ||
      "",

    father: {
      name:
        father?.name ||
        student.fatherName ||
        "",

      mobile:
        father?.mobile ||
        "",

      email:
        father?.email ||
        "",

      occupation:
        father?.occupation ||
        "",

      qualification:
        father?.qualification ||
        "",

      aadharNo:
        father?.aadharNo ||
        "",

      annualIncome:
        father?.annualIncome !=
          null
          ? String(
              father.annualIncome
            )
          : "",
    },

    mother: {
      name:
        mother?.name ||
        student.motherName ||
        "",

      mobile:
        mother?.mobile ||
        "",

      email:
        mother?.email ||
        "",

      occupation:
        mother?.occupation ||
        "",

      qualification:
        mother?.qualification ||
        "",

      aadharNo:
        mother?.aadharNo ||
        "",

      annualIncome:
        mother?.annualIncome !=
          null
          ? String(
              mother.annualIncome
            )
          : "",
    },

    guardian: {
      name:
        guardian?.name ||
        "",

      mobile:
        guardian?.mobile ||
        "",

      relation:
        guardian?.relation ||
        "",

      email:
        guardian?.email ||
        "",
    },
  };
}

/* =========================================================
   COMPONENT
========================================================= */

export default function StudentForm() {
  const { id } =
    useParams();

  const isEdit =
    Boolean(id);

  const navigate =
    useNavigate();

  const [form, setForm] =
    useState(
      EMPTY_FORM
    );

  const [classes, setClasses] =
    useState([]);

  const [sections, setSections] =
    useState([]);

  const [
    customFieldGroups,
    setCustomFieldGroups,
  ] = useState([]);

  const [
    customValues,
    setCustomValues,
  ] = useState({});

  const [errors, setErrors] =
    useState({});

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [
    bootLoading,
    setBootLoading,
  ] = useState(true);

  const [
    credentials,
    setCredentials,
  ] = useState(null);

  const [
    savedStudentId,
    setSavedStudentId,
  ] = useState(null);

  const [selectedPhoto, setSelectedPhoto] =
    useState(null);

  const [photoPreview, setPhotoPreview] =
    useState("");

  const [photoUploading, setPhotoUploading] =
    useState(false);

  /* =======================================================
     CUSTOM FIELDS
  ======================================================= */

  const allCustomFields =
    useMemo(
      () =>
        customFieldGroups.flatMap(
          (group) =>
            group.fields
        ),
      [customFieldGroups]
    );

  /* =======================================================
     SECTIONS
  ======================================================= */

  const filteredSections =
    useMemo(() => {
      if (!form.classId) {
        return [];
      }

      const fromState =
        sections.filter(
          (section) =>
            String(
              section.classId
            ) ===
            String(
              form.classId
            )
        );

      if (
        fromState.length > 0
      ) {
        return fromState;
      }

      const selectedClass =
        classes.find(
          (c) =>
            String(c.id) ===
            String(
              form.classId
            )
        );

      return (
        selectedClass?.sections ||
        []
      );
    }, [
      sections,
      classes,
      form.classId,
    ]);

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    const load =
      async () => {
        try {
          setBootLoading(
            true
          );

          setError("");

          let classList =
            [];

          try {
            const classesRes =
              await getClasses();

            classList =
              normalizeList(
                classesRes
              );

            setClasses(
              classList
            );
          } catch (
            classErr
          ) {
            setClasses([]);

            setError(
              classErr
                ?.response
                ?.data
                ?.error ||
                classErr
                  ?.response
                  ?.data
                  ?.message ||
                "Failed to load classes. Open the Class page and create classes first."
            );
          }

          const embeddedSections =
            classList.flatMap(
              (c) =>
                (
                  c.sections ||
                  []
                ).map(
                  (s) => ({
                    ...s,
                    classId:
                      s.classId ??
                      c.id,
                  })
                )
            );

          try {
            const sectionsRes =
              await getAllSections();

            const sectionList =
              normalizeList(
                sectionsRes
              );

            setSections(
              sectionList.length >
                0
                ? sectionList
                : embeddedSections
            );
          } catch {
            setSections(
              embeddedSections
            );
          }

          try {
            const groups =
              await loadCustomFieldsGrouped();

            setCustomFieldGroups(
              groups
            );
          } catch (
            customFieldError
          ) {
            console.error(
              "Failed to load custom fields:",
              customFieldError
            );

            setCustomFieldGroups(
              []
            );
          }

          if (isEdit) {
            const studentRes =
              await getStudentById(
                id
              );

            const student =
              studentRes?.data ||
              {};

            setForm(
              mapStudentToForm(
                student
              )
            );

            try {
              const valuesRes =
                await getCustomFieldValues(
                  id
                );

              const fromApi =
                Array.isArray(
                  valuesRes?.data
                )
                  ? valuesRes.data
                  : [];

              if (
                fromApi.length >
                0
              ) {
                setCustomValues(
                  mapCustomFieldValues(
                    fromApi
                  )
                );
              } else {
                setCustomValues(
                  mapCustomFieldValues(
                    student.customFieldValues ||
                      []
                  )
                );
              }
            } catch {
              setCustomValues(
                mapCustomFieldValues(
                  student.customFieldValues ||
                    []
                )
              );
            }
          }
        } catch (err) {
          console.error(
            "Student form loading error:",
            err
          );

          setError(
            err?.response
              ?.data
              ?.error ||
              err?.response
                ?.data
                ?.message ||
              "Failed to load form data."
          );
        } finally {
          setBootLoading(
            false
          );
        }
      };

    load();
  }, [
    id,
    isEdit,
  ]);

  /* =======================================================
     NORMAL INPUT CHANGE
  ======================================================= */

  const handleChange =
    (e) => {
      const {
        name,
        value,
      } = e.target;

      setForm(
        (prev) => ({
          ...prev,
          [name]: value,
        })
      );

      setErrors(
        (prev) => ({
          ...prev,
          [name]: "",
        })
      );
    };

  /* =======================================================
     PHOTO CHANGE
  ======================================================= */

  const handlePhotoChange =
    (e) => {
      const file =
        e.target.files?.[0];

      if (!file) {
        return;
      }

      if (!String(file.type || "").startsWith("image/")) {
        setError(
          "Please select an image file such as JPG, JPEG, PNG, WEBP, GIF or another supported image format."
        );
        e.target.value = "";
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError(
          "Student photo must be smaller than 10 MB."
        );
        e.target.value = "";
        return;
      }

      setError("");
      setSuccess("");
      setSelectedPhoto(file);

      const localPreview =
        URL.createObjectURL(file);

      setPhotoPreview(localPreview);

      e.target.value = "";
    };

  const removePhoto =
    () => {
      setSelectedPhoto(null);

      if (photoPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(photoPreview);
      }

      setPhotoPreview("");

      setForm(
        (previous) => ({
          ...previous,
          photoUrl: "",
        })
      );
    };

  /* =======================================================
     CUSTOM VALUE CHANGE
  ======================================================= */

  const handleCustomValueChange =
    (
      fieldId,
      value
    ) => {
      setCustomValues(
        (prev) => ({
          ...prev,
          [fieldId]:
            value,
        })
      );
    };

  /* =======================================================
     NESTED PARENT CHANGE
  ======================================================= */

  const handleNestedChange =
    (
      group,
      e
    ) => {
      const {
        name,
        value,
      } = e.target;

      setForm(
        (prev) => ({
          ...prev,

          [group]: {
            ...prev[group],
            [name]: value,
          },
        })
      );
    };

  /* =======================================================
     CLASS CHANGE
  ======================================================= */

  const handleClassChange =
    async (e) => {
      const value =
        e.target.value;

      setForm(
        (prev) => ({
          ...prev,
          classId: value,
          sectionId: "",
        })
      );

      setErrors(
        (prev) => ({
          ...prev,
          classId: "",
        })
      );

      if (!value) {
        return;
      }

      try {
        const res =
          await getSectionsByClass(
            value
          );

        const list =
          normalizeList(
            res
          ).map(
            (s) => ({
              ...s,
              classId:
                s.classId ??
                Number(value),
            })
          );

        if (
          list.length > 0
        ) {
          setSections(
            (prev) => {
              const others =
                prev.filter(
                  (s) =>
                    String(
                      s.classId
                    ) !==
                    String(value)
                );

              return [
                ...others,
                ...list,
              ];
            }
          );
        }
      } catch {
        /*
         * Keep existing sections.
         */
      }
    };

  /* =======================================================
     VALIDATION
  ======================================================= */

  const validate =
    () => {
      const nextErrors =
        {};

      if (
        !form.admissionNo.trim()
      ) {
        nextErrors.admissionNo =
          "Admission number is required.";
      }

      if (
        !form.studentName.trim()
      ) {
        nextErrors.studentName =
          "Student name is required.";
      }

      if (!form.classId) {
        nextErrors.classId =
          "Class is required.";
      }

      const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (
        form.father.email &&
        !emailRegex.test(
          form.father.email.trim()
        )
      ) {
        nextErrors.fatherEmail =
          "Enter a valid father email.";
      }

      if (
        form.mother.email &&
        !emailRegex.test(
          form.mother.email.trim()
        )
      ) {
        nextErrors.motherEmail =
          "Enter a valid mother email.";
      }

      setErrors(
        nextErrors
      );

      return (
        Object.keys(
          nextErrors
        ).length === 0
      );
    };

  /* =======================================================
     FINISH AFTER SAVE
  ======================================================= */

  const finishAfterSave =
    (studentId) => {
      if (studentId) {
        navigate(
          `/student/${studentId}`
        );
      } else {
        navigate(
          "/student"
        );
      }
    };

  /* =======================================================
     SAVE CUSTOM VALUES
  ======================================================= */

  const saveStudentCustomValues =
    async (
      studentId
    ) => {
      if (
        !studentId ||
        allCustomFields.length ===
          0
      ) {
        return;
      }

      const values =
        allCustomFields.map(
          (field) => ({
            customFieldId:
              field.id,

            value:
              customValues[
                field.id
              ] != null
                ? String(
                    customValues[
                      field.id
                    ]
                  )
                : "",
          })
        );

      await saveCustomFieldValues(
        {
          studentId:
            Number(
              studentId
            ),
          values,
        }
      );
    };

  /* =======================================================
     EXTRACT PARENT CREDENTIALS
  ======================================================= */

  const extractParentCredentials =
    (response) => {
      const data =
        response?.data;

      if (
        Array.isArray(
          data?.parentCredentials
        ) &&
        data
          .parentCredentials
          .length > 0
      ) {
        return data.parentCredentials;
      }

      if (
        Array.isArray(
          data?.credentials
            ?.parents
        ) &&
        data.credentials.parents
          .length > 0
      ) {
        return data.credentials.parents;
      }

      if (
        Array.isArray(
          response?.parentCredentials
        ) &&
        response
          .parentCredentials
          .length > 0
      ) {
        return response.parentCredentials;
      }

      if (
        Array.isArray(
          response?.credentials
            ?.parents
        ) &&
        response.credentials.parents
          .length > 0
      ) {
        return response.credentials.parents;
      }

      return [];
    };

  /* =======================================================
     SUBMIT
  ======================================================= */

  const handleSubmit =
    async (e) => {
      e.preventDefault();

      setError("");
      setSuccess("");

      if (!validate()) {
        setError(
          "Please fill all required fields and correct the highlighted errors."
        );

        return;
      }

      try {
        setLoading(true);

        const payload =
          buildStudentPayload(
            form
          );

        console.log(
          "STUDENT PAYLOAD:",
          payload
        );

        const response =
          isEdit
            ? await updateStudent(
                id,
                payload
              )
            : await createStudent(
                payload
              );

        const saved =
          response?.data ||
          {};

        console.log(
          "SAVED STUDENT DATA:",
          saved
        );

        const parentCredentials =
          extractParentCredentials(
            response
          );

        const nextId =
          saved?.id ||
          saved?.student?.id ||
          response?.id ||
          (isEdit
            ? Number(id)
            : null);

        /*
         * Upload the selected photo only after the student has an ID.
         * The browser preview is temporary; this stores the permanent
         * /uploads/students/... URL in the Student record.
         */
        if (selectedPhoto && nextId) {
          try {
            setPhotoUploading(true);

            const photoFormData =
              new FormData();

            photoFormData.append(
              "photo",
              selectedPhoto,
              selectedPhoto.name
            );

            const photoResponse =
              await axiosClient.post(
                "/students/upload-photo",
                photoFormData,
                {
                  timeout: 120000,
                }
              );

            const uploadedUrl =
              photoResponse?.data?.data?.photoUrl ||
              photoResponse?.data?.photoUrl ||
              photoResponse?.data?.data?.url ||
              photoResponse?.data?.url;

            if (!uploadedUrl) {
              throw new Error(
                "Photo uploaded, but the server did not return a photo URL."
              );
            }

            await updateStudent(
              nextId,
              {
                photoUrl: uploadedUrl,
              }
            );

            setForm((previous) => ({
              ...previous,
              photoUrl: uploadedUrl,
            }));

            if (photoPreview?.startsWith("blob:")) {
              URL.revokeObjectURL(photoPreview);
            }

            setPhotoPreview(uploadedUrl);
            setSelectedPhoto(null);
          } catch (photoError) {
            throw new Error(
              photoError?.response?.data?.error ||
                photoError?.response?.data?.message ||
                photoError.message ||
                "Student was saved, but the photo upload failed."
            );
          } finally {
            setPhotoUploading(false);
          }
        }

        if (
          nextId &&
          allCustomFields.length >
            0
        ) {
          try {
            await saveStudentCustomValues(
              nextId
            );
          } catch (
            customFieldError
          ) {
            console.error(
              "Failed to save custom field values:",
              customFieldError
            );

            setError(
              customFieldError
                ?.response
                ?.data
                ?.error ||
                customFieldError
                  ?.response
                  ?.data
                  ?.message ||
                "Student saved, but custom field values failed to save."
            );

            setLoading(false);

            return;
          }
        }

        setSuccess(
          response?.message ||
            (isEdit
              ? "Student updated successfully"
              : "Student created successfully")
        );

        if (
          parentCredentials.length >
          0
        ) {
          setSavedStudentId(
            nextId
          );

          setCredentials(
            parentCredentials
          );

          return;
        }

        if (nextId) {
          setTimeout(
            () =>
              finishAfterSave(
                nextId
              ),
            800
          );
        } else {
          setTimeout(
            () =>
              navigate(
                "/student"
              ),
            800
          );
        }
      } catch (err) {
        console.error(
          "SAVE STUDENT ERROR:",
          err
        );

        setError(
          err?.response
            ?.data
            ?.error ||
            err?.response
              ?.data
              ?.message ||
            err?.message ||
            "Failed to save student."
        );
      } finally {
        setLoading(false);
      }
    };

  /* =======================================================
     LOADING
  ======================================================= */

  if (bootLoading) {
    return (
      <div className="student-form-page">
        <div className="student-loading">
          Loading student form...
        </div>
      </div>
    );
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="student-form-page">

      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="student-form-header">

        <div>
          <h1>
            {isEdit
              ? "Edit Student"
              : "Add Student"}
          </h1>

          <p>
            {isEdit
              ? "Update student enrolment and related details."
              : "Register a new student with academic and parent details."}
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() =>
            navigate(
              "/student"
            )
          }
        >
          <ArrowLeft
            size={16}
            className="mr-2"
          />

          Back to list
        </Button>

      </div>

      {/* ===================================================
          ALERTS
      =================================================== */}

      {error && (
        <div className="student-alert error">
          {error}
        </div>
      )}

      {success && (
        <div className="student-alert success">
          {success}
        </div>
      )}

      {/* ===================================================
          FORM
      =================================================== */}

      <form
        className="student-form-card"
        onSubmit={
          handleSubmit
        }
      >

        {/* =================================================
            1. BASIC INFORMATION
        ================================================= */}

        <section className="student-form-section">

          <h3>
            1. Basic Information
          </h3>

          <p className="student-form-section-desc">
            Required enrolment identity
            for the student.
          </p>

          <div className="student-form-grid">

            <Input
              label="Admission No"
              name="admissionNo"
              value={
                form.admissionNo
              }
              onChange={
                handleChange
              }
              required
              error={
                errors.admissionNo
              }
            />

            <Input
              label="Student Name"
              name="studentName"
              value={
                form.studentName
              }
              onChange={
                handleChange
              }
              required
              error={
                errors.studentName
              }
            />

            <Input
              label="Fee No"
              name="feeNo"
              value={
                form.feeNo
              }
              onChange={
                handleChange
              }
            />

            <Input
              label="Sibling Admission No"
              name="siblingAdmNo"
              value={
                form.siblingAdmNo
              }
              onChange={
                handleChange
              }
            />

            <Select
              label="Child Living With"
              name="childLivingWith"
              value={
                form.childLivingWith
              }
              onChange={
                handleChange
              }
              options={[
                {
                  value:
                    "Both Father & Mother",
                  label:
                    "Both Father & Mother",
                },
                {
                  value:
                    "Father",
                  label:
                    "Father",
                },
                {
                  value:
                    "Mother",
                  label:
                    "Mother",
                },
                {
                  value:
                    "Guardian",
                  label:
                    "Guardian",
                },
              ]}
            />

          </div>

          {/* =================================================
              STUDENT PHOTO
          ================================================= */}

          <div
            className="student-photo-upload-field"
            style={{
              marginTop: "24px",
              gridColumn: "1 / -1",
            }}
          >
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: 600,
                marginBottom: "10px",
              }}
            >
              Student Photo
            </label>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "20px",
                flexWrap: "wrap",
                padding: "18px",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                background: "#f8fafc",
              }}
            >
              {photoPreview || form.photoUrl ? (
                <img
                  src={photoPreview || form.photoUrl}
                  alt={form.studentName || "Student"}
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "3px solid #e2e8f0",
                    background: "#ffffff",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: "50%",
                    background: "#e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ImagePlus
                    size={32}
                    color="#64748b"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="student-photo-input"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: photoUploading ? "not-allowed" : "pointer",
                    background: "#0ea5e9",
                    color: "#ffffff",
                    padding: "10px 16px",
                    borderRadius: "8px",
                    fontWeight: 600,
                    opacity: photoUploading ? 0.6 : 1,
                  }}
                >
                  <Upload size={17} />
                  {photoUploading ? "Uploading..." : "Choose Photo"}
                </label>

                <input
                  id="student-photo-input"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  disabled={photoUploading || loading}
                  style={{ display: "none" }}
                />

                <p
                  style={{
                    margin: "8px 0 0",
                    color: "#64748b",
                    fontSize: "13px",
                  }}
                >
                  Select an image from your device. Maximum 10 MB.
                </p>

                {selectedPhoto && (
                  <p
                    style={{
                      margin: "6px 0 0",
                      color: "#0369a1",
                      fontSize: "13px",
                      fontWeight: 600,
                    }}
                  >
                    Selected: {selectedPhoto.name}
                  </p>
                )}

                {(selectedPhoto || form.photoUrl) && (
                  <button
                    type="button"
                    onClick={removePhoto}
                    disabled={photoUploading || loading}
                    style={{
                      marginTop: "8px",
                      border: "none",
                      background: "transparent",
                      color: "#dc2626",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: 0,
                    }}
                  >
                    <X size={14} />
                    Remove photo
                  </button>
                )}
              </div>
            </div>

            {errors.photoUrl && (
              <div
                style={{
                  marginTop: "6px",
                  color: "#dc2626",
                  fontSize: "13px",
                }}
              >
                {errors.photoUrl}
              </div>
            )}
          </div>

          <div
            className="student-form-grid"
            style={{
              marginTop:
                "24px",
            }}
          >

            <Input
              label="Signature URL"
              name="signatureUrl"
              value={
                form.signatureUrl
              }
              onChange={
                handleChange
              }
              placeholder="Optional"
            />

          </div>

        </section>

        {/* =================================================
            2. ACADEMIC INFORMATION
        ================================================= */}

        <section className="student-form-section">

          <h3>
            2. Academic Information
          </h3>

          <p className="student-form-section-desc">
            Class, section, and academic
            placement details.
          </p>

          <div className="student-form-grid three">

            <div>

              <Select
                label="Class"
                name="classId"
                value={
                  form.classId
                }
                onChange={
                  handleClassChange
                }
                required
                error={
                  errors.classId
                }
                options={classes.map(
                  (c) => ({
                    value:
                      String(c.id),
                    label:
                      c.name,
                  })
                )}
              />

              {classes.length ===
                0 && (
                <p className="student-form-hint">
                  No classes found.
                  Go to{" "}
                  <strong>
                    Class
                  </strong>{" "}
                  in the sidebar,
                  create a class
                  and section,
                  then come back
                  here and refresh.
                </p>
              )}

            </div>

            <div>

              <Select
                label="Section"
                name="sectionId"
                value={
                  form.sectionId
                }
                onChange={
                  handleChange
                }
                disabled={
                  !form.classId
                }
                options={filteredSections.map(
                  (s) => ({
                    value:
                      String(s.id),
                    label:
                      s.name,
                  })
                )}
              />

              {form.classId &&
                filteredSections.length ===
                  0 && (
                  <p className="student-form-hint">
                    No sections for
                    this class.
                    Open{" "}
                    <strong>
                      Class
                    </strong>{" "}
                    or{" "}
                    <strong>
                      Section
                    </strong>
                    , add a section,
                    then refresh.
                  </p>
                )}

            </div>

            <Input
              label="Roll No"
              name="rollNo"
              value={
                form.rollNo
              }
              onChange={
                handleChange
              }
            />

            <Input
              label="Stream"
              name="stream"
              value={
                form.stream
              }
              onChange={
                handleChange
              }
            />

            <Input
              label="Fee Group"
              name="feeGroup"
              value={
                form.feeGroup
              }
              onChange={
                handleChange
              }
            />

            <Input
              label="Fee Payment Start From"
              name="feePaymentStartFrom"
              value={
                form.feePaymentStartFrom
              }
              onChange={
                handleChange
              }
            />

            <Select
              label="Admission Type"
              name="admissionType"
              value={
                form.admissionType
              }
              onChange={
                handleChange
              }
              options={[
                {
                  value: "new",
                  label: "New",
                },
                {
                  value:
                    "transfer",
                  label:
                    "Transfer",
                },
                {
                  value:
                    "readmission",
                  label:
                    "Readmission",
                },
              ]}
            />

            <Input
              label="Class Admitted"
              name="classAdmitted"
              value={
                form.classAdmitted
              }
              onChange={
                handleChange
              }
            />

            <Input
              label="Board"
              name="board"
              value={
                form.board
              }
              onChange={
                handleChange
              }
            />

            <Input
              label="Medium"
              name="medium"
              value={
                form.medium
              }
              onChange={
                handleChange
              }
            />

            <Input
              label="Board Registration No"
              name="boardRegistrationNo"
              value={
                form.boardRegistrationNo
              }
              onChange={
                handleChange
              }
            />

            <Input
              label="House"
              name="house"
              value={
                form.house
              }
              onChange={
                handleChange
              }
            />

            <Input
              label="Boarding Category"
              name="boardingCategory"
              value={
                form.boardingCategory
              }
              onChange={
                handleChange
              }
            />

          </div>

        </section>

        {/* =================================================
            3. PERSONAL INFORMATION
        ================================================= */}

        <section className="student-form-section">

          <h3>
            3. Personal Information
          </h3>

          <p className="student-form-section-desc">
            Personal and demographic
            details.
          </p>

          <div className="student-form-grid three">

            <Input
              label="Date of Birth"
              type="date"
              name="dateOfBirth"
              value={
                form.dateOfBirth
              }
              onChange={
                handleChange
              }
            />

            <Input
              label="Date of Admission"
              type="date"
              name="dateOfAdmission"
              value={
                form.dateOfAdmission
              }
              onChange={
                handleChange
              }
            />

            <Input
              label="Date of Join"
              type="date"
              name="dateOfJoin"
              value={
                form.dateOfJoin
              }
              onChange={
                handleChange
              }
            />

            <Select
              label="Gender"
              name="gender"
              value={
                form.gender
              }
              onChange={
                handleChange
              }
              options={[
                {
                  value: "male",
                  label: "Male",
                },
                {
                  value:
                    "female",
                  label:
                    "Female",
                },
                {
                  value: "other",
                  label: "Other",
                },
              ]}
            />

            <Select
              label="Blood Group"
              name="bloodGroup"
              value={
                form.bloodGroup
              }
              onChange={
                handleChange
              }
              options={BLOOD_GROUP.map(
                (bg) => ({
                  value: bg,
                  label: bg,
                })
              )}
            />

            <Select
              label="Religion"
              name="religion"
              value={
                form.religion
              }
              onChange={
                handleChange
              }
              options={RELIGIONS.map(
                (r) => ({
                  value: r,
                  label: r,
                })
              )}
            />

            <Select
              label="Category"
              name="category"
              value={
                form.category
              }
              onChange={
                handleChange
              }
              options={CATEGORIES.map(
                (c) => ({
                  value: c,
                  label: c,
                })
              )}
            />

            <Input
              label="Mother Tongue"
              name="motherTongue"
              value={
                form.motherTongue
              }
              onChange={
                handleChange
              }
            />

            <Input
              label="Nationality"
              name="nationality"
              value={
                form.nationality
              }
              onChange={
                handleChange
              }
            />

            <Input
              label="Marital Status"
              name="maritalStatus"
              value={
                form.maritalStatus
              }
              onChange={
                handleChange
              }
            />

          </div>

        </section>

        {/* =================================================
            4. FATHER
        ================================================= */}

        <section className="student-form-section">

          <h3>
            4. Parent / Father Information
          </h3>

          <p className="student-form-section-desc">
            Enter the father's email to
            automatically create a parent
            login account.
          </p>

          <div className="student-form-grid three">

            <Select
              label="Father Title"
              name="fatherTitle"
              value={
                form.fatherTitle
              }
              onChange={
                handleChange
              }
              options={[
                {
                  value: "MR.",
                  label: "MR.",
                },
                {
                  value: "DR.",
                  label: "DR.",
                },
                {
                  value:
                    "PROF.",
                  label:
                    "PROF.",
                },
              ]}
            />

            <Input
              label="Father Name"
              name="name"
              value={
                form.father.name
              }
              onChange={(e) =>
                handleNestedChange(
                  "father",
                  e
                )
              }
            />

            <Input
              label="Father Mobile"
              name="mobile"
              value={
                form.father.mobile
              }
              onChange={(e) =>
                handleNestedChange(
                  "father",
                  e
                )
              }
              placeholder="10-digit mobile"
            />

            <Input
              label="Father Email"
              type="email"
              name="email"
              value={
                form.father.email
              }
              onChange={(e) =>
                handleNestedChange(
                  "father",
                  e
                )
              }
              placeholder="Used for parent login"
              error={
                errors.fatherEmail
              }
            />

            <Input
              label="Occupation"
              name="occupation"
              value={
                form.father
                  .occupation
              }
              onChange={(e) =>
                handleNestedChange(
                  "father",
                  e
                )
              }
            />

            <Input
              label="Qualification"
              name="qualification"
              value={
                form.father
                  .qualification
              }
              onChange={(e) =>
                handleNestedChange(
                  "father",
                  e
                )
              }
            />

            <Input
              label="Aadhar No"
              name="aadharNo"
              value={
                form.father
                  .aadharNo
              }
              onChange={(e) =>
                handleNestedChange(
                  "father",
                  e
                )
              }
            />

            <Input
              label="Annual Income"
              type="number"
              name="annualIncome"
              value={
                form.father
                  .annualIncome
              }
              onChange={(e) =>
                handleNestedChange(
                  "father",
                  e
                )
              }
            />

          </div>

          {form.father.email && (
            <p className="student-form-hint">
              ✓ Parent login will be
              created for{" "}
              <strong>
                {form.father.email}
              </strong>{" "}
              when the student is saved.
            </p>
          )}

        </section>

        {/* =================================================
            5. MOTHER
        ================================================= */}

        <section className="student-form-section">

          <h3>
            5. Mother Information
          </h3>

          <p className="student-form-section-desc">
            Enter the mother's email to
            automatically create a parent
            login account.
          </p>

          <div className="student-form-grid three">

            <Select
              label="Mother Title"
              name="motherTitle"
              value={
                form.motherTitle
              }
              onChange={
                handleChange
              }
              options={[
                {
                  value: "MRS.",
                  label: "MRS.",
                },
                {
                  value: "MS.",
                  label: "MS.",
                },
                {
                  value: "DR.",
                  label: "DR.",
                },
                {
                  value:
                    "PROF.",
                  label:
                    "PROF.",
                },
              ]}
            />

            <Input
              label="Mother Name"
              name="name"
              value={
                form.mother.name
              }
              onChange={(e) =>
                handleNestedChange(
                  "mother",
                  e
                )
              }
            />

            <Input
              label="Mother Mobile"
              name="mobile"
              value={
                form.mother.mobile
              }
              onChange={(e) =>
                handleNestedChange(
                  "mother",
                  e
                )
              }
              placeholder="10-digit mobile"
            />

            <Input
              label="Mother Email"
              type="email"
              name="email"
              value={
                form.mother.email
              }
              onChange={(e) =>
                handleNestedChange(
                  "mother",
                  e
                )
              }
              placeholder="Used for parent login"
              error={
                errors.motherEmail
              }
            />

            <Input
              label="Occupation"
              name="occupation"
              value={
                form.mother
                  .occupation
              }
              onChange={(e) =>
                handleNestedChange(
                  "mother",
                  e
                )
              }
            />

            <Input
              label="Qualification"
              name="qualification"
              value={
                form.mother
                  .qualification
              }
              onChange={(e) =>
                handleNestedChange(
                  "mother",
                  e
                )
              }
            />

            <Input
              label="Aadhar No"
              name="aadharNo"
              value={
                form.mother
                  .aadharNo
              }
              onChange={(e) =>
                handleNestedChange(
                  "mother",
                  e
                )
              }
            />

            <Input
              label="Annual Income"
              type="number"
              name="annualIncome"
              value={
                form.mother
                  .annualIncome
              }
              onChange={(e) =>
                handleNestedChange(
                  "mother",
                  e
                )
              }
            />

          </div>

          {form.mother.email && (
            <p className="student-form-hint">
              ✓ Parent login will be
              created for{" "}
              <strong>
                {form.mother.email}
              </strong>{" "}
              when the student is saved.
            </p>
          )}

        </section>

        {/* =================================================
            6. GUARDIAN
        ================================================= */}

        <section className="student-form-section">

          <h3>
            6. Guardian Information
          </h3>

          <p className="student-form-section-desc">
            Optional guardian details when
            the student lives with a guardian.
          </p>

          <div className="student-form-grid three">

            <Input
              label="Guardian Name"
              name="name"
              value={
                form.guardian.name
              }
              onChange={(e) =>
                handleNestedChange(
                  "guardian",
                  e
                )
              }
            />

            <Input
              label="Guardian Mobile"
              name="mobile"
              value={
                form.guardian.mobile
              }
              onChange={(e) =>
                handleNestedChange(
                  "guardian",
                  e
                )
              }
            />

            <Input
              label="Guardian Email"
              type="email"
              name="email"
              value={
                form.guardian.email
              }
              onChange={(e) =>
                handleNestedChange(
                  "guardian",
                  e
                )
              }
              placeholder="Optional"
            />

            <Input
              label="Relation"
              name="relation"
              value={
                form.guardian
                  .relation
              }
              onChange={(e) =>
                handleNestedChange(
                  "guardian",
                  e
                )
              }
              placeholder="Guardian"
            />

          </div>

        </section>

        {/* =================================================
            7. CONTACT
        ================================================= */}

        <section className="student-form-section">

          <h3>
            7. Contact Information
          </h3>

          <p className="student-form-section-desc">
            Communication and emergency
            contacts.
          </p>

          <div className="student-form-grid three">

            <Input
              label="Student Email"
              type="email"
              name="studentEmail"
              value={
                form.studentEmail
              }
              onChange={
                handleChange
              }
            />

            <Input
              label="Country Code"
              name="countryCode"
              value={
                form.countryCode
              }
              onChange={
                handleChange
              }
              placeholder="+91"
            />

            <Input
              label="Communication Mobile"
              name="communicationMobile"
              value={
                form.communicationMobile
              }
              onChange={
                handleChange
              }
            />

            <Input
              label="Communication Email"
              type="email"
              name="communicationEmail"
              value={
                form.communicationEmail
              }
              onChange={
                handleChange
              }
            />

            <Input
              label="Emergency Phone"
              name="emergencyPhoneNo"
              value={
                form.emergencyPhoneNo
              }
              onChange={
                handleChange
              }
            />

          </div>

        </section>

        {/* =================================================
            8. IDENTIFICATION
        ================================================= */}

        <section className="student-form-section">

          <h3>
            8. Identification Information
          </h3>

          <p className="student-form-section-desc">
            Government and school
            identification numbers.
          </p>

          <div className="student-form-grid three">

            <Input
              label="Aadhar No"
              name="aadharNo"
              value={
                form.aadharNo
              }
              onChange={
                handleChange
              }
            />

            <Input
              label="Unique No"
              name="uniqueNo"
              value={
                form.uniqueNo
              }
              onChange={
                handleChange
              }
            />

            <Input
              label="GR No"
              name="grNo"
              value={
                form.grNo
              }
              onChange={
                handleChange
              }
            />

            <Input
              label="RFID No"
              name="rfidNo"
              value={
                form.rfidNo
              }
              onChange={
                handleChange
              }
            />

            <Input
              label="APAAR ID"
              name="apaarId"
              value={
                form.apaarId
              }
              onChange={
                handleChange
              }
            />

            <Input
              label="SRN No"
              name="srnNo"
              value={
                form.srnNo
              }
              onChange={
                handleChange
              }
            />

          </div>

        </section>

        {/* =================================================
            9. BANK
        ================================================= */}

        <section className="student-form-section">

          <h3>
            9. Bank Information
          </h3>

          <p className="student-form-section-desc">
            Bank account details used for
            fee and refunds.
          </p>

          <div className="student-form-grid three">

            <Input
              label="Bank Name"
              name="bankName"
              value={
                form.bankName
              }
              onChange={
                handleChange
              }
            />

            <Input
              label="Account No"
              name="accountNo"
              value={
                form.accountNo
              }
              onChange={
                handleChange
              }
            />

            <Input
              label="IFSC"
              name="ifsc"
              value={
                form.ifsc
              }
              onChange={
                handleChange
              }
            />

            <Input
              label="Virtual Account No"
              name="virtualAccountNo"
              value={
                form.virtualAccountNo
              }
              onChange={
                handleChange
              }
            />

            <Input
              label="eNACH"
              name="eNach"
              value={
                form.eNach
              }
              onChange={
                handleChange
              }
            />

          </div>

        </section>

        {/* =================================================
            10. OTHER
        ================================================= */}

        <section className="student-form-section">

          <h3>
            10. Other Information
          </h3>

          <p className="student-form-section-desc">
            Additional remarks for
            administration and fees.
          </p>

          <div className="student-form-grid">

            <Input
              label="Remark"
              name="remark"
              value={
                form.remark
              }
              onChange={
                handleChange
              }
            />

            <Input
              label="Fee Remark"
              name="feeRemark"
              value={
                form.feeRemark
              }
              onChange={
                handleChange
              }
            />

          </div>

        </section>

        {/* =================================================
            11. CUSTOM FIELDS
        ================================================= */}

        {customFieldGroups.length >
          0 && (
          <section className="student-form-section">

            <h3>
              11. Custom Fields
            </h3>

            <p className="student-form-section-desc">
              Dynamic fields configured
              for this school.
            </p>

            {customFieldGroups.map(
              (group) => (
                <div
                  key={
                    group.formName
                  }
                  className="student-custom-form-group"
                >

                  <h4 className="student-custom-form-title">
                    {
                      group.formName
                    }
                  </h4>

                  <div className="student-form-grid three">

                    {group.fields.map(
                      (field) => {
                        const fieldValue =
                          customValues[
                            field.id
                          ] ?? "";

                        const optionList =
                          (
                            field.options ||
                            []
                          ).map(
                            (opt) => ({
                              value:
                                opt.value,
                              label:
                                opt.label,
                            })
                          );

                        if (
                          field.control ===
                          CUSTOM_FIELD_CONTROLS.DROP_DOWN
                        ) {
                          return (
                            <Select
                              key={
                                field.id
                              }
                              label={
                                field.displayName ||
                                field.name
                              }
                              value={
                                fieldValue
                              }
                              onChange={(
                                e
                              ) =>
                                handleCustomValueChange(
                                  field.id,
                                  e
                                    .target
                                    .value
                                )
                              }
                              options={
                                optionList
                              }
                            />
                          );
                        }

                        return (
                          <Input
                            key={
                              field.id
                            }
                            label={
                              field.displayName ||
                              field.name
                            }
                            value={
                              fieldValue
                            }
                            onChange={(
                              e
                            ) =>
                              handleCustomValueChange(
                                field.id,
                                e
                                  .target
                                  .value
                              )
                            }
                            maxLength={
                              field.maxLength ||
                              undefined
                            }
                          />
                        );
                      }
                    )}

                  </div>

                </div>
              )
            )}

          </section>
        )}

        {/* =================================================
            ACTIONS
        ================================================= */}

        <div className="student-form-actions">

          <Button
            type="button"
            variant="outline"
            onClick={() =>
              navigate(
                "/student"
              )
            }
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            loading={
              loading
            }
          >
            {isEdit
              ? "Update Student"
              : "Create Student"}
          </Button>

        </div>

      </form>

      {/* ===================================================
          PARENT CREDENTIAL MODAL
      =================================================== */}

      <Modal
        isOpen={
          Boolean(
            credentials
          )
        }
        onClose={() => {
          setCredentials(
            null
          );

          finishAfterSave(
            savedStudentId ||
              id ||
              null
          );
        }}
        title="Parent Login Credentials"
        size="lg"
      >

        <p className="student-credentials-note">
          Parent login credentials were
          generated successfully. Share
          these credentials with the parent
          now. The password will not be
          shown again after closing this
          window.
        </p>

        <table className="student-credentials-table">

          <thead>
            <tr>
              <th>
                Relation
              </th>

              <th>
                Name
              </th>

              <th>
                Email
              </th>

              <th>
                Password
              </th>
            </tr>
          </thead>

          <tbody>

            {(
              credentials ||
              []
            ).map(
              (
                cred,
                index
              ) => (
                <tr
                  key={
                    `${cred.relation}-${cred.email}-${index}`
                  }
                >

                  <td
                    style={{
                      textTransform:
                        "capitalize",
                    }}
                  >
                    {
                      cred.relation ||
                      "Parent"
                    }
                  </td>

                  <td>
                    {
                      cred.name ||
                      "—"
                    }
                  </td>

                  <td>
                    {
                      cred.email ||
                      "—"
                    }
                  </td>

                  <td className="student-credentials-password">
                    {
                      cred.password ||
                      "—"
                    }
                  </td>

                </tr>
              )
            )}

          </tbody>

        </table>

        <ModalFooter>

          <div className="student-credentials-actions">

            <Button
              variant="primary"
              onClick={() => {
                setCredentials(
                  null
                );

                finishAfterSave(
                  savedStudentId ||
                    id ||
                    null
                );
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