const express = require("express");
const router = express.Router();
const controller = require("./substitution.controller");
const authenticate = require("../../middleware/authMiddleware");
const authorize = require("../../middleware/authorize");

router.use(authenticate);

/*
 * GET /api/v1/substitution/available/:timetableId?date=YYYY-MM-DD
 * Any authenticated staff can check availability (teacher requesting cover, or admin arranging one)
 */
router.get("/available/:timetableId", controller.getAvailableSubstitutes);

/*
 * POST /api/v1/substitution
 * body: { timetableId, date, substituteStaffId, remark? }
 * Teachers can arrange their own cover; admins can arrange for anyone
 */
router.post(
  "/",
  authorize("admin", "management", "principal", "teacher"),
  controller.assignSubstitute
);

/*
 * DELETE /api/v1/substitution/:id
 */
router.delete(
  "/:id",
  authorize("admin", "management", "principal", "teacher"),
  controller.cancelSubstitution
);

/*
 * GET /api/v1/substitution/mine?date=YYYY-MM-DD
 */
router.get("/mine", controller.getMySubstitutions);

module.exports = router;
