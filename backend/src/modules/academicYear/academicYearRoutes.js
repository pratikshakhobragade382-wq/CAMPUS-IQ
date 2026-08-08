const express = require('express');
const router = express.Router();

const ctrl = require('./academicYearController');
const authMiddleware = require('../../middleware/authMiddleware');
const authorize = require('../../middleware/authorize');

router.use(authMiddleware);

/**
 * CREATE ACADEMIC YEAR
 *
 * POST /api/v1/academic-years
 *
 * Body:
 * {
 *   "startDate": "2026-06-01",
 *   "endDate": "2027-05-31",
 *   "isActive": true
 * }
 *
 * Academic year name is generated automatically.
 */
router.post(
  '/',
  authorize(
    'admin',
    'management',
    'principal'
  ),
  ctrl.createAcademicYear
);

/**
 * GET ALL ACADEMIC YEARS
 *
 * GET /api/v1/academic-years
 */
router.get(
  '/',
  ctrl.getAcademicYears
);

/**
 * GET ACTIVE ACADEMIC YEAR
 *
 * GET /api/v1/academic-years/active
 */
router.get(
  '/active',
  ctrl.getActiveAcademicYear
);

/**
 * ACTIVATE ACADEMIC YEAR
 *
 * PATCH /api/v1/academic-years/:id/activate
 */
router.patch(
  '/:id/activate',
  authorize(
    'admin',
    'management',
    'principal'
  ),
  ctrl.activateAcademicYear
);

/**
 * UPDATE ACADEMIC YEAR
 *
 * PUT /api/v1/academic-years/:id
 *
 * Body example:
 * {
 *   "startDate": "2027-06-01",
 *   "endDate": "2028-05-31",
 *   "isActive": true
 * }
 *
 * Name is regenerated automatically.
 */
router.put(
  '/:id',
  authorize(
    'admin',
    'management',
    'principal'
  ),
  ctrl.updateAcademicYear
);

/**
 * DELETE ACADEMIC YEAR
 *
 * DELETE /api/v1/academic-years/:id
 */
router.delete(
  '/:id',
  authorize(
    'admin',
    'management',
    'principal'
  ),
  ctrl.deleteAcademicYear
);

module.exports = router;