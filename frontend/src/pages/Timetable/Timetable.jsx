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

function formatTime(value) {
  if (!value) return "—";

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

  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${String(minute).padStart(
    2,
    "0"
  )} ${period}`;
}

/* ============================================================
   ID HELPER
============================================================ */

function getId(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

/* ============================================================
   FLATTEN TIMETABLE RESPONSE
============================================================ */

function flattenGrouped(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (!data || typeof data !== "object") {
    return [];
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
        day,
    }));
  });
}

/* ============================================================
   EXTRACT ARRAY
============================================================ */

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

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  if (Array.isArray(data?.users)) {
    return data.users;
  }

  return [];
}

/* ============================================================
   NORMALIZE TEACHER
============================================================ */

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
   EMPTY STATE
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

  const [classes, setClasses] =
    useState([]);

  const [sections, setSections] =
    useState([]);

  const [teachers, setTeachers] =
    useState([]);

  /* ==========================================================
     FILTERS
  ========================================================== */

  const [mode, setMode] =
    useState("class");

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

  const [
    showEntryForm,
    setShowEntryForm,
  ] = useState(false);

  const [
    showSlotForm,
    setShowSlotForm,
  ] = useState(false);

  const [
    editingEntry,
    setEditingEntry,
  ] = useState(null);

  const [
    editingSlot,
    setEditingSlot,
  ] = useState(null);

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
      }
    };

  /* ==========================================================
     LOAD TEACHERS
     
     IMPORTANT:
     
     Your backend returns:
     
     {
       success: true,
       data: {
         staff: [...],
         pagination: {...}
       }
     }
     
     Your backend also supports:
     
     GET /staff?role=teacher
     
     Therefore we request ONLY teachers.
  ========================================================== */

  const loadTeachers = async () => {
    setTeacherLoading(true);

    try {
      console.log(
        "Loading teachers from /staff..."
      );

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

      console.log(
        "Staff API response:",
        response.data
      );

      /*
       * CORRECT BACKEND RESPONSE:
       *
       * response.data.data.staff
       */

      const staffList =
        extractArray(
          response.data?.data
        );

      console.log(
        "Teachers returned by backend:",
        staffList
      );

      const normalizedTeachers =
        staffList
          .map(normalizeTeacher)
          .filter(Boolean);

      /*
       * Remove duplicate teachers
       */

      const uniqueTeachers =
        Array.from(
          new Map(
            normalizedTeachers.map(
              (teacher) => [
                String(teacher.id),
                teacher,
              ]
            )
          ).values()
        );

      /*
       * Sort teachers alphabetically
       */

      uniqueTeachers.sort(
        (a, b) =>
          String(a.name).localeCompare(
            String(b.name)
          )
      );

      setTeachers(
        uniqueTeachers
      );

      console.log(
        "FINAL TEACHER LIST:",
        uniqueTeachers
      );

      /*
       * If the currently selected teacher
       * no longer exists, clear it.
       */

      if (
        staffId &&
        !uniqueTeachers.some(
          (teacher) =>
            String(teacher.id) ===
            String(staffId)
        )
      ) {
        setStaffId("");
      }

      /*
       * If editing an existing timetable,
       * make sure the selected teacher
       * remains available in the dropdown.
       */

      if (
        entryForm.staffId &&
        !uniqueTeachers.some(
          (teacher) =>
            String(teacher.id) ===
            String(entryForm.staffId)
        )
      ) {
        setEntryForm(
          (previous) => ({
            ...previous,
            staffId: "",
          })
        );
      }

    } catch (err) {
      console.error(
        "Failed to load teachers:",
        err
      );

      console.error(
        "Teacher API error:",
        err.response?.data
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
     LOAD SECTIONS WHEN CLASS CHANGES
  ========================================================== */

  useEffect(() => {
    if (classId) {
      loadSections(classId);
    } else {
      setSections([]);
    }
  }, [classId]);

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

        /* ====================================================
           TEACHER VIEW
        ==================================================== */

        if (
          mode === "teacher"
        ) {
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
        }

        /* ====================================================
           CLASS VIEW
        ==================================================== */

        else {
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
     FILTER ENTRIES
  ========================================================== */

  const visibleEntries =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return entries.filter(
        (entry) => {
          const matchesDay =
            activeDay === "All" ||
            entry.dayName ===
              activeDay;

          if (!matchesDay) {
            return false;
          }

          if (!query) {
            return true;
          }

          return [
            entry.subject?.name,
            entry.subjectName,
            entry.staff?.name,
            entry.teacher?.name,
            entry.class?.name,
            entry.section?.name,
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
     OPEN CREATE TIMETABLE
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

      /*
       * IMPORTANT:
       * Reload teachers when modal opens.
       *
       * This means if you add a teacher
       * from Staff page, you don't have to
       * restart the application.
       */

      await loadTeachers();

      setShowEntryForm(true);
    };

  /* ==========================================================
     EDIT TIMETABLE
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
        entry.subject?.name ||
        entry.subjectName ||
        "",

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
     SAVE TIMETABLE
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

      if (
        !entryForm.classId
      ) {
        setError(
          "Please select a class."
        );
        return;
      }

      if (
        !entryForm.sectionId
      ) {
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

      if (
        !entryForm.staffId
      ) {
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
        const selectedSlot =
          slots.find(
            (slot) =>
              String(
                slot.id
              ) ===
              String(
                entryForm.periodSlotId
              )
          );

        if (!selectedSlot) {
          setError(
            "The selected time slot is not available. Please refresh the page."
          );
          return;
        }

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

        /* ====================================================
           UPDATE
        ==================================================== */

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
        }

        /* ====================================================
           CREATE
        ==================================================== */

        else {
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
     DELETE TIMETABLE ENTRY
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

      if (!slotForm.label.trim()) {
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
     SWITCH MODE
  ========================================================== */

  const switchMode = (
    nextMode
  ) => {
    setMode(nextMode);

    setEntries([]);

    setError("");

    if (
      nextMode === "class"
    ) {
      setStaffId("");
    } else {
      setClassId("");
      setSectionId("");
    }
  };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="timetable-page">

      {/* ======================================================
          PAGE HEADER
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
            Create and manage the
            weekly timetable for
            classes and teachers.
          </p>

        </div>

        <div className="tt-header-actions">

          <Button
            variant="outline"
            size="md"
            onClick={() => {
              loadSlots();
              loadAcademicYears();
              loadClasses();
              loadTeachers();
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
          ALERTS
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
          TIMETABLE CARD
      ====================================================== */}

      <Card>

        <CardHeader>

          <div className="tt-card-header">

            <CardTitle>
              Timetable
            </CardTitle>

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

                <Field label="Section">

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
                      !classId
                    }
                  >

                    <option value="">
                      All Sections
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
              </>
            ) : (

              /* =================================================
                 TEACHER FILTER
              ================================================= */

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
                      {year.name ||
                        year.label ||
                        year.academicYear ||
                        year.year}
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
                  placeholder="Subject, teacher, class..."
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
              DAYS
          ================================================== */}

          <div className="tt-days">

            {[
              "All",
              ...DAYS.map(
                (day) =>
                  day.label
              ),
            ].map((day) => (

              <button
                type="button"
                key={day}
                className={
                  activeDay === day
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

            ))}

          </div>

          {/* ==================================================
              TABLE
          ================================================== */}

          <div className="tt-table-wrapper">

            <table className="tt-table">

              <thead>

                <tr>

                  <th>
                    Day
                  </th>

                  <th>
                    Time
                  </th>

                  <th>
                    Class
                  </th>

                  <th>
                    Section
                  </th>

                  <th>
                    Subject
                  </th>

                  <th>
                    Teacher
                  </th>

                  <th>
                    Actions
                  </th>

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
                          {entry.dayName ||
                            "—"}
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

                        {entry
                          .class
                          ?.name ||
                          entry.className ||
                          "—"}

                      </td>

                      <td>

                        {entry
                          .section
                          ?.name ||
                          entry.sectionName ||
                          "—"}

                      </td>

                      <td>

                        <strong>
                          {entry
                            .subject
                            ?.name ||
                            entry.subjectName ||
                            "—"}
                        </strong>

                      </td>

                      <td>

                        {entry
                          .staff
                          ?.name ||
                          entry
                            .teacher
                            ?.name ||
                          "—"}

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
                Create the actual
                school timings used
                by the timetable.
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
              message="No time slots found. Click Add Time Slot to create the first school timing."
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
                      {
                        slot.slotNo
                      }
                    </div>

                    <div className="tt-slot-content">

                      <strong>
                        {
                          slot.label
                        }
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
                        {
                          slot.slotType
                        }
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

            {/* ==================================================
                ACADEMIC YEAR
            ================================================== */}

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

                      {year.name ||
                        year.label ||
                        year.academicYear ||
                        year.year}

                    </option>

                  )
                )}

              </select>

            </Field>

            {/* ==================================================
                CLASS
            ================================================== */}

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
                    event.target.value;

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

            {/* ==================================================
                SECTION
            ================================================== */}

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
                      event.target.value,
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

            {/* ==================================================
                SUBJECT
            ================================================== */}

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
                      event.target.value,
                  })
                }
                placeholder="Enter subject name"
              />

            </Field>

            {/* ==================================================
                TEACHER NAME
            ================================================== */}

            <Field
              label="Teacher Name"
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
                      event.target.value,
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

              {/* ==================================================
                  TEACHER STATUS
              ================================================== */}

              {teacherLoading && (
                <small
                  style={{
                    display:
                      "block",
                    marginTop:
                      "6px",
                    color:
                      "#64748b",
                  }}
                >
                  Loading teachers...
                </small>
              )}

              {!teacherLoading &&
                teachers.length ===
                  0 && (

                  <small
                    style={{
                      display:
                        "block",
                      marginTop:
                        "6px",
                      color:
                        "#dc2626",
                    }}
                  >
                    No teachers found.
                    Please add a
                    staff member with
                    the Role set to
                    "Teacher", then
                    click Refresh.
                  </small>

                )}

            </Field>

            {/* ==================================================
                TIME
            ================================================== */}

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
                      event.target.value,
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

                      {
                        slot.label
                      }

                      {")"}

                    </option>

                  )
                )}

              </select>

              <div className="tt-time-help">

                <Clock3
                  size={14}
                />

                <span>

                  Don't see the
                  required time?
                  Close this
                  window and
                  click{" "}

                  <strong>
                    Add Time Slot
                  </strong>

                  .

                </span>

              </div>

            </Field>

            {/* ==================================================
                DAY
            ================================================== */}

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
                      event.target.value,
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
                      {
                        day.label
                      }
                    </option>

                  )
                )}

              </select>

            </Field>

            {/* ==================================================
                FORM BUTTONS
            ================================================== */}

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
                disabled={
                  teacherLoading ||
                  teachers.length ===
                    0
                }
              >

                <Save
                  size={16}
                />

                {editingEntry
                  ? "Update Timetable"
                  : "Create Timetable"}

              </Button>

            </div>

          </form>

        </Modal>

      )}

      {/* ======================================================
          ADD / EDIT TIME SLOT MODAL
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

            {/* SLOT NUMBER */}

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
                      event.target.value,
                  })
                }
              />

            </Field>

            {/* SLOT NAME */}

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
                      event.target.value,
                  })
                }
                placeholder="Period 1"
              />

            </Field>

            {/* START TIME */}

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
                      event.target.value,
                  })
                }
              />

            </Field>

            {/* END TIME */}

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
                      event.target.value,
                  })
                }
              />

            </Field>

            {/* TYPE */}

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
                      event.target.value,
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
                      {
                        type.label
                      }
                    </option>

                  )
                )}

              </select>

            </Field>

            {/* PREVIEW */}

            <div className="tt-slot-preview">

              <Clock3
                size={18}
              />

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

            {/* BUTTONS */}

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

                <Save
                  size={16}
                />

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