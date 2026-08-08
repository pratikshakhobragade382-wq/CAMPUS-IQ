// department.controller.js
const service = require("./department.service");

exports.createDepartment = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;

    const dept = await service.createDepartment({
      name: req.body.name,
      tenantId,
    });

    res.status(201).json({
      success: true,
      data: dept,
    });
  } catch (err) {
    next(err);
  }
};

exports.getDepartments = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;

    const data = await service.getDepartments(tenantId);

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};