const prisma = require('../../prisma/prismaClient');
const { HttpError } = require('../../utils/httpError');

// CREATE CLASS
exports.createClass = async ({ name, tenantId }) => {
  return await prisma.class.create({
    data: { name, tenantId },
  });
};

// GET ALL CLASSES
exports.getClasses = async (tenantId) => {
  return await prisma.class.findMany({
    where: { tenantId, isDeleted: false },
    include: { sections: { where: { isDeleted: false } } },
    orderBy: { createdAt: 'desc' },
  });
};

// ADD SECTION TO CLASS
exports.addSection = async ({ name, classId, tenantId }) => {
  // Ensure the class belongs to this tenant to prevent cross-tenant writes.
  const klass = await prisma.class.findFirst({
    where: { id: Number(classId), tenantId, isDeleted: false },
    select: { id: true },
  });

  if (!klass) {
    throw new HttpError(400, 'Invalid classId for this tenant', { code: 'INVALID_REFERENCE' });
  }

  return await prisma.section.create({
    data: { name, classId, tenantId },
  });
};

// GET SECTIONS BY CLASS
exports.getSectionsByClass = async (classId, tenantId) => {
  return await prisma.section.findMany({
    where: { classId, tenantId, isDeleted: false },
  });
};