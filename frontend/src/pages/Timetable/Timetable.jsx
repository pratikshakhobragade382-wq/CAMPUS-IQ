import React, { useEffect, useMemo, useState } from "react";

import {
  Plus,
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  Clock3,
  CalendarDays,
  Users,
  BookOpen,
  X,
  Save,
  AlertCircle,
  Download,
  UserCheck,
  FileText,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card";

import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

import axiosClient from "../../api/axios";

import "./Timetable.css";

/* ============================================================
   DAYS
============================================================ */

const DAYS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

/* ============================================================
   SLOT TYPES
============================================================ */

const SLOT_TYPES = [
  { value: "period", label: "Period" },
  { value: "recess", label: "Recess" },
  { value: "lunch", label: "Lunch" },
  { value: "sports", label: "Sports" },
];

/* ============================================================
   HELPERS
============================================================ */

function getId(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

function formatTime(value) {
  if (!value) {
    return "—";
  }

  const text = String(value).slice(0, 5);
  const parts = text.split(":");

  if (parts.length < 2) {
    return text;
  }

  const hour = Number(parts[0]);
  const minute = Number(parts[1]);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return text;
  }

  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${String(minute).padStart(
    2,
    "0"
  )} ${suffix}`;
}

function getClassName(entry) {
  return (
    entry?.class?.name ||
    entry?.className ||
    entry?.class?.className ||
    ""
  );
}

function getSectionName(entry) {
  return (
    entry?.section?.name ||
    entry?.sectionName ||
    entry?.section?.sectionName ||
    ""
  );
}

function getSubjectName(entry) {
  return (
    entry?.subject?.name ||
    entry?.subjectName ||
    entry?.subject?.subjectName ||
    "Subject"
  );
}

function getTeacherName(entry) {
  return (
    entry?.staff?.name ||
    entry?.teacher?.name ||
    entry?.teacherName ||
    "Teacher not assigned"
  );
}

function getInchargeName(section) {
  return (
    section?.classTeacher?.name ||
    section?.classTeacherName ||
    section?.classIncharge?.name ||
    section?.classInchargeName ||
    ""
  );
}

function normalizeDay(value) {
  if (
    value === 1 ||
    String(value).toLowerCase() === "1" ||
    String(value).toLowerCase() === "monday"
  ) {
    return "Monday";
  }

  if (
    value === 2 ||
    String(value).toLowerCase() === "2" ||
    String(value).toLowerCase() === "tuesday"
  ) {
    return "Tuesday";
  }

  if (
    value === 3 ||
    String(value).toLowerCase() === "3" ||
    String(value).toLowerCase() === "wednesday"
  ) {
    return "Wednesday";
  }

  if (
    value === 4 ||
    String(value).toLowerCase() === "4" ||
    String(value).toLowerCase() === "thursday"
  ) {
    return "Thursday";
  }

  if (
    value === 5 ||
    String(value).toLowerCase() === "5" ||
    String(value).toLowerCase() === "friday"
  ) {
    return "Friday";
  }

  if (
    value === 6 ||
    String(value).toLowerCase() === "6" ||
    String(value).toLowerCase() === "saturday"
  ) {
    return "Saturday";
  }

  return String(value || "");
}

function flattenGrouped(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (!data || typeof data !== "object") {
    return [];
  }

  if (Array.isArray(data.timetable)) {
    return data.timetable;
  }

  if (Array.isArray(data.items)) {
    return data.items;
  }

  if (Array.isArray(data.entries)) {
    return data.entries;
  }

  return Object.entries(data).flatMap(([day, items]) => {
    if (!Array.isArray(items)) {
      return [];
    }

    return items.map((item) => ({
      ...item,
      dayName:
        item.dayName ||
        item.day ||
        item.dayOfWeek ||
        day,
    }));
  });
}

function extractArray(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.staff)) {
    return data.staff;
  }

  if (Array.isArray(data?.teachers)) {
    return data.teachers;
  }

  if (Array.isArray(data?.sections)) {
    return data.sections;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  return [];
}

function normalizeTeacher(teacher) {
  if (!teacher || typeof teacher !== "object") {
    return null;
  }

  const id =
    teacher.id ??
    teacher.staffId ??
    teacher.staff_id;

  if (
    id === null ||
    id === undefined ||
    id === ""
  ) {
    return null;
  }

  const firstName =
    teacher.firstName ??
    teacher.first_name ??
    "";

  const lastName =
    teacher.lastName ??
    teacher.last_name ??
    "";

  const name =
    teacher.name ||
    teacher.fullName ||
    teacher.full_name ||
    `${firstName} ${lastName}`.trim() ||
    teacher.username ||
    teacher.email ||
    "Teacher";

  return {
    ...teacher,
    id,
    name,
  };
}

function getAcademicYearName(year) {
  return (
    year?.name ||
    year?.label ||
    year?.academicYear ||
    year?.year ||
    ""
  );
}

/* ============================================================
   HTML ESCAPE FOR PRINT WINDOW
============================================================ */

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* ============================================================
   MODAL
============================================================ */

function Modal({
  title,
  children,
  onClose,
  wide = false,
}) {
  return (
    <div className="tt-modal-overlay">
      <div
        className={`tt-modal ${
          wide ? "tt-modal-wide" : ""
        }`}
      >
        <div className="tt-modal-header">
          <h2>{title}</h2>

          <button
            type="button"
            className="tt-close-button"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <div className="tt-modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   FIELD
============================================================ */

function Field({
  label,
  required = false,
  children,
}) {
  return (
    <label className="tt-field">
      <span className="tt-field-label">
        {label}

        {required && (
          <span className="tt-required">
            {" "}
            *
          </span>
        )}
      </span>

      {children}
    </label>
  );
}

/* ============================================================
   EMPTY
============================================================ */

function EmptyState({ message }) {
  return (
    <div className="tt-empty-state">
      {message}
    </div>
  );
}

/* ============================================================
   MAIN COMPONENT
============================================================ */

export default function Timetable() {
  /* ==========================================================
     DATA
  ========================================================== */

  const [slots, setSlots] = useState([]);
  const [entries, setEntries] = useState([]);

  const [academicYears, setAcademicYears] =
    useState([]);

  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [teachers, setTeachers] = useState([]);

  /* ==========================================================
     FILTERS
  ========================================================== */

  const [mode, setMode] = useState("class");

  const [
    academicYearId,
    setAcademicYearId,
  ] = useState("");

  const [classId, setClassId] =
    useState("");

  const [sectionId, setSectionId] =
    useState("");

  const [staffId, setStaffId] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [activeDay, setActiveDay] =
    useState("All");

  const [viewMode, setViewMode] =
    useState("weekly");

  /* ==========================================================
     LOADING
  ========================================================== */

  const [loading, setLoading] =
    useState(false);

  const [initialLoading, setInitialLoading] =
    useState(true);

  const [slotLoading, setSlotLoading] =
    useState(false);

  const [teacherLoading, setTeacherLoading] =
    useState(false);

  const [sectionLoading, setSectionLoading] =
    useState(false);

  const [inchargeSaving, setInchargeSaving] =
    useState(false);

  /* ==========================================================
     MESSAGES
  ========================================================== */

  const [error, setError] =
    useState("");

  const [notice, setNotice] =
    useState("");

  /* ==========================================================
     MODALS
  ========================================================== */

  const [showEntryForm, setShowEntryForm] =
    useState(false);

  const [showSlotForm, setShowSlotForm] =
    useState(false);

  const [showInchargeForm, setShowInchargeForm] =
    useState(false);

  const [editingEntry, setEditingEntry] =
    useState(null);

  const [editingSlot, setEditingSlot] =
    useState(null);

  /* ==========================================================
     ENTRY FORM
  ========================================================== */

  const [entryForm, setEntryForm] =
    useState({
      academicYearId: "",
      classId: "",
      sectionId: "",
      subjectName: "",
      staffId: "",
      periodSlotId: "",
      dayOfWeek: "1",
    });

  /* ==========================================================
     SLOT FORM
  ========================================================== */

  const [slotForm, setSlotForm] =
    useState({
      slotNo: "",
      label: "",
      slotType: "period",
      startTime: "",
      endTime: "",
    });

  /* ==========================================================
     INCHARGE FORM
  ========================================================== */

  const [inchargeTeacherId, setInchargeTeacherId] =
    useState("");

  /* ==========================================================
     LOAD ACADEMIC YEARS
  ========================================================== */

  const loadAcademicYears =
    async () => {
      try {
        const response =
          await axiosClient.get(
            "/academic-years"
          );

        const data =
          response.data?.data ??
          response.data?.academicYears ??
          response.data ??
          [];

        setAcademicYears(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (err) {
        console.error(
          "Failed to load academic years:",
          err
        );
      }
    };

  /* ==========================================================
     LOAD CLASSES
  ========================================================== */

  const loadClasses = async () => {
    try {
      const response =
        await axiosClient.get(
          "/classes"
        );

      const data =
        response.data?.data ??
        response.data?.classes ??
        response.data ??
        [];

      setClasses(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      console.error(
        "Failed to load classes:",
        err
      );
    }
  };

  /* ==========================================================
     LOAD SECTIONS
  ========================================================== */

  const loadSections =
    async (selectedClassId) => {
      if (!selectedClassId) {
        setSections([]);
        return;
      }

      setSectionLoading(true);

      try {
        const response =
          await axiosClient.get(
            "/sections",
            {
              params: {
                classId:
                  selectedClassId,
              },
            }
          );

        const data =
          response.data?.data ??
          response.data?.sections ??
          response.data ??
          [];

        setSections(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (err) {
        console.error(
          "Failed to load sections:",
          err
        );

        setSections([]);
      } finally {
        setSectionLoading(false);
      }
    };

  /* ==========================================================
     LOAD TEACHERS
  ========================================================== */

  const loadTeachers = async () => {
    setTeacherLoading(true);

    try {
      const response =
        await axiosClient.get(
          "/staff",
          {
            params: {
              page: 1,
              limit: 1000,
              role: "teacher",
            },
          }
        );

      const staffList =
        extractArray(
          response.data?.data
        );

      const normalized =
        staffList
          .map(normalizeTeacher)
          .filter(Boolean);

      const uniqueTeachers =
        Array.from(
          new Map(
            normalized.map(
              (teacher) => [
                String(teacher.id),
                teacher,
              ]
            )
          ).values()
        );

      uniqueTeachers.sort(
        (a, b) =>
          String(
            a.name
          ).localeCompare(
            String(b.name)
          )
      );

      setTeachers(
        uniqueTeachers
      );
    } catch (err) {
      console.error(
        "Failed to load teachers:",
        err
      );

      setTeachers([]);

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Unable to load teachers."
      );
    } finally {
      setTeacherLoading(false);
    }
  };

  /* ==========================================================
     LOAD TIME SLOTS
  ========================================================== */

  const loadSlots = async () => {
    setSlotLoading(true);

    try {
      const response =
        await axiosClient.get(
          "/timetable/period-slots"
        );

      const data =
        response.data?.data ??
        response.data ??
        [];

      setSlots(
        Array.isArray(data)
          ? [...data].sort(
              (a, b) =>
                Number(
                  a.slotNo || 0
                ) -
                Number(
                  b.slotNo || 0
                )
            )
          : []
      );
    } catch (err) {
      console.error(
        "Failed to load time slots:",
        err
      );

      setSlots([]);

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Unable to load time slots."
      );
    } finally {
      setSlotLoading(false);
    }
  };

  /* ==========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    const loadInitialData =
      async () => {
        setInitialLoading(true);

        await Promise.all([
          loadAcademicYears(),
          loadClasses(),
          loadTeachers(),
          loadSlots(),
        ]);

        setInitialLoading(false);
      };

    loadInitialData();
  }, []);

  /* ==========================================================
     CLASS CHANGE
  ========================================================== */

  useEffect(() => {
    if (classId) {
      loadSections(classId);
    } else {
      setSections([]);
    }
  }, [classId]);

  /* ==========================================================
     SELECTED SECTION
  ========================================================== */

  const selectedSection =
    useMemo(() => {
      return sections.find(
        (section) =>
          String(section.id) ===
          String(sectionId)
      );
    }, [sections, sectionId]);

  const selectedClass =
    useMemo(() => {
      return classes.find(
        (item) =>
          String(item.id) ===
          String(classId)
      );
    }, [classes, classId]);

  const selectedAcademicYear =
    useMemo(() => {
      return academicYears.find(
        (year) =>
          String(year.id) ===
          String(academicYearId)
      );
    }, [
      academicYears,
      academicYearId,
    ]);

  /* ==========================================================
     LOAD TIMETABLE
  ========================================================== */

  const loadTimetable =
    async () => {
      setLoading(true);
      setError("");
      setNotice("");

      try {
        let response;

        if (mode === "teacher") {
          if (!staffId) {
            setEntries([]);
            setLoading(false);
            return;
          }

          response =
            await axiosClient.get(
              "/timetable/teacher",
              {
                params: {
                  staffId,
                  ...(academicYearId
                    ? {
                        academicYearId,
                      }
                    : {}),
                },
              }
            );
        } else {
          if (!classId) {
            setEntries([]);
            setLoading(false);
            return;
          }

          response =
            await axiosClient.get(
              "/timetable/class",
              {
                params: {
                  classId,

                  ...(sectionId
                    ? {
                        sectionId,
                      }
                    : {}),

                  ...(academicYearId
                    ? {
                        academicYearId,
                      }
                    : {}),
                },
              }
            );
        }

        const data =
          response.data?.data ??
          response.data ??
          {};

        setEntries(
          flattenGrouped(data)
        );
      } catch (err) {
        console.error(
          "Failed to load timetable:",
          err
        );

        setEntries([]);

        setError(
          err.response?.data?.error ||
            err.response?.data?.message ||
            "Failed to load timetable."
        );
      } finally {
        setLoading(false);
      }
    };

  /* ==========================================================
     VISIBLE ENTRIES
  ========================================================== */

  const visibleEntries =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return entries.filter(
        (entry) => {
          const entryDay =
            normalizeDay(
              entry.dayName ||
                entry.day ||
                entry.dayOfWeek
            );

          if (
            activeDay !== "All" &&
            entryDay !== activeDay
          ) {
            return false;
          }

          if (!query) {
            return true;
          }

          return [
            getSubjectName(entry),
            getTeacherName(entry),
            getClassName(entry),
            getSectionName(entry),
            entry.dayName,
            entry.periodSlot?.label,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(query);
        }
      );
    }, [
      entries,
      search,
      activeDay,
    ]);

  /* ==========================================================
     WEEKLY ENTRY LOOKUP
  ========================================================== */

  const getEntriesForSlotDay =
    (slot, dayLabel) => {
      return visibleEntries.filter(
        (entry) => {
          const entryDay =
            normalizeDay(
              entry.dayName ||
                entry.day ||
                entry.dayOfWeek
            );

          const entrySlotId =
            entry.periodSlotId ??
            entry.periodSlot?.id;

          return (
            entryDay ===
              dayLabel &&
            String(
              entrySlotId
            ) ===
              String(slot.id)
          );
        }
      );
    };

  /* ==========================================================
     OPEN CREATE ENTRY
  ========================================================== */

  const openCreateEntry =
    async () => {
      setEditingEntry(null);

      setEntryForm({
        academicYearId:
          academicYearId || "",

        classId:
          classId || "",

        sectionId:
          sectionId || "",

        subjectName: "",

        staffId:
          staffId || "",

        periodSlotId: "",

        dayOfWeek: "1",
      });

      setError("");
      setNotice("");

      await loadTeachers();

      setShowEntryForm(true);
    };

  /* ==========================================================
     EDIT ENTRY
  ========================================================== */

  const editEntry = (
    entry
  ) => {
    setEditingEntry(entry);

    setEntryForm({
      academicYearId:
        getId(
          entry.academicYearId
        ) ||
        getId(
          academicYearId
        ),

      classId:
        getId(
          entry.classId
        ) ||
        getId(
          entry.class?.id
        ) ||
        getId(classId),

      sectionId:
        getId(
          entry.sectionId
        ) ||
        getId(
          entry.section?.id
        ),

      subjectName:
        getSubjectName(entry) ===
        "Subject"
          ? ""
          : getSubjectName(entry),

      staffId:
        getId(
          entry.staffId
        ) ||
        getId(
          entry.staff?.id
        ) ||
        getId(
          entry.teacher?.id
        ),

      periodSlotId:
        getId(
          entry.periodSlotId
        ) ||
        getId(
          entry.periodSlot?.id
        ),

      dayOfWeek:
        getId(
          entry.dayOfWeek
        ) || "1",
    });

    setError("");
    setNotice("");

    loadTeachers();

    setShowEntryForm(true);
  };

  /* ==========================================================
     SAVE ENTRY
  ========================================================== */

  const saveEntry =
    async (event) => {
      event.preventDefault();

      setError("");
      setNotice("");

      if (
        !entryForm.academicYearId
      ) {
        setError(
          "Please select an academic year."
        );
        return;
      }

      if (!entryForm.classId) {
        setError(
          "Please select a class."
        );
        return;
      }

      if (!entryForm.sectionId) {
        setError(
          "Please select a section."
        );
        return;
      }

      if (
        !entryForm.subjectName.trim()
      ) {
        setError(
          "Please enter the subject name."
        );
        return;
      }

      if (!entryForm.staffId) {
        setError(
          "Please select a teacher."
        );
        return;
      }

      if (
        !entryForm.periodSlotId
      ) {
        setError(
          "Please select a time slot."
        );
        return;
      }

      try {
        const payload = {
          academicYearId:
            Number(
              entryForm.academicYearId
            ),

          classId:
            Number(
              entryForm.classId
            ),

          sectionId:
            Number(
              entryForm.sectionId
            ),

          subjectName:
            entryForm.subjectName.trim(),

          staffId:
            Number(
              entryForm.staffId
            ),

          periodSlotId:
            Number(
              entryForm.periodSlotId
            ),

          dayOfWeek:
            Number(
              entryForm.dayOfWeek
            ),
        };

        if (editingEntry) {
          await axiosClient.put(
            `/timetable/${editingEntry.id}`,
            {
              subjectName:
                payload.subjectName,

              staffId:
                payload.staffId,

              periodSlotId:
                payload.periodSlotId,

              dayOfWeek:
                payload.dayOfWeek,
            }
          );

          setNotice(
            "Timetable updated successfully."
          );
        } else {
          await axiosClient.post(
            "/timetable",
            payload
          );

          setNotice(
            "Timetable created successfully."
          );
        }

        setShowEntryForm(false);
        setEditingEntry(null);

        await loadTimetable();
      } catch (err) {
        console.error(
          "Timetable save error:",
          err
        );

        setError(
          err.response?.data?.error ||
            err.response?.data?.message ||
            "Unable to save timetable."
        );
      }
    };

  /* ==========================================================
     DELETE ENTRY
  ========================================================== */

  const deleteEntry =
    async (entry) => {
      if (
        !window.confirm(
          "Delete this timetable entry?"
        )
      ) {
        return;
      }

      try {
        setError("");

        await axiosClient.delete(
          `/timetable/${entry.id}`
        );

        setNotice(
          "Timetable entry deleted successfully."
        );

        await loadTimetable();
      } catch (err) {
        console.error(
          "Delete timetable error:",
          err
        );

        setError(
          err.response?.data?.error ||
            err.response?.data?.message ||
            "Unable to delete timetable entry."
        );
      }
    };

  /* ==========================================================
     OPEN CREATE SLOT
  ========================================================== */

  const openCreateSlot =
    () => {
      setEditingSlot(null);

      const highestSlot =
        slots.reduce(
          (highest, slot) =>
            Math.max(
              highest,
              Number(
                slot.slotNo || 0
              )
            ),
          0
        );

      setSlotForm({
        slotNo: String(
          highestSlot + 1
        ),

        label: `Period ${
          highestSlot + 1
        }`,

        slotType: "period",

        startTime: "",

        endTime: "",
      });

      setError("");
      setNotice("");

      setShowSlotForm(true);
    };

  /* ==========================================================
     EDIT SLOT
  ========================================================== */

  const editSlot = (
    slot
  ) => {
    setEditingSlot(slot);

    setSlotForm({
      slotNo: String(
        slot.slotNo || ""
      ),

      label:
        slot.label || "",

      slotType:
        slot.slotType ||
        "period",

      startTime:
        String(
          slot.startTime || ""
        ).slice(0, 5),

      endTime:
        String(
          slot.endTime || ""
        ).slice(0, 5),
    });

    setError("");
    setNotice("");

    setShowSlotForm(true);
  };

  /* ==========================================================
     SAVE SLOT
  ========================================================== */

  const saveSlot =
    async (event) => {
      event.preventDefault();

      setError("");
      setNotice("");

      if (!slotForm.slotNo) {
        setError(
          "Please enter a slot number."
        );
        return;
      }

      if (
        !slotForm.label.trim()
      ) {
        setError(
          "Please enter a slot name."
        );
        return;
      }

      if (!slotForm.startTime) {
        setError(
          "Please select a start time."
        );
        return;
      }

      if (!slotForm.endTime) {
        setError(
          "Please select an end time."
        );
        return;
      }

      if (
        slotForm.startTime >=
        slotForm.endTime
      ) {
        setError(
          "End time must be later than start time."
        );
        return;
      }

      try {
        const payload = {
          slotNo:
            Number(
              slotForm.slotNo
            ),

          label:
            slotForm.label.trim(),

          slotType:
            slotForm.slotType,

          startTime:
            slotForm.startTime,

          endTime:
            slotForm.endTime,
        };

        if (editingSlot) {
          await axiosClient.put(
            `/timetable/period-slots/${editingSlot.id}`,
            {
              label:
                payload.label,

              slotType:
                payload.slotType,

              startTime:
                payload.startTime,

              endTime:
                payload.endTime,
            }
          );

          setNotice(
            "Time slot updated successfully."
          );
        } else {
          await axiosClient.post(
            "/timetable/period-slots",
            payload
          );

          setNotice(
            "Time slot created successfully."
          );
        }

        setShowSlotForm(false);
        setEditingSlot(null);

        await loadSlots();
      } catch (err) {
        console.error(
          "Slot save error:",
          err
        );

        setError(
          err.response?.data?.error ||
            err.response?.data?.message ||
            "Unable to save time slot."
        );
      }
    };

  /* ==========================================================
     DELETE SLOT
  ========================================================== */

  const deleteSlot =
    async (slot) => {
      if (
        !window.confirm(
          `Delete "${slot.label}"?`
        )
      ) {
        return;
      }

      try {
        setError("");

        await axiosClient.delete(
          `/timetable/period-slots/${slot.id}`
        );

        setNotice(
          "Time slot deleted successfully."
        );

        await loadSlots();
      } catch (err) {
        console.error(
          "Delete slot error:",
          err
        );

        setError(
          err.response?.data?.error ||
            err.response?.data?.message ||
            "Unable to delete time slot."
        );
      }
    };

  /* ==========================================================
     OPEN INCHARGE MODAL
  ========================================================== */

  const openInchargeModal =
    () => {
      if (!sectionId) {
        setError(
          "Please select a section first."
        );
        return;
      }

      setInchargeTeacherId(
        getId(
          selectedSection?.classTeacher?.id
        ) ||
          getId(
            selectedSection?.classTeacherId
          ) ||
          ""
      );

      setError("");
      setNotice("");

      setShowInchargeForm(true);
    };

  /* ==========================================================
     SAVE CLASS INCHARGE
  ========================================================== */

  const saveClassIncharge =
    async (event) => {
      event.preventDefault();

      if (!sectionId) {
        setError(
          "Please select a section."
        );
        return;
      }

      setInchargeSaving(true);
      setError("");
      setNotice("");

      try {
        await axiosClient.put(
          `/sections/${sectionId}`,
          {
            classTeacherId:
              inchargeTeacherId
                ? Number(
                    inchargeTeacherId
                  )
                : null,
          }
        );

        setNotice(
          "Class incharge updated successfully."
        );

        setShowInchargeForm(false);

        await loadSections(
          classId
        );

        await loadTimetable();
      } catch (err) {
        console.error(
          "Class incharge error:",
          err
        );

        setError(
          err.response?.data?.error ||
            err.response?.data?.message ||
            "Unable to update class incharge."
        );
      } finally {
        setInchargeSaving(false);
      }
    };

  /* ==========================================================
     SWITCH MODE
  ========================================================== */

  const switchMode = (
    nextMode
  ) => {
    setMode(nextMode);

    setEntries([]);
    setError("");
    setNotice("");

    if (
      nextMode === "class"
    ) {
      setStaffId("");
    } else {
      setClassId("");
      setSectionId("");
      setSections([]);
    }
  };

  /* ==========================================================
     PDF - DEDICATED PRINT WINDOW
     
     IMPORTANT:
     We DO NOT use window.print() on the
     Admin portal.
     
     A completely new document is created
     containing ONLY timetable content.
  ========================================================== */

  const downloadTimetablePDF =
    () => {
      if (mode === "class") {
        if (!classId) {
          setError(
            "Please select a class first."
          );
          return;
        }

        if (!sectionId) {
          setError(
            "Please select a section before downloading the PDF."
          );
          return;
        }
      }

      if (
        visibleEntries.length === 0
      ) {
        setError(
          "There is no timetable data to download. Click Load Timetable first."
        );
        return;
      }

      const printWindow =
        window.open(
          "",
          "_blank",
          "width=1400,height=950"
        );

      if (!printWindow) {
        setError(
          "The PDF window was blocked by your browser. Please allow pop-ups for this site and try again."
        );
        return;
      }

      const className =
        selectedClass?.name ||
        selectedClass?.className ||
        selectedClass?.class ||
        selectedClass?.grade ||
        getClassName(
          visibleEntries[0]
        ) ||
        "Class";

      const sectionName =
        selectedSection?.name ||
        getSectionName(
          visibleEntries[0]
        ) ||
        "Section";

      const academicYearName =
        getAcademicYearName(
          selectedAcademicYear
        ) ||
        "Academic Year";

      const inchargeName =
        getInchargeName(
          selectedSection
        ) ||
        visibleEntries[0]
          ?.section
          ?.classTeacher
          ?.name ||
        "Not assigned";

      const teacherName =
        teachers.find(
          (teacher) =>
            String(teacher.id) ===
            String(staffId)
        )?.name ||
        "Teacher";

      const title =
        mode === "teacher"
          ? `${teacherName} - Weekly Timetable`
          : `${className} ${sectionName} - Weekly Timetable`;

      /* ------------------------------------------------------
         BUILD ONLY TIMETABLE ROWS
      ------------------------------------------------------ */

      const rows = slots
        .map((slot) => {
          const cells =
            DAYS.map(
              (day) => {
                const matches =
                  getEntriesForSlotDay(
                    slot,
                    day.label
                  );

                if (
                  matches.length === 0
                ) {
                  return `
                    <td class="empty-cell">
                      <span>—</span>
                    </td>
                  `;
                }

                const content =
                  matches
                    .map(
                      (entry) => {
                        const subject =
                          escapeHtml(
                            getSubjectName(
                              entry
                            )
                          );

                        const teacher =
                          escapeHtml(
                            getTeacherName(
                              entry
                            )
                          );

                        const entryClass =
                          escapeHtml(
                            getClassName(
                              entry
                            )
                          );

                        const entrySection =
                          escapeHtml(
                            getSectionName(
                              entry
                            )
                          );

                        const sectionLine =
                          mode ===
                            "teacher" &&
                          entryClass
                            ? `
                              <div class="cell-class">
                                ${entryClass}${
                                  entrySection
                                    ? ` • ${entrySection}`
                                    : ""
                                }
                              </div>
                            `
                            : "";

                        return `
                          <div class="subject-card">
                            <div class="subject">
                              ${subject}
                            </div>
                            ${sectionLine}
                            <div class="teacher">
                              ${teacher}
                            </div>
                          </div>
                        `;
                      }
                    )
                    .join("");

                return `
                  <td>
                    ${content}
                  </td>
                `;
              }
            ).join("");

          const slotType =
            String(
              slot.slotType || ""
            ).toLowerCase();

          const isBreak =
            slotType ===
              "recess" ||
            slotType ===
              "lunch";

          if (isBreak) {
            return `
              <tr class="break-row">
                <td class="time-cell">
                  <strong>
                    ${escapeHtml(
                      slot.label ||
                        "Break"
                    )}
                  </strong>
                  <span>
                    ${escapeHtml(
                      formatTime(
                        slot.startTime
                      )
                    )}
                    -
                    ${escapeHtml(
                      formatTime(
                        slot.endTime
                      )
                    )}
                  </span>
                </td>

                <td
                  colspan="6"
                  class="break-cell"
                >
                  ${escapeHtml(
                    slot.label ||
                      "Break"
                  )}
                </td>
              </tr>
            `;
          }

          return `
            <tr>
              <td class="time-cell">
                <strong>
                  ${escapeHtml(
                    slot.label ||
                      `Period ${
                        slot.slotNo || ""
                      }`
                  )}
                </strong>

                <span>
                  ${escapeHtml(
                    formatTime(
                      slot.startTime
                    )
                  )}
                  -
                  ${escapeHtml(
                    formatTime(
                      slot.endTime
                    )
                  )}
                </span>
              </td>

              ${cells}
            </tr>
          `;
        })
        .join("");

      /* ------------------------------------------------------
         PRINT DOCUMENT
      ------------------------------------------------------ */

      printWindow.document.open();

      printWindow.document.write(`
        <!DOCTYPE html>

        <html>
          <head>
            <meta charset="UTF-8" />

            <title>
              ${escapeHtml(title)}
            </title>

            <style>

              @page {
                size: A4 landscape;
                margin: 9mm;
              }

              * {
                box-sizing: border-box;
              }

              html,
              body {
                margin: 0;
                padding: 0;
                background: #ffffff;
                color: #172033;
                font-family:
                  Arial,
                  Helvetica,
                  sans-serif;
              }

              body {
                padding: 0;
              }

              .print-page {
                width: 100%;
              }

              .top-line {
                height: 6px;
                width: 100%;
                background: #2563eb;
                border-radius: 6px 6px 0 0;
                margin-bottom: 18px;
              }

              .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 20px;
                margin-bottom: 14px;
              }

              .brand {
                display: flex;
                align-items: flex-start;
                gap: 12px;
              }

              .brand-mark {
                width: 42px;
                height: 42px;
                border-radius: 10px;
                background: #eff6ff;
                color: #2563eb;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                font-weight: 800;
              }

              h1 {
                margin: 0;
                font-size: 24px;
                line-height: 1.2;
                color: #111827;
              }

              .subtitle {
                margin-top: 4px;
                color: #64748b;
                font-size: 11px;
              }

              .generated {
                text-align: right;
                color: #64748b;
                font-size: 9px;
                line-height: 1.5;
              }

              .summary {
                display: grid;
                grid-template-columns:
                  repeat(4, 1fr);
                gap: 8px;
                margin-bottom: 14px;
              }

              .summary-item {
                border: 1px solid #dbe4f0;
                border-radius: 8px;
                padding: 8px 10px;
                background: #f8fafc;
                min-height: 46px;
              }

              .summary-label {
                display: block;
                text-transform: uppercase;
                font-size: 7px;
                letter-spacing: 0.08em;
                font-weight: 700;
                color: #64748b;
                margin-bottom: 3px;
              }

              .summary-value {
                display: block;
                font-size: 11px;
                font-weight: 700;
                color: #172033;
              }

              .table-wrap {
                width: 100%;
                overflow: hidden;
              }

              table {
                width: 100%;
                border-collapse: separate;
                border-spacing: 0;
                table-layout: fixed;
                border: 1px solid #cbd5e1;
                border-radius: 9px;
                overflow: hidden;
              }

              thead th {
                background: #1e3a8a;
                color: #ffffff;
                font-size: 9px;
                font-weight: 800;
                padding: 8px 5px;
                text-align: center;
                border-right: 1px solid
                  rgba(255,255,255,0.18);
              }

              thead th:first-child {
                width: 105px;
              }

              tbody td {
                border-right: 1px solid #dbe4f0;
                border-bottom: 1px solid #dbe4f0;
                vertical-align: middle;
                height: 66px;
                padding: 5px;
                background: #ffffff;
              }

              tbody tr:last-child td {
                border-bottom: none;
              }

              tbody td:last-child {
                border-right: none;
              }

              .time-cell {
                background: #f8fafc !important;
                text-align: center;
                padding: 6px !important;
              }

              .time-cell strong {
                display: block;
                color: #172033;
                font-size: 9px;
                margin-bottom: 4px;
              }

              .time-cell span {
                display: block;
                color: #64748b;
                font-size: 7px;
                line-height: 1.35;
              }

              .subject-card {
                background: #eff6ff;
                border: 1px solid #bfdbfe;
                border-radius: 6px;
                padding: 6px;
                margin: 1px;
                min-height: 45px;
                page-break-inside: avoid;
              }

              .subject {
                font-size: 9px;
                font-weight: 800;
                color: #1e3a8a;
                line-height: 1.25;
              }

              .cell-class {
                margin-top: 2px;
                font-size: 7px;
                font-weight: 700;
                color: #475569;
              }

              .teacher {
                margin-top: 4px;
                font-size: 7px;
                color: #475569;
                line-height: 1.2;
              }

              .empty-cell {
                text-align: center;
                color: #cbd5e1;
                font-size: 12px;
              }

              .break-row td {
                height: 30px;
              }

              .break-cell {
                background: #f1f5f9 !important;
                color: #475569;
                text-align: center;
                font-size: 8px;
                font-weight: 800;
                letter-spacing: 0.08em;
                text-transform: uppercase;
              }

              .footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 10px;
                padding-top: 7px;
                border-top: 1px solid #e2e8f0;
                color: #64748b;
                font-size: 7px;
              }

              .footer strong {
                color: #334155;
              }

              @media print {
                body {
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
              }

            </style>
          </head>

          <body>

            <div class="print-page">

              <div class="top-line"></div>

              <div class="header">

                <div class="brand">

                  <div class="brand-mark">
                    CI
                  </div>

                  <div>
                    <h1>
                      ${escapeHtml(
                        title
                      )}
                    </h1>

                    <div class="subtitle">
                      CAMPUS-IQ • Weekly Academic Timetable
                    </div>
                  </div>

                </div>

                <div class="generated">
                  Generated on<br />
                  ${escapeHtml(
                    new Date().toLocaleDateString(
                      "en-IN",
                      {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      }
                    )
                  )}
                </div>

              </div>

              <div class="summary">

                ${
                  mode ===
                  "class"
                    ? `
                      <div class="summary-item">
                        <span class="summary-label">
                          Class
                        </span>
                        <span class="summary-value">
                          ${escapeHtml(
                            className
                          )}
                        </span>
                      </div>

                      <div class="summary-item">
                        <span class="summary-label">
                          Section
                        </span>
                        <span class="summary-value">
                          ${escapeHtml(
                            sectionName
                          )}
                        </span>
                      </div>

                      <div class="summary-item">
                        <span class="summary-label">
                          Academic Year
                        </span>
                        <span class="summary-value">
                          ${escapeHtml(
                            academicYearName
                          )}
                        </span>
                      </div>

                      <div class="summary-item">
                        <span class="summary-label">
                          Class Incharge
                        </span>
                        <span class="summary-value">
                          ${escapeHtml(
                            inchargeName
                          )}
                        </span>
                      </div>
                    `
                    : `
                      <div class="summary-item">
                        <span class="summary-label">
                          Teacher
                        </span>
                        <span class="summary-value">
                          ${escapeHtml(
                            teacherName
                          )}
                        </span>
                      </div>

                      <div class="summary-item">
                        <span class="summary-label">
                          Academic Year
                        </span>
                        <span class="summary-value">
                          ${escapeHtml(
                            academicYearName
                          )}
                        </span>
                      </div>

                      <div class="summary-item">
                        <span class="summary-label">
                          Timetable
                        </span>
                        <span class="summary-value">
                          Weekly Schedule
                        </span>
                      </div>

                      <div class="summary-item">
                        <span class="summary-label">
                          Total Entries
                        </span>
                        <span class="summary-value">
                          ${visibleEntries.length}
                        </span>
                      </div>
                    `
                }

              </div>

              <div class="table-wrap">

                <table>

                  <thead>
                    <tr>
                      <th>Time / Period</th>
                      ${DAYS.map(
                        (day) =>
                          `<th>${escapeHtml(
                            day.label
                          )}</th>`
                      ).join("")}
                    </tr>
                  </thead>

                  <tbody>
                    ${rows}
                  </tbody>

                </table>

              </div>

              <div class="footer">
                <span>
                  <strong>CAMPUS-IQ</strong>
                  &nbsp; Academic Management System
                </span>

                <span>
                  Timetable document
                </span>
              </div>

            </div>

          </body>
        </html>
      `);

      printWindow.document.close();

      printWindow.focus();

      setTimeout(() => {
        printWindow.print();

        setTimeout(() => {
          printWindow.close();
        }, 800);
      }, 500);
    };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="timetable-page">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="tt-page-header">

        <div>

          <div className="tt-breadcrumb">
            <CalendarDays size={16} />
            Academic Management
          </div>

          <h1>
            Timetable
          </h1>

          <p>
            Create, manage and download
            professional weekly timetables.
          </p>

        </div>

        <div className="tt-header-actions">

          <Button
            variant="outline"
            size="md"
            onClick={
              downloadTimetablePDF
            }
            disabled={
              visibleEntries.length ===
              0
            }
          >
            <Download size={16} />

            Download PDF
          </Button>

          <Button
            variant="outline"
            size="md"
            onClick={() => {
              loadSlots();
              loadAcademicYears();
              loadClasses();
              loadTeachers();

              if (classId) {
                loadSections(
                  classId
                );
              }
            }}
            disabled={
              slotLoading ||
              teacherLoading
            }
          >

            <RefreshCw
              size={16}
              className={
                slotLoading ||
                teacherLoading
                  ? "tt-spin"
                  : ""
              }
            />

            Refresh
          </Button>

          <Button
            variant="outline"
            size="md"
            onClick={
              openCreateSlot
            }
          >
            <Clock3 size={16} />

            Add Time Slot
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={
              openCreateEntry
            }
          >
            <Plus size={16} />

            Create Timetable
          </Button>

        </div>

      </div>

      {/* ======================================================
          ALERT
      ====================================================== */}

      {(error || notice) && (
        <div
          className={`tt-alert ${
            error
              ? "tt-alert-error"
              : "tt-alert-success"
          }`}
        >

          <AlertCircle
            size={18}
          />

          <span>
            {error || notice}
          </span>

          <button
            type="button"
            onClick={() => {
              setError("");
              setNotice("");
            }}
          >
            <X size={16} />
          </button>

        </div>
      )}

      {/* ======================================================
          MAIN TIMETABLE CARD
      ====================================================== */}

      <Card>

        <CardHeader>

          <div className="tt-card-header">

            <div>
              <CardTitle>
                Weekly Timetable
              </CardTitle>

              <p className="tt-card-description">
                Select a class and section
                to view, manage or download
                its timetable.
              </p>
            </div>

            <div className="tt-mode-switch">

              <button
                type="button"
                className={
                  mode === "class"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  switchMode(
                    "class"
                  )
                }
              >
                <Users size={16} />

                Class View
              </button>

              <button
                type="button"
                className={
                  mode === "teacher"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  switchMode(
                    "teacher"
                  )
                }
              >
                <BookOpen
                  size={16}
                />

                Teacher View
              </button>

            </div>

          </div>

        </CardHeader>

        <CardContent>

          {/* ==================================================
              FILTERS
          ================================================== */}

          <div className="tt-filter-grid">

            {mode === "class" ? (
              <>
                <Field
                  label="Class"
                  required
                >

                  <select
                    className="tt-select"
                    value={classId}
                    onChange={(event) => {
                      setClassId(
                        event.target.value
                      );

                      setSectionId("");

                      setEntries([]);
                    }}
                  >

                    <option value="">
                      Select Class
                    </option>

                    {classes.map(
                      (item) => (
                        <option
                          key={
                            item.id
                          }
                          value={
                            item.id
                          }
                        >
                          {item.name ||
                            item.className ||
                            item.class ||
                            item.grade}
                        </option>
                      )
                    )}

                  </select>

                </Field>

                <Field
                  label="Section"
                  required
                >

                  <select
                    className="tt-select"
                    value={
                      sectionId
                    }
                    onChange={(event) =>
                      setSectionId(
                        event.target.value
                      )
                    }
                    disabled={
                      !classId ||
                      sectionLoading
                    }
                  >

                    <option value="">
                      {!classId
                        ? "Select class first"
                        : sectionLoading
                        ? "Loading sections..."
                        : "Select Section"}
                    </option>

                    {sections.map(
                      (section) => (
                        <option
                          key={
                            section.id
                          }
                          value={
                            section.id
                          }
                        >
                          {section.name ||
                            section.sectionName ||
                            section.code}
                        </option>
                      )
                    )}

                  </select>

                </Field>

                <div className="tt-incharge-action">

                  <Button
                    variant="outline"
                    size="md"
                    onClick={
                      openInchargeModal
                    }
                    disabled={
                      !sectionId
                    }
                  >
                    <UserCheck
                      size={16}
                    />

                    Set Class Incharge
                  </Button>

                </div>
              </>
            ) : (

              <Field
                label="Teacher"
                required
              >

                <select
                  className="tt-select"
                  value={staffId}
                  onChange={(event) =>
                    setStaffId(
                      event.target.value
                    )
                  }
                >

                  <option value="">
                    {teacherLoading
                      ? "Loading Teachers..."
                      : "Select Teacher"}
                  </option>

                  {teachers.map(
                    (teacher) => (
                      <option
                        key={String(
                          teacher.id
                        )}
                        value={String(
                          teacher.id
                        )}
                      >
                        {teacher.name}
                      </option>
                    )
                  )}

                </select>

              </Field>
            )}

            <Field
              label="Academic Year"
            >

              <select
                className="tt-select"
                value={
                  academicYearId
                }
                onChange={(event) =>
                  setAcademicYearId(
                    event.target.value
                  )
                }
              >

                <option value="">
                  All Academic Years
                </option>

                {academicYears.map(
                  (year) => (
                    <option
                      key={
                        year.id
                      }
                      value={
                        year.id
                      }
                    >
                      {getAcademicYearName(
                        year
                      )}
                    </option>
                  )
                )}

              </select>

            </Field>

            <Field label="Search">

              <div className="tt-search">

                <Search
                  size={16}
                />

                <Input
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Subject, teacher..."
                />

              </div>

            </Field>

            <div className="tt-load-button">

              <Button
                variant="primary"
                size="md"
                onClick={
                  loadTimetable
                }
                disabled={
                  loading
                }
              >
                {loading
                  ? "Loading..."
                  : "Load Timetable"}
              </Button>

            </div>

          </div>

          {/* ==================================================
              SELECTED SECTION SUMMARY
          ================================================== */}

          {mode === "class" &&
            sectionId && (
              <div className="tt-section-summary">

                <div className="tt-summary-icon">
                  <Users size={19} />
                </div>

                <div className="tt-summary-main">

                  <div className="tt-summary-title">
                    {selectedClass?.name ||
                      selectedClass?.className ||
                      "Class"}{" "}
                    •{" "}
                    {selectedSection?.name ||
                      "Section"}
                  </div>

                  <div className="tt-summary-meta">

                    <span>
                      Academic Year:{" "}
                      {getAcademicYearName(
                        selectedAcademicYear
                      ) ||
                        "Not selected"}
                    </span>

                    <span>
                      Class Incharge:{" "}
                      <strong>
                        {getInchargeName(
                          selectedSection
                        ) ||
                          "Not assigned"}
                      </strong>
                    </span>

                  </div>

                </div>

                <button
                  type="button"
                  className="tt-summary-edit"
                  onClick={
                    openInchargeModal
                  }
                >
                  <Pencil size={14} />

                  Change
                </button>

              </div>
            )}

          {/* ==================================================
              VIEW SWITCH
          ================================================== */}

          <div className="tt-view-switch">

            <button
              type="button"
              className={
                viewMode === "weekly"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setViewMode(
                  "weekly"
                )
              }
            >
              <CalendarDays
                size={16}
              />

              Weekly View
            </button>

            <button
              type="button"
              className={
                viewMode === "list"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setViewMode(
                  "list"
                )
              }
            >
              <FileText size={16} />

              Management View
            </button>

          </div>

          {/* ==================================================
              DAY FILTER
          ================================================== */}

          <div className="tt-days">

            {[
              "All",
              ...DAYS.map(
                (day) =>
                  day.label
              ),
            ].map(
              (day) => (
                <button
                  type="button"
                  key={day}
                  className={
                    activeDay ===
                    day
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setActiveDay(
                      day
                    )
                  }
                >
                  {day}
                </button>
              )
            )}

          </div>

          {/* ==================================================
              WEEKLY VIEW
          ================================================== */}

          {viewMode ===
            "weekly" && (
            <div className="tt-weekly-wrapper">

              <div className="tt-weekly-grid">

                <div className="tt-weekly-header tt-time-header">
                  Time / Period
                </div>

                {DAYS.map(
                  (day) => (
                    <div
                      className="tt-weekly-header"
                      key={
                        day.value
                      }
                    >
                      {day.label}
                    </div>
                  )
                )}

                {slots.length ===
                0 ? (
                  <div className="tt-weekly-empty">
                    No time slots found.
                    Create a time slot first.
                  </div>
                ) : (
                  slots.map(
                    (slot) => {
                      const slotType =
                        String(
                          slot.slotType ||
                            ""
                        ).toLowerCase();

                      const isBreak =
                        slotType ===
                          "recess" ||
                        slotType ===
                          "lunch";

                      return (
                        <React.Fragment
                          key={
                            slot.id
                          }
                        >

                          <div
                            className={`tt-weekly-time ${
                              isBreak
                                ? "break-time"
                                : ""
                            }`}
                          >
                            <strong>
                              {slot.label ||
                                `Period ${
                                  slot.slotNo ||
                                  ""
                                }`}
                            </strong>

                            <span>
                              {formatTime(
                                slot.startTime
                              )}
                              {" - "}
                              {formatTime(
                                slot.endTime
                              )}
                            </span>
                          </div>

                          {DAYS.map(
                            (day) => {
                              const dayEntries =
                                getEntriesForSlotDay(
                                  slot,
                                  day.label
                                );

                              if (
                                isBreak
                              ) {
                                return (
                                  <div
                                    key={`${slot.id}-${day.value}`}
                                    className="tt-weekly-cell break-cell"
                                  >
                                    <span>
                                      {slot.label ||
                                        "Break"}
                                    </span>
                                  </div>
                                );
                              }

                              return (
                                <div
                                  key={`${slot.id}-${day.value}`}
                                  className="tt-weekly-cell"
                                >

                                  {dayEntries.length ===
                                  0 ? (
                                    <span className="tt-no-class">
                                      —
                                    </span>
                                  ) : (
                                    dayEntries.map(
                                      (
                                        entry
                                      ) => (
                                        <div
                                          className="tt-subject-card"
                                          key={
                                            entry.id
                                          }
                                        >

                                          <strong>
                                            {getSubjectName(
                                              entry
                                            )}
                                          </strong>

                                          <span>
                                            {getTeacherName(
                                              entry
                                            )}
                                          </span>

                                          {mode ===
                                            "teacher" && (
                                            <small>
                                              {getClassName(
                                                entry
                                              )}{" "}
                                              •{" "}
                                              {getSectionName(
                                                entry
                                              )}
                                            </small>
                                          )}

                                        </div>
                                      )
                                    )
                                  )}

                                </div>
                              );
                            }
                          )}

                        </React.Fragment>
                      );
                    }
                  )
                )}

              </div>

            </div>
          )}

          {/* ==================================================
              MANAGEMENT LIST
          ================================================== */}

          {viewMode ===
            "list" && (
            <div className="tt-table-wrapper">

              <table className="tt-table">

                <thead>
                  <tr>
                    <th>Day</th>
                    <th>Time</th>
                    <th>Section</th>
                    <th>Subject</th>
                    <th>Teacher</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>

                  {visibleEntries.map(
                    (entry) => (
                      <tr
                        key={
                          entry.id
                        }
                      >

                        <td>
                          <strong>
                            {normalizeDay(
                              entry.dayName ||
                                entry.day ||
                                entry.dayOfWeek
                            )}
                          </strong>
                        </td>

                        <td>

                          <div className="tt-time-cell">

                            <strong>
                              {formatTime(
                                entry
                                  .periodSlot
                                  ?.startTime
                              )}
                            </strong>

                            <span>
                              to
                            </span>

                            <strong>
                              {formatTime(
                                entry
                                  .periodSlot
                                  ?.endTime
                              )}
                            </strong>

                          </div>

                          <small>
                            {entry
                              .periodSlot
                              ?.label ||
                              ""}
                          </small>

                        </td>

                        <td>
                          {getClassName(
                            entry
                          )}{" "}
                          •{" "}
                          {getSectionName(
                            entry
                          )}
                        </td>

                        <td>
                          <strong>
                            {getSubjectName(
                              entry
                            )}
                          </strong>
                        </td>

                        <td>
                          {getTeacherName(
                            entry
                          )}
                        </td>

                        <td>

                          <div className="tt-action-buttons">

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                editEntry(
                                  entry
                                )
                              }
                            >
                              <Pencil
                                size={14}
                              />

                              Edit
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                deleteEntry(
                                  entry
                                )
                              }
                            >
                              <Trash2
                                size={14}
                              />

                              Delete
                            </Button>

                          </div>

                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

              {!loading &&
                visibleEntries.length ===
                  0 && (
                  <EmptyState
                    message={
                      mode ===
                      "class"
                        ? classId
                          ? "No timetable entries found."
                          : "Select a class and click Load Timetable."
                        : staffId
                        ? "No timetable entries found."
                        : "Select a teacher and click Load Timetable."
                    }
                  />
                )}

            </div>
          )}

          {/* ==================================================
              PDF HELP
          ================================================== */}

          <div className="tt-pdf-help">

            <div>
              <Download size={18} />
            </div>

            <div>
              <strong>
                Download section timetable
              </strong>

              <span>
                Select Class + Section,
                load the timetable, then
                click Download PDF. The
                PDF contains only the
                timetable.
              </span>
            </div>

          </div>

        </CardContent>
      </Card>

      {/* ======================================================
          TIME SLOTS
      ====================================================== */}

      <Card>

        <CardHeader>

          <div className="tt-card-header">

            <div>

              <CardTitle>
                Time Slots
              </CardTitle>

              <p className="tt-card-description">
                School timings used by
                the timetable.
              </p>

            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={
                openCreateSlot
              }
            >
              <Plus size={15} />

              Add Time Slot
            </Button>

          </div>

        </CardHeader>

        <CardContent>

          {slots.length ===
          0 ? (
            <EmptyState
              message="No time slots found. Click Add Time Slot to create one."
            />
          ) : (
            <div className="tt-slot-grid">

              {slots.map(
                (slot) => (
                  <div
                    className="tt-slot-card"
                    key={
                      slot.id
                    }
                  >

                    <div className="tt-slot-number">
                      {slot.slotNo}
                    </div>

                    <div className="tt-slot-content">

                      <strong>
                        {slot.label}
                      </strong>

                      <div className="tt-slot-time">

                        <Clock3
                          size={15}
                        />

                        {formatTime(
                          slot.startTime
                        )}

                        <span>
                          —
                        </span>

                        {formatTime(
                          slot.endTime
                        )}

                      </div>

                      <span className="tt-slot-type">
                        {slot.slotType}
                      </span>

                    </div>

                    <div className="tt-slot-actions">

                      <button
                        type="button"
                        onClick={() =>
                          editSlot(
                            slot
                          )
                        }
                        title="Edit time slot"
                      >
                        <Pencil
                          size={16}
                        />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          deleteSlot(
                            slot
                          )
                        }
                        title="Delete time slot"
                      >
                        <Trash2
                          size={16}
                        />
                      </button>

                    </div>

                  </div>
                )
              )}

            </div>
          )}

        </CardContent>

      </Card>

      {/* ======================================================
          CREATE / EDIT TIMETABLE MODAL
      ====================================================== */}

      {showEntryForm && (
        <Modal
          title={
            editingEntry
              ? "Edit Timetable"
              : "Create Timetable"
          }
          onClose={() =>
            setShowEntryForm(
              false
            )
          }
          wide
        >

          <form
            className="tt-form"
            onSubmit={
              saveEntry
            }
          >

            <Field
              label="Academic Year"
              required
            >

              <select
                className="tt-select"
                required
                value={
                  entryForm.academicYearId
                }
                onChange={(event) =>
                  setEntryForm({
                    ...entryForm,
                    academicYearId:
                      event.target.value,
                  })
                }
              >

                <option value="">
                  Select Academic Year
                </option>

                {academicYears.map(
                  (year) => (
                    <option
                      key={
                        year.id
                      }
                      value={
                        year.id
                      }
                    >
                      {getAcademicYearName(
                        year
                      )}
                    </option>
                  )
                )}

              </select>

            </Field>

            <Field
              label="Class"
              required
            >

              <select
                className="tt-select"
                required
                value={
                  entryForm.classId
                }
                onChange={(event) => {

                  const newClassId =
                    event.target
                      .value;

                  setEntryForm({
                    ...entryForm,
                    classId:
                      newClassId,
                    sectionId:
                      "",
                  });

                  loadSections(
                    newClassId
                  );
                }}
              >

                <option value="">
                  Select Class
                </option>

                {classes.map(
                  (item) => (
                    <option
                      key={
                        item.id
                      }
                      value={
                        item.id
                      }
                    >
                      {item.name ||
                        item.className ||
                        item.class ||
                        item.grade}
                    </option>
                  )
                )}

              </select>

            </Field>

            <Field
              label="Section"
              required
            >

              <select
                className="tt-select"
                required
                value={
                  entryForm.sectionId
                }
                onChange={(event) =>
                  setEntryForm({
                    ...entryForm,
                    sectionId:
                      event.target
                        .value,
                  })
                }
                disabled={
                  !entryForm.classId
                }
              >

                <option value="">
                  {!entryForm.classId
                    ? "Select class first"
                    : "Select Section"}
                </option>

                {sections.map(
                  (section) => (
                    <option
                      key={
                        section.id
                      }
                      value={
                        section.id
                      }
                    >
                      {section.name ||
                        section.sectionName ||
                        section.code}
                    </option>
                  )
                )}

              </select>

            </Field>

            <Field
              label="Subject"
              required
            >

              <Input
                required
                value={
                  entryForm.subjectName
                }
                onChange={(event) =>
                  setEntryForm({
                    ...entryForm,
                    subjectName:
                      event.target
                        .value,
                  })
                }
                placeholder="Enter subject name"
              />

            </Field>

            <Field
              label="Teacher"
              required
            >

              <select
                className="tt-select"
                required
                value={
                  entryForm.staffId
                }
                onChange={(event) =>
                  setEntryForm({
                    ...entryForm,
                    staffId:
                      event.target
                        .value,
                  })
                }
              >

                <option value="">
                  {teacherLoading
                    ? "Loading Teachers..."
                    : "Select Teacher"}
                </option>

                {teachers.map(
                  (teacher) => (
                    <option
                      key={String(
                        teacher.id
                      )}
                      value={String(
                        teacher.id
                      )}
                    >
                      {teacher.name}
                    </option>
                  )
                )}

              </select>

            </Field>

            <Field
              label="Time"
              required
            >

              <select
                className="tt-select"
                required
                value={
                  entryForm.periodSlotId
                }
                onChange={(event) =>
                  setEntryForm({
                    ...entryForm,
                    periodSlotId:
                      event.target
                        .value,
                  })
                }
              >

                <option value="">
                  Select Time
                </option>

                {slots.map(
                  (slot) => (
                    <option
                      key={
                        slot.id
                      }
                      value={
                        slot.id
                      }
                    >
                      {formatTime(
                        slot.startTime
                      )}
                      {" - "}
                      {formatTime(
                        slot.endTime
                      )}
                      {" ("}
                      {slot.label}
                      {")"}
                    </option>
                  )
                )}

              </select>

            </Field>

            <Field
              label="Day"
              required
            >

              <select
                className="tt-select"
                required
                value={
                  entryForm.dayOfWeek
                }
                onChange={(event) =>
                  setEntryForm({
                    ...entryForm,
                    dayOfWeek:
                      event.target
                        .value,
                  })
                }
              >

                {DAYS.map(
                  (day) => (
                    <option
                      key={
                        day.value
                      }
                      value={
                        day.value
                      }
                    >
                      {day.label}
                    </option>
                  )
                )}

              </select>

            </Field>

            <div className="tt-form-actions">

              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setShowEntryForm(
                    false
                  )
                }
              >
                Cancel
              </Button>

              <Button
                type="submit"
                variant="primary"
              >
                <Save size={16} />

                {editingEntry
                  ? "Update Timetable"
                  : "Create Timetable"}
              </Button>

            </div>

          </form>

        </Modal>
      )}

      {/* ======================================================
          CLASS INCHARGE MODAL
      ====================================================== */}

      {showInchargeForm && (
        <Modal
          title="Set Class Incharge"
          onClose={() =>
            setShowInchargeForm(
              false
            )
          }
        >

          <form
            className="tt-form"
            onSubmit={
              saveClassIncharge
            }
          >

            <div className="tt-incharge-modal-info">

              <div className="tt-incharge-modal-icon">
                <UserCheck size={24} />
              </div>

              <div>

                <strong>
                  {selectedClass?.name ||
                    selectedClass?.className ||
                    "Class"}{" "}
                  •{" "}
                  {selectedSection?.name ||
                    "Section"}
                </strong>

                <span>
                  Choose the teacher who
                  will be the class incharge
                  for this section.
                </span>

              </div>

            </div>

            <Field
              label="Class Incharge"
              required
            >

              <select
                className="tt-select"
                required
                value={
                  inchargeTeacherId
                }
                onChange={(event) =>
                  setInchargeTeacherId(
                    event.target
                      .value
                  )
                }
              >

                <option value="">
                  Select Teacher
                </option>

                {teachers.map(
                  (teacher) => (
                    <option
                      key={
                        teacher.id
                      }
                      value={
                        teacher.id
                      }
                    >
                      {teacher.name}
                    </option>
                  )
                )}

              </select>

            </Field>

            <div className="tt-form-actions">

              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setShowInchargeForm(
                    false
                  )
                }
              >
                Cancel
              </Button>

              <Button
                type="submit"
                variant="primary"
                disabled={
                  inchargeSaving
                }
              >
                <Save size={16} />

                {inchargeSaving
                  ? "Saving..."
                  : "Save Incharge"}
              </Button>

            </div>

          </form>

        </Modal>
      )}

      {/* ======================================================
          ADD / EDIT SLOT MODAL
      ====================================================== */}

      {showSlotForm && (
        <Modal
          title={
            editingSlot
              ? "Edit Time Slot"
              : "Add Time Slot"
          }
          onClose={() =>
            setShowSlotForm(
              false
            )
          }
        >

          <form
            className="tt-form"
            onSubmit={
              saveSlot
            }
          >

            <Field
              label="Slot Number"
              required
            >

              <Input
                required
                type="number"
                min="1"
                value={
                  slotForm.slotNo
                }
                disabled={
                  !!editingSlot
                }
                onChange={(event) =>
                  setSlotForm({
                    ...slotForm,
                    slotNo:
                      event.target
                        .value,
                  })
                }
              />

            </Field>

            <Field
              label="Slot Name"
              required
            >

              <Input
                required
                value={
                  slotForm.label
                }
                onChange={(event) =>
                  setSlotForm({
                    ...slotForm,
                    label:
                      event.target
                        .value,
                  })
                }
                placeholder="Period 1"
              />

            </Field>

            <Field
              label="Start Time"
              required
            >

              <Input
                required
                type="time"
                value={
                  slotForm.startTime
                }
                onChange={(event) =>
                  setSlotForm({
                    ...slotForm,
                    startTime:
                      event.target
                        .value,
                  })
                }
              />

            </Field>

            <Field
              label="End Time"
              required
            >

              <Input
                required
                type="time"
                value={
                  slotForm.endTime
                }
                onChange={(event) =>
                  setSlotForm({
                    ...slotForm,
                    endTime:
                      event.target
                        .value,
                  })
                }
              />

            </Field>

            <Field
              label="Type"
              required
            >

              <select
                className="tt-select"
                required
                value={
                  slotForm.slotType
                }
                onChange={(event) =>
                  setSlotForm({
                    ...slotForm,
                    slotType:
                      event.target
                        .value,
                  })
                }
              >

                {SLOT_TYPES.map(
                  (type) => (
                    <option
                      key={
                        type.value
                      }
                      value={
                        type.value
                      }
                    >
                      {type.label}
                    </option>
                  )
                )}

              </select>

            </Field>

            <div className="tt-slot-preview">

              <Clock3 size={18} />

              <div>

                <strong>
                  Preview
                </strong>

                <span>
                  {slotForm.startTime
                    ? formatTime(
                        slotForm.startTime
                      )
                    : "--:--"}

                  {" - "}

                  {slotForm.endTime
                    ? formatTime(
                        slotForm.endTime
                      )
                    : "--:--"}
                </span>

              </div>

            </div>

            <div className="tt-form-actions">

              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setShowSlotForm(
                    false
                  )
                }
              >
                Cancel
              </Button>

              <Button
                type="submit"
                variant="primary"
              >
                <Save size={16} />

                {editingSlot
                  ? "Update Time Slot"
                  : "Create Time Slot"}
              </Button>

            </div>

          </form>

        </Modal>
      )}

    </div>
  );
}