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

module.exports = router;