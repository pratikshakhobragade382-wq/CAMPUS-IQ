const svc = require('./academicYearService');

/**
 * CREATE ACADEMIC YEAR
 */
exports.createAcademicYear = async (req, res, next) => {
  try {
    const {
      startDate,
      endDate,
      isActive = false,
    } = req.body;

    if (!startDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date is required',
      });
    }

    if (!endDate) {
      return res.status(400).json({
        success: false,
        error: 'End date is required',
      });
    }

    const data = await svc.createAcademicYear({
      startDate,
      endDate,
      isActive,
      tenantId: req.user.tenantId,
    });

    return res.status(201).json({
      success: true,
      message: 'Academic session created',
      data,
    });
  } catch (e) {
    next(e);
  }
};

/**
 * GET ALL ACADEMIC YEARS
 */
exports.getAcademicYears = async (req, res, next) => {
  try {
    const data = await svc.getAcademicYears(
      req.user.tenantId
    );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (e) {
    next(e);
  }
};

/**
 * GET ACTIVE ACADEMIC YEAR
 */
exports.getActiveAcademicYear = async (
  req,
  res,
  next
) => {
  try {
    const data = await svc.getActiveYear(
      req.user.tenantId
    );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (e) {
    next(e);
  }
};

/**
 * ACTIVATE ACADEMIC YEAR
 */
exports.activateAcademicYear = async (
  req,
  res,
  next
) => {
  try {
    const data =
      await svc.activateAcademicYear(
        req.params.id,
        req.user.tenantId
      );

    return res.status(200).json({
      success: true,
      message: 'Session activated',
      data,
    });
  } catch (e) {
    next(e);
  }
};

/**
 * UPDATE ACADEMIC YEAR
 */
exports.updateAcademicYear = async (
  req,
  res,
  next
) => {
  try {
    const data =
      await svc.updateAcademicYear(
        req.params.id,
        req.body,
        req.user.tenantId
      );

    return res.status(200).json({
      success: true,
      message: 'Session updated',
      data,
    });
  } catch (e) {
    next(e);
  }
};

/**
 * DELETE ACADEMIC YEAR
 */
exports.deleteAcademicYear = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await svc.deleteAcademicYear(
        req.params.id,
        req.user.tenantId
      );

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (e) {
    next(e);
  }
};