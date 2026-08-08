// src/modules/exam/exam.routes.js
const express = require('express');
const router = express.Router();
const controller = require('./exam.controller');
const authenticate = require('../../middleware/authMiddleware');
const authorize = require('../../middleware/authorize');

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Exams
 *   description: Exam scheduling, marks management, and report cards
 */

/**
 * @swagger
 * /exams:
 *   post:
 *     summary: Create a new exam (admin only)
 *     tags: [Exams]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [academicYearId, name, examType, classId, startDate, endDate]
 *             properties:
 *               academicYearId: { type: integer, example: 1 }
 *               name: { type: string, example: "Term 1 Final Exam" }
 *               examType: { type: string, enum: [unit_test_1, unit_test_2, half_yearly, annual, pre_board, practical, internal_assessment], example: "unit_test_1" }
 *               classId: { type: integer, example: 13 }
 *               startDate: { type: string, format: date, example: "2026-07-01" }
 *               endDate: { type: string, format: date, example: "2026-07-05" }
 *     responses:
 *       201:
 *         description: Exam created successfully
 *       400:
 *         description: Invalid input or date range out of academic year range
 *       403:
 *         description: Forbidden (Admin only)
 */
router.post('/', authorize('admin'), controller.createExam);

/**
 * @swagger
 * /exams:
 *   get:
 *     summary: Get all exams (all authenticated users)
 *     tags: [Exams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: academicYearId
 *         schema: { type: integer }
 *       - in: query
 *         name: classId
 *         schema: { type: integer }
 *       - in: query
 *         name: examType
 *         schema: { type: string, enum: [unit_test_1, unit_test_2, half_yearly, annual, pre_board, practical, internal_assessment] }
 *     responses:
 *       200:
 *         description: Exams fetched successfully
 */
router.get('/', controller.getAllExams);

/**
 * @swagger
 * /exams/{id}:
 *   get:
 *     summary: Get a single exam details with completion statistics (all authenticated users)
 *     tags: [Exams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Exam details fetched successfully
 *       404:
 *         description: Exam not found
 */
router.get('/:id(\\d+)', controller.getExamById);

/**
 * @swagger
 * /exams/{id}:
 *   put:
 *     summary: Update exam details (admin only)
 *     tags: [Exams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, example: "Updated Exam Name" }
 *               examType: { type: string, enum: [unit_test_1, unit_test_2, half_yearly, annual, pre_board, practical, internal_assessment] }
 *               startDate: { type: string, format: date }
 *               endDate: { type: string, format: date }
 *               isActive: { type: boolean }
 *     responses:
 *       200:
 *         description: Exam updated successfully
 *       403:
 *         description: Forbidden (Admin only)
 *       404:
 *         description: Exam not found
 */
router.put('/:id(\\d+)', authorize('admin'), controller.updateExam);

/**
 * @swagger
 * /exams/{id}:
 *   delete:
 *     summary: Delete or deactivate an exam (admin only)
 *     tags: [Exams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Exam deleted or deactivated successfully
 *       403:
 *         description: Forbidden (Admin only)
 *       404:
 *         description: Exam not found
 */
router.delete('/:id(\\d+)', authorize('admin'), controller.deleteExam);

/**
 * @swagger
 * /exams/{examId}/marks:
 *   post:
 *     summary: Bulk enter marks for an exam class and subject (admin or timetabled teacher only)
 *     tags: [Exams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [subjectId, maxMarks, records]
 *             properties:
 *               subjectId: { type: integer, example: 1 }
 *               maxMarks: { type: number, example: 100 }
 *               records:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [studentId]
 *                   properties:
 *                     studentId: { type: integer, example: 8 }
 *                     marksObtained: { type: number, example: 85.5 }
 *                     isAbsent: { type: boolean, example: false }
 *                     grade: { type: string, example: "A1" }
 *                     remark: { type: string, example: "Excellent performance" }
 *     responses:
 *       200:
 *         description: Marks recorded successfully
 *       400:
 *         description: Validation errors (e.g. marks > maxMarks, student class mismatch)
 *       403:
 *         description: Forbidden (not linked staff or timetabled teacher)
 *       409:
 *         description: Duplicate entry conflict
 */
router.post('/:examId(\\d+)/marks', authorize('admin', 'teacher'), controller.bulkEnterMarks);

/**
 * @swagger
 * /exams/{examId}/marks:
 *   get:
 *     summary: Get entered marks for an exam, filterable by subject (admin or timetabled teacher only)
 *     tags: [Exams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: subjectId
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Exam marks fetched successfully
 *       403:
 *         description: Forbidden (no timetabling assignment)
 */
router.get('/:examId(\\d+)/marks', authorize('admin', 'teacher'), controller.getExamMarks);

/**
 * @swagger
 * /exams/students/{studentId}/report:
 *   get:
 *     summary: Fetch annual report card marks for a student across exams (admin or teacher only)
 *     tags: [Exams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: academicYearId
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Student report card fetched successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Student not found
 */
router.get('/students/:studentId(\\d+)/report', authorize('admin', 'teacher'), controller.getStudentReportCard);

module.exports = router;
