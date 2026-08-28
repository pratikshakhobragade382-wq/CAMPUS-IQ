
const express = require("express");

const router = express.Router();

const controller = require("./class.controller");

const auth = require("../../middleware/authMiddleware");
const authorize = require("../../middleware/authorize");
const validateRequest = require("../../middleware/validateRequest");

const {
  createClassBody,
  updateClassBody,
  addSectionBody,
  classIdParam,
} = require("./class.validation");

/**
 * ============================================================
 * CREATE CLASS
 * POST /classes
 * ============================================================
 */
router.post(
  "/",
  auth,
  authorize(
    "admin",
    "management",
    "principal",
    "teacher"
  ),
  validateRequest({
    body: createClassBody,
  }),
  controller.createClass
);

/**
 * ============================================================
 * GET ALL CLASSES
 * GET /classes
 * ============================================================
 */
router.get(
  "/",
  auth,
  controller.getClasses
);

/**
 * ============================================================
 * GET SINGLE CLASS
 * GET /classes/:classId
 * ============================================================
 */
router.get(
  "/:classId",
  auth,
  validateRequest({
    params: classIdParam,
  }),
  controller.getClassById
);

/**
 * ============================================================
 * UPDATE CLASS
 * PUT /classes/:classId
 * ============================================================
 */
router.put(
  "/:classId",
  auth,
  authorize(
    "admin",
    "management",
    "principal"
  ),
  validateRequest({
    params: classIdParam,
    body: updateClassBody,
  }),
  controller.updateClass
);

/**
 * ============================================================
 * DELETE CLASS
 * DELETE /classes/:classId
 * ============================================================
 */
router.delete(
  "/:classId",
  auth,
  authorize(
    "admin",
    "management",
    "principal"
  ),
  validateRequest({
    params: classIdParam,
  }),
  controller.deleteClass
);

/**
 * ============================================================
 * ADD SECTION
 * POST /classes/:classId/sections
 * ============================================================
 */
router.post(
  "/:classId/sections",
  auth,
  authorize(
    "admin",
    "management",
    "principal",
    "teacher"
  ),
  validateRequest({
    params: classIdParam,
    body: addSectionBody,
  }),
  controller.addSection
);

/**
 * ============================================================
 * GET STUDENTS BY SECTION
 * GET /classes/:classId/sections/:sectionId/students
 * ============================================================
 */
router.get(
  "/:classId/sections/:sectionId/students",
  auth,
  controller.getStudentsBySection
);

/**
 * ============================================================
 * EXPORT ROUTER
 * ============================================================
 *
 * VERY IMPORTANT:
 * The routes/index.js file expects this file to export
 * an Express router.
 *
 * Without this line:
 *
 * module.exports = router;
 *
 * Express receives an object instead of a router and gives:
 *
 * Router.use() requires a middleware function but got an Object
 *
 * ============================================================
 */
module.exports = router;

