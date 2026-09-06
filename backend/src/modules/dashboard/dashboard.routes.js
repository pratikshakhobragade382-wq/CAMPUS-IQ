const express = require('express');
const router = express.Router();
const dashboardController = require('./dashboard.controller');
const authenticate = require('../../middleware/authMiddleware');

router.use(authenticate);

/**
 * @swagger
 * /dashboard/summary:
 *   get:
 *     summary: Get aggregated dashboard stats for the logged-in tenant
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard summary fetched successfully
 */
router.get('/summary', dashboardController.getSummary);

/**
 * @swagger
 * /dashboard/teacher-summary:
 *   get:
 *     summary: Get the logged-in teacher's own dashboard summary (today's schedule, classes/subjects assigned, attendance marked today, upcoming exams for their classes)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Teacher dashboard summary fetched successfully
 *       403:
 *         description: Not a teacher account
 */
router.get('/teacher-summary', dashboardController.getTeacherSummary);

/**
 * @swagger
 * /dashboard/student-summary:
 *   get:
 *     summary: Get the logged-in student's own dashboard summary (profile, today's schedule, attendance, pending assignments, upcoming exams)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Student dashboard summary fetched successfully
 *       403:
 *         description: Not a student account
 */
router.get('/student-summary', dashboardController.getStudentSummary);

/**
 * @swagger
 * /dashboard/parent-summary:
 *   get:
 *     summary: Get the logged-in parent's dashboard summary for a linked child (defaults to first child; pass ?studentId= to switch)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: studentId
 *         schema:
 *           type: integer
 *         required: false
 *         description: Which linked child to view (defaults to the first)
 *     responses:
 *       200:
 *         description: Parent dashboard summary fetched successfully
 *       403:
 *         description: Not a parent account
 *       404:
 *         description: No linked children found, or student not linked to this parent
 */
router.get('/parent-summary', dashboardController.getParentSummary);

module.exports = router;