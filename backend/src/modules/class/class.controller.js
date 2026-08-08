const classService = require("./class.service");

// CREATE CLASS
exports.createClass = async (req, res, next) => {
  try {
    const { name } = req.body;

    // Tenant id must come from the verified JWT to preserve tenant isolation.
    const tenantId = req.user.tenantId;

    const newClass = await classService.createClass({
      name,
      tenantId,
    });

    res.status(201).json({
      success: true,
      data: newClass,
    });

  } catch (error) {
    next(error);
  }
};


// GET CLASSES
exports.getClasses = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;

    const classes = await classService.getClasses(tenantId);

    res.status(200).json({
      success: true,
      data: classes,
    });

  } catch (error) {
    next(error);
  }
};


// ADD SECTION
exports.addSection = async (req, res, next) => {
  try {
    const { name } = req.body;
    const { classId } = req.params;

    const tenantId = req.user.tenantId;

    const section = await classService.addSection({
      name,
      classId: Number(classId),
      tenantId,
    });

    res.status(201).json({
      success: true,
      data: section,
    });

  } catch (error) {
    next(error);
  }
};


// GET SECTIONS BY CLASS
exports.getSectionsByClass = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const tenantId = req.user.tenantId;

    const sections = await classService.getSectionsByClass(
      Number(classId),
      tenantId
    );

    res.status(200).json({
      success: true,
      data: sections,
    });

  } catch (error) {
    next(error);
  }
};