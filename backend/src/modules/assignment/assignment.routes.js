// src/modules/assignment/assignment.routes.js
const express = require('express');
const router = express.Router();
const controller = require('./assignment.controller');
const authenticate = require('../../middleware/authMiddleware');
const authorize = require('../../middleware/authorize');

router.use(authenticate);

// Upload assignment document (PDF, Word, PPT)
const assignmentUpload = require('../../middleware/assignmentUpload');
router.post(
  '/upload',
  authorize('admin', 'staff', 'teacher', 'student'),
  (req, res, next) => {
    assignmentUpload.single('file')(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          error: err.message || 'File upload failed',
          message: err.message || 'File upload failed',
        });
      }
      next();
    });
  },
  controller.uploadAssignmentFile
);

// Create assignment (Teacher / Staff / Admin)
router.post('/', authorize('admin', 'staff', 'teacher'), controller.createAssignment);

// Get assignments
router.get('/', controller.getAssignments);

// Get assignment by ID
router.get('/:id(\\d+)', controller.getAssignmentById);

// Update assignment
router.put('/:id(\\d+)', authorize('admin', 'staff', 'teacher'), controller.updateAssignment);

// Delete assignment
router.delete('/:id(\\d+)', authorize('admin', 'staff', 'teacher'), controller.deleteAssignment);

// Get submissions for an assignment
router.get('/:id(\\d+)/submissions', authorize('admin', 'staff', 'teacher'), controller.getSubmissions);

// Grade a submission
router.put('/submissions/:submissionId(\\d+)/grade', authorize('admin', 'staff', 'teacher'), controller.gradeSubmission);

module.exports = router;
