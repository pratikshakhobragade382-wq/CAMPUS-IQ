const express = require("express");

const router = express.Router();

const controller = require("./timetable.controller");

const authenticate = require("../../middleware/authMiddleware");
const authorize = require("../../middleware/authorize");

/* ============================================================
   AUTHENTICATION
============================================================ */

router.use(authenticate);

/* ============================================================
   TIME SLOTS
============================================================ */

/*
 * Create time
 *
 * POST /api/v1/timetable/period-slots
 */
router.post(
  "/period-slots",
  authorize(
    "admin",
    "management",
    "principal"
  ),
  controller.createPeriodSlot
);

/*
 * Get times
 *
 * GET /api/v1/timetable/period-slots
 */
router.get(
  "/period-slots",
  controller.getAllPeriodSlots
);

/*
 * Update time
 */
router.put(
  "/period-slots/:id",
  authorize(
    "admin",
    "management",
    "principal"
  ),
  controller.updatePeriodSlot
);

/*
 * Delete time
 */
router.delete(
  "/period-slots/:id",
  authorize(
    "admin",
    "management",
    "principal"
  ),
  controller.deletePeriodSlot
);

/*
 * Optional default time setup.
 */
router.post(
  "/period-slots/seed",
  authorize(
    "admin",
    "management",
    "principal"
  ),
  controller.seedDefaultSlots
);

/* ============================================================
   CREATE TIMETABLE
============================================================ */

/*
 * POST
 *
 * Admin creates a timetable.
 */
router.post(
  "/",
  authorize(
    "admin",
    "management",
    "principal"
  ),
  controller.createTimetableEntry
);

/* ============================================================
   VIEW CLASS TIMETABLE
============================================================ */

/*
 * Supports BOTH:
 *
 * Old:
 *   /timetable/class?classId=1
 *
 * New:
 *   /timetable/class?className=10th
 */
router.get(
  "/class",
  controller.getClassTimetable
);

/* ============================================================
   VIEW TEACHER TIMETABLE
============================================================ */

/*
 * Supports:
 *
 * staffId
 * teacherName
 * academicYearName
 */
router.get(
  "/teacher",
  controller.getTeacherTimetable
);

/* ============================================================
   UPDATE TIMETABLE
============================================================ */

router.put(
  "/:id",
  authorize(
    "admin",
    "management",
    "principal"
  ),
  controller.updateTimetableEntry
);

/* ============================================================
   DELETE TIMETABLE
============================================================ */

router.delete(
  "/:id",
  authorize(
    "admin",
    "management",
    "principal"
  ),
  controller.deleteTimetableEntry
);

module.exports = router;