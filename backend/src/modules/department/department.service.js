const prisma = require("../../prisma/prismaClient");

/**
 * Create Department
 *
 * If a department with the same name already exists but was
 * soft-deleted, restore that department instead of creating
 * a duplicate record.
 */
exports.createDepartment = async ({ name, tenantId }) => {
  const existingDepartment = await prisma.department.findFirst({
    where: {
      name,
      tenantId,
    },
  });

  // Restore previously soft-deleted department
  if (existingDepartment?.isDeleted) {
    return await prisma.department.update({
      where: {
        id: existingDepartment.id,
      },
      data: {
        isDeleted: false,
      },
    });
  }

  // Department already exists and is active
  if (existingDepartment) {
    const error = new Error("Department already exists.");
    error.statusCode = 409;
    throw error;
  }

  // Create a completely new department
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

  // Check whether another department already uses this name
  const existingDepartment = await prisma.department.findFirst({
    where: {
      name,
      tenantId,
      id: {
        not: id,
      },
    },
  });

  if (existingDepartment) {
    const error = new Error("Department already exists.");
    error.statusCode = 409;
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