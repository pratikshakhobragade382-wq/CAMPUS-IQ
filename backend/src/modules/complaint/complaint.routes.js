const express = require("express");

const router = express.Router();

const controller = require("./complaint.controller");

const authenticate = require("../../middleware/authMiddleware");
const authorize = require("../../middleware/authorize");

const parentOnly = authorize("parent");

const adminOnly = authorize(
  "admin",
  "principal",
  "management"
);

router.use(authenticate);

// =====================================================
// PARENT
// =====================================================

// POST /api/v1/complaints
router.post(
  "/",
  parentOnly,
  controller.createComplaint
);

// GET /api/v1/complaints/my
router.get(
  "/my",
  parentOnly,
  controller.listMyComplaints
);

// GET /api/v1/complaints/my/:id
router.get(
  "/my/:id",
  parentOnly,
  controller.getMyComplaint
);

// =====================================================
// ADMIN
// =====================================================

// Fixed paths must come before "/:id".

// GET /api/v1/complaints/analytics
router.get(
  "/analytics",
  adminOnly,
  controller.getAnalytics
);

// GET /api/v1/complaints
router.get(
  "/",
  adminOnly,
  controller.listComplaints
);

// GET /api/v1/complaints/:id
router.get(
  "/:id",
  adminOnly,
  controller.getComplaint
);

// PATCH /api/v1/complaints/:id
router.patch(
  "/:id",
  adminOnly,
  controller.updateComplaint
);

// POST /api/v1/complaints/:id/suggestion
router.post(
  "/:id/suggestion",
  adminOnly,
  controller.decideSuggestion
);

// POST /api/v1/complaints/:id/generate-reply
router.post(
  "/:id/generate-reply",
  adminOnly,
  controller.generateReply
);

// POST /api/v1/complaints/:id/reply
router.post(
  "/:id/reply",
  adminOnly,
  controller.sendReply
);

// POST /api/v1/complaints/:id/reanalyze
router.post(
  "/:id/reanalyze",
  adminOnly,
  controller.reanalyze
);

module.exports = router;