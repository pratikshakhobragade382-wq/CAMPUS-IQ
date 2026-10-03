const express = require("express");

const router = express.Router();

const studentController = require("./student.controller");

const {
  uploadPhoto,
} = require("./student.photo.controller");

const authenticate = require("../../middleware/authMiddleware");

const authorize = require("../../middleware/authorize");

/*
===========================================================
AUTHENTICATION
===========================================================
*/

router.use(authenticate);

/*
===========================================================
UPLOAD STUDENT PHOTO
===========================================================

IMPORTANT:

This route MUST appear before:

/:id

because otherwise Express can interpret:

/upload-photo

as:

/:id
*/

router.post(
  "/upload-photo",

  authorize(
    "admin",
    "management",
    "principal",
    "staff"
  ),

  uploadPhoto
);

/*
===========================================================
CREATE STUDENT
===========================================================
*/

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

/*
===========================================================
GET ALL STUDENTS
===========================================================
*/

router.get(
  "/",

  studentController.getAllStudents
);

/*
===========================================================
GET STUDENT BY ID
===========================================================
*/

router.get(
  "/:id",

  studentController.getStudentById
);

/*
===========================================================
UPDATE STUDENT
===========================================================
*/

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

/*
===========================================================
DELETE STUDENT
===========================================================
*/

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

/*
===========================================================
RESET STUDENT PASSWORD
===========================================================
*/

router.post(
  "/:id/reset-password",

  authorize(
    "admin",
    "management",
    "principal"
  ),

  studentController.resetStudentPassword
);

/*
===========================================================
EXPORT
===========================================================
*/

module.exports = router;