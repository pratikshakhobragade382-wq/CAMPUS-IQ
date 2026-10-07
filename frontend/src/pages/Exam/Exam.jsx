import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  ClipboardList,
  RefreshCw,
  Search,
  Calendar,
  BookOpen,
  Sparkles,
  Clock,
  Printer,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { DataTable } from '../../components/tables/DataTable';
import { Tabs } from '../../components/ui/Tabs';
import { Modal, ModalBody, ModalFooter } from '../../components/modal/Modal';

import { useAuth } from '../../context/AuthContext';
import { getAcademicYears } from '../../api/academicYear.api';
import { getClasses } from '../../api/class.api';
import { getStudents } from '../../api/student.api';
import { getSubjects } from '../../api/subject.api';
import {
  getExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam,
  bulkEnterMarks,
  getExamMarks,
  getStudentReportCard,
  getExamSubjectSchedules,
  upsertExamSubjectSchedules,
  deleteExamSubjectSchedule,
} from '../../api/exam.api';

/* =====================================================
   CONSTANTS & HELPERS
===================================================== */

const EXAM_TYPE_OPTIONS = [
  { value: 'unit_test_1', label: 'Unit Test 1' },
  { value: 'unit_test_2', label: 'Unit Test 2' },
  { value: 'half_yearly', label: 'Half Yearly' },
  { value: 'annual', label: 'Annual' },
  { value: 'pre_board', label: 'Pre Board' },
  { value: 'practical', label: 'Practical' },
  { value: 'internal_assessment', label: 'Internal Assessment' },
];

const emptyExamForm = {
  id: null,
  academicYearId: '',
  name: '',
  examType: 'unit_test_1',
  classId: '',
  startDate: '',
  endDate: '',
  isActive: true,
};

function getApiError(err, fallback = 'Something went wrong') {
  return (
    err?.response?.data?.error ||
    err?.response?.data?.message ||
    err?.message ||
    fallback
  );
}

function toDateOnly(value) {
  if (!value) return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatIndianDate(date) {
  const dateOnly = toDateOnly(date);
  if (!dateOnly) return '—';
  const dateObj = new Date(`${dateOnly}T00:00:00`);
  if (Number.isNaN(dateObj.getTime())) return '—';
  return dateObj.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatWeekday(date) {
  const dateOnly = toDateOnly(date);
  if (!dateOnly) return '';
  const dateObj = new Date(`${dateOnly}T00:00:00`);
  if (Number.isNaN(dateObj.getTime())) return '';
  return dateObj.toLocaleDateString('en-IN', { weekday: 'short' });
}

function formatFullWeekday(date) {
  const dateOnly = toDateOnly(date);
  if (!dateOnly) return '';
  const dateObj = new Date(`${dateOnly}T00:00:00`);
  if (Number.isNaN(dateObj.getTime())) return '';
  return dateObj.toLocaleDateString('en-IN', { weekday: 'long' });
}

const formatShortWeekday = formatWeekday;

function formatTimeDisplay(timeStr) {
  if (!timeStr) return '—';
  const parts = String(timeStr).split(':');
  if (parts.length < 2) return timeStr;
  let hour = parseInt(parts[0], 10);
  const minute = parts[1];
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  hour = hour ? hour : 12;
  return `${hour}:${minute} ${ampm}`;
}

function examTypeLabel(type) {
  return EXAM_TYPE_OPTIONS.find((o) => o.value === type)?.label || type || '—';
}

function academicYearLabel(year) {
  if (!year) return '';
  if (year.name) return year.name;
  return `${new Date(year.startDate).getFullYear()}-${new Date(year.endDate).getFullYear()}`;
}

function getStaffRole(user) {
  return user?.staffRole || user?.staff?.role || null;
}

function getStaffId(user) {
  return user?.staffId || user?.staff?.id || null;
}

function isAdminUser(user) {
  return user?.identity === 'admin';
}

function canManageMarks(user) {
  if (isAdminUser(user)) return true;
  return user?.identity === 'staff' && getStaffRole(user) === 'teacher';
}

/** Admin portal marks are view-only. Teachers may still enter marks. */
function canEnterMarks(user) {
  if (isAdminUser(user)) return false;
  return user?.identity === 'staff' && getStaffRole(user) === 'teacher';
}

function canViewReport(user) {
  return canManageMarks(user);
}

/* =====================================================
   COMPONENT
===================================================== */

export default function Exam() {
  const { user } = useAuth();
  const isAdmin = isAdminUser(user);
  const marksAllowed = canManageMarks(user);
  const marksEditable = canEnterMarks(user);
  const reportAllowed = canViewReport(user);
  const linkedStaffId = getStaffId(user);

  const [academicYears, setAcademicYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [exams, setExams] = useState([]);

  const [filterAcademicYearId, setFilterAcademicYearId] = useState('');
  const [filterClassId, setFilterClassId] = useState('');
  const [filterExamType, setFilterExamType] = useState('');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState('');

  const [isModalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(emptyExamForm);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState(null);

  // Subject schedule state
  const [subjectSchedules, setSubjectSchedules] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleRows, setScheduleRows] = useState([]); // rows being edited
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleMsg, setScheduleMsg] = useState('');
  const [scheduleErr, setScheduleErr] = useState('');
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleActiveExam, setScheduleActiveExam] = useState(null);
  const [scheduleTab, setScheduleTab] = useState('manage'); // 'manage' | 'datesheet'
  const [scheduleSearch, setScheduleSearch] = useState('');

  // Marks state
  const [marksExamId, setMarksExamId] = useState('');
  const [marksSubjectId, setMarksSubjectId] = useState('');
  const [maxMarks, setMaxMarks] = useState('100');
  const [markRows, setMarkRows] = useState([]);
  const [existingMarks, setExistingMarks] = useState([]);
  const [marksLoading, setMarksLoading] = useState(false);
  const [marksSaving, setMarksSaving] = useState(false);
  const [marksError, setMarksError] = useState('');
  const [marksMessage, setMarksMessage] = useState('');

  // Report card state
  const [reportStudentQuery, setReportStudentQuery] = useState('');
  const [reportStudentOptions, setReportStudentOptions] = useState([]);
  const [reportStudentId, setReportStudentId] = useState('');
  const [reportAcademicYearId, setReportAcademicYearId] = useState('');
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState('');

  const filteredExams = useMemo(() => {
    if (!searchQuery.trim()) return exams;
    const q = searchQuery.trim().toLowerCase();
    return exams.filter((exam) => {
      return [
        exam.name,
        exam.examType,
        exam.class?.name,
        exam.academicYear?.name,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    });
  }, [exams, searchQuery]);

  const selectedMarksExam = useMemo(
    () => exams.find((e) => String(e.id) === String(marksExamId)) || null,
    [exams, marksExamId]
  );

  const loadExams = useCallback(async () => {
    try {
      setLoading(true);
      setPageError('');
      const response = await getExams({
        academicYearId: filterAcademicYearId || undefined,
        classId: filterClassId || undefined,
        examType: filterExamType || undefined,
        includeInactive,
      });
      setExams(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to load exams', error);
      setExams([]);
      setPageError(getApiError(error, 'Failed to load exams'));
    } finally {
      setLoading(false);
    }
  }, [filterAcademicYearId, filterClassId, filterExamType, includeInactive]);

  useEffect(() => {
    const loadLookups = async () => {
      try {
        const [yearsRes, classesRes, subjectsRes] = await Promise.all([
          getAcademicYears(),
          getClasses(),
          getSubjects().catch(() => ({ data: [] })),
        ]);

        const years = Array.isArray(yearsRes?.data) ? yearsRes.data : [];
        const classList = Array.isArray(classesRes?.data) ? classesRes.data : [];
        const subjectList = Array.isArray(subjectsRes?.data) ? subjectsRes.data : [];

        setAcademicYears(years);
        setClasses(classList);
        setSubjects(subjectList);

        const activeYear = years.find((y) => y.isActive) || years[0];
        if (activeYear) {
          setFilterAcademicYearId(String(activeYear.id));
          setReportAcademicYearId(String(activeYear.id));
        }
      } catch (error) {
        console.error('Failed to load exam lookups', error);
        setPageError(getApiError(error, 'Failed to load lookup data'));
      }
    };

    loadLookups();
  }, []);

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  const openAddModal = () => {
    setIsEditing(false);
    setForm({
      ...emptyExamForm,
      academicYearId: filterAcademicYearId || (academicYears[0]?.id ? String(academicYears[0].id) : ''),
      classId: filterClassId || '',
    });
    setModalOpen(true);
  };

  const openEditModal = (exam) => {
    setIsEditing(true);
    setForm({
      id: exam.id,
      academicYearId: String(exam.academicYearId || exam.academicYear?.id || ''),
      name: exam.name || '',
      examType: exam.examType || 'unit_test_1',
      classId: String(exam.classId || exam.class?.id || ''),
      startDate: toDateOnly(exam.startDate),
      endDate: toDateOnly(exam.endDate),
      isActive: exam.isActive !== false,
    });
    setModalOpen(true);
  };

  const resetForm = () => {
    setForm(emptyExamForm);
  };

  const handleSaveExam = async (event) => {
    event.preventDefault();

    if (!isEditing) {
      if (!form.academicYearId || !form.name.trim() || !form.examType || !form.classId || !form.startDate || !form.endDate) {
        alert('Please fill academic year, name, exam type, class, start date and end date.');
        return;
      }
      if (form.startDate > form.endDate) {
        alert('Start date cannot be after end date.');
        return;
      }
    } else if (!form.name.trim() || !form.examType || !form.startDate || !form.endDate) {
      alert('Please fill name, exam type, start date and end date.');
      return;
    }

    try {
      setSaving(true);

      if (isEditing) {
        const payload = {
          name: form.name.trim(),
          examType: form.examType,
          startDate: form.startDate,
          endDate: form.endDate,
          isActive: !!form.isActive,
        };
        await updateExam(form.id, payload);
      } else {
        const payload = {
          academicYearId: parseInt(form.academicYearId, 10),
          name: form.name.trim(),
          examType: form.examType,
          classId: parseInt(form.classId, 10),
          startDate: form.startDate,
          endDate: form.endDate,
        };
        await createExam(payload);
      }

      setModalOpen(false);
      resetForm();
      await loadExams();
    } catch (error) {
      console.error('Exam save failed', error);
      alert(getApiError(error, 'Failed to save exam'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExam = async (id) => {
    if (!window.confirm('Delete this exam? If marks exist, it will be deactivated instead.')) {
      return;
    }

    try {
      const result = await deleteExam(id);
      alert(result?.message || 'Exam deleted successfully');
      await loadExams();
    } catch (error) {
      console.error('Exam delete failed', error);
      alert(getApiError(error, 'Failed to delete exam'));
    }
  };

  const openExamDetails = async (exam) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailData(null);
    setSubjectSchedules([]);
    setScheduleRows([]);
    setScheduleMsg('');
    setScheduleErr('');
    try {
      const [detailRes, schedRes] = await Promise.all([
        getExamById(exam.id, { includeInactive: !exam.isActive }),
        getExamSubjectSchedules(exam.id).catch(() => ({ data: [] })),
      ]);
      setDetailData(detailRes?.data || null);
      const schedList = Array.isArray(schedRes?.data) ? schedRes.data : [];
      setSubjectSchedules(schedList);
      // Pre-fill edit rows from saved schedules
      setScheduleRows(
        schedList.map((s) => ({
          subjectId: String(s.subject?.id || s.subjectId),
          subjectName: s.subject?.name || '—',
          examDate: toDateOnly(s.examDate),
          startTime: s.startTime || '',
          endTime: s.endTime || '',
        }))
      );
    } catch (error) {
      console.error('Failed to load exam details', error);
      alert(getApiError(error, 'Failed to load exam details'));
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  /* ---------- Marks helpers ---------- */

  const loadStudentsForMarks = async (classId) => {
    if (!classId) {
      setMarkRows([]);
      return;
    }

    try {
      setMarksLoading(true);
      setMarksError('');
      const response = await getStudents({ page: 1, limit: 200, classId });
      const list = response?.data?.students || response?.data || [];
      const studentList = Array.isArray(list) ? list : [];
      setMarkRows(
        studentList.map((s) => ({
          studentId: s.id,
          studentName: s.studentName || s.name || '—',
          admissionNo: s.admissionNo || '—',
          rollNo: s.rollNo ?? '—',
          marksObtained: '',
          isAbsent: false,
          grade: '',
          remark: '',
        }))
      );
    } catch (error) {
      console.error('Failed to load students for marks', error);
      setMarkRows([]);
      setMarksError(getApiError(error, 'Failed to load students'));
    } finally {
      setMarksLoading(false);
    }
  };

  const loadExistingMarks = async (examId, subjectId) => {
    if (!examId) {
      setExistingMarks([]);
      return;
    }

    try {
      setMarksLoading(true);
      setMarksError('');
      const response = await getExamMarks(examId, {
        subjectId: subjectId || undefined,
      });
      setExistingMarks(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to load exam marks', error);
      setExistingMarks([]);
      setMarksError(getApiError(error, 'Failed to load marks'));
    } finally {
      setMarksLoading(false);
    }
  };

  useEffect(() => {
    if (!marksExamId || !selectedMarksExam) {
      setMarkRows([]);
      setExistingMarks([]);
      return;
    }
    if (marksEditable) {
      loadStudentsForMarks(selectedMarksExam.classId);
    } else {
      setMarkRows([]);
    }
    loadExistingMarks(marksExamId, marksSubjectId || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marksExamId, selectedMarksExam?.classId, marksEditable]);

  useEffect(() => {
    if (!marksExamId) return;
    loadExistingMarks(marksExamId, marksSubjectId || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marksSubjectId]);

  const updateMarkRow = (studentId, field, value) => {
    setMarkRows((prev) =>
      prev.map((row) =>
        row.studentId === studentId ? { ...row, [field]: value } : row
      )
    );
  };

  const handleSubmitMarks = async () => {
    setMarksMessage('');
    setMarksError('');

    if (!marksEditable) {
      setMarksError('Admins can view marks but cannot enter them.');
      return;
    }

    if (!marksExamId || !marksSubjectId || !maxMarks) {
      setMarksError('Please select exam, subject and enter max marks.');
      return;
    }

    if (!linkedStaffId) {
      setMarksError(
        'Your account is not linked to a staff record. Marks entry requires a linked staff profile.'
      );
      return;
    }

    const parsedMax = parseFloat(maxMarks);
    if (Number.isNaN(parsedMax) || parsedMax <= 0) {
      setMarksError('maxMarks must be greater than 0.');
      return;
    }

    const records = [];
    for (const row of markRows) {
      if (row.isAbsent) {
        records.push({
          studentId: parseInt(row.studentId, 10),
          isAbsent: true,
          grade: row.grade.trim() || undefined,
          remark: row.remark.trim() || undefined,
        });
        continue;
      }

      if (row.marksObtained === '' || row.marksObtained === null || row.marksObtained === undefined) {
        continue;
      }

      const marksValue = parseFloat(row.marksObtained);
      if (Number.isNaN(marksValue) || marksValue < 0 || marksValue > parsedMax) {
        setMarksError(
          `Invalid marks for ${row.studentName}. Must be between 0 and ${parsedMax}.`
        );
        return;
      }

      records.push({
        studentId: parseInt(row.studentId, 10),
        marksObtained: marksValue,
        isAbsent: false,
        grade: row.grade.trim() || undefined,
        remark: row.remark.trim() || undefined,
      });
    }

    if (records.length === 0) {
      setMarksError('Enter marks for at least one student (or mark them absent).');
      return;
    }

    const payload = {
      subjectId: parseInt(marksSubjectId, 10),
      maxMarks: parsedMax,
      records,
    };

    try {
      setMarksSaving(true);
      const response = await bulkEnterMarks(marksExamId, payload);
      setMarksMessage(response?.message || response?.data?.message || 'Marks recorded successfully');
      setMarkRows((prev) =>
        prev.map((row) => ({
          ...row,
          marksObtained: '',
          isAbsent: false,
          grade: '',
          remark: '',
        }))
      );
      await loadExistingMarks(marksExamId, marksSubjectId);
    } catch (error) {
      console.error('Marks save failed', error);
      setMarksError(getApiError(error, 'Failed to save marks'));
    } finally {
      setMarksSaving(false);
    }
  };

  /* ---------- Report card helpers ---------- */

  const searchReportStudents = async (query) => {
    setReportStudentQuery(query);
    if (!query || query.trim().length < 1) {
      setReportStudentOptions([]);
      return;
    }

    try {
      const response = await getStudents({ page: 1, limit: 20, search: query.trim() });
      const list = response?.data?.students || response?.data || [];
      setReportStudentOptions(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error('Student search failed', error);
      setReportStudentOptions([]);
    }
  };

  const handleLoadReport = async () => {
    setReportError('');
    setReportData(null);

    if (!reportStudentId) {
      setReportError('Please select a student.');
      return;
    }

    try {
      setReportLoading(true);
      const response = await getStudentReportCard(reportStudentId, {
        academicYearId: reportAcademicYearId || undefined,
      });
      setReportData(response?.data || null);
    } catch (error) {
      console.error('Report card failed', error);
      setReportError(getApiError(error, 'Failed to load report card'));
    } finally {
      setReportLoading(false);
    }
  };

  /* ---------- Subject Schedule helpers ---------- */

  const openScheduleModal = async (exam) => {
    setScheduleActiveExam(exam);
    setScheduleModalOpen(true);
    setScheduleLoading(true);
    setScheduleMsg('');
    setScheduleErr('');
    setScheduleTab('manage');
    setScheduleSearch('');
    try {
      const schedRes = await getExamSubjectSchedules(exam.id).catch(() => ({ data: [] }));
      const schedList = Array.isArray(schedRes?.data) ? schedRes.data : [];
      setSubjectSchedules(schedList);

      const existingMap = new Map();
      schedList.forEach((s) => {
        existingMap.set(String(s.subject?.id || s.subjectId), s);
      });

      // If already scheduled subjects exist, show them; also provide one-click populate for all class subjects
      if (schedList.length > 0) {
        setScheduleRows(
          schedList.map((s) => ({
            subjectId: String(s.subject?.id || s.subjectId),
            subjectName: s.subject?.name || '',
            subjectCode: s.subject?.code || '',
            examDate: toDateOnly(s.examDate),
            startTime: s.startTime || '',
            endTime: s.endTime || '',
            isSaved: true,
          }))
        );
      } else {
        // Pre-load all available subjects for this class so the user immediately gets the full class subject list!
        const initialRows = subjects.map((subj) => ({
          subjectId: String(subj.id),
          subjectName: subj.name,
          subjectCode: subj.code || '',
          examDate: '',
          startTime: '',
          endTime: '',
          isSaved: false,
        }));
        setScheduleRows(initialRows);
      }
    } catch (err) {
      console.error('Failed to load subject schedules', err);
      setScheduleErr(getApiError(err, 'Failed to load subject schedules'));
    } finally {
      setScheduleLoading(false);
    }
  };

  const populateAllClassSubjects = () => {
    const currentMap = new Map();
    scheduleRows.forEach((r) => {
      if (r.subjectId) currentMap.set(String(r.subjectId), r);
    });

    const newRows = subjects.map((subj) => {
      const existing = currentMap.get(String(subj.id));
      if (existing) return existing;
      return {
        subjectId: String(subj.id),
        subjectName: subj.name,
        subjectCode: subj.code || '',
        examDate: '',
        startTime: '',
        endTime: '',
        isSaved: false,
      };
    });

    setScheduleRows(newRows);
    setScheduleMsg(`Loaded all ${subjects.length} subjects for this class. Select exam date & time for each subject and click Save.`);
    setScheduleErr('');
  };

  const addScheduleRow = () => {
    setScheduleRows((prev) => [
      ...prev,
      { subjectId: '', subjectName: '', subjectCode: '', examDate: '', startTime: '', endTime: '', isSaved: false },
    ]);
  };

  const updateScheduleRow = (idx, field, value) => {
    setScheduleRows((prev) =>
      prev.map((row, i) => {
        if (i !== idx) return row;
        const updated = { ...row, [field]: value };
        if (field === 'subjectId') {
          const found = subjects.find((s) => String(s.id) === String(value));
          updated.subjectName = found?.name || '';
          updated.subjectCode = found?.code || '';
        }
        return updated;
      })
    );
  };

  const removeScheduleRow = (idx) => {
    setScheduleRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveSchedule = async () => {
    setScheduleMsg('');
    setScheduleErr('');
    const currentExamId = scheduleActiveExam?.id || detailData?.exam?.id;
    if (!currentExamId) return;

    const valid = scheduleRows.filter((r) => r.subjectId && r.examDate);
    if (valid.length === 0) {
      setScheduleErr('Please select an exam date for at least one subject before saving.');
      return;
    }

    try {
      setScheduleSaving(true);
      await upsertExamSubjectSchedules(
        currentExamId,
        valid.map((r) => ({
          subjectId: parseInt(r.subjectId, 10),
          examDate: r.examDate,
          startTime: r.startTime || undefined,
          endTime: r.endTime || undefined,
        }))
      );
      const schedRes = await getExamSubjectSchedules(currentExamId);
      const schedList = Array.isArray(schedRes?.data) ? schedRes.data : [];
      setSubjectSchedules(schedList);
      setScheduleMsg(`Successfully scheduled ${valid.length} subject(s)! ✨ Timetable published and notification sent to all portals.`);
      await loadExams();
    } catch (error) {
      setScheduleErr(getApiError(error, 'Failed to save schedule'));
    } finally {
      setScheduleSaving(false);
    }
  };

  const handleDeleteScheduleEntry = async (subjectId) => {
    if (!window.confirm('Remove this subject from the schedule?')) return;
    const currentExamId = scheduleActiveExam?.id || detailData?.exam?.id;
    if (!currentExamId) return;

    try {
      await deleteExamSubjectSchedule(currentExamId, subjectId);
      setSubjectSchedules((prev) => prev.filter((s) => s.subjectId !== subjectId && s.subject?.id !== subjectId));
      setScheduleRows((prev) =>
        prev.map((r) =>
          String(r.subjectId) === String(subjectId)
            ? { ...r, examDate: '', startTime: '', endTime: '', isSaved: false }
            : r
        )
      );
      await loadExams();
    } catch (error) {
      alert(getApiError(error, 'Failed to delete schedule entry'));
    }
  };

  /* ---------- Columns ---------- */

  const examColumns = [
    { header: 'Exam', accessor: 'name' },
    {
      header: 'Type',
      render: (row) => examTypeLabel(row.examType),
    },
    {
      header: 'Class',
      render: (row) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
          {row.class?.name || '—'}
        </span>
      ),
    },
    {
      header: 'Academic Year',
      render: (row) => row.academicYear?.name || '—',
    },
    {
      header: 'Start',
      render: (row) => formatIndianDate(row.startDate),
    },
    {
      header: 'End',
      render: (row) => formatIndianDate(row.endDate),
    },
    {
      header: 'Subject Schedule',
      render: (row) => {
        const count = Array.isArray(row.subjectSchedules) ? row.subjectSchedules.length : 0;
        return (
          <button
            type="button"
            onClick={() => openScheduleModal(row)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors shadow-sm ${
              count > 0
                ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
            }`}
            title="Click to view & manage full class subject schedule"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{count > 0 ? `${count} Subjects Scheduled` : '⚡ Set Class Schedule'}</span>
          </button>
        );
      },
    },
    {
      header: 'Status',
      render: (row) => (
        <Badge variant={row.isActive ? 'green' : 'gray'}>
          {row.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex flex-wrap gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openScheduleModal(row)}
            title="Class Subject Schedule / Timetable"
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            <Calendar className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => openExamDetails(row)} title="View details">
            <Eye className="w-4 h-4" />
          </Button>
          {isAdmin && (
            <>
              <Button variant="outline" size="sm" onClick={() => openEditModal(row)} title="Edit">
                <Pencil className="w-4 h-4" />
              </Button>
              <Button variant="danger" size="sm" onClick={() => handleDeleteExam(row.id)} title="Delete">
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
          {marksAllowed && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setMarksExamId(String(row.id));
                setActiveTab(1);
              }}
              title="Enter / view marks"
            >
              <ClipboardList className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const existingMarksColumns = [
    {
      header: 'Student',
      render: (row) => row.student?.studentName || '—',
    },
    {
      header: 'Admission No',
      render: (row) => row.student?.admissionNo || '—',
    },
    {
      header: 'Roll',
      render: (row) => row.student?.rollNo ?? '—',
    },
    {
      header: 'Subject',
      render: (row) => row.subject?.name || '—',
    },
    {
      header: 'Marks',
      render: (row) =>
        row.isAbsent
          ? 'Absent'
          : row.marksObtained != null
            ? `${row.marksObtained} / ${row.maxMarks}`
            : '—',
    },
    { header: 'Grade', accessor: 'grade' },
    { header: 'GP', accessor: 'gradePoint' },
    {
      header: 'Entered By',
      render: (row) => row.enteredBy?.name || '—',
    },
  ];

  const examsTab = (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Select
            label="Academic Year"
            value={filterAcademicYearId}
            onChange={(e) => setFilterAcademicYearId(e.target.value)}
            options={academicYears.map((year) => ({
              value: String(year.id),
              label: academicYearLabel(year),
            }))}
          />
          <Select
            label="Class"
            value={filterClassId}
            onChange={(e) => setFilterClassId(e.target.value)}
            options={classes.map((cls) => ({
              value: String(cls.id),
              label: cls.name,
            }))}
          />
          <Select
            label="Exam Type"
            value={filterExamType}
            onChange={(e) => setFilterExamType(e.target.value)}
            options={EXAM_TYPE_OPTIONS}
          />
          <div className="flex items-end gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-700 pb-2">
              <input
                type="checkbox"
                checked={includeInactive}
                onChange={(e) => setIncludeInactive(e.target.checked)}
                className="rounded border-gray-300"
              />
              Include inactive
            </label>
            <Button variant="outline" size="md" onClick={loadExams} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {pageError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {pageError}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Exam Schedule {loading ? '(Loading...)' : `(${filteredExams.length})`}</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={examColumns}
            data={filteredExams}
            className={loading ? 'opacity-80' : ''}
            noDataMessage={loading ? 'Loading exams...' : 'No exams found for the selected filters.'}
          />
        </CardContent>
      </Card>
    </div>
  );

  const marksTab = !marksAllowed ? (
    <Card>
      <CardContent className="py-8 text-center text-gray-600">
        Only admins and timetabled teachers can view or enter exam marks.
      </CardContent>
    </Card>
  ) : (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{marksEditable ? 'Marks Entry' : 'View Marks'}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Select
            label="Exam"
            required
            value={marksExamId}
            onChange={(e) => {
              setMarksExamId(e.target.value);
              setMarksMessage('');
              setMarksError('');
            }}
            options={exams.map((exam) => ({
              value: String(exam.id),
              label: `${exam.name} (${exam.class?.name || 'Class'})`,
            }))}
          />
          <Select
            label="Subject"
            required
            value={marksSubjectId}
            onChange={(e) => {
              setMarksSubjectId(e.target.value);
              setMarksMessage('');
              setMarksError('');
            }}
            options={subjects.map((subject) => ({
              value: String(subject.id),
              label: subject.code ? `${subject.name} (${subject.code})` : subject.name,
            }))}
          />
          {marksEditable && (
            <Input
              label="Max Marks"
              required
              type="number"
              min="1"
              step="0.01"
              value={maxMarks}
              onChange={(e) => setMaxMarks(e.target.value)}
            />
          )}
          {marksEditable && (
            <div className="flex items-end">
              <Button
                onClick={handleSubmitMarks}
                disabled={marksSaving || !marksExamId}
                loading={marksSaving}
              >
                Save Marks
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {marksEditable && !linkedStaffId && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Your login is not linked to a staff record. The backend requires <code>enteredById</code> from a staff profile to save marks.
        </div>
      )}

      {marksError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {marksError}
        </div>
      )}
      {marksMessage && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {marksMessage}
        </div>
      )}

      {marksEditable && selectedMarksExam && (
        <p className="text-sm text-gray-600">
          Entering marks for class <strong>{selectedMarksExam.class?.name || selectedMarksExam.classId}</strong>.
          Only students in this class are listed. Duplicate student/subject entries return HTTP 409.
        </p>
      )}

      {marksEditable && (
      <Card>
        <CardHeader>
          <CardTitle>
            Students {marksLoading ? '(Loading...)' : `(${markRows.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {markRows.length === 0 ? (
            <p className="text-sm text-gray-500 py-6 text-center">
              {marksExamId ? 'No students found for this exam class.' : 'Select an exam to load students.'}
            </p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Student</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Roll</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Absent</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Marks</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Grade (optional)</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Remark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {markRows.map((row) => (
                  <tr key={row.studentId}>
                    <td className="px-3 py-2 text-sm">
                      <div className="font-medium text-gray-900">{row.studentName}</div>
                      <div className="text-xs text-gray-500">{row.admissionNo}</div>
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-700">{row.rollNo}</td>
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={row.isAbsent}
                        onChange={(e) => updateMarkRow(row.studentId, 'isAbsent', e.target.checked)}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        disabled={row.isAbsent}
                        value={row.marksObtained}
                        onChange={(e) => updateMarkRow(row.studentId, 'marksObtained', e.target.value)}
                        className="w-24 rounded-lg border border-gray-300 px-2 py-1 text-sm disabled:bg-gray-50"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={row.grade}
                        onChange={(e) => updateMarkRow(row.studentId, 'grade', e.target.value)}
                        placeholder="Auto if blank"
                        className="w-28 rounded-lg border border-gray-300 px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={row.remark}
                        onChange={(e) => updateMarkRow(row.studentId, 'remark', e.target.value)}
                        className="w-40 rounded-lg border border-gray-300 px-2 py-1 text-sm"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recorded Marks</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={existingMarksColumns}
            data={existingMarks}
            noDataMessage={marksExamId ? 'No marks recorded yet for this exam/subject.' : 'Select an exam to view marks.'}
          />
        </CardContent>
      </Card>
    </div>
  );

  const reportTab = !reportAllowed ? (
    <Card>
      <CardContent className="py-8 text-center text-gray-600">
        Only admins and teachers can view student report cards.
      </CardContent>
    </Card>
  ) : (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Student Report Card</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Input
              label="Search Student"
              required
              value={reportStudentQuery}
              onChange={(e) => searchReportStudents(e.target.value)}
              placeholder="Name or admission number"
            />
            {reportStudentOptions.length > 0 && (
              <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-gray-200 bg-white">
                {reportStudentOptions.map((student) => (
                  <button
                    key={student.id}
                    type="button"
                    className={`block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                      String(reportStudentId) === String(student.id) ? 'bg-primary-50 text-primary-700' : 'text-gray-700'
                    }`}
                    onClick={() => {
                      setReportStudentId(String(student.id));
                      setReportStudentQuery(
                        `${student.studentName || student.name || 'Student'} (${student.admissionNo || student.id})`
                      );
                      setReportStudentOptions([]);
                    }}
                  >
                    {student.studentName || student.name} — {student.admissionNo || student.id}
                    {student.class?.name ? ` · ${student.class.name}` : ''}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Select
            label="Academic Year"
            value={reportAcademicYearId}
            onChange={(e) => setReportAcademicYearId(e.target.value)}
            options={academicYears.map((year) => ({
              value: String(year.id),
              label: academicYearLabel(year),
            }))}
          />
          <div className="flex items-end">
            <Button onClick={handleLoadReport} disabled={reportLoading} loading={reportLoading}>
              <Search className="w-4 h-4 mr-2" />
              Load Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {reportError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {reportError}
        </div>
      )}

      {reportData && (
        <Card>
          <CardHeader>
            <CardTitle>
              {reportData.student?.name || 'Student'} — {reportData.student?.class || ''}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 text-sm text-gray-700 md:grid-cols-3">
              <p>
                <span className="text-gray-500">Admission No:</span> {reportData.student?.admissionNo || '—'}
              </p>
              <p>
                <span className="text-gray-500">Roll No:</span> {reportData.student?.rollNo ?? '—'}
              </p>
              <p>
                <span className="text-gray-500">Academic Year ID:</span> {reportData.academicYearId}
              </p>
            </div>

            {(reportData.exams || []).length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">No exam marks found for this student/year.</p>
            ) : (
              (reportData.exams || []).map((examBlock) => (
                <div key={examBlock.examId} className="rounded-xl border border-gray-200 p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{examBlock.examName}</h3>
                      <p className="text-sm text-gray-500">
                        {examTypeLabel(examBlock.examType)} · {formatIndianDate(examBlock.startDate)} –{' '}
                        {formatIndianDate(examBlock.endDate)}
                      </p>
                    </div>
                    <StatusBadge status="completed">{examTypeLabel(examBlock.examType)}</StatusBadge>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Subject</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Marks</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Grade</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">GP</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Remark</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Entered By</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {(examBlock.subjects || []).map((subject) => (
                          <tr key={subject.markId}>
                            <td className="px-3 py-2">
                              {subject.subjectName}
                              {subject.subjectCode ? ` (${subject.subjectCode})` : ''}
                            </td>
                            <td className="px-3 py-2">
                              {subject.isAbsent
                                ? 'Absent'
                                : subject.marksObtained != null
                                  ? `${subject.marksObtained} / ${subject.maxMarks}`
                                  : '—'}
                            </td>
                            <td className="px-3 py-2">{subject.grade || '—'}</td>
                            <td className="px-3 py-2">{subject.gradePoint ?? '—'}</td>
                            <td className="px-3 py-2">{subject.remark || '—'}</td>
                            <td className="px-3 py-2">{subject.enteredBy || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );

  const tabs = [
    { label: 'Exams', content: examsTab },
    { label: 'Marks', content: marksTab },
    { label: 'Report Card', content: reportTab },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Exams</h1>
          <p className="text-gray-600 mt-1">
            Manage examination schedules, enter marks, and view student report cards.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            placeholder="Search exams..."
            className="min-w-[260px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {isAdmin && (
            <Button variant="primary" size="md" onClick={openAddModal}>
              <Plus className="w-4 h-4 mr-2" /> Add Exam
            </Button>
          )}
        </div>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        title={isEditing ? 'Edit Exam' : 'Add Exam'}
        size="lg"
      >
        <ModalBody>
          <form className="grid gap-4" onSubmit={handleSaveExam}>
            <Select
              label="Academic Year"
              required
              disabled={isEditing}
              value={form.academicYearId}
              onChange={(e) => setForm({ ...form, academicYearId: e.target.value })}
              options={academicYears.map((year) => ({
                value: String(year.id),
                label: academicYearLabel(year),
              }))}
            />
            <Input
              label="Exam Name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Term 1 Final Exam"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Exam Type"
                required
                value={form.examType}
                onChange={(e) => setForm({ ...form, examType: e.target.value })}
                options={EXAM_TYPE_OPTIONS}
              />
              <Select
                label="Class"
                required
                disabled={isEditing}
                value={form.classId}
                onChange={(e) => setForm({ ...form, classId: e.target.value })}
                options={classes.map((cls) => ({
                  value: String(cls.id),
                  label: cls.name,
                }))}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Start Date"
                required
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
              <Input
                label="End Date"
                required
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
            {isEditing && (
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={!!form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="rounded border-gray-300"
                />
                Active
              </label>
            )}
          </form>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSaveExam} disabled={saving} loading={saving}>
            {isEditing ? 'Update Exam' : 'Create Exam'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Details Modal */}
      <Modal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        title="Exam Details"
        size="lg"
      >
        <ModalBody>
          {detailLoading && <p className="text-sm text-gray-500">Loading details...</p>}
          {!detailLoading && detailData && (
            <>
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2 text-sm">
                <p>
                  <span className="text-gray-500">Name:</span>{' '}
                  <span className="font-medium text-gray-900">{detailData.exam?.name}</span>
                </p>
                <p>
                  <span className="text-gray-500">Type:</span>{' '}
                  {examTypeLabel(detailData.exam?.examType)}
                </p>
                <p>
                  <span className="text-gray-500">Class:</span>{' '}
                  {detailData.exam?.class?.name || '—'}
                </p>
                <p>
                  <span className="text-gray-500">Academic Year:</span>{' '}
                  {detailData.exam?.academicYear?.name || '—'}
                </p>
                <p>
                  <span className="text-gray-500">Start:</span>{' '}
                  {formatIndianDate(detailData.exam?.startDate)}
                </p>
                <p>
                  <span className="text-gray-500">End:</span>{' '}
                  {formatIndianDate(detailData.exam?.endDate)}
                </p>
                <p>
                  <span className="text-gray-500">Status:</span>{' '}
                  <Badge variant={detailData.exam?.isActive ? 'green' : 'gray'}>
                    {detailData.exam?.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 grid gap-3 md:grid-cols-3">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Total Students</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {detailData.summary?.totalStudents ?? 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Marked Students</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {detailData.summary?.markedStudents ?? 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Completion</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {detailData.summary?.completionPercentage || '0%'}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Subject-wise Schedule Section ── */}
            <div className="mt-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    Subject-wise Exam Schedule
                  </h3>
                  {subjectSchedules.length > 0 && (
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                      {subjectSchedules.length} / {subjects.length} subjects scheduled
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={populateAllClassSubjects}
                        className="text-xs text-blue-700 bg-blue-50 hover:bg-blue-100"
                        title="Load all available subjects for this class"
                      >
                        <Sparkles className="w-3.5 h-3.5 mr-1" />
                        Load All Class Subjects
                      </Button>
                      <Button variant="outline" size="sm" onClick={addScheduleRow} className="text-xs">
                        <Plus className="w-3 h-3 mr-1" /> Add Subject
                      </Button>
                    </>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDetailOpen(false);
                      openScheduleModal(detailData.exam);
                    }}
                    className="text-xs text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                  >
                    Open Full Manager ↗
                  </Button>
                </div>
              </div>

              {scheduleErr && (
                <div className="mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{scheduleErr}</div>
              )}
              {scheduleMsg && (
                <div className="mb-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">{scheduleMsg}</div>
              )}

              {scheduleRows.length === 0 && subjectSchedules.length === 0 ? (
                <p className="text-xs text-gray-400 py-2 text-center">
                  {isAdmin ? 'No schedule set. Click "Add Subject" to add subject-wise exam dates.' : 'No subject schedule set yet.'}
                </p>
              ) : (
                <div className="overflow-auto rounded-lg border border-gray-200 max-h-[360px]">
                  <table className="min-w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-gray-500 uppercase">Subject</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-500 uppercase">Exam Date</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-500 uppercase">Start Time</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-500 uppercase">End Time</th>
                        {isAdmin && <th className="px-3 py-2 text-left font-semibold text-gray-500 uppercase">Action</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {isAdmin
                        ? scheduleRows.map((row, idx) => (
                            <tr key={idx}>
                              <td className="px-3 py-2">
                                <select
                                  value={row.subjectId}
                                  onChange={(e) => updateScheduleRow(idx, 'subjectId', e.target.value)}
                                  className="w-full rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                                >
                                  <option value="">-- Select Subject --</option>
                                  {subjects.map((s) => (
                                    <option key={s.id} value={String(s.id)}>
                                      {s.name}{s.code ? ` (${s.code})` : ''}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="date"
                                  value={row.examDate}
                                  min={toDateOnly(detailData?.exam?.startDate)}
                                  max={toDateOnly(detailData?.exam?.endDate)}
                                  onChange={(e) => updateScheduleRow(idx, 'examDate', e.target.value)}
                                  className="w-full rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="time"
                                  value={row.startTime}
                                  onChange={(e) => updateScheduleRow(idx, 'startTime', e.target.value)}
                                  className="w-full rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="time"
                                  value={row.endTime}
                                  onChange={(e) => updateScheduleRow(idx, 'endTime', e.target.value)}
                                  className="w-full rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <div className="flex gap-1">
                                  {row.subjectId && subjectSchedules.some((s) => String(s.subject?.id || s.subjectId) === String(row.subjectId)) && (
                                    <button
                                      onClick={() => handleDeleteScheduleEntry(parseInt(row.subjectId, 10))}
                                      className="text-red-500 hover:text-red-700 p-1"
                                      title="Remove from schedule"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => removeScheduleRow(idx)}
                                    className="text-gray-400 hover:text-gray-600 p-1"
                                    title="Remove row"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        : subjectSchedules.map((s) => (
                            <tr key={s.id}>
                              <td className="px-3 py-2 font-medium text-gray-900">
                                {s.subject?.name || '—'}
                                {s.subject?.code ? <span className="ml-1 text-gray-400">({s.subject.code})</span> : null}
                              </td>
                              <td className="px-3 py-2 text-gray-700">{formatIndianDate(s.examDate)}</td>
                              <td className="px-3 py-2 text-gray-600">{s.startTime || '—'}</td>
                              <td className="px-3 py-2 text-gray-600">{s.endTime || '—'}</td>
                            </tr>
                          ))}
                    </tbody>
                  </table>
                </div>
              )}

              {isAdmin && scheduleRows.length > 0 && (
                <div className="mt-3 flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setScheduleRows(
                        subjectSchedules.map((s) => ({
                          subjectId: String(s.subject?.id || s.subjectId),
                          examDate: toDateOnly(s.examDate),
                          startTime: s.startTime || '',
                          endTime: s.endTime || '',
                        }))
                      );
                      setScheduleMsg('');
                      setScheduleErr('');
                    }}
                    disabled={scheduleSaving}
                  >
                    Reset
                  </Button>
                  <Button size="sm" onClick={handleSaveSchedule} disabled={scheduleSaving} loading={scheduleSaving}>
                    Save Schedule
                  </Button>
                </div>
              )}
            </div>
            </>
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant="outline" onClick={() => setDetailOpen(false)}>
            Close
          </Button>
          {marksAllowed && detailData?.exam?.id && (
            <Button
              onClick={() => {
                setMarksExamId(String(detailData.exam.id));
                setActiveTab(1);
                setDetailOpen(false);
              }}
            >
              Go to Marks
            </Button>
          )}
        </ModalFooter>
      </Modal>

      {/* ════════════════════════════════════════════════════════════
          DEDICATED SUBJECT-WISE SCHEDULE & DATE SHEET MODAL
      ════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        title={
          scheduleActiveExam
            ? `📅 Subject Schedule — ${scheduleActiveExam.name} (${scheduleActiveExam.class?.name || 'Class'})`
            : 'Subject Schedule'
        }
        size="xl"
      >
        <ModalBody>
          {scheduleLoading && (
            <div className="flex items-center justify-center py-12 text-sm text-gray-500">
              <RefreshCw className="w-5 h-5 animate-spin mr-2 text-blue-600" />
              Loading exam subject schedule...
            </div>
          )}

          {!scheduleLoading && scheduleActiveExam && (
            <div className="space-y-4">
              {/* Header Info Banner */}
              <div className="rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50/70 to-indigo-50/50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 text-base">
                        {scheduleActiveExam.name}
                      </span>
                      <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                        Class: {scheduleActiveExam.class?.name || '—'}
                      </span>
                      <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
                        {examTypeLabel(scheduleActiveExam.examType)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 flex items-center gap-2">
                      <span>
                        🗓️ Window: <strong>{formatIndianDate(scheduleActiveExam.startDate)}</strong> to{' '}
                        <strong>{formatIndianDate(scheduleActiveExam.endDate)}</strong>
                      </span>
                      <span>•</span>
                      <span>Academic Year: {scheduleActiveExam.academicYear?.name || '—'}</span>
                    </p>
                  </div>

                  {/* Summary Metric Badges */}
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-white px-3 py-1.5 shadow-sm border border-gray-200 text-center">
                      <p className="text-[10px] uppercase font-bold text-gray-400">Class Subjects</p>
                      <p className="text-sm font-bold text-gray-800">{subjects.length}</p>
                    </div>
                    <div className="rounded-lg bg-green-50 px-3 py-1.5 shadow-sm border border-green-200 text-center">
                      <p className="text-[10px] uppercase font-bold text-green-700">Scheduled</p>
                      <p className="text-sm font-bold text-green-800">{subjectSchedules.length}</p>
                    </div>
                    <div className="rounded-lg bg-amber-50 px-3 py-1.5 shadow-sm border border-amber-200 text-center">
                      <p className="text-[10px] uppercase font-bold text-amber-700">Pending</p>
                      <p className="text-sm font-bold text-amber-800">
                        {Math.max(0, subjects.length - subjectSchedules.length)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* View Switcher & Action Toolbar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-b border-gray-200 pb-2">
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setScheduleTab('manage')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                      scheduleTab === 'manage'
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    ⚙️ Manage Schedule (Editor)
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleTab('datesheet')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                      scheduleTab === 'datesheet'
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    📋 View Full Date Sheet ({subjectSchedules.length})
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {scheduleTab === 'manage' && isAdmin && (
                    <>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={populateAllClassSubjects}
                        title="Auto-fill full list of subjects for this class"
                        className="text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200"
                      >
                        <Sparkles className="w-3.5 h-3.5 mr-1 text-blue-600" />
                        Load All Class Subjects ({subjects.length})
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addScheduleRow}
                        className="text-xs"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Add Row
                      </Button>
                    </>
                  )}
                  {scheduleTab === 'datesheet' && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => window.print()}
                      className="text-xs"
                    >
                      <Printer className="w-3.5 h-3.5 mr-1" />
                      Print Date Sheet
                    </Button>
                  )}
                </div>
              </div>

              {/* Status alerts */}
              {scheduleErr && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{scheduleErr}</span>
                </div>
              )}
              {scheduleMsg && (
                <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{scheduleMsg}</span>
                </div>
              )}

              {/* TAB 1: MANAGE SCHEDULE (EDITOR) */}
              {scheduleTab === 'manage' && (
                <div className="space-y-3">
                  {/* Quick Search inside subject list */}
                  {scheduleRows.length > 5 && (
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search subjects in list..."
                        value={scheduleSearch}
                        onChange={(e) => setScheduleSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-400"
                      />
                    </div>
                  )}

                  <div className="overflow-auto rounded-lg border border-gray-200 max-h-[420px]">
                    <table className="min-w-full text-xs">
                      <thead className="bg-gray-50 sticky top-0 z-10 border-b border-gray-200">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold text-gray-600 uppercase">#</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-600 uppercase">Subject</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-600 uppercase">Exam Date</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-600 uppercase">Start Time</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-600 uppercase">End Time</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-600 uppercase">Status</th>
                          {isAdmin && (
                            <th className="px-3 py-2 text-center font-semibold text-gray-600 uppercase">Action</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {scheduleRows.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-3 py-8 text-center text-gray-400">
                              No subjects listed yet. Click{' '}
                              <strong className="text-blue-600 cursor-pointer" onClick={populateAllClassSubjects}>
                                "Load All Class Subjects"
                              </strong>{' '}
                              to view all subjects of this class.
                            </td>
                          </tr>
                        ) : (
                          scheduleRows
                            .map((row, idx) => ({ row, idx }))
                            .filter(({ row }) => {
                              if (!scheduleSearch.trim()) return true;
                              const q = scheduleSearch.toLowerCase();
                              return (
                                (row.subjectName && row.subjectName.toLowerCase().includes(q)) ||
                                (row.subjectCode && row.subjectCode.toLowerCase().includes(q))
                              );
                            })
                            .map(({ row, idx }, displayIdx) => {
                              const isDateOutside =
                                row.examDate &&
                                ((scheduleActiveExam.startDate &&
                                  row.examDate < toDateOnly(scheduleActiveExam.startDate)) ||
                                  (scheduleActiveExam.endDate &&
                                    row.examDate > toDateOnly(scheduleActiveExam.endDate)));

                              return (
                                <tr
                                  key={idx}
                                  className={`hover:bg-gray-50/80 transition-colors ${
                                    row.examDate ? 'bg-blue-50/20' : ''
                                  }`}
                                >
                                  <td className="px-3 py-2 text-gray-400 font-medium">{displayIdx + 1}</td>
                                  <td className="px-3 py-2 min-w-[200px]">
                                    {isAdmin ? (
                                      <select
                                        value={row.subjectId}
                                        onChange={(e) => updateScheduleRow(idx, 'subjectId', e.target.value)}
                                        className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs font-medium text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
                                      >
                                        <option value="">-- Choose Subject --</option>
                                        {subjects.map((s) => (
                                          <option key={s.id} value={String(s.id)}>
                                            {s.name} {s.code ? `(${s.code})` : ''}
                                          </option>
                                        ))}
                                      </select>
                                    ) : (
                                      <span className="font-medium text-gray-900">
                                        {row.subjectName || '—'}{' '}
                                        {row.subjectCode ? (
                                          <span className="text-gray-400 font-normal">({row.subjectCode})</span>
                                        ) : null}
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 min-w-[170px]">
                                    {isAdmin ? (
                                      <div>
                                        <input
                                          type="date"
                                          value={row.examDate}
                                          min={toDateOnly(scheduleActiveExam.startDate)}
                                          max={toDateOnly(scheduleActiveExam.endDate)}
                                          onChange={(e) => updateScheduleRow(idx, 'examDate', e.target.value)}
                                          className={`w-full rounded border px-2 py-1 text-xs focus:outline-none focus:ring-1 ${
                                            isDateOutside
                                              ? 'border-red-400 bg-red-50 focus:ring-red-400'
                                              : 'border-gray-300 focus:ring-blue-400'
                                          }`}
                                        />
                                        {row.examDate && (
                                          <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="text-[10px] text-blue-600 font-medium">
                                              {formatWeekday(row.examDate)}
                                            </span>
                                            {isDateOutside && (
                                              <span className="text-[10px] text-red-600 font-medium">
                                                (Outside exam window!)
                                              </span>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div>
                                        <span className="text-gray-800 font-medium">
                                          {formatIndianDate(row.examDate)}
                                        </span>
                                        {row.examDate && (
                                          <span className="ml-1.5 text-[10px] text-gray-500">
                                            ({formatWeekday(row.examDate)})
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-3 py-2">
                                    {isAdmin ? (
                                      <input
                                        type="time"
                                        value={row.startTime}
                                        onChange={(e) => updateScheduleRow(idx, 'startTime', e.target.value)}
                                        className="w-full rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                                      />
                                    ) : (
                                      <span className="text-gray-700">{formatTimeDisplay(row.startTime)}</span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2">
                                    {isAdmin ? (
                                      <input
                                        type="time"
                                        value={row.endTime}
                                        onChange={(e) => updateScheduleRow(idx, 'endTime', e.target.value)}
                                        className="w-full rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                                      />
                                    ) : (
                                      <span className="text-gray-700">{formatTimeDisplay(row.endTime)}</span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2">
                                    {row.examDate ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-800">
                                        <CheckCircle2 className="w-3 h-3 text-green-600" />
                                        Scheduled
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-500">
                                        Pending
                                      </span>
                                    )}
                                  </td>
                                  {isAdmin && (
                                    <td className="px-3 py-2 text-center">
                                      <div className="flex items-center justify-center gap-1">
                                        {row.subjectId &&
                                          subjectSchedules.some(
                                            (s) => String(s.subject?.id || s.subjectId) === String(row.subjectId)
                                          ) && (
                                            <button
                                              type="button"
                                              onClick={() => handleDeleteScheduleEntry(parseInt(row.subjectId, 10))}
                                              className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                                              title="Delete saved schedule for this subject"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          )}
                                        <button
                                          type="button"
                                          onClick={() => removeScheduleRow(idx)}
                                          className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
                                          title="Remove row from view"
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    </td>
                                  )}
                                </tr>
                              );
                            })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {isAdmin && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        Tip: Click <strong>"Save Schedule"</strong> to store all configured subject dates.
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setScheduleRows(
                              subjectSchedules.map((s) => ({
                                subjectId: String(s.subject?.id || s.subjectId),
                                subjectName: s.subject?.name || '—',
                                subjectCode: s.subject?.code || '',
                                examDate: toDateOnly(s.examDate),
                                startTime: s.startTime || '',
                                endTime: s.endTime || '',
                                isSaved: true,
                              }))
                            );
                            setScheduleMsg('');
                            setScheduleErr('');
                          }}
                          disabled={scheduleSaving}
                        >
                          Reset
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={handleSaveSchedule}
                          disabled={scheduleSaving}
                          loading={scheduleSaving}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Save Schedule
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: FULL DATE SHEET / TIMETABLE ROUTINE VIEW */}
              {scheduleTab === 'datesheet' && (
                <div className="space-y-4">
                  {subjectSchedules.length === 0 ? (
                    <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                      <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-600">No subjects scheduled yet for this exam.</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Switch to <strong>Manage Schedule</strong> tab to add dates for each class subject.
                      </p>
                      {isAdmin && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setScheduleTab('manage')}
                          className="mt-3 text-xs"
                        >
                          Go to Schedule Editor
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-4 py-3 text-white flex items-center justify-between">
                          <div>
                            <h4 className="font-bold text-sm tracking-wide uppercase">Official Examination Date Sheet</h4>
                            <p className="text-xs text-blue-100">
                              {scheduleActiveExam.name} • Class: {scheduleActiveExam.class?.name || '—'}
                            </p>
                          </div>
                          <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full font-medium">
                            {subjectSchedules.length} Papers Scheduled
                          </span>
                        </div>

                        <div className="divide-y divide-gray-100 bg-white max-h-[420px] overflow-y-auto print:max-h-none print:overflow-visible">
                          {subjectSchedules.map((item, idx) => (
                            <div
                              key={item.id || idx}
                              className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-blue-50/30 transition-colors"
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex flex-col items-center justify-center text-blue-700 flex-shrink-0">
                                  <span className="text-[10px] font-bold uppercase leading-none">
                                    {formatShortWeekday(item.examDate)}
                                  </span>
                                  <span className="text-base font-extrabold leading-tight">
                                    {item.examDate ? new Date(`${toDateOnly(item.examDate)}T00:00:00`).getDate() : '—'}
                                  </span>
                                </div>
                                <div>
                                  <h5 className="font-semibold text-gray-900 text-sm">
                                    {item.subject?.name || 'Subject'}
                                  </h5>
                                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-500">
                                    {item.subject?.code && (
                                      <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-mono text-[10px]">
                                        Code: {item.subject.code}
                                      </span>
                                    )}
                                    <span>•</span>
                                    <span className="font-medium text-gray-700">
                                      {formatIndianDate(item.examDate)} ({formatFullWeekday(item.examDate)})
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 sm:text-right">
                                <div className="text-xs">
                                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">Timing</span>
                                  <span className="font-medium text-gray-800">
                                    {item.startTime ? formatTimeDisplay(item.startTime) : '—'}
                                    {item.endTime ? ` - ${formatTimeDisplay(item.endTime)}` : ''}
                                  </span>
                                </div>
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                                  Confirmed
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant="outline" onClick={() => setScheduleModalOpen(false)}>
            Close
          </Button>
          {marksAllowed && scheduleActiveExam?.id && (
            <Button
              onClick={() => {
                setMarksExamId(String(scheduleActiveExam.id));
                setActiveTab(1);
                setScheduleModalOpen(false);
              }}
            >
              Go to Marks
            </Button>
          )}
        </ModalFooter>
      </Modal>
    </div>
  );
}
