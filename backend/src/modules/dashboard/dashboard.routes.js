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

module.exports = router;