const express = require('express');
const router = express.Router();
const controller = require('./holiday.controller');
const authenticate = require('../../middleware/authMiddleware');
const authorize = require('../../middleware/authorize');

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Holidays
 *   description: School holiday calendar management
 */

/**
 * @swagger
 * /holidays:
 *   post:
 *     summary: Add a holiday
 *     tags: [Holidays]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [academicYearId, name, date]
 *             properties:
 *               academicYearId: { type: integer, example: 1 }
 *               name: { type: string, example: "Republic Day" }
 *               date: { type: string, format: date, example: "2026-01-26" }
 *               holidayType: { type: string, enum: [public, school, regional], example: "public" }
 *     responses:
 *       201:
 *         description: Holiday created
 *       409:
 *         description: Holiday already exists on this date
 */
router.post('/', authorize('admin'), controller.createHoliday);

/**
 * @swagger
 * /holidays:
 *   get:
 *     summary: Get all holidays
 *     tags: [Holidays]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: academicYearId
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Holidays fetched
 */
router.get('/', controller.getAllHolidays);

/**
 * @swagger
 * /holidays/{id}:
 *   put:
 *     summary: Update a holiday
 *     tags: [Holidays]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Holiday updated
 */
router.put('/:id', authorize('admin'), controller.updateHoliday);

/**
 * @swagger
 * /holidays/{id}:
 *   delete:
 *     summary: Delete a holiday
 *     tags: [Holidays]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Holiday deleted
 */
router.delete('/:id', authorize('admin'), controller.deleteHoliday);

module.exports = router;
