const express = require("express");
const router = express.Router();

const studentController = require("./student.controller");
const authenticate = require("../../middleware/authMiddleware");
const authorize = require("../../middleware/authorize");

// =====================================================
// AUTHENTICATION
// =====================================================

router.use(authenticate);

// =====================================================
// CREATE STUDENT
// =====================================================

router.post(
  "/",
  authorize(
    "admin",
    "management",
    "principal",
    "staff"
  ),
  studentController.createStudent
);

// =====================================================
// GET ALL STUDENTS
// =====================================================

router.get(
  "/",
  studentController.getAllStudents
);

// =====================================================
// GET STUDENT BY ID
// =====================================================

router.get(
  "/:id",
  studentController.getStudentById
);

// =====================================================
// UPDATE STUDENT
// =====================================================

router.put(
  "/:id",
  authorize(
    "admin",
    "management",
    "principal",
    "staff"
  ),
  studentController.updateStudent
);

// =====================================================
// DELETE STUDENT
// =====================================================

router.delete(
  "/:id",
  authorize(
    "admin",
    "management",
    "principal",
    "staff"
  ),
  studentController.deleteStudent
);

// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;