const router = require("express").Router();

const controller = require("./department.controller");
const auth = require("../../middleware/authMiddleware");
const authorize = require("../../middleware/authorize");
const validateRequest = require("../../middleware/validateRequest");
const { createDepartmentBody } = require("./department.validation");

/**
 * Create Department
 */
router.post(
  "/",
  auth,
  authorize("admin", "management", "principal"),
  validateRequest({ body: createDepartmentBody }),
  controller.createDepartment
);

/**
 * Get all Departments
 */
router.get(
  "/",
  auth,
  controller.getDepartments
);

/**
 * Get Department by ID
 */
router.get(
  "/:id",
  auth,
  controller.getDepartmentById
);

/**
 * Update Department
 */
router.put(
  "/:id",
  auth,
  authorize("admin", "management", "principal"),
  validateRequest({ body: createDepartmentBody }),
  controller.updateDepartment
);

/**
 * Delete Department
 */
router.delete(
  "/:id",
  auth,
  authorize("admin", "management", "principal"),
  controller.deleteDepartment
);

module.exports = router;