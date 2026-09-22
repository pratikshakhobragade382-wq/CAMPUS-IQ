const router = require("express").Router();

const controller = require("./section.controller");

const auth = require("../../middleware/authMiddleware");

const authorize = require("../../middleware/authorize");

const validateRequest = require("../../middleware/validateRequest");

const {
  createSectionBody,
  updateSectionBody,
  sectionIdParam,
} = require("./section.validation");

/*
============================================================
GET ALL SECTIONS

GET /sections
GET /sections?classId=1
============================================================
*/
router.get(
  "/",
  auth,
  controller.getAllSections
);

/*
============================================================
CREATE SECTION

Example request body:

{
  "name": "A",
  "classId": 1,
  "classTeacherId": 15
}

classTeacherId is optional.
============================================================
*/
router.post(
  "/",
  auth,
  authorize(
    "admin",
    "management",
    "principal"
  ),
  validateRequest({
    body: createSectionBody,
  }),
  controller.createSection
);

/*
============================================================
GET SECTION BY ID
============================================================
*/
router.get(
  "/:id",
  auth,
  validateRequest({
    params: sectionIdParam,
  }),
  controller.getSectionById
);

/*
============================================================
UPDATE SECTION

Can update:

{
  "name": "A",
  "classId": 1,
  "classTeacherId": 15
}

To remove the class teacher, use:

{
  "classTeacherId": null
}
============================================================
*/
router.put(
  "/:id",
  auth,
  authorize(
    "admin",
    "management",
    "principal"
  ),
  validateRequest({
    params: sectionIdParam,
    body: updateSectionBody,
  }),
  controller.updateSection
);

/*
============================================================
REMOVE CLASS INCHARGE

DELETE /sections/:id/class-teacher
============================================================
*/
router.delete(
  "/:id/class-teacher",
  auth,
  authorize(
    "admin",
    "management",
    "principal"
  ),
  validateRequest({
    params: sectionIdParam,
  }),
  controller.removeClassTeacher
);

/*
============================================================
DELETE SECTION
============================================================
*/
router.delete(
  "/:id",
  auth,
  authorize(
    "admin",
    "management",
    "principal"
  ),
  validateRequest({
    params: sectionIdParam,
  }),
  controller.deleteSection
);

module.exports = router;