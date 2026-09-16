const express = require("express");

const router = express.Router();

const performanceController = require("./performance.controller");

router.get(
  "/performance",
  performanceController.getPerformance
);

module.exports = router;