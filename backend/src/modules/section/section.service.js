const prisma = require("../../prisma/prismaClient");
const { HttpError } = require('../../utils/httpError');

exports.createSection = async (data) => {
  const { classId, tenantId } = data;

  // Ensure the referenced class belongs to the same tenant (prevents cross-tenant writes).
  const klass = await prisma.class.findFirst({
    where: { id: Number(classId), tenantId, isDeleted: false },
    select: { id: true },
  });

  if (!klass) {
    throw new HttpError(400, 'Invalid classId for this tenant', { code: 'INVALID_REFERENCE' });
  }

  return await prisma.section.create({ data });
};

exports.getAllSections = async (tenantId) => {
  return await prisma.section.findMany({
    where: { tenantId, isDeleted: false },
    orderBy: { name: "asc" },
  });
};

exports.getSectionById = async (id, tenantId) => {
  const section = await prisma.section.findFirst({
    where: { id: Number(id), tenantId, isDeleted: false },
  });

  if (!section) {
    throw new HttpError(404, 'Section not found', { code: 'NOT_FOUND' });
  }

  return section;
};

exports.updateSection = async (id, data, tenantId) => {
  const { name, classId } = data; // Destructure to prevent mass assignment

  // Verify ownership of the section
  const section = await prisma.section.findFirst({
    where: { id: Number(id), tenantId, isDeleted: false }
  });

  if (!section) {
    throw new HttpError(404, 'Section not found', { code: 'NOT_FOUND' });
  }

  if (classId !== undefined) {
    const klass = await prisma.class.findFirst({
      where: { id: Number(classId), tenantId, isDeleted: false },
      select: { id: true },
    });

    if (!klass) {
      throw new HttpError(400, 'Invalid classId for this tenant', { code: 'INVALID_REFERENCE' });
    }
  }

  return await prisma.section.update({
    where: { id: Number(id) },
    data: {
      name: name !== undefined ? name : undefined,
      classId: classId !== undefined ? Number(classId) : undefined
    },
  });
};

exports.deleteSection = async (id, tenantId) => {
  // Soft delete to prevent cascading deletion of student assignments
  const result = await prisma.section.updateMany({
    where: { id: Number(id), tenantId, isDeleted: false },
    data: { isDeleted: true },
  });

  if (result.count === 0) {
    throw new HttpError(404, 'Section not found', { code: 'NOT_FOUND' });
  }

  return { deleted: true };
};