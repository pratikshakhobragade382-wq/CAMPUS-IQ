const express = require('express');
const router = express.Router();
const authController = require('./authController');
const validateRequest = require('../../middleware/validateRequest');
const { registerBody, loginBody } = require('./auth.validation');
const authMiddleware = require('../../middleware/authMiddleware');
const authorize = require('../../middleware/authorize');
const optionalAuth = require('../../middleware/optionalAuth');
const requireRegistrationKey = require('../../middleware/requireRegistrationKey');

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - tenantId
 *               - identity
 *             properties:
 *               name:
 *                 type: string
 *                 example: Dipesh
 *               email:
 *                 type: string
 *                 example: test@gmail.com
 *               password:
 *                 type: string
 *                 example: "123456"
 *               tenantId:
 *                 type: integer
 *                 example: 1
 *               identity:
 *                 type: string
 *                 example: admin
 *     responses:
 *       200:
 *         description: User registered successfully
 *       400:
 *         description: Bad request
 */
router.post(
        '/register',
        requireRegistrationKey,
        optionalAuth,
        validateRequest({ body: registerBody }),
        authController.register
);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - tenantId
 *             properties:
 *               email:
 *                 type: string
 *                 example: test@gmail.com
 *               password:
 *                 type: string
 *                 example: "123456"
 *               tenantId:
 *                 type: string
 *                 example: "1"
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', validateRequest({ body: loginBody }), authController.login);

module.exports = router;
