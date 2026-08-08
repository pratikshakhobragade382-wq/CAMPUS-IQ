const express = require('express');
const router = express.Router();
const ctrl = require('./master-data.controller');
const authenticate = require('../../middleware/authMiddleware');
const authorize = require('../../middleware/authorize');

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Master Data
 *   description: Lookup values (BloodGroup, Religion, House etc.)
 */

/** @swagger
 * /master-data/valid-categories:
 *   get:
 *     summary: Get valid category names
 *     tags: [Master Data]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Valid categories
 */
router.get('/valid-categories', ctrl.getValidCategories);

/** @swagger
 * /master-data/categories:
 *   get:
 *     summary: Get all categories that have data
 *     tags: [Master Data]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Categories list
 */
router.get('/categories', ctrl.getAllCategories);

/** @swagger
 * /master-data/all:
 *   get:
 *     summary: Get all master data grouped by category
 *     tags: [Master Data]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All data grouped
 */
router.get('/all', ctrl.getAllMasterData);

/** @swagger
 * /master-data/bulk:
 *   post:
 *     summary: Bulk create values for a category
 *     tags: [Master Data]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [category, values]
 *             properties:
 *               category:
 *                 type: string
 *                 example: BloodGroup
 *               values:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["A+","A-","B+","B-","O+","O-","AB+","AB-"]
 *     responses:
 *       201:
 *         description: Bulk created
 */
router.post('/bulk', authorize('admin', 'management', 'principal'), ctrl.bulkCreate);

/** @swagger
 * /master-data:
 *   post:
 *     summary: Create a single master data value
 *     tags: [Master Data]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [category, value]
 *             properties:
 *               category:
 *                 type: string
 *               value:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created
 *       409:
 *         description: Already exists
 */
router.post('/', authorize('admin', 'management', 'principal'), ctrl.createMasterData);

/** @swagger
 * /master-data:
 *   get:
 *     summary: Get values by category
 *     tags: [Master Data]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Values list
 */
router.get('/', ctrl.getAllByCategory);

/** @swagger
 * /master-data/{id}:
 *   put:
 *     summary: Update a master data value
 *     tags: [Master Data]
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
 *         description: Updated
 */
router.put('/:id', authorize('admin', 'management', 'principal'), ctrl.updateMasterData);

/** @swagger
 * /master-data/{id}:
 *   delete:
 *     summary: Delete a master data value
 *     tags: [Master Data]
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
 *         description: Deleted
 */
router.delete('/:id', authorize('admin', 'management', 'principal'), ctrl.deleteMasterData);

module.exports = router;
