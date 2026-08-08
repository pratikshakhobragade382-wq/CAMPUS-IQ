const service = require("./subject.service");

exports.create = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId; // 👈 get from JWT
    const subject = await service.createSubject({
      ...req.body,
      tenantId,             // 👈 inject it
    });
    res.status(201).json({ success: true, data: subject });
  } catch (err) {
    next(err);
  }
};

exports.getAll = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const subjects = await service.getAllSubjects(tenantId); // 👈 pass tenantId
    res.json({ success: true, data: subjects });
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const subject = await service.getSubjectById(req.params.id, tenantId);
    res.json({ success: true, data: subject });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const subject = await service.updateSubject(req.params.id, req.body, tenantId);
    res.json({ success: true, data: subject });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    await service.deleteSubject(req.params.id, tenantId);
    res.json({ success: true, message: "Deleted successfully" });
  } catch (err) {
    next(err);
  }
};