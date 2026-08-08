const prisma = require("../../prisma/prismaClient");
const { HttpError } = require('../../utils/httpError');

exports.createSubject = async (data) => {
  return await prisma.subject.create({ data });
};

exports.getAllSubjects = async (tenantId) => {
  return await prisma.subject.findMany({
    where: { tenantId, isDeleted: false }, // tenant isolation + soft-delete filter
    orderBy: { name: "asc" }
  });
};

exports.getSubjectById = async (id, tenantId) => {
  const subject = await prisma.subject.findFirst({
    where: {
      id: Number(id),
      tenantId,
      isDeleted: false,
    },
  });

  if (!subject) {
    throw new HttpError(404, 'Subject not found', { code: 'NOT_FOUND' });
  }

  return subject;
};

exports.updateSubject = async (id, data, tenantId) => {
  // Verify ownership and existence first
  const existing = await prisma.subject.findFirst({
    where: { id: Number(id), tenantId, isDeleted: false },
  });

  if (!existing) {
    throw new HttpError(404, 'Subject not found', { code: 'NOT_FOUND' });
  }

  // Safe direct update using unique ID
  return await prisma.subject.update({
    where: { id: Number(id) },
    data,
  });
};

exports.deleteSubject = async (id, tenantId) => {
  // Soft delete to prevent cascading deletion of staff-subject assignments
  const result = await prisma.subject.updateMany({
    where: { id: Number(id), tenantId, isDeleted: false },
    data: { isDeleted: true },
  });

  if (result.count === 0) {
    throw new HttpError(404, 'Subject not found', { code: 'NOT_FOUND' });
  }

  return { deleted: true };
};