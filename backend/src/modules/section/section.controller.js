const service = require("./section.service");

/*
============================================================
CREATE SECTION
============================================================
*/
exports.createSection = async (
  req,
  res,
  next
) => {
  try {
    const tenantId = req.user.tenantId;

    const section =
      await service.createSection({
        ...req.body,
        tenantId,
      });

    return res.status(201).json({
      success: true,
      data: section,
    });
  } catch (err) {
    next(err);
  }
};

/*
============================================================
GET ALL SECTIONS
============================================================
*/
exports.getAllSections = async (
  req,
  res,
  next
) => {
  try {
    const tenantId = req.user.tenantId;

    const {
      classId,
    } = req.query;

    const sections =
      await service.getAllSections(
        tenantId,
        classId
      );

    return res.json({
      success: true,
      data: sections,
    });
  } catch (err) {
    next(err);
  }
};

/*
============================================================
GET SECTION BY ID
============================================================
*/
exports.getSectionById = async (
  req,
  res,
  next
) => {
  try {
    const tenantId = req.user.tenantId;

    const section =
      await service.getSectionById(
        req.params.id,
        tenantId
      );

    return res.json({
      success: true,
      data: section,
    });
  } catch (err) {
    next(err);
  }
};

/*
============================================================
UPDATE SECTION
============================================================
*/
exports.updateSection = async (
  req,
  res,
  next
) => {
  try {
    const tenantId = req.user.tenantId;

    const section =
      await service.updateSection(
        req.params.id,
        req.body,
        tenantId
      );

    return res.json({
      success: true,
      message:
        "Section updated successfully",
      data: section,
    });
  } catch (err) {
    next(err);
  }
};

/*
============================================================
REMOVE CLASS INCHARGE
============================================================
*/
exports.removeClassTeacher = async (
  req,
  res,
  next
) => {
  try {
    const tenantId = req.user.tenantId;

    const section =
      await service.removeClassTeacher(
        req.params.id,
        tenantId
      );

    return res.json({
      success: true,
      message:
        "Class incharge removed successfully",
      data: section,
    });
  } catch (err) {
    next(err);
  }
};

/*
============================================================
DELETE SECTION
============================================================
*/
exports.deleteSection = async (
  req,
  res,
  next
) => {
  try {
    const tenantId = req.user.tenantId;

    await service.deleteSection(
      req.params.id,
      tenantId
    );

    return res.json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};