const express = require('express');
const router = express.Router();
const staffController = require('./staff.controller');
const authenticate = require('../../middleware/authMiddleware');
const authorize = require('../../middleware/authorize');

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Staff
 *   description: Staff management APIs
 */

/**
 * @swagger
 * /staff:
 *   post:
 *     summary: Create a new staff member
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [employeeId, name, email]
 *             properties:
 *               employeeId:
 *                 type: string
 *                 example: "EMP001"
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 example: "john@school.com"
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *               dateOfJoining:
 *                 type: string
 *                 format: date
 *                 example: "2024-06-01"
 *               salary:
 *                 type: number
 *                 example: 35000
 *               address:
 *                 type: string
 *               photoUrl:
 *                 type: string
 *               departmentId:
 *                 type: integer
 *                 example: 1
 *               subjectIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2]
 *     responses:
 *       201:
 *         description: Staff created successfully
 *       409:
 *         description: Employee ID or email already exists
 */
router.post('/', authorize('admin', 'management', 'principal'), staffController.createStaff);

/**
 * @swagger
 * /staff:
 *   get:
 *     summary: Get all staff
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         example: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Staff fetched successfully
 */
router.get('/', authorize('admin', 'management', 'principal', 'staff'), staffController.getAllStaff);

/**
 * @swagger
 * /staff/{id}:
 *   get:
 *     summary: Get staff by ID
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Staff fetched successfully
 *       404:
 *         description: Staff not found
 */
router.get('/:id', authorize('admin', 'management', 'principal', 'staff'), staffController.getStaffById);

/**
 * @swagger
 * /staff/{id}:
 *   put:
 *     summary: Update staff member
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Staff updated successfully
 *       404:
 *         description: Staff not found
 */
router.put('/:id', authorize('admin', 'management', 'principal'), staffController.updateStaff);

/**
 * @swagger
 * /staff/{id}:
 *   delete:
 *     summary: Delete staff member
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Staff deleted successfully
 *       404:
 *         description: Staff not found
 */
router.delete('/:id', authorize('admin', 'management', 'principal'), staffController.deleteStaff);

/**
 * @swagger
 * /staff/{id}/subjects:
 *   post:
 *     summary: Assign subjects to staff
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [subjectIds]
 *             properties:
 *               subjectIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2, 3]
 *     responses:
 *       200:
 *         description: Subjects assigned successfully
 *       404:
 *         description: Staff not found
 */
router.post('/:id/subjects', authorize('admin', 'management', 'principal'), staffController.assignSubjects);

/**
 * @swagger
 * /staff/{id}/subjects/{subjectId}:
 *   delete:
 *     summary: Remove a subject from staff
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: subjectId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Subject removed from staff
 *       404:
 *         description: Staff or subject link not found
 */
router.delete('/:id/subjects/:subjectId', authorize('admin', 'management', 'principal'), staffController.removeSubject);

module.exports = router;
