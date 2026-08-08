// department.service.js
const prisma = require("../../prisma/prismaClient");


exports.createDepartment = async ({ name, tenantId }) => {
  return await prisma.department.create({
    data: {
      name,
      tenantId,
    },
  });
};

exports.getDepartments = async (tenantId) => {
  return await prisma.department.findMany({
    where: { tenantId },
    orderBy: { name: "asc" }
  });
};