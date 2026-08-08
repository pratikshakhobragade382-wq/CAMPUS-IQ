const express = require('express');
const router = express.Router();
const studentController = require('./student.controller');
const authenticate = require('../../middleware/authMiddleware');
const authorize = require('../../middleware/authorize');

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Students
 *   description: Student management APIs
 */

/**
 * @swagger
 * /students:
 *   post:
 *     summary: Create a new student
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [admissionNo, studentName, classId]
 *             properties:
 *               admissionNo:
 *                 type: string
 *                 example: "ADM2024001"
 *               feeNo:
 *                 type: string
 *               siblingAdmNo:
 *                 type: string
 *               studentName:
 *                 type: string
 *                 example: "Ravi Kumar"
 *               childLivingWith:
 *                 type: string
 *                 example: "Both Father & Mother"
 *               fatherTitle:
 *                 type: string
 *                 example: "MR."
 *               fatherName:
 *                 type: string
 *                 example: "Suresh Kumar"
 *               motherTitle:
 *                 type: string
 *                 example: "MRS."
 *               motherName:
 *                 type: string
 *                 example: "Priya Kumar"
 *               classId:
 *                 type: integer
 *                 example: 1
 *               sectionId:
 *                 type: integer
 *                 example: 1
 *               stream:
 *                 type: string
 *               feeGroup:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 example: "2010-05-15"
 *               dateOfAdmission:
 *                 type: string
 *                 format: date
 *                 example: "2024-06-01"
 *               dateOfJoin:
 *                 type: string
 *                 format: date
 *                 example: "2024-06-01"
 *               rollNo:
 *                 type: string
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *               admissionType:
 *                 type: string
 *                 enum: [new, transfer, readmission]
 *               emergencyPhoneNo:
 *                 type: string
 *               board:
 *                 type: string
 *               medium:
 *                 type: string
 *               aadharNo:
 *                 type: string
 *               grNo:
 *                 type: string
 *               bankName:
 *                 type: string
 *               accountNo:
 *                 type: string
 *               ifsc:
 *                 type: string
 *               father:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   mobile:
 *                     type: string
 *                   email:
 *                     type: string
 *                   occupation:
 *                     type: string
 *                   qualification:
 *                     type: string
 *                   aadharNo:
 *                     type: string
 *                   annualIncome:
 *                     type: number
 *               mother:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   mobile:
 *                     type: string
 *                   email:
 *                     type: string
 *               guardian:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   mobile:
 *                     type: string
 *                   relation:
 *                     type: string
 *     responses:
 *       201:
 *         description: Student created successfully
 *       409:
 *         description: Admission number already exists
 */
router.post('/', authorize('admin', 'management', 'principal', 'staff'), studentController.createStudent);

/**
 * @swagger
 * /students:
 *   get:
 *     summary: Get all students
 *     tags: [Students]
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
 *         description: Search by name, admission no or GR no
 *       - in: query
 *         name: classId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Students fetched successfully
 */
router.get('/', studentController.getAllStudents);

/**
 * @swagger
 * /students/{id}:
 *   get:
 *     summary: Get student by ID
 *     tags: [Students]
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
 *         description: Student fetched successfully
 *       404:
 *         description: Student not found
 */
router.get('/:id', studentController.getStudentById);

/**
 * @swagger
 * /students/{id}:
 *   put:
 *     summary: Update student
 *     tags: [Students]
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
 *         description: Student updated successfully
 *       404:
 *         description: Student not found
 */
router.put('/:id', authorize('admin', 'management', 'principal', 'staff'), studentController.updateStudent);

/**
 * @swagger
 * /students/{id}:
 *   delete:
 *     summary: Delete student
 *     tags: [Students]
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
 *         description: Student deleted successfully
 *       404:
 *         description: Student not found
 */
router.delete('/:id', authorize('admin', 'management', 'principal', 'staff'), studentController.deleteStudent);

module.exports = router;
