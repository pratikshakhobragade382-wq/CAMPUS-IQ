const express = require('express');
const router = express.Router();
const ctrl = require('./custom-fields.controller');
const authenticate = require('../../middleware/authMiddleware');
const authorize = require('../../middleware/authorize');

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Custom Fields
 *   description: Dynamic form field builder with dropdown options
 */

/**
 * @swagger
 * /custom-fields/forms:
 *   get:
 *     summary: Get all form names that have custom fields
 *     tags: [Custom Fields]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Forms list
 */
router.get('/forms', ctrl.getAllForms);

/**
 * @swagger
 * /custom-fields/values:
 *   post:
 *     summary: Save custom field values for a student
 *     tags: [Custom Fields]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [studentId, values]
 *             properties:
 *               studentId:
 *                 type: integer
 *                 example: 1
 *               values:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     customFieldId:
 *                       type: integer
 *                     value:
 *                       type: string
 *                 example: [{"customFieldId": 1, "value": "Some value"}]
 *     responses:
 *       200:
 *         description: Values saved
 */
router.post('/values', authorize('admin', 'management', 'principal', 'staff'), ctrl.saveFieldValues);

/**
 * @swagger
 * /custom-fields/values/{studentId}:
 *   get:
 *     summary: Get all custom field values for a student
 *     tags: [Custom Fields]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Values fetched
 */
router.get('/values/:studentId', ctrl.getFieldValues);

/**
 * @swagger
 * /custom-fields:
 *   post:
 *     summary: Create a custom field (with optional dropdown options)
 *     tags: [Custom Fields]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [formName, name, displayName, control]
 *             properties:
 *               formName:
 *                 type: string
 *                 example: "More Information"
 *               name:
 *                 type: string
 *                 example: "Category"
 *               displayName:
 *                 type: string
 *                 example: "Student Category"
 *               control:
 *                 type: string
 *                 enum: [TextBox, DropDown]
 *                 example: "DropDown"
 *               dataType:
 *                 type: string
 *                 example: "text"
 *               priority:
 *                 type: integer
 *                 example: 1
 *               maxLength:
 *                 type: integer
 *                 example: 100
 *               options:
 *                 type: array
 *                 description: Only for DropDown control
 *                 items:
 *                   type: object
 *                   properties:
 *                     label:
 *                       type: string
 *                     value:
 *                       type: string
 *                     priority:
 *                       type: integer
 *                 example: [{"label": "Option A", "value": "A", "priority": 1}, {"label": "Option B", "value": "B", "priority": 2}]
 *     responses:
 *       201:
 *         description: Custom field created
 *       409:
 *         description: Already exists
 */
router.post('/', authorize('admin', 'management', 'principal'), ctrl.createCustomField);

/**
 * @swagger
 * /custom-fields:
 *   get:
 *     summary: Get custom fields by form name (includes dropdown options)
 *     tags: [Custom Fields]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: formName
 *         required: true
 *         schema:
 *           type: string
 *         example: "More Information"
 *     responses:
 *       200:
 *         description: Fields with options
 */
router.get('/', ctrl.getFieldsByForm);

/**
 * @swagger
 * /custom-fields/{id}:
 *   put:
 *     summary: Update a custom field
 *     tags: [Custom Fields]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayName:
 *                 type: string
 *               control:
 *                 type: string
 *                 enum: [TextBox, DropDown]
 *               dataType:
 *                 type: string
 *               priority:
 *                 type: integer
 *               maxLength:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Updated
 *       404:
 *         description: Not found
 */
router.put('/:id', authorize('admin', 'management', 'principal'), ctrl.updateCustomField);

/**
 * @swagger
 * /custom-fields/{id}:
 *   delete:
 *     summary: Delete a custom field and all its options
 *     tags: [Custom Fields]
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
 *       404:
 *         description: Not found
 */
router.delete('/:id', authorize('admin', 'management', 'principal'), ctrl.deleteCustomField);

/**
 * @swagger
 * /custom-fields/{id}/options:
 *   post:
 *     summary: Add a single dropdown option to a field
 *     tags: [Custom Fields]
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
 *             required: [label, value]
 *             properties:
 *               label:
 *                 type: string
 *                 example: "Option A"
 *               value:
 *                 type: string
 *                 example: "A"
 *               priority:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Option added
 *       404:
 *         description: Field not found
 *       409:
 *         description: Option already exists
 */
router.post('/:id/options', authorize('admin', 'management', 'principal'), ctrl.addOption);

/**
 * @swagger
 * /custom-fields/{id}/options/bulk:
 *   post:
 *     summary: Bulk add dropdown options to a field
 *     tags: [Custom Fields]
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
 *             required: [options]
 *             properties:
 *               options:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     label:
 *                       type: string
 *                     value:
 *                       type: string
 *                     priority:
 *                       type: integer
 *                 example: [{"label": "Yes", "value": "yes", "priority": 1}, {"label": "No", "value": "no", "priority": 2}]
 *     responses:
 *       201:
 *         description: Options added
 *       404:
 *         description: Field not found
 */
router.post('/:id/options/bulk', authorize('admin', 'management', 'principal'), ctrl.bulkAddOptions);

/**
 * @swagger
 * /custom-fields/{id}/options/{optionId}:
 *   put:
 *     summary: Update a dropdown option
 *     tags: [Custom Fields]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: optionId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               label:
 *                 type: string
 *               value:
 *                 type: string
 *               priority:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Option updated
 *       404:
 *         description: Option not found
 */
router.put('/:id/options/:optionId', authorize('admin', 'management', 'principal'), ctrl.updateOption);

/**
 * @swagger
 * /custom-fields/{id}/options/{optionId}:
 *   delete:
 *     summary: Delete a dropdown option
 *     tags: [Custom Fields]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: optionId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Option deleted
 *       404:
 *         description: Option not found
 */
router.delete('/:id/options/:optionId', authorize('admin', 'management', 'principal'), ctrl.deleteOption);

module.exports = router;
