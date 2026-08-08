const router = require("express").Router();
const controller = require("./section.controller");
const auth = require("../../middleware/authMiddleware");
const authorize = require('../../middleware/authorize');
const validateRequest = require('../../middleware/validateRequest');
const {
	createSectionBody,
	updateSectionBody,
	sectionIdParam,
} = require('./section.validation');

/**
 * @openapi
 * tags:
 *   name: Sections
 *   description: Section management APIs
 */

/**
 * @openapi
 * /sections:
 *   post:
 *     summary: Create a new section
 *     tags: [Sections]
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
 *               - classId
 *             properties:
 *               name:
 *                 type: string
 *                 example: "A"
 *               classId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Section created successfully
 *       500:
 *         description: Server error
 */
router.post(
	"/",
	auth,
	authorize('admin', 'management', 'principal'),
	validateRequest({ body: createSectionBody }),
	controller.createSection
);

/**
 * @openapi
 * /sections:
 *   get:
 *     summary: Get all sections
 *     tags: [Sections]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of sections
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   name:
 *                     type: string
 *                     example: "A"
 *                   classId:
 *                     type: integer
 *                     example: 1
 *       500:
 *         description: Server error
 */
router.get("/", auth, controller.getAllSections);

/**
 * @openapi
 * /sections/{id}:
 *   get:
 *     summary: Get section by ID
 *     tags: [Sections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Section details
 *       404:
 *         description: Section not found
 */
router.get(
	"/:id",
	auth,
	validateRequest({ params: sectionIdParam }),
	controller.getSectionById
);

/**
 * @openapi
 * /sections/{id}:
 *   put:
 *     summary: Update section
 *     tags: [Sections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "B"
 *               classId:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       200:
 *         description: Section updated
 *       500:
 *         description: Server error
 */
router.put(
	"/:id",
	auth,
	authorize('admin', 'management', 'principal'),
	validateRequest({ params: sectionIdParam, body: updateSectionBody }),
	controller.updateSection
);

/**
 * @openapi
 * /sections/{id}:
 *   delete:
 *     summary: Delete section
 *     tags: [Sections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Section deleted
 *       500:
 *         description: Server error
 */
router.delete(
	"/:id",
	auth,
	authorize('admin', 'management', 'principal'),
	validateRequest({ params: sectionIdParam }),
	controller.deleteSection
);

module.exports = router;