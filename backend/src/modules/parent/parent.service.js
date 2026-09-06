const prisma = require("../../prisma/prismaClient");
const { getStudentIdsForParent } = require("../student/student.service");

// =====================================================
// GET LINKED CHILDREN (list, with basic class/section info)
// =====================================================
const getMyChildren = async (userId, tenantId) => {
  const studentIds = await getStudentIdsForParent(userId, tenantId);

  if (!studentIds.length) return [];

  const students = await prisma.student.findMany({
    where: {
      id: { in: studentIds },
      tenantId,
      isDeleted: false,
    },
    select: {
      id: true,
      admissionNo: true,
      studentName: true,
      photoUrl: true,
      rollNo: true,
      gender: true,
      dateOfBirth: true,
      class: { select: { id: true, name: true } },
      section: { select: { id: true, name: true } },
    },
    orderBy: { studentName: "asc" },
  });

  return students;
};

async function assertChildOwnership(userId, tenantId, studentId) {
  const studentIds = await getStudentIdsForParent(userId, tenantId);
  const id = parseInt(studentId);
  if (!studentIds.includes(id)) {
    throw new Error("Student not found");
  }
  return id;
}

// =====================================================
// CHILD PROFILE (full student record, scoped)
// =====================================================
const getChildProfile = async (userId, tenantId, studentId) => {
  const id = await assertChildOwnership(userId, tenantId, studentId);

  const student = await prisma.student.findFirst({
    where: { id, tenantId, isDeleted: false },
    include: {
      class: { select: { id: true, name: true } },
      section: { select: { id: true, name: true } },
      parents: {
        select: {
          id: true,
          relation: true,
          name: true,
          mobile: true,
          email: true,
          occupation: true,
        },
      },
    },
  });

  if (!student) throw new Error("Student not found");
  return student;
};

// =====================================================
// CHILD ATTENDANCE
// =====================================================
const getChildAttendance = async (userId, tenantId, studentId, query = {}) => {
  const id = await assertChildOwnership(userId, tenantId, studentId);
  const { month, year, academicYearId } = query;

  const where = { studentId: id, tenantId };

  if (month && year) {
    const start = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, 1));
    const end = new Date(Date.UTC(parseInt(year), parseInt(month), 1));
    where.date = { gte: start, lt: end };
  }

  if (academicYearId) {
    where.academicYearId = parseInt(academicYearId);
  }

  const records = await prisma.studentAttendance.findMany({
    where,
    orderBy: { date: "desc" },
    select: {
      id: true,
      date: true,
      status: true,
      remark: true,
    },
  });

  const summary = records.reduce(
    (acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      acc.total++;
      return acc;
    },
    { total: 0 }
  );

  return { records, summary };
};

// =====================================================
// CHILD EXAM MARKS
// =====================================================
const getChildExamMarks = async (userId, tenantId, studentId, query = {}) => {
  const id = await assertChildOwnership(userId, tenantId, studentId);
  const { examId } = query;

  const where = { studentId: id, tenantId };
  if (examId) where.examId = parseInt(examId);

  const marks = await prisma.examMark.findMany({
    where,
    include: {
      exam: { select: { id: true, name: true, examType: true, startDate: true } },
      subject: { select: { id: true, name: true, code: true } },
    },
    orderBy: { exam: { startDate: "desc" } },
  });

  // Only show marks for exams whose results are published for this class.
  const student = await prisma.student.findUnique({
    where: { id },
    select: { classId: true },
  });

  const publishedExamIds = new Set(
    (
      await prisma.resultPublication.findMany({
        where: {
          tenantId,
          classId: student.classId,
          isPublished: true,
          examId: { not: null },
        },
        select: { examId: true },
      })
    ).map((r) => r.examId)
  );

  return marks.filter((m) => publishedExamIds.has(m.examId));
};

// =====================================================
// CHILD TIMETABLE
// =====================================================
const getChildTimetable = async (userId, tenantId, studentId) => {
  const id = await assertChildOwnership(userId, tenantId, studentId);

  const student = await prisma.student.findFirst({
    where: { id, tenantId, isDeleted: false },
    select: { classId: true, sectionId: true },
  });
  if (!student) throw new Error("Student not found");

  const timetable = await prisma.timetable.findMany({
    where: {
      tenantId,
      classId: student.classId,
      isActive: true,
      OR: [{ sectionId: student.sectionId }, { sectionId: null }],
    },
    include: {
      subject: { select: { id: true, name: true } },
      staff: { select: { id: true, name: true } },
      periodSlot: {
        select: { slotNo: true, label: true, startTime: true, endTime: true },
      },
    },
    orderBy: [{ dayOfWeek: "asc" }, { periodSlot: { slotNo: "asc" } }],
  });

  return timetable;
};

// =====================================================
// CHILD FEE STATUS
// =====================================================
const getChildFees = async (userId, tenantId, studentId) => {
  const id = await assertChildOwnership(userId, tenantId, studentId);

  const collections = await prisma.feeCollection.findMany({
    where: { studentId: id, tenantId },
    include: {
      feeStructure: {
        include: { feeCategory: { select: { name: true } } },
      },
    },
    orderBy: { paymentDate: "desc" },
  });

  const student = await prisma.student.findUnique({
    where: { id },
    select: { classId: true },
  });

  const structures = await prisma.feeStructure.findMany({
    where: { tenantId, classId: student.classId, isActive: true },
    include: { feeCategory: { select: { name: true } } },
  });

  const totalDue = structures.reduce((sum, s) => sum + Number(s.amount), 0);
  const totalPaid = collections.reduce((sum, c) => sum + Number(c.netAmount), 0);

  return {
    totalDue,
    totalPaid,
    balance: Math.max(totalDue - totalPaid, 0),
    structures,
    collections,
  };
};

// =====================================================
// CHILD ASSIGNMENTS/HOMEWORK
// =====================================================
const getChildAssignments = async (userId, tenantId, studentId) => {
  const id = await assertChildOwnership(userId, tenantId, studentId);

  const student = await prisma.student.findFirst({
    where: { id, tenantId, isDeleted: false },
    select: { classId: true, sectionId: true },
  });
  if (!student) throw new Error("Student not found");

  const assignments = await prisma.assignment.findMany({
    where: {
      tenantId,
      classId: student.classId,
      isActive: true,
      OR: [{ sectionId: student.sectionId }, { sectionId: null }],
    },
    include: {
      AssignmentSubmission: {
        where: { studentId: id },
        select: { status: true, grade: true, feedback: true, submittedAt: true },
      },
    },
    orderBy: { dueDate: "desc" },
  });

  return assignments.map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    dueDate: a.dueDate,
    maxMarks: a.maxMarks,
    attachmentUrl: a.attachmentUrl,
    submission: a.AssignmentSubmission[0] || null,
  }));
};

module.exports = {
  getMyChildren,
  getChildProfile,
  getChildAttendance,
  getChildExamMarks,
  getChildTimetable,
  getChildFees,
  getChildAssignments,
};
