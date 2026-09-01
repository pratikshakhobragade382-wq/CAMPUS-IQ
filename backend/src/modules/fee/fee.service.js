const prisma = require('../../prisma/prismaClient');
const { HttpError } = require('../../utils/httpError');

const VALID_PAYMENT_MODES = ['cash', 'cheque', 'online', 'card', 'bank_transfer', 'upi'];

// ─── AUTHORIZATION ─────────────────────────────

const assertCanCollectFees = (actingUser) => {
  if (actingUser.identity === 'admin') return;
  if (actingUser.identity === 'staff' && actingUser.staffRole === 'accountant') return;
  throw new HttpError(403, 'Only admins or accountants can collect fees', { code: 'FORBIDDEN' });
};

const assertIsAdmin = (actingUser) => {
  if (actingUser.identity !== 'admin') {
    throw new HttpError(403, 'Only admins can manage fee categories and structures', { code: 'FORBIDDEN' });
  }
};

// ─── FEE CATEGORY ───────────────────────────────

const createFeeCategory = async (data, tenantId, actingUser) => {
  assertIsAdmin(actingUser);
  const { name, description } = data;
  if (!name) throw new HttpError(400, 'name is required', { code: 'VALIDATION_ERROR' });

  try {
    return await prisma.feeCategory.create({
      data: { tenantId, name, description: description || null },
    });
  } catch (err) {
    if (err.code === 'P2002') throw new HttpError(409, 'A fee category with this name already exists', { code: 'DUPLICATE' });
    throw err;
  }
};

const getAllFeeCategories = async (tenantId) => {
  return prisma.feeCategory.findMany({
    where: { tenantId, isActive: true },
    orderBy: { name: 'asc' },
  });
};

const updateFeeCategory = async (id, data, tenantId, actingUser) => {
  assertIsAdmin(actingUser);
  const existing = await prisma.feeCategory.findFirst({ where: { id: parseInt(id), tenantId } });
  if (!existing) throw new HttpError(404, 'Fee category not found', { code: 'NOT_FOUND' });

  return prisma.feeCategory.update({
    where: { id: parseInt(id) },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });
};

const deleteFeeCategory = async (id, tenantId, actingUser) => {
  assertIsAdmin(actingUser);
  const existing = await prisma.feeCategory.findFirst({ where: { id: parseInt(id), tenantId } });
  if (!existing) throw new HttpError(404, 'Fee category not found', { code: 'NOT_FOUND' });

  // Soft delete via isActive rather than hard delete — fee categories may be referenced
  // by historical FeeStructure/FeeCollection rows we don't want to orphan.
  await prisma.feeCategory.update({ where: { id: parseInt(id) }, data: { isActive: false } });
  return { message: 'Fee category deactivated successfully' };
};

// ─── FEE STRUCTURE ──────────────────────────────

const createFeeStructure = async (data, tenantId, actingUser) => {
  assertIsAdmin(actingUser);
  const { academicYearId, classId, feeCategoryId, stream, studentCategory, amount, frequency, dueDay } = data;

  if (!academicYearId || !classId || !feeCategoryId || amount === undefined) {
    throw new HttpError(400, 'academicYearId, classId, feeCategoryId and amount are required', { code: 'VALIDATION_ERROR' });
  }
  if (parseFloat(amount) <= 0) {
    throw new HttpError(400, 'amount must be greater than 0', { code: 'VALIDATION_ERROR' });
  }

  const [academicYear, cls, category] = await Promise.all([
    prisma.academicYear.findFirst({ where: { id: parseInt(academicYearId), tenantId } }),
    prisma.class.findFirst({ where: { id: parseInt(classId), tenantId } }),
    prisma.feeCategory.findFirst({ where: { id: parseInt(feeCategoryId), tenantId } }),
  ]);
  if (!academicYear) throw new HttpError(404, 'Academic year not found', { code: 'NOT_FOUND' });
  if (!cls) throw new HttpError(404, 'Class not found', { code: 'NOT_FOUND' });
  if (!category) throw new HttpError(404, 'Fee category not found', { code: 'NOT_FOUND' });

  return prisma.feeStructure.create({
    data: {
      tenantId,
      academicYearId: parseInt(academicYearId),
      classId: parseInt(classId),
      feeCategoryId: parseInt(feeCategoryId),
      stream: stream || null,
      studentCategory: studentCategory || null,
      amount: parseFloat(amount),
      frequency: frequency || 'annual',
      dueDay: dueDay ? parseInt(dueDay) : null,
    },
  });
};

const getFeeStructures = async (tenantId, filters = {}) => {
  const { academicYearId, classId, feeCategoryId } = filters;
  return prisma.feeStructure.findMany({
    where: {
      tenantId,
      isActive: true,
      ...(academicYearId && { academicYearId: parseInt(academicYearId) }),
      ...(classId && { classId: parseInt(classId) }),
      ...(feeCategoryId && { feeCategoryId: parseInt(feeCategoryId) }),
    },
    include: {
      feeCategory: { select: { id: true, name: true } },
      class: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

const updateFeeStructure = async (id, data, tenantId, actingUser) => {
  assertIsAdmin(actingUser);
  const existing = await prisma.feeStructure.findFirst({ where: { id: parseInt(id), tenantId } });
  if (!existing) throw new HttpError(404, 'Fee structure not found', { code: 'NOT_FOUND' });

  if (data.amount !== undefined && parseFloat(data.amount) <= 0) {
    throw new HttpError(400, 'amount must be greater than 0', { code: 'VALIDATION_ERROR' });
  }

  return prisma.feeStructure.update({
    where: { id: parseInt(id) },
    data: {
      ...(data.amount !== undefined && { amount: parseFloat(data.amount) }),
      ...(data.frequency && { frequency: data.frequency }),
      ...(data.dueDay !== undefined && { dueDay: data.dueDay ? parseInt(data.dueDay) : null }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });
};

// ─── FEE COLLECTION (PAYMENT) ───────────────────

// Generates a sequential receipt number per tenant+academicYear.
// Retries on unique-constraint collision (race-condition safe) rather than
// trusting a naive count-then-insert with no protection.
const generateReceiptNo = async (tenantId, academicYearId) => {
  const agg = await prisma.feeCollection.aggregate({
    where: { tenantId, academicYearId },
    _max: { receiptNo: true },
  });

  let next = 1;
  if (agg._max.receiptNo) {
    const parts = agg._max.receiptNo.split('/');
    if (parts.length === 3) {
      const currentMax = parseInt(parts[2], 10);
      if (!isNaN(currentMax)) {
        next = currentMax + 1;
      }
    }
  }
  return `RC/${academicYearId}/${String(next).padStart(6, '0')}`;
};

const collectFee = async (data, tenantId, actingUser) => {
  assertCanCollectFees(actingUser);

  const { studentId, feeStructureId, academicYearId, amount, discount, fine, paymentMode, paymentDate, chequeNo, bankName, transactionId, remark } = data;

  if (!studentId || !feeStructureId || !academicYearId || amount === undefined || !paymentMode || !paymentDate) {
    throw new HttpError(400, 'studentId, feeStructureId, academicYearId, amount, paymentMode and paymentDate are required', { code: 'VALIDATION_ERROR' });
  }
  if (!VALID_PAYMENT_MODES.includes(paymentMode)) {
    throw new HttpError(400, `paymentMode must be one of: ${VALID_PAYMENT_MODES.join(', ')}`, { code: 'VALIDATION_ERROR' });
  }
  if (parseFloat(amount) <= 0) {
    throw new HttpError(400, 'amount must be greater than 0', { code: 'VALIDATION_ERROR' });
  }

  const [student, feeStructure] = await Promise.all([
    prisma.student.findFirst({ where: { id: parseInt(studentId), tenantId, isDeleted: false } }),
    prisma.feeStructure.findFirst({ where: { id: parseInt(feeStructureId), tenantId } }),
  ]);
  if (!student) throw new HttpError(404, 'Student not found', { code: 'NOT_FOUND' });
  if (!feeStructure) throw new HttpError(404, 'Fee structure not found', { code: 'NOT_FOUND' });

  const discountAmt = discount ? parseFloat(discount) : 0;
  const fineAmt = fine ? parseFloat(fine) : 0;
  const netAmount = parseFloat(amount) - discountAmt + fineAmt;

  if (netAmount <= 0) {
    throw new HttpError(400, 'netAmount must be greater than 0 (check amount/discount/fine)', { code: 'VALIDATION_ERROR' });
  }

  // collectedById is ALWAYS derived from the authenticated user, never the request body.
  const collectedById = actingUser.staffId;
  if (!collectedById) {
    throw new HttpError(403, 'This account is not linked to a staff record and cannot collect fees', { code: 'FORBIDDEN' });
  }

  // Retry loop handles the rare race where two payments are recorded in the same instant
  // and both compute the same "next" receipt number before either commits.
  let attempts = 0;
  while (attempts < 3) {
    attempts++;
    const receiptNo = await generateReceiptNo(tenantId, parseInt(academicYearId));
    try {
      return await prisma.feeCollection.create({
        data: {
          tenantId,
          receiptNo,
          studentId: parseInt(studentId),
          feeStructureId: parseInt(feeStructureId),
          academicYearId: parseInt(academicYearId),
          amount: parseFloat(amount),
          discount: discountAmt,
          fine: fineAmt,
          netAmount,
          paymentMode,
          paymentDate: new Date(paymentDate),
          chequeNo: chequeNo || null,
          bankName: bankName || null,
          transactionId: transactionId || null,
          remark: remark || null,
          collectedById,
        },
      });
    } catch (err) {
      if (err.code === 'P2002' && attempts < 3) continue; // receipt number collision, retry
      if (err.code === 'P2002') throw new HttpError(409, 'Could not generate a unique receipt number, please retry', { code: 'CONFLICT' });
      throw err;
    }
  }
  throw new HttpError(409, 'Could not generate a unique receipt number after multiple attempts', { code: 'CONFLICT' });
};

// Resolves a student by either a numeric primary key or a human-entered
// identifier such as an admission number (e.g. "S010"). Passing a non-numeric
// string straight into an Int `where` filter (e.g. via parseInt -> NaN) makes
// Prisma reject the whole query instead of just matching nothing, so we
// branch on whether the identifier is actually numeric first.
const findStudentByIdentifier = async (tenantId, identifier) => {
  const numericId = Number(identifier);
  const isNumeric = identifier !== '' && identifier !== null && identifier !== undefined && Number.isInteger(numericId);

  return prisma.student.findFirst({
    where: {
      tenantId,
      isDeleted: false,
      ...(isNumeric ? { id: numericId } : { admissionNo: String(identifier) }),
    },
    select: { id: true, studentName: true, admissionNo: true, classId: true },
  });
};

const getStudentFeeStatus = async (tenantId, studentId, academicYearId) => {
  const student = await findStudentByIdentifier(tenantId, studentId);
  if (!student) throw new HttpError(404, 'Student not found', { code: 'NOT_FOUND' });

  const structures = await prisma.feeStructure.findMany({
    where: {
      tenantId,
      classId: student.classId,
      isActive: true,
      ...(academicYearId && { academicYearId: parseInt(academicYearId) }),
    },
    include: { feeCategory: { select: { id: true, name: true } } },
  });

  const breakdown = await Promise.all(
    structures.map(async (structure) => {
      const collections = await prisma.feeCollection.findMany({
        where: { tenantId, studentId: student.id, feeStructureId: structure.id },
      });
      const paid = collections.reduce((sum, c) => sum + parseFloat(c.netAmount), 0);
      const owed = parseFloat(structure.amount);
      return {
        feeCategory: structure.feeCategory.name,
        feeStructureId: structure.id,
        owed,
        paid,
        balance: Math.max(owed - paid, 0),
        status: paid >= owed ? 'paid' : paid > 0 ? 'partial' : 'unpaid',
      };
    })
  );

  const totals = breakdown.reduce(
    (acc, b) => ({ owed: acc.owed + b.owed, paid: acc.paid + b.paid, balance: acc.balance + b.balance }),
    { owed: 0, paid: 0, balance: 0 }
  );

  return {
    student: { id: student.id, name: student.studentName, admissionNo: student.admissionNo },
    breakdown,
    totals,
  };
};

const getStudentPaymentHistory = async (tenantId, studentId) => {
  const student = await findStudentByIdentifier(tenantId, studentId);
  if (!student) throw new HttpError(404, 'Student not found', { code: 'NOT_FOUND' });

  return prisma.feeCollection.findMany({
    where: { tenantId, studentId: student.id },
    include: {
      feeStructure: { include: { feeCategory: { select: { id: true, name: true } } } },
      collectedBy: { select: { id: true, name: true } },
    },
    orderBy: { paymentDate: 'desc' },
  });
};

const getCollectionsByDateRange = async (tenantId, fromDate, toDate) => {
  const from = fromDate ? new Date(fromDate) : new Date(new Date().setHours(0, 0, 0, 0));
  const to = toDate ? new Date(toDate) : new Date();

  const collections = await prisma.feeCollection.findMany({
    where: { tenantId, paymentDate: { gte: from, lte: to } },
    include: {
      student: { select: { id: true, studentName: true, admissionNo: true } },
      feeStructure: { include: { feeCategory: { select: { id: true, name: true } } } },
      collectedBy: { select: { id: true, name: true } },
    },
    orderBy: { paymentDate: 'desc' },
  });

  const totalCollected = collections.reduce((sum, c) => sum + parseFloat(c.netAmount), 0);

  return { fromDate: from, toDate: to, totalCollected, count: collections.length, collections };
};

module.exports = {
  createFeeCategory, getAllFeeCategories, updateFeeCategory, deleteFeeCategory,
  createFeeStructure, getFeeStructures, updateFeeStructure,
  collectFee, getStudentFeeStatus, getStudentPaymentHistory, getCollectionsByDateRange,
};