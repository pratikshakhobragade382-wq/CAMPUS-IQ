const express = require("express");
const router = express.Router();
const controller = require("./class.controller");
const auth = require('../../middleware/authMiddleware');
const authorize = require('../../middleware/authorize');
const validateRequest = require('../../middleware/validateRequest');
const {
	createClassBody,
	addSectionBody,
	classIdParam,
} = require('./class.validation');

/**
 * @openapi
 * /classes:
 *   post:
 *     summary: Create a new class
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Class 1"
 *     responses:
 *       201:
 *         description: Class created successfully
 *       400:
 *         description: Bad request
 */
router.post("/", auth, authorize('admin', 'management', 'principal'), validateRequest({ body: createClassBody }), controller.createClass);

/**
 * @openapi
 * /classes:
 *   get:
 *     summary: Get all classes
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of classes
 */
router.get("/", auth, controller.getClasses);

/**
 * @openapi
 * /classes/{classId}/sections:
 *   post:
 *     summary: Add section to a class
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "A"
 *     responses:
 *       201:
 *         description: Section created successfully
 */
router.post(
	"/:classId/sections",
	auth,
	authorize('admin', 'management', 'principal'),
	validateRequest({ params: classIdParam, body: addSectionBody }),
	controller.addSection
);

/**
 * @openapi
 * /classes/{classId}/sections:
 *   get:
 *     summary: Get sections of a class
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of sections
 */
router.get(
	"/:classId/sections",
	auth,
	validateRequest({ params: classIdParam }),
	controller.getSectionsByClass
);

module.exports = router;