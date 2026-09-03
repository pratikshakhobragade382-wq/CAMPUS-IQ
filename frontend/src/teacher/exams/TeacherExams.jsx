import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import TeacherTopbar from '../components/TeacherTopbar';
import { getExams, getExamMarks, bulkEnterMarks, getStudentReportCard } from '../../api/exam.api';
import { getClasses } from '../../api/class.api';
import { getSubjects } from '../../api/subject.api';
import { getStudents } from '../../api/student.api';
import './TeacherExams.css';

export default function TeacherExams() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('marks'); // default to 'marks' or 'schedules'

  // Master Data
  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [alertMsg, setAlertMsg] = useState(null);

  // Marks Entry Form State
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [maxMarks, setMaxMarks] = useState(100);
  const [marksRecords, setMarksRecords] = useState([]);
  const [savingMarks, setSavingMarks] = useState(false);

  // Report Card State
  const [reportClassId, setReportClassId] = useState('');
  const [reportSectionId, setReportSectionId] = useState('');
  const [reportStudentId, setReportStudentId] = useState('');
  const [studentListForReport, setStudentListForReport] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  // Load All Master Data on mount
  const loadMasterData = async () => {
    try {
      const [examsRes, classesRes, subjectsRes] = await Promise.all([
        getExams().catch(() => ({ data: [] })),
        getClasses().catch(() => ({ data: [] })),
        getSubjects().catch(() => ({ data: [] })),
      ]);

      const eList = Array.isArray(examsRes?.data) ? examsRes.data : Array.isArray(examsRes) ? examsRes : [];
      const cList = Array.isArray(classesRes?.data) ? classesRes.data : Array.isArray(classesRes) ? classesRes : [];
      const sList = Array.isArray(subjectsRes?.data) ? subjectsRes.data : Array.isArray(subjectsRes) ? subjectsRes : [];

      setExams(eList);
      setClasses(cList);
      setSubjects(sList);
    } catch (err) {
      console.error('Failed to load exam master data:', err);
    }
  };

  useEffect(() => {
    loadMasterData();
  }, []);

  // Available sections for the selected class in marks entry
  const marksClassSections = useMemo(() => {
    if (!selectedClassId) return [];
    const cls = classes.find((c) => Number(c.id) === Number(selectedClassId));
    return cls?.sections || [];
  }, [classes, selectedClassId]);

  // Available sections for the selected class in report card
  const reportClassSections = useMemo(() => {
    if (!reportClassId) return [];
    const cls = classes.find((c) => Number(c.id) === Number(reportClassId));
    return cls?.sections || [];
  }, [classes, reportClassId]);

  // Auto-fill class if an exam is selected
  const handleExamChange = (examId) => {
    setSelectedExamId(examId);
    if (examId) {
      const ex = exams.find((e) => Number(e.id) === Number(examId));
      if (ex && ex.classId) {
        setSelectedClassId(String(ex.classId));
        setSelectedSectionId('');
      }
    }
  };

  // When class/section changes in Report Card tab, load students
  useEffect(() => {
    if (!reportClassId) {
      setStudentListForReport([]);
      return;
    }
    async function loadStudents() {
      try {
        const params = { classId: Number(reportClassId), limit: 200 };
        if (reportSectionId) params.sectionId = Number(reportSectionId);

        const res = await getStudents(params);
        const list = res?.data?.students || res?.data || (Array.isArray(res) ? res : []);
        setStudentListForReport(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error('Failed to load students for report card:', err);
      }
    }
    loadStudents();
  }, [reportClassId, reportSectionId]);

  // Load students & existing marks for selected Exam + Subject + Class
  const handleLoadMarksTable = async () => {
    if (!selectedExamId) {
      setAlertMsg({ type: 'error', text: 'Please select an Examination.' });
      return;
    }
    if (!selectedClassId) {
      setAlertMsg({ type: 'error', text: 'Please select a Class.' });
      return;
    }
    if (!selectedSubjectId) {
      setAlertMsg({ type: 'error', text: 'Please select a Subject.' });
      return;
    }

    setLoading(true);
    setAlertMsg(null);
    try {
      const studentParams = { classId: Number(selectedClassId), limit: 200 };
      if (selectedSectionId) studentParams.sectionId = Number(selectedSectionId);

      const [studentsRes, existingMarksRes] = await Promise.all([
        getStudents(studentParams),
        getExamMarks(selectedExamId, { subjectId: Number(selectedSubjectId) }).catch(() => ({ data: [] })),
      ]);

      const rawStudents = studentsRes?.data?.students || studentsRes?.data || (Array.isArray(studentsRes) ? studentsRes : []);
      const students = Array.isArray(rawStudents) ? rawStudents : [];
      const existingMarks = Array.isArray(existingMarksRes?.data) ? existingMarksRes.data : Array.isArray(existingMarksRes) ? existingMarksRes : [];

      if (students.length === 0) {
        setAlertMsg({ type: 'error', text: 'No students found enrolled in this class/section.' });
        setMarksRecords([]);
        return;
      }

      const rows = students.map((stu) => {
        const existing = existingMarks.find((m) => Number(m.studentId) === Number(stu.id));
        return {
          studentId: stu.id,
          name: stu.studentName || stu.name,
          admissionNo: stu.admissionNo || '—',
          rollNo: stu.rollNo || '—',
          marksObtained: existing?.marksObtained !== undefined && existing?.marksObtained !== null ? existing.marksObtained : '',
          isAbsent: existing?.isAbsent || false,
          grade: existing?.grade || '',
          remark: existing?.remark || '',
        };
      });

      setMarksRecords(rows);
    } catch (err) {
      console.error('Failed to load marks sheet:', err);
      setAlertMsg({ type: 'error', text: 'Failed to load students for marks entry.' });
    } finally {
      setLoading(false);
    }
  };

  // Update record fields
  const handleRecordChange = (index, field, value) => {
    setMarksRecords((prev) => {
      const copy = [...prev];
      const record = { ...copy[index], [field]: value };

      if (field === 'marksObtained') {
        const num = parseFloat(value);
        if (!isNaN(num) && maxMarks > 0) {
          const pct = (num / maxMarks) * 100;
          if (pct >= 90) record.grade = 'A1';
          else if (pct >= 80) record.grade = 'A2';
          else if (pct >= 70) record.grade = 'B1';
          else if (pct >= 60) record.grade = 'B2';
          else if (pct >= 50) record.grade = 'C1';
          else if (pct >= 33) record.grade = 'D';
          else record.grade = 'E';
        }
      }

      if (field === 'isAbsent' && value === true) {
        record.marksObtained = '';
        record.grade = 'AB';
      }

      copy[index] = record;
      return copy;
    });
  };

  // Save marks to backend
  const handleSaveMarks = async () => {
    if (!selectedExamId || !selectedSubjectId || marksRecords.length === 0) return;

    // Check for students missing marks who are not marked absent
    const missingStudent = marksRecords.find(
      (r) => !r.isAbsent && (r.marksObtained === '' || r.marksObtained === null || isNaN(Number(r.marksObtained)))
    );
    if (missingStudent) {
      setAlertMsg({
        type: 'error',
        text: `Please enter marks (0 - ${maxMarks}) or tick 'Absent' for ${missingStudent.name}.`,
      });
      return;
    }

    // Check for marks exceeding maxMarks or negative
    const invalidMarkStudent = marksRecords.find(
      (r) => !r.isAbsent && (Number(r.marksObtained) < 0 || Number(r.marksObtained) > Number(maxMarks))
    );
    if (invalidMarkStudent) {
      setAlertMsg({
        type: 'error',
        text: `Marks for ${invalidMarkStudent.name} must be between 0 and ${maxMarks}.`,
      });
      return;
    }

    setSavingMarks(true);
    setAlertMsg(null);
    try {
      const recordsToSubmit = marksRecords.map((r) => ({
        studentId: r.studentId,
        marksObtained: r.isAbsent || r.marksObtained === '' ? null : Number(r.marksObtained),
        isAbsent: Boolean(r.isAbsent),
        grade: r.grade || undefined,
        remark: r.remark || undefined,
      }));

      await bulkEnterMarks(selectedExamId, {
        subjectId: Number(selectedSubjectId),
        maxMarks: Number(maxMarks),
        records: recordsToSubmit,
      });

      setAlertMsg({ type: 'success', text: 'Marks successfully saved and synced to database!' });
    } catch (err) {
      console.error('Failed to save marks:', err);
      setAlertMsg({ type: 'error', text: err?.response?.data?.message || err?.response?.data?.error || 'Failed to save marks.' });
    } finally {
      setSavingMarks(false);
    }
  };

  // Fetch report card
  const handleFetchReportCard = async () => {
    if (!reportStudentId) return;
    setReportLoading(true);
    setReportData(null);
    try {
      const res = await getStudentReportCard(reportStudentId);
      setReportData(res?.data || res);
    } catch (err) {
      console.error('Report card error:', err);
      setAlertMsg({ type: 'error', text: 'Unable to fetch report card for selected student.' });
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <div className="teacher-exams-page">
      <TeacherTopbar
        searchPlaceholder="Search exams, marks, students..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <div className="exams-content-container">
        <div className="exams-header-section">
          <div className="exams-title-area">
            <h1>Examinations & Assessment</h1>
            <p>Schedule exams, enter subject marks, and view complete student performance reports</p>
          </div>
        </div>

      {alertMsg && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '10px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: alertMsg.type === 'success' ? '#dcfce7' : '#fee2e2',
            color: alertMsg.type === 'success' ? '#15803d' : '#b91c1c',
            border: `1px solid ${alertMsg.type === 'success' ? '#86efac' : '#fca5a5'}`,
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          <i className={alertMsg.type === 'success' ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-exclamation'}></i>
          <span>{alertMsg.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="exam-tabs-nav">
        <button
          type="button"
          className={`exam-nav-tab ${activeTab === 'marks' ? 'active' : ''}`}
          onClick={() => setActiveTab('marks')}
        >
          <i className="fa-solid fa-pen-to-square"></i>
          Enter / Edit Marks
        </button>

        <button
          type="button"
          className={`exam-nav-tab ${activeTab === 'schedules' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedules')}
        >
          <i className="fa-solid fa-calendar-check"></i>
          Exam Schedules ({exams.length})
        </button>

        <button
          type="button"
          className={`exam-nav-tab ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          <i className="fa-solid fa-file-invoice"></i>
          Student Report Cards
        </button>
      </div>

      {/* TAB 1: MARKS ENTRY */}
      {activeTab === 'marks' && (
        <div>
          <div className="exam-filter-card">
            <div className="filter-grid-row" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
              {/* Exam Dropdown */}
              <div className="filter-field">
                <label>Select Exam *</label>
                <select
                  value={selectedExamId}
                  onChange={(e) => handleExamChange(e.target.value)}
                >
                  <option value="">-- Choose Exam ({exams.length}) --</option>
                  {exams.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Class Dropdown */}
              <div className="filter-field">
                <label>Select Class *</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => {
                    setSelectedClassId(e.target.value);
                    setSelectedSectionId('');
                  }}
                >
                  <option value="">-- Choose Class ({classes.length}) --</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Section Dropdown */}
              <div className="filter-field">
                <label>Section (Optional)</label>
                <select
                  value={selectedSectionId}
                  onChange={(e) => setSelectedSectionId(e.target.value)}
                  disabled={!selectedClassId || marksClassSections.length === 0}
                >
                  <option value="">-- All Sections --</option>
                  {marksClassSections.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      Section {sec.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject Dropdown */}
              <div className="filter-field">
                <label>Select Subject *</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                >
                  <option value="">-- Choose Subject ({subjects.length}) --</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code || 'Sub'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Max Marks */}
              <div className="filter-field" style={{ maxWidth: 120 }}>
                <label>Max Marks</label>
                <input
                  type="number"
                  value={maxMarks}
                  onChange={(e) => setMaxMarks(Number(e.target.value))}
                  min={1}
                />
              </div>

              {/* Fetch Button */}
              <div className="filter-field">
                <button
                  type="button"
                  className="btn-enter-marks"
                  style={{ width: '100%', height: 42 }}
                  onClick={handleLoadMarksTable}
                  disabled={loading}
                >
                  <i className="fa-solid fa-list-check"></i>
                  {loading ? 'Fetching...' : 'Fetch Students'}
                </button>
              </div>
            </div>
          </div>

          {marksRecords.length > 0 ? (
            <div className="marks-entry-card">
              <div className="marks-table-wrapper">
                <table className="marks-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Student Name</th>
                      <th>Adm No</th>
                      <th>Roll No</th>
                      <th>Marks (Max: {maxMarks})</th>
                      <th>Absent?</th>
                      <th>Grade</th>
                      <th>Teacher Remark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marksRecords.map((record, index) => (
                      <tr key={record.studentId}>
                        <td>{index + 1}</td>
                        <td>
                          <strong>{record.name}</strong>
                        </td>
                        <td>{record.admissionNo}</td>
                        <td>{record.rollNo}</td>
                        <td>
                          <input
                            type="number"
                            className={`input-mark ${
                              Number(record.marksObtained) > maxMarks ? 'invalid' : ''
                            }`}
                            placeholder="0"
                            disabled={record.isAbsent}
                            value={record.marksObtained}
                            onChange={(e) => handleRecordChange(index, 'marksObtained', e.target.value)}
                            max={maxMarks}
                            min={0}
                          />
                        </td>
                        <td>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={record.isAbsent}
                              onChange={(e) => handleRecordChange(index, 'isAbsent', e.target.checked)}
                            />
                            <span style={{ fontSize: 13, color: record.isAbsent ? '#ef4444' : '#64748b' }}>
                              Absent
                            </span>
                          </label>
                        </td>
                        <td>
                          <span
                            className={`grade-pill ${
                              record.grade.startsWith('A')
                                ? 'grade-a'
                                : record.grade.startsWith('B')
                                ? 'grade-b'
                                : record.grade.startsWith('C')
                                ? 'grade-c'
                                : record.grade === 'AB'
                                ? 'grade-f'
                                : ''
                            }`}
                          >
                            {record.grade || '—'}
                          </span>
                        </td>
                        <td>
                          <input
                            type="text"
                            placeholder="e.g. Good performance"
                            value={record.remark}
                            onChange={(e) => handleRecordChange(index, 'remark', e.target.value)}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              fontSize: 13,
                              width: '100%',
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="btn-save-marks-bar">
                <span style={{ fontSize: 14, color: '#64748b' }}>
                  Total Students: <strong>{marksRecords.length}</strong>
                </span>

                <button
                  type="button"
                  className="btn-enter-marks"
                  style={{ maxWidth: 220 }}
                  onClick={handleSaveMarks}
                  disabled={savingMarks}
                >
                  <i className="fa-solid fa-floppy-disk"></i>
                  {savingMarks ? 'Saving...' : 'Save All Marks'}
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{
                background: '#ffffff',
                borderRadius: 16,
                padding: '60px 20px',
                textAlign: 'center',
                border: '1px solid #e2e8f0',
              }}
            >
              <i className="fa-solid fa-pen-ruler text-gray-300 text-5xl mb-3"></i>
              <h3 style={{ fontSize: 18, color: '#1e293b', margin: '0 0 6px 0' }}>Marks Entry Sheet</h3>
              <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>
                Select an Exam, Class, and Subject above, then click <strong>"Fetch Students"</strong> to start entering marks.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SCHEDULES */}
      {activeTab === 'schedules' && (
        <div>
          {exams.length === 0 ? (
            <div className="exam-filter-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
              <i className="fa-solid fa-book-open-reader text-gray-400 text-4xl mb-3"></i>
              <h3 style={{ fontSize: 18, color: '#1e293b', margin: '0 0 6px 0' }}>No Active Exams Found</h3>
              <p style={{ color: '#64748b', fontSize: 14 }}>There are no exams scheduled in the system yet.</p>
            </div>
          ) : (
            <div className="exam-cards-grid">
              {exams.map((exam) => (
                <div key={exam.id} className="exam-card-item">
                  <div>
                    <div className="exam-card-header">
                      <span className="exam-badge-type">{exam.examType?.replace(/_/g, ' ') || 'Exam'}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: exam.isActive ? '#16a34a' : '#64748b' }}>
                        {exam.isActive ? '● ACTIVE' : '○ COMPLETED'}
                      </span>
                    </div>
                    <h3 className="exam-card-title">{exam.name}</h3>

                    <div className="exam-card-details">
                      <div className="detail-row">
                        <i className="fa-solid fa-graduation-cap text-blue-500"></i>
                        <span>Class: {exam.class?.name || `Class #${exam.classId}`}</span>
                      </div>
                      <div className="detail-row">
                        <i className="fa-regular fa-calendar text-blue-500"></i>
                        <span>
                          {new Date(exam.startDate).toLocaleDateString('en-IN')} -{' '}
                          {new Date(exam.endDate).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="exam-card-actions">
                    <button
                      type="button"
                      className="btn-enter-marks"
                      onClick={() => {
                        setSelectedExamId(String(exam.id));
                        setSelectedClassId(String(exam.classId));
                        setSelectedSectionId('');
                        setActiveTab('marks');
                      }}
                    >
                      <i className="fa-solid fa-pen-nib"></i>
                      Enter Marks
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: REPORT CARDS */}
      {activeTab === 'reports' && (
        <div>
          <div className="exam-filter-card">
            <div className="filter-grid-row">
              {/* Class */}
              <div className="filter-field">
                <label>Select Class</label>
                <select
                  value={reportClassId}
                  onChange={(e) => {
                    setReportClassId(e.target.value);
                    setReportSectionId('');
                    setReportStudentId('');
                  }}
                >
                  <option value="">-- Choose Class ({classes.length}) --</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Section */}
              <div className="filter-field">
                <label>Select Section</label>
                <select
                  value={reportSectionId}
                  onChange={(e) => {
                    setReportSectionId(e.target.value);
                    setReportStudentId('');
                  }}
                  disabled={!reportClassId || reportClassSections.length === 0}
                >
                  <option value="">-- All Sections --</option>
                  {reportClassSections.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      Section {sec.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Student */}
              <div className="filter-field">
                <label>Select Student</label>
                <select
                  value={reportStudentId}
                  onChange={(e) => setReportStudentId(e.target.value)}
                  disabled={!reportClassId || studentListForReport.length === 0}
                >
                  <option value="">-- Choose Student ({studentListForReport.length}) --</option>
                  {studentListForReport.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.studentName || s.name} (Roll: {s.rollNo || s.admissionNo})
                    </option>
                  ))}
                </select>
              </div>

              {/* Fetch Report Button */}
              <div className="filter-field">
                <button
                  type="button"
                  className="btn-enter-marks"
                  style={{ width: '100%', height: 42 }}
                  onClick={handleFetchReportCard}
                  disabled={reportLoading || !reportStudentId}
                >
                  <i className="fa-solid fa-magnifying-glass"></i>
                  {reportLoading ? 'Fetching...' : 'View Report Card'}
                </button>
              </div>
            </div>
          </div>

          {reportData && (
            <div className="marks-entry-card" style={{ padding: 24 }}>
              <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: 16, marginBottom: 20 }}>
                <h2 style={{ fontSize: 20, color: '#0f172a', margin: '0 0 6px 0' }}>
                  {reportData.student?.name || 'Student Report Card'}
                </h2>
                <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>
                  Admission No: {reportData.student?.admissionNo || '—'} | Class:{' '}
                  {reportData.student?.class || '—'}
                </p>
              </div>

              {Array.isArray(reportData.exams) && reportData.exams.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {reportData.exams.map((ex, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: '#f8fafc',
                        padding: 16,
                        borderRadius: 12,
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <h4 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px 0', color: '#1e293b' }}>
                        {ex.examName} ({ex.examType?.replace(/_/g, ' ')})
                      </h4>

                      <table className="marks-table">
                        <thead>
                          <tr>
                            <th>Subject</th>
                            <th>Max Marks</th>
                            <th>Marks Obtained</th>
                            <th>Grade</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(ex.subjects || ex.marks)?.map((m, mi) => (
                            <tr key={mi}>
                              <td>{m.subjectName}</td>
                              <td>{m.maxMarks}</td>
                              <td>{m.isAbsent ? 'Absent' : m.marksObtained}</td>
                              <td>
                                <span className="grade-pill">{m.grade || '—'}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#64748b', textAlign: 'center', padding: 30 }}>
                  No published exam marks found for this student.
                </p>
              )}
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
