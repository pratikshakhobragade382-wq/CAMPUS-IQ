const router = require("express").Router();
const controller = require("./department.controller");
const auth = require("../../middleware/authMiddleware");
const authorize = require('../../middleware/authorize');
const validateRequest = require('../../middleware/validateRequest');
const { createDepartmentBody } = require('./department.validation');

/**
 * @openapi
 * /departments:
 *   post:
 *     summary: Create a new department
 *     tags: [Departments]
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
 *                 example: Science
 *     responses:
 *       201:
 *         description: Department created successfully
 */
router.post(
	"/",
	auth,
	authorize('admin', 'management', 'principal'),
	validateRequest({ body: createDepartmentBody }),
	controller.createDepartment
);

/**
 * @openapi
 * /departments:
 *   get:
 *     summary: Get all departments
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of departments
 */
router.get("/", auth, controller.getDepartments);

module.exports = router;