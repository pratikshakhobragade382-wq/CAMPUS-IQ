import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import TeacherTopbar from '../components/TeacherTopbar';
import { getExams, getExamMarks, bulkEnterMarks, getStudentReportCard } from '../../api/exam.api';
import { getClasses } from '../../api/class.api';
import { getSubjects } from '../../api/subject.api';
import { getStudents } from '../../api/student.api';
import './TeacherExams.css';

export default function TeacherExams() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('schedules'); // 'schedules' | 'marks' | 'reports'

  // Common master data
  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [alertMsg, setAlertMsg] = useState(null);

  // Marks entry state
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [maxMarks, setMaxMarks] = useState(100);
  const [marksRecords, setMarksRecords] = useState([]);
  const [savingMarks, setSavingMarks] = useState(false);

  // Report card state
  const [reportStudentId, setReportStudentId] = useState('');
  const [studentListForReport, setStudentListForReport] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  // Load initial data
  useEffect(() => {
    async function init() {
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
        console.error('Failed to load exam data:', err);
      }
    }
    init();
  }, []);

  // When class changes for report card
  useEffect(() => {
    if (!selectedClassId) return;
    async function loadStudents() {
      try {
        const res = await getStudents({ classId: selectedClassId });
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setStudentListForReport(list);
      } catch (err) {
        console.error('Failed to load students:', err);
      }
    }
    loadStudents();
  }, [selectedClassId]);

  // Load students & existing marks for selected Exam + Subject + Class
  const handleLoadMarksTable = async () => {
    if (!selectedExamId || !selectedSubjectId || !selectedClassId) {
      setAlertMsg({ type: 'error', text: 'Please select Exam, Class, and Subject first.' });
      return;
    }

    setLoading(true);
    setAlertMsg(null);
    try {
      const [studentsRes, existingMarksRes] = await Promise.all([
        getStudents({ classId: selectedClassId }),
        getExamMarks(selectedExamId, { subjectId: selectedSubjectId }).catch(() => ({ data: [] })),
      ]);

      const students = Array.isArray(studentsRes?.data) ? studentsRes.data : Array.isArray(studentsRes) ? studentsRes : [];
      const existingMarks = Array.isArray(existingMarksRes?.data) ? existingMarksRes.data : Array.isArray(existingMarksRes) ? existingMarksRes : [];

      const rows = students.map((stu) => {
        const existing = existingMarks.find((m) => Number(m.studentId) === Number(stu.id));
        return {
          studentId: stu.id,
          name: stu.studentName || stu.name,
          admissionNo: stu.admissionNo || '—',
          rollNo: stu.rollNo || '—',
          marksObtained: existing?.marksObtained !== undefined ? existing.marksObtained : '',
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

  // Update mark field
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

  // Save marks
  const handleSaveMarks = async () => {
    if (!selectedExamId || !selectedSubjectId || marksRecords.length === 0) return;

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
      setAlertMsg({ type: 'error', text: err?.response?.data?.message || 'Failed to save marks.' });
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
        searchPlaceholder="Search exams, schedules, marks..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <div className="exams-header-section">
        <div className="exams-title-area">
          <h1>Examinations & Assessment</h1>
          <p>View exam schedules, enter subject marks, and inspect student report cards</p>
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
          className={`exam-nav-tab ${activeTab === 'schedules' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedules')}
        >
          <i className="fa-solid fa-calendar-check"></i>
          Exam Schedules ({exams.length})
        </button>

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
          className={`exam-nav-tab ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          <i className="fa-solid fa-file-invoice"></i>
          Student Report Cards
        </button>
      </div>

      {/* TAB 1: SCHEDULES */}
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

      {/* TAB 2: MARKS ENTRY */}
      {activeTab === 'marks' && (
        <div>
          <div className="exam-filter-card">
            <div className="filter-grid-row">
              <div className="filter-field">
                <label>Select Exam *</label>
                <select value={selectedExamId} onChange={(e) => setSelectedExamId(e.target.value)}>
                  <option value="">-- Choose Exam --</option>
                  {exams.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.examType?.replace(/_/g, ' ')})
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-field">
                <label>Select Class *</label>
                <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)}>
                  <option value="">-- Choose Class --</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-field">
                <label>Select Subject *</label>
                <select value={selectedSubjectId} onChange={(e) => setSelectedSubjectId(e.target.value)}>
                  <option value="">-- Choose Subject --</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code || 'Sub'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-field" style={{ maxWidth: 140 }}>
                <label>Max Marks</label>
                <input
                  type="number"
                  value={maxMarks}
                  onChange={(e) => setMaxMarks(Number(e.target.value))}
                  min={1}
                />
              </div>

              <div className="filter-field">
                <button
                  type="button"
                  className="btn-enter-marks"
                  style={{ width: '100%', height: 42 }}
                  onClick={handleLoadMarksTable}
                  disabled={loading}
                >
                  <i className="fa-solid fa-list-check"></i>
                  {loading ? 'Loading...' : 'Fetch Students'}
                </button>
              </div>
            </div>
          </div>

          {marksRecords.length > 0 && (
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
                            placeholder="e.g. Good progress"
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
          )}
        </div>
      )}

      {/* TAB 3: REPORT CARDS */}
      {activeTab === 'reports' && (
        <div>
          <div className="exam-filter-card">
            <div className="filter-grid-row">
              <div className="filter-field">
                <label>Select Class</label>
                <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)}>
                  <option value="">-- Choose Class --</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-field">
                <label>Select Student</label>
                <select value={reportStudentId} onChange={(e) => setReportStudentId(e.target.value)}>
                  <option value="">-- Choose Student --</option>
                  {studentListForReport.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.studentName || s.name} (Roll: {s.rollNo || s.admissionNo})
                    </option>
                  ))}
                </select>
              </div>

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
                          {ex.marks?.map((m, mi) => (
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
  );
}
