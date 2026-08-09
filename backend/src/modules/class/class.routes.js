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
  authorize("admin", "management", "principal"),
  validateRequest({ body: createClassBody }),
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
  validateRequest({ params: classIdParam }),
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
  authorize("admin", "management", "principal"),
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
 *
 * Soft delete
 * ============================================================
 */
router.delete(
  "/:classId",
  auth,
  authorize("admin", "management", "principal"),
  validateRequest({ params: classIdParam }),
  controller.deleteClass
);

/**
 * ============================================================
 * ADD SECTION TO CLASS
 * POST /classes/:classId/sections
 * ============================================================
 */
router.post(
  "/:classId/sections",
  auth,
  authorize("admin", "management", "principal"),
  validateRequest({
    params: classIdParam,
    body: addSectionBody,
  }),
  controller.addSection
);

/**
 * ============================================================
 * GET SECTIONS OF CLASS
 * GET /classes/:classId/sections
 * ============================================================
 */
router.get(
  "/:classId/sections",
  auth,
  validateRequest({ params: classIdParam }),
  controller.getSectionsByClass
);

module.exports = router;