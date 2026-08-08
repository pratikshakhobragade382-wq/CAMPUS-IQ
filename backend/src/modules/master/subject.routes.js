const express = require("express");
const router = express.Router();

const controller = require("./subject.controller");

const auth = require("../../middleware/authMiddleware");
const authorize = require('../../middleware/authorize');
const validateRequest = require('../../middleware/validateRequest');
const {
	createSubjectBody,
	updateSubjectBody,
	subjectIdParam,
} = require('./subject.validation');

/**
 * @openapi
 * /subjects:
 *   post:
 *     summary: Create Subject
 *     tags: [Master]
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
 *               - code
 *             properties:
 *               name:
 *                 type: string
 *                 example: Mathematics
 *               code:
 *                 type: string
 *                 example: MATH101
 *     responses:
 *       201:
 *         description: Subject created successfully
 */
router.post(
	"/",
	auth,
	authorize('admin', 'management', 'principal'),
	validateRequest({ body: createSubjectBody }),
	controller.create
);

/**
 * @openapi
 * /subjects:
 *   get:
 *     summary: Get all Subjects
 *     tags: [Master]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of subjects
 */
router.get("/", auth, controller.getAll);

/**
 * @openapi
 * /subjects/{id}:
 *   get:
 *     summary: Get Subject by ID
 *     tags: [Master]
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
 *         description: Subject details
 */
router.get(
	"/:id",
	auth,
	validateRequest({ params: subjectIdParam }),
	controller.getById
);

/**
 * @openapi
 * /subjects/{id}:
 *   put:
 *     summary: Update Subject
 *     tags: [Master]
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
 *             properties:
 *               name:
 *                 type: string
 *                 example: Physics
 *               code:
 *                 type: string
 *                 example: PHY101
 *     responses:
 *       200:
 *         description: Updated successfully
 */
router.put(
	"/:id",
	auth,
	authorize('admin', 'management', 'principal'),
	validateRequest({ params: subjectIdParam, body: updateSubjectBody }),
	controller.update
);

/**
 * @openapi
 * /subjects/{id}:
 *   delete:
 *     summary: Delete Subject
 *     tags: [Master]
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
 *         description: Deleted successfully
 */
router.delete(
	"/:id",
	auth,
	authorize('admin', 'management', 'principal'),
	validateRequest({ params: subjectIdParam }),
	controller.remove
);

module.exports = router;