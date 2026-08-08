const service = require("./section.service");

exports.createSection = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const section = await service.createSection({
      ...req.body,
      tenantId,
    });
    res.status(201).json({ success: true, data: section });
  } catch (err) {
    next(err);
  }
};

exports.getAllSections = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const sections = await service.getAllSections(tenantId);
    res.json({ success: true, data: sections });
  } catch (err) {
    next(err);
  }
};

exports.getSectionById = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const section = await service.getSectionById(req.params.id, tenantId);
    res.json({ success: true, data: section });
  } catch (err) {
    next(err);
  }
};

exports.updateSection = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const section = await service.updateSection(req.params.id, req.body, tenantId);
    res.json({ success: true, data: section });
  } catch (err) {
    next(err);
  }
};

exports.deleteSection = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    await service.deleteSection(req.params.id, tenantId);
    res.json({ success: true, message: "Deleted successfully" });
  } catch (err) {
    next(err);
  }
};