const classService = require("./class.service");

/**
 * ============================================================
 * CREATE CLASS
 * POST /api/classes
 * ============================================================
 */
exports.createClass = async (req, res, next) => {
  try {
    const { name, section } = req.body;

    const tenantId = req.user.tenantId;

    const newClass = await classService.createClass({
      name,
      section,
      tenantId,
    });

    return res.status(201).json({
      success: true,
      message: "Class created successfully",
      data: newClass,
    });
  } catch (error) {
    next(error);
  }
};


/**
 * ============================================================
 * GET ALL CLASSES
 * GET /api/classes
 * ============================================================
 */
exports.getClasses = async (req, res, next) => {
  try {
    const classes = await classService.getClasses({
      tenantId: req.user.tenantId,
    });

    return res.status(200).json({
      success: true,
      data: classes,
    });
  } catch (error) {
    next(error);
  }
};


/**
 * ============================================================
 * GET SINGLE CLASS
 * GET /api/classes/:classId
 * ============================================================
 */
exports.getClassById = async (req, res, next) => {
  try {
    const { classId } = req.params;

    const classData = await classService.getClassById({
      classId: Number(classId),
      tenantId: req.user.tenantId,
    });

    return res.status(200).json({
      success: true,
      data: classData,
    });
  } catch (error) {
    next(error);
  }
};


/**
 * ============================================================
 * UPDATE CLASS
 * PUT /api/classes/:classId
 * ============================================================
 */
exports.updateClass = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const { name, section } = req.body;

    const updatedClass = await classService.updateClass({
      classId: Number(classId),
      name,
      section,
      tenantId: req.user.tenantId,
    });

    return res.status(200).json({
      success: true,
      message: "Class updated successfully",
      data: updatedClass,
    });
  } catch (error) {
    next(error);
  }
};


/**
 * ============================================================
 * DELETE CLASS
 * DELETE /api/classes/:classId
 * ============================================================
 */
exports.deleteClass = async (req, res, next) => {
  try {
    const { classId } = req.params;

    const deletedClass = await classService.deleteClass({
      classId: Number(classId),
      tenantId: req.user.tenantId,
    });

    return res.status(200).json({
      success: true,
      message: "Class deleted successfully",
      data: deletedClass,
    });
  } catch (error) {
    next(error);
  }
};


/**
 * ============================================================
 * ADD SECTION
 * POST /api/classes/:classId/sections
 * ============================================================
 */
exports.addSection = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const { name } = req.body;

    const section = await classService.addSection({
      name,
      classId: Number(classId),
      tenantId: req.user.tenantId,
    });

    return res.status(201).json({
      success: true,
      message: "Section added successfully",
      data: section,
    });
  } catch (error) {
    next(error);
  }
};


/**
 * ============================================================
 * GET SECTIONS
 * GET /api/classes/:classId/sections
 * ============================================================
 */
exports.getSectionsByClass = async (req, res, next) => {
  try {
    const { classId } = req.params;

    const sections =
      await classService.getSectionsByClass(
        Number(classId),
        req.user.tenantId
      );

    return res.status(200).json({
      success: true,
      data: sections,
    });
  } catch (error) {
    next(error);
  }
};

   /**
 * ============================================================
 * GET STUDENTS BY SECTION
 * GET /classes/:classId/sections/:sectionId/students
 * ============================================================
 */
exports.getStudentsBySection = async (
  req,
  res,
  next
) => {
  try {
    const {
      classId,
      sectionId,
    } = req.params;

    const result =
      await classService.getStudentsBySection({
        classId: Number(classId),
        sectionId: Number(sectionId),
        tenantId: req.user.tenantId,
      });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};