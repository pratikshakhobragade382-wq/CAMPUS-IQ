const express = require('express');
const router = express.Router();
const controller = require('./fee.controller');
const authenticate = require('../../middleware/authMiddleware');
const authorize = require('../../middleware/authorize');

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Fees
 *   description: Fee categories, structures, and payment collection
 */

/**
 * @swagger
 * /fees/categories:
 *   post:
 *     summary: Create a fee category
 *     tags: [Fees]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, example: "Tuition Fee" }
 *               description: { type: string, example: "Annual tuition fee" }
 *     responses:
 *       201:
 *         description: Fee category created
 *       409:
 *         description: A fee category with this name already exists
 */
router.post('/categories', authorize('admin', 'management', 'principal'), controller.createFeeCategory);

/**
 * @swagger
 * /fees/categories:
 *   get:
 *     summary: Get all fee categories
 *     tags: [Fees]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Fee categories fetched
 */
router.get('/categories', controller.getAllFeeCategories);

/**
 * @swagger
 * /fees/categories/{id}:
 *   put:
 *     summary: Update a fee category
 *     tags: [Fees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Fee category updated
 */
router.put('/categories/:id', authorize('admin', 'management', 'principal'), controller.updateFeeCategory);

/**
 * @swagger
 * /fees/categories/{id}:
 *   delete:
 *     summary: Deactivate a fee category
 *     tags: [Fees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Fee category deactivated
 */
router.delete('/categories/:id', authorize('admin', 'management', 'principal'), controller.deleteFeeCategory);

/**
 * @swagger
 * /fees/structures:
 *   post:
 *     summary: Create a fee structure (assign amount to a class + category + academic year)
 *     tags: [Fees]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [academicYearId, classId, feeCategoryId, amount]
 *             properties:
 *               academicYearId: { type: integer, example: 1 }
 *               classId: { type: integer, example: 13 }
 *               feeCategoryId: { type: integer, example: 1 }
 *               amount: { type: number, example: 50000 }
 *               frequency: { type: string, example: "annual" }
 *               dueDay: { type: integer, example: 10 }
 *     responses:
 *       201:
 *         description: Fee structure created
 */
router.post('/structures', authorize('admin', 'management', 'principal'), controller.createFeeStructure);

/**
 * @swagger
 * /fees/structures:
 *   get:
 *     summary: Get fee structures
 *     tags: [Fees]
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
 *         name: feeCategoryId
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Fee structures fetched
 */
router.get('/structures', controller.getFeeStructures);

/**
 * @swagger
 * /fees/structures/{id}:
 *   put:
 *     summary: Update a fee structure
 *     tags: [Fees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Fee structure updated
 */
router.put('/structures/:id', authorize('admin', 'management', 'principal'), controller.updateFeeStructure);

/**
 * @swagger
 * /fees/collect:
 *   post:
 *     summary: Record a fee payment (admin or accountant only)
 *     tags: [Fees]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [studentId, feeStructureId, academicYearId, amount, paymentMode, paymentDate]
 *             properties:
 *               studentId: { type: integer, example: 8 }
 *               feeStructureId: { type: integer, example: 1 }
 *               academicYearId: { type: integer, example: 1 }
 *               amount: { type: number, example: 20000 }
 *               discount: { type: number, example: 0 }
 *               fine: { type: number, example: 0 }
 *               paymentMode: { type: string, enum: [cash, cheque, online, card, bank_transfer, upi], example: "cash" }
 *               paymentDate: { type: string, format: date, example: "2026-07-06" }
 *               chequeNo: { type: string }
 *               bankName: { type: string }
 *               transactionId: { type: string }
 *               remark: { type: string }
 *     responses:
 *       201:
 *         description: Fee collected
 *       403:
 *         description: Only admins or accountants can collect fees
 */
router.post('/collect', authorize('admin', 'management', 'principal', 'accountant'), controller.collectFee);

/**
 * @swagger
 * /fees/students/{studentId}/status:
 *   get:
 *     summary: Get a student's fee status (owed/paid/balance per category)
 *     tags: [Fees]
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
 *         description: Fee status fetched
 */
router.get('/students/:studentId/status', controller.getStudentFeeStatus);

/**
 * @swagger
 * /fees/students/{studentId}/history:
 *   get:
 *     summary: Get a student's payment history
 *     tags: [Fees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Payment history fetched
 */
router.get('/students/:studentId/history', controller.getStudentPaymentHistory);

/**
 * @swagger
 * /fees/collections:
 *   get:
 *     summary: Get all fee collections in a date range (daily collection report)
 *     tags: [Fees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fromDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: toDate
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Collections fetched
 */
router.get('/collections', authorize('admin', 'management', 'principal', 'accountant'), controller.getCollectionsByDateRange);

module.exports = router;
