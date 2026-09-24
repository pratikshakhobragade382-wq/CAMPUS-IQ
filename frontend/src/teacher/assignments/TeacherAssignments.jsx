import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import TeacherTopbar from '../components/TeacherTopbar';
import {
  getAssignments,
  createAssignment,
  deleteAssignment,
  getAssignmentSubmissions,
  gradeSubmission,
  uploadAssignmentFile,
  getFileUrl,
} from '../../api/assignment.api';
import { getClasses } from '../../api/class.api';
import { getSubjects } from '../../api/subject.api';
import './TeacherAssignments.css';

// Helpers for file display
function formatFileSize(bytes) {
  if (bytes === null || bytes === undefined || bytes === '') return '';
  const num = Number(bytes);
  if (isNaN(num) || num <= 0) return '';
  if (num < 1024) return `${num} B`;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
  return `${(num / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(fileNameOrUrl) {
  if (!fileNameOrUrl || typeof fileNameOrUrl !== 'string') return 'fa-file-lines';
  const lower = fileNameOrUrl.toLowerCase();
  if (lower.endsWith('.pdf')) return 'fa-file-pdf';
  if (lower.endsWith('.doc') || lower.endsWith('.docx')) return 'fa-file-word';
  if (lower.endsWith('.ppt') || lower.endsWith('.pptx')) return 'fa-file-powerpoint';
  return 'fa-file-lines';
}

function getFileBadgeColor(fileNameOrUrl) {
  if (!fileNameOrUrl || typeof fileNameOrUrl !== 'string') return { bg: '#f1f5f9', color: '#64748b' };
  const lower = fileNameOrUrl.toLowerCase();
  if (lower.endsWith('.pdf')) return { bg: '#fee2e2', color: '#dc2626' };
  if (lower.endsWith('.doc') || lower.endsWith('.docx')) return { bg: '#dbeafe', color: '#2563eb' };
  if (lower.endsWith('.ppt') || lower.endsWith('.pptx')) return { bg: '#ffedd5', color: '#ea580c' };
  return { bg: '#e0e7ff', color: '#4f46e5' };
}


export default function TeacherAssignments() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterClass, setSelectedFilterClass] = useState('');
  const [selectedFilterSubject, setSelectedFilterSubject] = useState('');
  const [alertMsg, setAlertMsg] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const initialFormData = {
    title: '',
    description: '',
    classId: '',
    sectionId: '',
    subjectId: '',
    dueDate: '',
    maxMarks: 100,
    attachmentUrl: '',
    attachmentName: '',
    attachmentSize: null,
  };

  const [formData, setFormData] = useState(initialFormData);

  const openCreateModal = () => {
    setFormData(initialFormData);
    setUploadError('');
    setUploadingFile(false);
    setUploadProgress(0);
    setIsDragging(false);
    if (fileInputRef.current) {
      try {
        fileInputRef.current.value = '';
      } catch {
        // ignore
      }
    }
    setIsModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsModalOpen(false);
    setFormData(initialFormData);
    setUploadError('');
    setUploadingFile(false);
    setUploadProgress(0);
    setIsDragging(false);
    if (fileInputRef.current) {
      try {
        fileInputRef.current.value = '';
      } catch {
        // ignore
      }
    }
  };

  // Allowed file extensions for teacher assignment documents
  const allowedExtensions = ['.pdf', '.doc', '.docx', '.ppt', '.pptx'];

  // Handle file selection / upload
  const handleFileUpload = async (file) => {
    if (!file) return;

    try {
      const fileName = file.name || '';
      const dotIdx = fileName.lastIndexOf('.');
      const ext = dotIdx !== -1 ? fileName.substring(dotIdx).toLowerCase() : '';
      if (!allowedExtensions.includes(ext)) {
        setUploadError(
          'Invalid file type. Please upload a PDF, Word (.doc, .docx), or PowerPoint (.ppt, .pptx) document.'
        );
        return;
      }

      if (file.size > 30 * 1024 * 1024) {
        setUploadError('File is too large. Maximum file size is 30 MB.');
        return;
      }

      setUploadError('');
      setUploadingFile(true);
      setUploadProgress(0);

      const res = await uploadAssignmentFile(file, (progress) => {
        setUploadProgress(progress || 0);
      });

      const uploadedUrl = res?.data?.url || res?.url;
      const uploadedName = res?.data?.fileName || res?.fileName || file.name;
      const uploadedSize = res?.data?.fileSize || res?.fileSize || file.size;

      if (uploadedUrl) {
        setFormData((prev) => ({
          ...prev,
          attachmentUrl: String(uploadedUrl),
          attachmentName: String(uploadedName),
          attachmentSize: Number(uploadedSize) || null,
        }));
      } else {
        setUploadError('Upload finished but server did not return a valid URL.');
      }
    } catch (err) {
      console.error('File upload error:', err);
      setUploadError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          'Failed to upload document. Please try again.'
      );
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) {
        try {
          fileInputRef.current.value = '';
        } catch {
          // ignore
        }
      }
    }
  };

  const handleRemoveFile = () => {
    setFormData((prev) => ({
      ...prev,
      attachmentUrl: '',
      attachmentName: '',
      attachmentSize: null,
    }));
    setUploadError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

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

      const aList = Array.isArray(assignRes?.data) ? assignRes.data : Array.isArray(assignRes) ? assignRes : [];
      const cList = Array.isArray(classRes?.data) ? classRes.data : Array.isArray(classRes) ? classRes : [];
      const sList = Array.isArray(subRes?.data) ? subRes.data : Array.isArray(subRes) ? subRes : [];

      setAssignments(aList);
      setClasses(cList);
      setSubjects(sList);
    } catch (err) {
      console.error('Failed to load assignments data:', err);
      setAlertMsg({ type: 'error', text: 'Failed to load assignments list.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Available sections for the currently selected class in modal
  const availableSections = useMemo(() => {
    if (!formData.classId) return [];
    const cls = classes.find((c) => Number(c.id) === Number(formData.classId));
    return cls?.sections || [];
  }, [classes, formData.classId]);

  // Handle Form Change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'classId') {
        // Reset section when class changes
        updated.sectionId = '';
      }
      return updated;
    });
  };

  // Submit New Assignment
  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setAlertMsg({ type: 'error', text: 'Please enter an assignment title.' });
      return;
    }
    if (!formData.classId) {
      setAlertMsg({ type: 'error', text: 'Please select a class from the dropdown.' });
      return;
    }
    if (!formData.subjectId) {
      setAlertMsg({ type: 'error', text: 'Please select a subject from the dropdown.' });
      return;
    }
    if (!formData.dueDate) {
      setAlertMsg({ type: 'error', text: 'Please choose a due date.' });
      return;
    }
    if (formData.maxMarks === '' || Number(formData.maxMarks) <= 0) {
      setAlertMsg({ type: 'error', text: 'Please enter valid Max Marks (minimum 1).' });
      return;
    }

    setSaving(true);
    setAlertMsg(null);
    try {
      await createAssignment({
        title: formData.title.trim(),
        description: formData.description?.trim() || null,
        classId: Number(formData.classId),
        sectionId: formData.sectionId ? Number(formData.sectionId) : null,
        subjectId: Number(formData.subjectId),
        dueDate: formData.dueDate,
        maxMarks: Number(formData.maxMarks) || 100,
        attachmentUrl: formData.attachmentUrl?.trim() || null,
      });

      setAlertMsg({ type: 'success', text: 'Assignment successfully published to students!' });
      closeCreateModal();
      loadData();
    } catch (err) {
      console.error('Create error:', err);
      setAlertMsg({ type: 'error', text: err?.response?.data?.message || err?.response?.data?.error || 'Failed to create assignment.' });
    } finally {
      setSaving(false);
    }
  };

  // Delete Assignment
  const handleDeleteAssignment = async (id) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;
    try {
      await deleteAssignment(id);
      setAlertMsg({ type: 'success', text: 'Assignment deleted successfully.' });
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
      const subList = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setSubmissions(subList);
    } catch (err) {
      console.error('Fetch submissions error:', err);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  // Grade Submission
  const handleGrade = async (submissionId, grade, feedback) => {
    if (grade !== '' && grade !== undefined && grade !== null) {
      const numGrade = Number(grade);
      const max = selectedAssignment?.maxMarks || 100;
      if (isNaN(numGrade) || numGrade < 0 || numGrade > max) {
        setAlertMsg({ type: 'error', text: `Marks must be between 0 and ${max}.` });
        return;
      }
    }

    try {
      await gradeSubmission(submissionId, { grade: grade === '' ? null : Number(grade), feedback });
      setSubmissions((prev) =>
        prev.map((s) => (s.id === submissionId ? { ...s, grade: grade === '' ? null : Number(grade), feedback, status: 'graded' } : s))
      );
      setAlertMsg({ type: 'success', text: 'Submission graded successfully!' });
    } catch (err) {
      console.error('Grade error:', err);
      setAlertMsg({ type: 'error', text: 'Failed to grade submission.' });
    }
  };


  // Filtered list
  const filteredAssignments = (assignments || []).filter((a) => {
    if (!a) return false;
    const q = (searchQuery || '').toLowerCase();
    const title = (a.title || '').toLowerCase();
    const desc = (a.description || '').toLowerCase();
    const matchesSearch = !q || title.includes(q) || desc.includes(q);

    const matchesClass =
      !selectedFilterClass || Number(a.classId) === Number(selectedFilterClass);
    const matchesSubject =
      !selectedFilterSubject || Number(a.subjectId) === Number(selectedFilterSubject);

    return matchesSearch && matchesClass && matchesSubject;
  });

  return (
    <div className="teacher-assignments-page">
      <TeacherTopbar
        searchPlaceholder="Search assignments, topics, keywords..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <div className="assignments-content-container">
        <div className="assignments-header-section">
          <div className="assignments-title-area">
            <h1>Classroom Assignments</h1>
            <p>Create homework tasks, manage submissions, and grade student performance</p>
          </div>

          <button
            type="button"
            className="btn-create-assignment"
            onClick={openCreateModal}
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

      {/* Filter Bar */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 14,
          border: '1px solid #e2e8f0',
          padding: '14px 18px',
          marginBottom: 24,
          display: 'flex',
          gap: 16,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
          <i className="fa-solid fa-filter mr-1 text-blue-600"></i> Filters:
        </span>

        <select
          value={selectedFilterClass}
          onChange={(e) => setSelectedFilterClass(e.target.value)}
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            border: '1px solid #cbd5e1',
            fontSize: 14,
            background: '#f8fafc',
            outline: 'none',
          }}
        >
          <option value="">All Classes ({classes.length})</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={selectedFilterSubject}
          onChange={(e) => setSelectedFilterSubject(e.target.value)}
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            border: '1px solid #cbd5e1',
            fontSize: 14,
            background: '#f8fafc',
            outline: 'none',
          }}
        >
          <option value="">All Subjects ({subjects.length})</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.code || 'Sub'})
            </option>
          ))}
        </select>

        {(selectedFilterClass || selectedFilterSubject || searchQuery) && (
          <button
            type="button"
            onClick={() => {
              setSelectedFilterClass('');
              setSelectedFilterSubject('');
              setSearchQuery('');
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ef4444',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <i className="fa-solid fa-xmark"></i> Clear Filters
          </button>
        )}
      </div>

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
            const subjectName = subjects.find((s) => Number(s.id) === Number(assignment.subjectId))?.name || `Subject #${assignment.subjectId}`;
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
                      {assignment.sectionId ? ` (Sec ${assignment.sectionId})` : ''}
                    </span>
                    <span className="card-marks-badge">
                      <i className="fa-solid fa-award text-amber-500 mr-1"></i> Max Marks: {assignment.maxMarks || 100}
                    </span>
                  </div>

                  {assignment.attachmentUrl && (
                    <div className="assignment-attachment-row">
                      <a
                        href={getFileUrl(assignment.attachmentUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="card-attachment-button"
                        title="View or download attached assignment"
                      >
                        <i
                          className={`fa-solid ${getFileIcon(assignment.attachmentUrl)}`}
                          style={{ color: getFileBadgeColor(assignment.attachmentUrl).color }}
                        ></i>
                        <span>
                          Attached Document ({assignment.attachmentUrl.split('.').pop()?.toUpperCase() || 'FILE'})
                        </span>
                        <i
                          className="fa-solid fa-arrow-up-right-from-square"
                          style={{ fontSize: 11, marginLeft: 'auto', opacity: 0.7 }}
                        ></i>
                      </a>
                    </div>
                  )}

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
                onClick={closeCreateModal}
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

                {/* Class & Section dropdowns */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group-field">
                    <label>Class *</label>
                    <select
                      name="classId"
                      value={formData.classId}
                      onChange={handleChange}
                      required
                    >
                      <option value="">-- Select Class --</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group-field">
                    <label>Section (Optional)</label>
                    <select
                      name="sectionId"
                      value={formData.sectionId}
                      onChange={handleChange}
                      disabled={!formData.classId || availableSections.length === 0}
                    >
                      <option value="">-- All Sections --</option>
                      {availableSections.map((sec) => (
                        <option key={sec.id} value={sec.id}>
                          Section {sec.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Subject & Max Marks */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group-field">
                    <label>Subject *</label>
                    <select
                      name="subjectId"
                      value={formData.subjectId}
                      onChange={handleChange}
                      required
                    >
                      <option value="">-- Select Subject --</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.code || 'Sub'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group-field">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <label style={{ margin: 0 }}>Max Marks *</label>
                      <div className="marks-preset-chips">
                        {[20, 25, 50, 100].map((preset) => (
                          <button
                            type="button"
                            key={preset}
                            className={`chip-preset-mark ${Number(formData.maxMarks) === preset ? 'active' : ''}`}
                            onClick={() => setFormData((p) => ({ ...p, maxMarks: preset }))}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      type="number"
                      name="maxMarks"
                      value={formData.maxMarks}
                      onChange={handleChange}
                      min={1}
                      max={1000}
                      required
                      placeholder="e.g. 100"
                    />
                  </div>
                </div>

                {/* Due Date */}
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
                  <label>Instructions / Description</label>
                  <textarea
                    name="description"
                    rows={3}
                    placeholder="Details about exercise questions, submission format, or chapters..."
                    value={formData.description}
                    onChange={handleChange}
                  />
                </div>

                {/* Assignment Document Upload Section (PDF, Word, PPT) */}
                <div className="form-group-field">
                  <div className="upload-section-header">
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>
                      Upload Assignment Document (Optional)
                    </span>
                    <span className="upload-section-tag">PDF • Word • PPT</span>
                  </div>

                  {/* Hidden File Input placed outside the dropzone label */}
                  <input
                    id="teacher-assignment-file-input"
                    ref={fileInputRef}
                    type="file"
                    style={{ display: 'none' }}
                    accept=".pdf,.doc,.docx,.ppt,.pptx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileUpload(file);
                      }
                    }}
                  />

                  {!formData.attachmentUrl ? (
                    <label
                      htmlFor={uploadingFile ? undefined : 'teacher-assignment-file-input'}
                      className={`upload-dropzone ${isDragging ? 'drag-over' : ''} ${uploadingFile ? 'uploading' : ''}`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDragging(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDragging(false);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDragging(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleFileUpload(file);
                      }}
                    >
                      {uploadingFile ? (
                        <div className="upload-progress-container">
                          <i className="fa-solid fa-circle-notch fa-spin text-blue-500 text-2xl"></i>
                          <p className="upload-progress-text">Uploading document... {uploadProgress}%</p>
                          <div className="upload-progress-bar-bg">
                            <div className="upload-progress-bar-fill" style={{ width: `${uploadProgress}%` }}></div>
                          </div>
                        </div>
                      ) : (
                        <div className="upload-dropzone-content">
                          <div className="upload-icon-wrapper">
                            <i className="fa-solid fa-cloud-arrow-up"></i>
                          </div>
                          <p className="upload-main-text">
                            <span style={{ color: '#0ea5e9', fontWeight: 700, textDecoration: 'underline' }}>
                              Click to upload
                            </span>{' '}
                            or drag and drop
                          </p>
                          <p className="upload-sub-text">
                            Accepted formats: <strong>PDF, Word (.doc, .docx), PowerPoint (.ppt, .pptx)</strong>
                          </p>
                          <p className="upload-limit-text">Maximum file size: 30 MB</p>
                        </div>
                      )}
                    </label>
                  ) : (
                    <div className="uploaded-file-card">
                      <div className="uploaded-file-info">
                        <div
                          className="uploaded-file-icon"
                          style={{
                            background: getFileBadgeColor(formData.attachmentName || formData.attachmentUrl).bg,
                            color: getFileBadgeColor(formData.attachmentName || formData.attachmentUrl).color,
                          }}
                        >
                          <i
                            className={`fa-solid ${getFileIcon(formData.attachmentName || formData.attachmentUrl)}`}
                          ></i>
                        </div>
                        <div className="uploaded-file-text">
                          <div
                            className="uploaded-file-title"
                            title={formData.attachmentName || formData.attachmentUrl}
                          >
                            {formData.attachmentName || 'Assignment Document'}
                          </div>
                          <div className="uploaded-file-meta">
                            <span className="uploaded-success-tag">
                              <i className="fa-solid fa-circle-check"></i> Uploaded
                            </span>
                            {formData.attachmentSize && (
                              <span>• {formatFileSize(formData.attachmentSize)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="uploaded-file-actions">
                        <a
                          href={getFileUrl(formData.attachmentUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-view-uploaded"
                          title="Preview uploaded document"
                        >
                          <i className="fa-solid fa-arrow-up-right-from-square"></i> Preview
                        </a>
                        <button
                          type="button"
                          className="btn-remove-uploaded"
                          onClick={handleRemoveFile}
                          title="Remove document"
                        >
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      </div>
                    </div>
                  )}

                  {uploadError && (
                    <div className="upload-error-msg">
                      <i className="fa-solid fa-triangle-exclamation"></i> {uploadError}
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-actions-footer">
                <button
                  type="button"
                  className="btn-card-action"
                  onClick={closeCreateModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-create-assignment"
                  disabled={saving}
                >
                  {saving ? 'Publishing...' : 'Publish Assignment'}
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
                      <th>Submitted Work</th>
                      <th>Status</th>
                      <th>Marks (Max: {selectedAssignment.maxMarks || 100})</th>
                      <th>Feedback</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((sub) => (
                      <tr key={sub.id}>
                        <td>Student #{sub.studentId}</td>
                        <td>{new Date(sub.submittedAt).toLocaleDateString('en-IN')}</td>
                        <td>
                          {sub.attachmentUrl ? (
                            <a
                              href={getFileUrl(sub.attachmentUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                fontSize: 12,
                                fontWeight: 600,
                                color: '#0284c7',
                                textDecoration: 'none',
                              }}
                            >
                              <i className={`fa-solid ${getFileIcon(sub.attachmentUrl)}`}></i> Attachment
                            </a>
                          ) : sub.content ? (
                            <span style={{ fontSize: 12, color: '#334155' }} title={sub.content}>
                              {sub.content.length > 25 ? `${sub.content.slice(0, 25)}…` : sub.content}
                            </span>
                          ) : (
                            <span style={{ fontSize: 12, color: '#94a3b8' }}>No file</span>
                          )}
                        </td>
                        <td>
                          <span className={`grade-pill ${sub.status === 'graded' ? 'grade-a' : 'grade-b'}`}>
                            {sub.status}
                          </span>
                        </td>
                        <td>
                          <input
                            type="number"
                            style={{ width: 75, padding: 6, borderRadius: 6, border: '1px solid #cbd5e1' }}
                            defaultValue={sub.grade ?? ''}
                            min={0}
                            max={selectedAssignment.maxMarks || 100}
                            onBlur={(e) => handleGrade(sub.id, e.target.value, sub.feedback)}
                            placeholder={`0 - ${selectedAssignment.maxMarks || 100}`}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            style={{ width: '100%', padding: 6, borderRadius: 6, border: '1px solid #cbd5e1' }}
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
    </div>
  );
}
