import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  ClipboardList,
  RefreshCw,
  Search,
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
    try {
      const response = await getExamById(exam.id, { includeInactive: !exam.isActive });
      setDetailData(response?.data || null);
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
    loadStudentsForMarks(selectedMarksExam.classId);
    loadExistingMarks(marksExamId, marksSubjectId || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marksExamId, selectedMarksExam?.classId]);

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

  /* ---------- Columns ---------- */

  const examColumns = [
    { header: 'Exam', accessor: 'name' },
    {
      header: 'Type',
      render: (row) => examTypeLabel(row.examType),
    },
    {
      header: 'Class',
      render: (row) => row.class?.name || '—',
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
        <div className="flex flex-wrap gap-2">
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
          <CardTitle>Marks Entry</CardTitle>
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
          <Input
            label="Max Marks"
            required
            type="number"
            min="1"
            step="0.01"
            value={maxMarks}
            onChange={(e) => setMaxMarks(e.target.value)}
          />
          <div className="flex items-end">
            <Button
              onClick={handleSubmitMarks}
              disabled={marksSaving || !marksExamId}
              loading={marksSaving}
            >
              Save Marks
            </Button>
          </div>
        </CardContent>
      </Card>

      {!linkedStaffId && (
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

      {selectedMarksExam && (
        <p className="text-sm text-gray-600">
          Entering marks for class <strong>{selectedMarksExam.class?.name || selectedMarksExam.classId}</strong>.
          Only students in this class are listed. Duplicate student/subject entries return HTTP 409.
        </p>
      )}

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
    </div>
  );
}
