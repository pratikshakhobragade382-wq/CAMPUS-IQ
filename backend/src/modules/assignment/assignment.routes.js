// src/modules/assignment/assignment.routes.js
const express = require('express');
const router = express.Router();
const controller = require('./assignment.controller');
const authenticate = require('../../middleware/authMiddleware');
const authorize = require('../../middleware/authorize');

router.use(authenticate);

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
