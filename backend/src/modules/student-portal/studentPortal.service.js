const prisma = require("../../prisma/prismaClient");

async function getOwnStudentRecord(studentId, tenantId) {
  if (!studentId) throw new Error("Student not found");

  const student = await prisma.student.findFirst({
    where: { id: studentId, tenantId, isDeleted: false },
    select: { id: true, classId: true, sectionId: true },
  });

  if (!student) throw new Error("Student not found");
  return student;
}

const getMyProfile = async (studentId, tenantId) => {
  await getOwnStudentRecord(studentId, tenantId);

  const student = await prisma.student.findFirst({
    where: { id: studentId, tenantId, isDeleted: false },
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
        },
      },
    },
  });

  return student;
};

const getMyAttendance = async (studentId, tenantId, query = {}) => {
  await getOwnStudentRecord(studentId, tenantId);
  const { month, year, academicYearId } = query;

  const where = { studentId, tenantId };

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
    select: { id: true, date: true, status: true, remark: true },
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

const getMyExamMarks = async (studentId, tenantId, query = {}) => {
  const student = await getOwnStudentRecord(studentId, tenantId);
  const { examId } = query;

  const where = { studentId, tenantId };
  if (examId) where.examId = parseInt(examId);

  const marks = await prisma.examMark.findMany({
    where,
    include: {
      exam: { select: { id: true, name: true, examType: true, startDate: true } },
      subject: { select: { id: true, name: true, code: true } },
    },
    orderBy: { exam: { startDate: "desc" } },
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

const getMyTimetable = async (studentId, tenantId) => {
  const student = await getOwnStudentRecord(studentId, tenantId);

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

const getMyFees = async (studentId, tenantId) => {
  const student = await getOwnStudentRecord(studentId, tenantId);

  const collections = await prisma.feeCollection.findMany({
    where: { studentId, tenantId },
    include: {
      feeStructure: {
        include: { feeCategory: { select: { name: true } } },
      },
    },
    orderBy: { paymentDate: "desc" },
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

const getMyAssignments = async (studentId, tenantId) => {
  const student = await getOwnStudentRecord(studentId, tenantId);

  const assignments = await prisma.assignment.findMany({
    where: {
      tenantId,
      classId: student.classId,
      isActive: true,
      OR: [{ sectionId: student.sectionId }, { sectionId: null }],
    },
    include: {
      AssignmentSubmission: {
        where: { studentId },
        select: {
          id: true,
          status: true,
          grade: true,
          feedback: true,
          submittedAt: true,
          content: true,
          attachmentUrl: true,
        },
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

const submitAssignment = async (studentId, tenantId, assignmentId, data) => {
  const student = await getOwnStudentRecord(studentId, tenantId);

  const assignment = await prisma.assignment.findFirst({
    where: {
      id: parseInt(assignmentId),
      tenantId,
      classId: student.classId,
      isActive: true,
      OR: [{ sectionId: student.sectionId }, { sectionId: null }],
    },
  });

  if (!assignment) throw new Error("Assignment not found");

  const { content, attachmentUrl } = data;
  const now = new Date();
  const status = now > new Date(assignment.dueDate) ? "late" : "submitted";

  const submission = await prisma.assignmentSubmission.upsert({
    where: {
      tenantId_assignmentId_studentId: {
        tenantId,
        assignmentId: assignment.id,
        studentId,
      },
    },
    update: {
      content,
      attachmentUrl,
      status,
      submittedAt: now,
    },
    create: {
      tenantId,
      assignmentId: assignment.id,
      studentId,
      content,
      attachmentUrl,
      status,
      submittedAt: now,
    },
  });

  return submission;
};


const getMyCalendar = async (studentId, tenantId, query = {}) => {
  const student = await getOwnStudentRecord(studentId, tenantId);
  const { month, year } = query;

  let rangeStart;
  let rangeEnd;
  if (month && year) {
    rangeStart = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, 1));
    rangeEnd = new Date(Date.UTC(parseInt(year), parseInt(month), 1));
  } else {
    const now = new Date();
    rangeStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
    rangeEnd = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 1));
  }

  const [holidays, exams, assignments] = await Promise.all([
    prisma.holiday.findMany({
      where: {
        tenantId,
        date: { gte: rangeStart, lt: rangeEnd },
      },
      select: { id: true, name: true, date: true, holidayType: true },
    }),

    prisma.exam.findMany({
      where: {
        tenantId,
        isActive: true,
        classId: student.classId,
        startDate: { gte: rangeStart, lt: rangeEnd },
      },
      select: {
        id: true,
        name: true,
        examType: true,
        startDate: true,
        endDate: true,
      },
    }),

    prisma.assignment.findMany({
      where: {
        tenantId,
        classId: student.classId,
        isActive: true,
        OR: [{ sectionId: student.sectionId }, { sectionId: null }],
        dueDate: { gte: rangeStart, lt: rangeEnd },
      },
      select: { id: true, title: true, dueDate: true },
    }),
  ]);

  const events = [
    ...holidays.map((h) => ({
      id: `holiday-${h.id}`,
      type: "holiday",
      title: h.name,
      date: h.date,
      meta: { holidayType: h.holidayType },
    })),
    ...exams.map((e) => ({
      id: `exam-${e.id}`,
      type: "exam",
      title: e.name,
      date: e.startDate,
      endDate: e.endDate,
      meta: { examType: e.examType },
    })),
    ...assignments.map((a) => ({
      id: `assignment-${a.id}`,
      type: "assignment",
      title: a.title,
      date: a.dueDate,
      meta: {},
    })),
  ].sort((a, b) => new Date(a.date) - new Date(b.date));

  return { rangeStart, rangeEnd, events };
};

module.exports = {
  getMyProfile,
  getMyAttendance,
  getMyExamMarks,
  getMyTimetable,
  getMyFees,
  getMyAssignments,
  submitAssignment,
  getMyCalendar,
};
