const service = require("./department.service");

/**
 * Create Department
 */
exports.createDepartment = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;

    const name = req.body.name?.trim();

    if (!name) {
      const error = new Error("Department name is required.");
      error.statusCode = 400;
      throw error;
    }

    const dept = await service.createDepartment({
      name,
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

/**
 * Get all Departments
 */
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

/**
 * Get Department by ID
 */
exports.getDepartmentById = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      const error = new Error("Invalid department ID.");
      error.statusCode = 400;
      throw error;
    }

    const department = await service.getDepartmentById({
      id,
      tenantId,
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        error: "Department not found.",
      });
    }

    res.json({
      success: true,
      data: department,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update Department
 */
exports.updateDepartment = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      const error = new Error("Invalid department ID.");
      error.statusCode = 400;
      throw error;
    }

    const name = req.body.name?.trim();

    if (!name) {
      const error = new Error("Department name is required.");
      error.statusCode = 400;
      throw error;
    }

    const department = await service.updateDepartment({
      id,
      name,
      tenantId,
    });

    res.json({
      success: true,
      data: department,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete Department
 */
exports.deleteDepartment = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      const error = new Error("Invalid department ID.");
      error.statusCode = 400;
      throw error;
    }

    await service.deleteDepartment({
      id,
      tenantId,
    });

    res.json({
      success: true,
      message: "Department deleted successfully.",
    });
  } catch (err) {
    next(err);
  }
};