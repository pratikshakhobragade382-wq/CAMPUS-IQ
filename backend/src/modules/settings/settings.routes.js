const express = require("express");
const router = express.Router();

const controller = require("./settings.controller");
const auth = require("../../middleware/authMiddleware");
const authorize = require("../../middleware/authorize");
const validateRequest = require("../../middleware/validateRequest");

const {
  updateSchoolBody,
  updatePreferencesBody,
  updateProfileBody,
  changePasswordBody,
} = require("./settings.validation");

/**
 * ============================================================
 * SCHOOL INFO — admin only
 * ============================================================
 */
router.get("/school", auth, authorize("admin"), controller.getSchoolInfo);

router.put(
  "/school",
  auth,
  authorize("admin"),
  validateRequest({ body: updateSchoolBody }),
  controller.updateSchoolInfo
);

/**
 * ============================================================
 * APP PREFERENCES — admin only
 * ============================================================
 */
router.get("/preferences", auth, authorize("admin"), controller.getPreferences);

router.put(
  "/preferences",
  auth,
  authorize("admin"),
  validateRequest({ body: updatePreferencesBody }),
  controller.updatePreferences
);

/**
 * ============================================================
 * MY PROFILE — any authenticated user
 * ============================================================
 */
router.get("/profile", auth, controller.getProfile);

router.put(
  "/profile",
  auth,
  validateRequest({ body: updateProfileBody }),
  controller.updateProfile
);

/**
 * ============================================================
 * CHANGE PASSWORD — any authenticated user
 * ============================================================
 */
router.put(
  "/password",
  auth,
  validateRequest({ body: changePasswordBody }),
  controller.changePassword
);

module.exports = router;
