import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import TeacherTopbar from '../components/TeacherTopbar';
import { getAssignments, createAssignment, deleteAssignment, getAssignmentSubmissions, gradeSubmission } from '../../api/assignment.api';
import { getClasses } from '../../api/class.api';
import { getSubjects } from '../../api/subject.api';
import './TeacherAssignments.css';

export default function TeacherAssignments() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [alertMsg, setAlertMsg] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    classId: '',
    sectionId: '',
    subjectId: '',
    dueDate: '',
    maxMarks: 100,
    attachmentUrl: '',
  });

  // Submissions Modal State
  const [isSubmissionsOpen, setIsSubmissionsOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);

  // Load Data
  const loadData = async () => {
    setLoading(true);
    try {
      const [assignRes, classRes, subRes] = await Promise.all([
        getAssignments().catch(() => ({ data: [] })),
        getClasses().catch(() => ({ data: [] })),
        getSubjects().catch(() => ({ data: [] })),
      ]);

      setAssignments(Array.isArray(assignRes?.data) ? assignRes.data : Array.isArray(assignRes) ? assignRes : []);
      setClasses(Array.isArray(classRes?.data) ? classRes.data : Array.isArray(classRes) ? classRes : []);
      setSubjects(Array.isArray(subRes?.data) ? subRes.data : Array.isArray(subRes) ? subRes : []);
    } catch (err) {
      console.error('Failed to load assignments:', err);
      setAlertMsg({ type: 'error', text: 'Failed to load assignments list.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle Form Change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Submit New Assignment
  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.classId || !formData.subjectId || !formData.dueDate) {
      setAlertMsg({ type: 'error', text: 'Please fill all required fields.' });
      return;
    }

    setSaving(true);
    setAlertMsg(null);
    try {
      await createAssignment(formData);
      setAlertMsg({ type: 'success', text: 'Assignment created successfully!' });
      setIsModalOpen(false);
      setFormData({
        title: '',
        description: '',
        classId: '',
        sectionId: '',
        subjectId: '',
        dueDate: '',
        maxMarks: 100,
        attachmentUrl: '',
      });
      loadData();
    } catch (err) {
      console.error('Create error:', err);
      setAlertMsg({ type: 'error', text: err?.response?.data?.message || 'Failed to create assignment.' });
    } finally {
      setSaving(false);
    }
  };

  // Delete Assignment
  const handleDeleteAssignment = async (id) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;
    try {
      await deleteAssignment(id);
      setAlertMsg({ type: 'success', text: 'Assignment deleted.' });
      setAssignments((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error('Delete error:', err);
      setAlertMsg({ type: 'error', text: 'Failed to delete assignment.' });
    }
  };

  // Open Submissions
  const handleOpenSubmissions = async (assignment) => {
    setSelectedAssignment(assignment);
    setIsSubmissionsOpen(true);
    setSubmissionsLoading(true);
    try {
      const res = await getAssignmentSubmissions(assignment.id);
      setSubmissions(Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Fetch submissions error:', err);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  // Grade Submission
  const handleGrade = async (submissionId, grade, feedback) => {
    try {
      await gradeSubmission(submissionId, { grade, feedback });
      setSubmissions((prev) =>
        prev.map((s) => (s.id === submissionId ? { ...s, grade, feedback, status: 'graded' } : s))
      );
      setAlertMsg({ type: 'success', text: 'Submission graded successfully!' });
    } catch (err) {
      console.error('Grade error:', err);
      setAlertMsg({ type: 'error', text: 'Failed to grade submission.' });
    }
  };

  const filteredAssignments = assignments.filter((a) => {
    const q = searchQuery.toLowerCase();
    return a.title?.toLowerCase().includes(q) || a.description?.toLowerCase().includes(q);
  });

  return (
    <div className="teacher-assignments-page">
      <TeacherTopbar
        searchPlaceholder="Search assignments, topics..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <div className="assignments-header-section">
        <div className="assignments-title-area">
          <h1>Classroom Assignments</h1>
          <p>Create homework tasks, manage submissions, and provide student grading</p>
        </div>

        <button
          type="button"
          className="btn-create-assignment"
          onClick={() => setIsModalOpen(true)}
        >
          <i className="fa-solid fa-plus"></i>
          Create Assignment
        </button>
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

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
          <i className="fa-solid fa-circle-notch fa-spin text-3xl mb-3 text-blue-600"></i>
          <p>Loading assignments...</p>
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div
          style={{
            background: '#ffffff',
            borderRadius: 16,
            padding: '60px 20px',
            textAlign: 'center',
            border: '1px solid #e2e8f0',
          }}
        >
          <i className="fa-solid fa-clipboard-list text-gray-300 text-5xl mb-3"></i>
          <h3 style={{ fontSize: 18, color: '#1e293b', margin: '0 0 6px 0' }}>No Assignments Found</h3>
          <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>
            Click the "Create Assignment" button above to give your students their first task.
          </p>
        </div>
      ) : (
        <div className="assignments-grid">
          {filteredAssignments.map((assignment) => {
            const isOverdue = new Date(assignment.dueDate) < new Date();
            const subjectName = subjects.find((s) => Number(s.id) === Number(assignment.subjectId))?.name || 'Subject';
            const className = classes.find((c) => Number(c.id) === Number(assignment.classId))?.name || `Class #${assignment.classId}`;
            const subCount = assignment.AssignmentSubmission?.length || 0;

            return (
              <div key={assignment.id} className="assignment-card">
                <div>
                  <div className="assignment-header">
                    <span className="subject-badge">{subjectName}</span>
                    <span className={`due-badge ${isOverdue ? 'overdue' : ''}`}>
                      <i className="fa-regular fa-clock"></i>
                      Due: {new Date(assignment.dueDate).toLocaleDateString('en-IN')}
                    </span>
                  </div>

                  <h3 className="assignment-title">{assignment.title}</h3>
                  <p className="assignment-desc">{assignment.description || 'No additional instructions provided.'}</p>
                </div>

                <div>
                  <div className="assignment-meta-row">
                    <span>
                      <i className="fa-solid fa-graduation-cap text-blue-500 mr-1"></i> {className}
                    </span>
                    <span>
                      <i className="fa-solid fa-star text-amber-500 mr-1"></i> Max Marks: {assignment.maxMarks || 100}
                    </span>
                  </div>

                  <div className="assignment-actions-row">
                    <button
                      type="button"
                      className="btn-card-action"
                      onClick={() => handleOpenSubmissions(assignment)}
                    >
                      <i className="fa-solid fa-users-viewfinder"></i>
                      Submissions ({subCount})
                    </button>
                    <button
                      type="button"
                      className="btn-card-action btn-delete-action"
                      onClick={() => handleDeleteAssignment(assignment.id)}
                      title="Delete Assignment"
                    >
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2>Create New Assignment</h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsModalOpen(false)}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleCreateAssignment}>
              <div className="modal-form-body">
                <div className="form-group-field">
                  <label>Assignment Title *</label>
                  <input
                    type="text"
                    name="title"
                    placeholder="e.g. Chapter 4 Trigonometry Homework"
                    value={formData.title}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group-field">
                    <label>Class *</label>
                    <select name="classId" value={formData.classId} onChange={handleChange} required>
                      <option value="">-- Select Class --</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group-field">
                    <label>Subject *</label>
                    <select name="subjectId" value={formData.subjectId} onChange={handleChange} required>
                      <option value="">-- Select Subject --</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group-field">
                    <label>Due Date *</label>
                    <input
                      type="date"
                      name="dueDate"
                      value={formData.dueDate}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group-field">
                    <label>Max Marks</label>
                    <input
                      type="number"
                      name="maxMarks"
                      value={formData.maxMarks}
                      onChange={handleChange}
                      min={1}
                    />
                  </div>
                </div>

                <div className="form-group-field">
                  <label>Instructions / Description</label>
                  <textarea
                    name="description"
                    rows={3}
                    placeholder="Details about pages, questions, or formatting..."
                    value={formData.description}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="modal-actions-footer">
                <button
                  type="button"
                  className="btn-card-action"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-create-assignment"
                  disabled={saving}
                >
                  {saving ? 'Creating...' : 'Publish Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUBMISSIONS MODAL */}
      {isSubmissionsOpen && selectedAssignment && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: 700 }}>
            <div className="modal-header">
              <h2>Submissions: {selectedAssignment.title}</h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsSubmissionsOpen(false)}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="modal-form-body">
              {submissionsLoading ? (
                <p style={{ textAlign: 'center', padding: 20 }}>Loading submissions...</p>
              ) : submissions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 30, color: '#64748b' }}>
                  <i className="fa-regular fa-folder-open text-3xl mb-2"></i>
                  <p>No students have submitted this assignment yet.</p>
                </div>
              ) : (
                <table className="marks-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Student ID</th>
                      <th>Submitted Date</th>
                      <th>Status</th>
                      <th>Marks ({selectedAssignment.maxMarks})</th>
                      <th>Feedback</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((sub) => (
                      <tr key={sub.id}>
                        <td>Student #{sub.studentId}</td>
                        <td>{new Date(sub.submittedAt).toLocaleDateString('en-IN')}</td>
                        <td>
                          <span className={`grade-pill ${sub.status === 'graded' ? 'grade-a' : 'grade-b'}`}>
                            {sub.status}
                          </span>
                        </td>
                        <td>
                          <input
                            type="number"
                            style={{ width: 70, padding: 4, borderRadius: 6, border: '1px solid #cbd5e1' }}
                            defaultValue={sub.grade ?? ''}
                            onBlur={(e) => handleGrade(sub.id, e.target.value, sub.feedback)}
                            placeholder="Grade"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            style={{ width: '100%', padding: 4, borderRadius: 6, border: '1px solid #cbd5e1' }}
                            defaultValue={sub.feedback ?? ''}
                            onBlur={(e) => handleGrade(sub.id, sub.grade, e.target.value)}
                            placeholder="Add remark"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="modal-actions-footer">
              <button
                type="button"
                className="btn-create-assignment"
                onClick={() => setIsSubmissionsOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
