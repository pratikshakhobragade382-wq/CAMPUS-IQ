const prisma = require("../../prisma/prismaClient");

/**
 * Create Department
 */
exports.createDepartment = async ({ name, tenantId }) => {
  return await prisma.department.create({
    data: {
      name,
      tenantId,
    },
  });
};

/**
 * Get all Departments
 */
exports.getDepartments = async (tenantId) => {
  return await prisma.department.findMany({
    where: {
      tenantId,
      isDeleted: false,
    },
    orderBy: {
      name: "asc",
    },
  });
};

/**
 * Get Department by ID
 */
exports.getDepartmentById = async ({ id, tenantId }) => {
  return await prisma.department.findFirst({
    where: {
      id,
      tenantId,
      isDeleted: false,
    },
  });
};

/**
 * Update Department
 */
exports.updateDepartment = async ({ id, name, tenantId }) => {
  const department = await prisma.department.findFirst({
    where: {
      id,
      tenantId,
      isDeleted: false,
    },
  });

  if (!department) {
    const error = new Error("Department not found.");
    error.statusCode = 404;
    throw error;
  }

  return await prisma.department.update({
    where: {
      id,
    },
    data: {
      name,
    },
  });
};

/**
 * Delete Department
 *
 * Soft delete is used because the Department model
 * contains an isDeleted field.
 */
exports.deleteDepartment = async ({ id, tenantId }) => {
  const department = await prisma.department.findFirst({
    where: {
      id,
      tenantId,
      isDeleted: false,
    },
  });

  if (!department) {
    const error = new Error("Department not found.");
    error.statusCode = 404;
    throw error;
  }

  return await prisma.department.update({
    where: {
      id,
    },
    data: {
      isDeleted: true,
    },
  });
};