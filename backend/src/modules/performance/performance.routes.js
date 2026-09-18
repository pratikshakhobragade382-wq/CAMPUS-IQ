const express = require("express");

const router = express.Router();

const performanceController =
  require("./performance.controller");

const authenticate =
  require("../../middleware/authMiddleware");

const authorize =
  require("../../middleware/authorize");

/*
============================================================
 PARENT PERFORMANCE AUTHENTICATION
============================================================

 Every performance request must:

 1. Have a valid JWT
 2. Belong to a parent account

============================================================
*/

router.use(authenticate);

router.use(
  authorize("parent")
);

/*
============================================================
 GET PARENT PERFORMANCE
============================================================

 GET:

 /api/v1/parents/performance

 Optional:

 ?academicYearId=1

============================================================
*/

router.get(
  "/performance",
  performanceController.getPerformance
);

module.exports = router;