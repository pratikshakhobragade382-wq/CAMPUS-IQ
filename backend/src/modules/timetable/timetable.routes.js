const express = require('express');
const router = express.Router();
const controller = require('./timetable.controller');
const authenticate = require('../../middleware/authMiddleware');
const authorize = require('../../middleware/authorize');

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Timetable
 *   description: Period slots and class/teacher timetable management
 */

/**
 * @swagger
 * /timetable/period-slots/seed:
 *   post:
 *     summary: Seed default period slots (7 periods, recess, lunch, sports)
 *     tags: [Timetable]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Default slots seeded
 *       409:
 *         description: Already seeded
 */
router.post('/period-slots/seed', authorize('admin', 'management', 'principal'), controller.seedDefaultSlots);

/**
 * @swagger
 * /timetable/period-slots:
 *   post:
 *     summary: Create a period slot
 *     tags: [Timetable]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [slotNo, label, slotType, startTime, endTime]
 *             properties:
 *               slotNo: { type: integer, example: 1 }
 *               label: { type: string, example: "Period 1" }
 *               slotType: { type: string, enum: [period, recess, lunch, sports], example: "period" }
 *               startTime: { type: string, example: "08:00" }
 *               endTime: { type: string, example: "08:45" }
 *     responses:
 *       201:
 *         description: Period slot created
 *   get:
 *     summary: Get all period slots
 *     tags: [Timetable]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Period slots fetched
 */
router.post('/period-slots', authorize('admin', 'management', 'principal'), controller.createPeriodSlot);
router.get('/period-slots', controller.getAllPeriodSlots);

/**
 * @swagger
 * /timetable/period-slots/{id}:
 *   put:
 *     summary: Update a period slot
 *     tags: [Timetable]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Updated
 *   delete:
 *     summary: Delete a period slot
 *     tags: [Timetable]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Deleted
 */
router.put('/period-slots/:id', authorize('admin', 'management', 'principal'), controller.updatePeriodSlot);
router.delete('/period-slots/:id', authorize('admin', 'management', 'principal'), controller.deletePeriodSlot);

/**
 * @swagger
 * /timetable:
 *   post:
 *     summary: Create a timetable entry (assign teacher+subject to class+period+day)
 *     tags: [Timetable]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [academicYearId, classId, subjectId, staffId, periodSlotId, dayOfWeek]
 *             properties:
 *               academicYearId: { type: integer, example: 1 }
 *               classId: { type: integer, example: 13 }
 *               sectionId: { type: integer, example: 1 }
 *               subjectId: { type: integer, example: 1 }
 *               staffId: { type: integer, example: 1 }
 *               periodSlotId: { type: integer, example: 1 }
 *               dayOfWeek: { type: integer, example: 1, description: "1=Mon..6=Sat" }
 *     responses:
 *       201:
 *         description: Created
 *       409:
 *         description: Conflict — teacher or class already booked
 */
router.post('/', authorize('admin', 'management', 'principal'), controller.createTimetableEntry);

/**
 * @swagger
 * /timetable/class:
 *   get:
 *     summary: Get timetable for a class (grouped by day)
 *     tags: [Timetable]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: classId
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: sectionId
 *         schema: { type: integer }
 *       - in: query
 *         name: academicYearId
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Class timetable fetched
 */
router.get('/class', controller.getClassTimetable);

/**
 * @swagger
 * /timetable/teacher:
 *   get:
 *     summary: Get timetable for a teacher (grouped by day)
 *     tags: [Timetable]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: staffId
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: academicYearId
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Teacher timetable fetched
 */
router.get('/teacher', controller.getTeacherTimetable);

/**
 * @swagger
 * /timetable/{id}:
 *   put:
 *     summary: Update a timetable entry
 *     tags: [Timetable]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Updated
 *   delete:
 *     summary: Delete a timetable entry
 *     tags: [Timetable]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Deleted
 */
router.put('/:id', authorize('admin', 'management', 'principal'), controller.updateTimetableEntry);
router.delete('/:id', authorize('admin', 'management', 'principal'), controller.deleteTimetableEntry);

module.exports = router;
