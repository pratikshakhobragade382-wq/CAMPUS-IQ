// src/modules/exam/exam.service.js
const prisma = require('../../prisma/prismaClient');
const { HttpError } = require('../../utils/httpError');

// ─── AUTHORIZATION HELPERS ────────────────────
const assertIsAdmin = (actingUser) => {
  if (actingUser.identity !== 'admin') {
    throw new HttpError(403, 'Only admins can manage exams', { code: 'FORBIDDEN' });
  }
};

const assertCanManageMarks = async (tenantId, actingUser, classId, subjectId) => {
  if (actingUser.identity === 'admin') return;
  if (actingUser.identity !== 'staff' || actingUser.staffRole !== 'teacher') {
    throw new HttpError(403, 'Only teachers or admins can manage marks', { code: 'FORBIDDEN' });
  }
  if (!actingUser.staffId) {
    throw new HttpError(403, 'This account is not linked to a staff record', { code: 'FORBIDDEN' });
  }
  const teacherTimetableCount = await prisma.timetable.count({
    where: { tenantId, staffId: actingUser.staffId, isActive: true },
  });
  if (teacherTimetableCount > 0) {
    const assignment = await prisma.timetable.findFirst({
      where: {
        tenantId,
        staffId: actingUser.staffId,
        classId: parseInt(classId),
        subjectId: parseInt(subjectId),
        isActive: true,
      },
    });
    if (!assignment) {
      throw new HttpError(403, 'You are not timetabled to teach this subject to this class', { code: 'FORBIDDEN' });
    }
  }
};

// ─── GRADING SYSTEM HELPERS ────────────────────
const getGradingScale = async (tenantId) => {
  const record = await prisma.masterData.findFirst({
    where: { category: 'GradingScale', tenantId, isActive: true }
  });
  if (record) {
    try {
      return JSON.parse(record.value);
    } catch (e) {
      try {
        const parts = record.value.split(',');
        return parts.map((part) => {
          const [range, grade, gp] = part.split(':');
          const [min, max] = range.split('-').map(Number);
          return { min, max, grade, gp: Number(gp) };
        });
      } catch (err) {
        // Fall back to default scale on parsing error
      }
    }
  }
  return [
    { min: 91, max: 100, grade: 'A1', gp: 10 },
    { min: 81, max: 90, grade: 'A2', gp: 9 },
    { min: 71, max: 80, grade: 'B1', gp: 8 },
    { min: 61, max: 70, grade: 'B2', gp: 7 },
    { min: 51, max: 60, grade: 'C1', gp: 6 },
    { min: 41, max: 50, grade: 'C2', gp: 5 },
    { min: 33, max: 40, grade: 'D', gp: 4 },
    { min: 0, max: 32.99, grade: 'E', gp: 0 }
  ];
};

const computeGradeAndGP = (marksObtained, maxMarks, scale, explicitGrade) => {
  if (marksObtained === undefined || marksObtained === null) {
    return { grade: null, gradePoint: null, remarkAdd: '' };
  }
  const percentage = (parseFloat(marksObtained) / parseFloat(maxMarks)) * 100;
  if (explicitGrade) {
    const rule = scale.find(r => r.grade.toLowerCase() === explicitGrade.toLowerCase());
    return {
      grade: explicitGrade,
      gradePoint: rule ? rule.gp : null,
      remarkAdd: ' [Manually Overridden]'
    };
  }
  const rule = scale.find(r => percentage >= r.min && percentage <= r.max);
  if (rule) {
    return { grade: rule.grade, gradePoint: rule.gp, remarkAdd: '' };
  }
  return { grade: 'E', gradePoint: 0, remarkAdd: '' };
};

// ─── EXAM SERVICES ────────────────────────────
const createExam = async (data, tenantId, actingUser) => {
  assertIsAdmin(actingUser);
  const { academicYearId, name, examType, classId, startDate, endDate } = data;
  if (!academicYearId || !name || !examType || !classId || !startDate || !endDate) {
    throw new HttpError(400, 'academicYearId, name, examType, classId, startDate and endDate are required', { code: 'VALIDATION_ERROR' });
  }
  const [academicYear, cls] = await Promise.all([
    prisma.academicYear.findFirst({ where: { id: parseInt(academicYearId), tenantId } }),
    prisma.class.findFirst({ where: { id: parseInt(classId), tenantId } })
  ]);
  if (!academicYear) throw new HttpError(404, 'Academic year not found', { code: 'NOT_FOUND' });
  if (!cls) throw new HttpError(404, 'Class not found', { code: 'NOT_FOUND' });
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (start > end) {
    throw new HttpError(400, 'startDate cannot be after endDate', { code: 'VALIDATION_ERROR' });
  }
  if (academicYear.startDate && academicYear.endDate) {
    if (start < academicYear.startDate || start > academicYear.endDate ||
        end < academicYear.startDate || end > academicYear.endDate) {
      throw new HttpError(400, 'Exam dates must fall within the academic year date range', { code: 'VALIDATION_ERROR' });
    }
  }
  return prisma.exam.create({
    data: {
      tenantId,
      academicYearId: parseInt(academicYearId),
      name,
      examType,
      classId: parseInt(classId),
      startDate: start,
      endDate: end,
      isActive: true
    }
  });
};

const getAllExams = async (tenantId, filters = {}) => {
  const { academicYearId, classId, examType, includeInactive } = filters;
  return prisma.exam.findMany({
    where: {
      tenantId,
      ...(!includeInactive && { isActive: true }),
      ...(academicYearId && { academicYearId: parseInt(academicYearId) }),
      ...(classId && { classId: parseInt(classId) }),
      ...(examType && { examType })
    },
    include: {
      class: { select: { id: true, name: true } },
      academicYear: { select: { id: true, name: true } }
    },
    orderBy: { startDate: 'desc' }
  });
};

const getExamById = async (id, tenantId, includeInactive) => {
  const exam = await prisma.exam.findFirst({
    where: { id: parseInt(id), tenantId, ...(!includeInactive && { isActive: true }) },
    include: {
      class: { select: { id: true, name: true } },
      academicYear: { select: { id: true, name: true } }
    }
  });
  if (!exam) throw new HttpError(404, 'Exam not found', { code: 'NOT_FOUND' });
  const totalStudents = await prisma.student.count({
    where: { classId: exam.classId, tenantId, isDeleted: false }
  });
  const enteredMarksCount = await prisma.examMark.groupBy({
    by: ['studentId'],
    where: { examId: exam.id, tenantId }
  });
  const markedStudents = enteredMarksCount.length;
  return {
    exam,
    summary: {
      totalStudents,
      markedStudents,
      completionPercentage: totalStudents > 0 ? ((markedStudents / totalStudents) * 100).toFixed(2) + '%' : '0%'
    }
  };
};

const updateExam = async (id, data, tenantId, actingUser) => {
  assertIsAdmin(actingUser);
  const exam = await prisma.exam.findFirst({ where: { id: parseInt(id), tenantId } });
  if (!exam) throw new HttpError(404, 'Exam not found', { code: 'NOT_FOUND' });
  const updateData = {};
  if (data.name) updateData.name = data.name;
  if (data.examType) updateData.examType = data.examType;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.startDate || data.endDate) {
    const start = data.startDate ? new Date(data.startDate) : new Date(exam.startDate);
    const end = data.endDate ? new Date(data.endDate) : new Date(exam.endDate);
    if (start > end) {
      throw new HttpError(400, 'startDate cannot be after endDate', { code: 'VALIDATION_ERROR' });
    }
    const academicYear = await prisma.academicYear.findUnique({ where: { id: exam.academicYearId } });
    if (academicYear && academicYear.startDate && academicYear.endDate) {
      if (start < academicYear.startDate || start > academicYear.endDate ||
          end < academicYear.startDate || end > academicYear.endDate) {
        throw new HttpError(400, 'Exam dates must fall within the academic year date range', { code: 'VALIDATION_ERROR' });
      }
    }
    updateData.startDate = start;
    updateData.endDate = end;
  }
  return prisma.exam.update({
    where: { id: parseInt(id) },
    data: updateData
  });
};

const deleteExam = async (id, tenantId, actingUser) => {
  assertIsAdmin(actingUser);
  const exam = await prisma.exam.findFirst({ where: { id: parseInt(id), tenantId } });
  if (!exam) throw new HttpError(404, 'Exam not found', { code: 'NOT_FOUND' });
  const marksCount = await prisma.examMark.count({ where: { examId: exam.id, tenantId } });
  if (marksCount > 0) {
    await prisma.exam.update({
      where: { id: exam.id },
      data: { isActive: false }
    });
    return { message: 'Exam has marks associated. Deactivated successfully' };
  }
  await prisma.exam.delete({ where: { id: exam.id } });
  return { message: 'Exam deleted successfully' };
};

// ─── EXAM MARK SERVICES ───────────────────────
const bulkEnterMarks = async (examId, data, tenantId, actingUser) => {
  const { subjectId, maxMarks, records } = data;
  if (!subjectId || maxMarks === undefined || !Array.isArray(records) || records.length === 0) {
    throw new HttpError(400, 'subjectId, maxMarks, and records array are required', { code: 'VALIDATION_ERROR' });
  }
  const parsedMaxMarks = parseFloat(maxMarks);
  if (parsedMaxMarks <= 0) {
    throw new HttpError(400, 'maxMarks must be greater than 0', { code: 'VALIDATION_ERROR' });
  }
  const enteredById = actingUser.staffId;
  if (!enteredById) {
    throw new HttpError(403, 'This account is not linked to a staff record and cannot enter marks', { code: 'FORBIDDEN' });
  }
  const exam = await prisma.exam.findFirst({ where: { id: parseInt(examId), tenantId, isActive: true } });
  if (!exam) throw new HttpError(404, 'Exam not found', { code: 'NOT_FOUND' });

  await assertCanManageMarks(tenantId, actingUser, exam.classId, subjectId);

  const subject = await prisma.subject.findFirst({ where: { id: parseInt(subjectId), tenantId, isDeleted: false } });
  if (!subject) throw new HttpError(404, 'Subject not found', { code: 'NOT_FOUND' });

  const studentIds = records.map(r => parseInt(r.studentId));
  const students = await prisma.student.findMany({
    where: {
      id: { in: studentIds },
      tenantId,
      classId: exam.classId,
      isDeleted: false
    },
    select: { id: true }
  });

  if (students.length !== new Set(studentIds).size) {
    throw new HttpError(400, 'One or more student IDs are invalid, deleted, or do not belong to the class', { code: 'VALIDATION_ERROR' });
  }

  const scale = await getGradingScale(tenantId);

  const transactions = [];

  for (const r of records) {
    const studentId = parseInt(r.studentId);
    const isAbsent = !!r.isAbsent;

    let marksObtained = r.marksObtained !== undefined && r.marksObtained !== null ? parseFloat(r.marksObtained) : null;
    if (isAbsent) {
      marksObtained = null;
    } else if (marksObtained === null) {
      throw new HttpError(400, `marksObtained is required if student is present (studentId: ${studentId})`, { code: 'VALIDATION_ERROR' });
    } else if (marksObtained < 0 || marksObtained > parsedMaxMarks) {
      throw new HttpError(400, `marksObtained must be between 0 and maxMarks (studentId: ${studentId})`, { code: 'VALIDATION_ERROR' });
    }

    const { grade, gradePoint, remarkAdd } = computeGradeAndGP(marksObtained, parsedMaxMarks, scale, r.grade);
    const remark = (r.remark || '') + remarkAdd;

    // FIX: use create (not upsert) so duplicate submissions correctly
    // trigger P2002 -> 409 DUPLICATE instead of silently overwriting.
    transactions.push(
      prisma.examMark.create({
        data: {
          tenantId,
          examId: exam.id,
          studentId,
          subjectId: parseInt(subjectId),
          maxMarks: parsedMaxMarks,
          marksObtained,
          isAbsent,
          grade,
          gradePoint,
          remark: remark || null,
          enteredById
        }
      })
    );
  }

  try {
    const results = await prisma.$transaction(transactions);
    return { message: `Marks recorded for ${results.length} students`, count: results.length };
  } catch (err) {
    if (err.code === 'P2002') {
      throw new HttpError(409, 'Marks already exist for one or more student/subject combinations', { code: 'DUPLICATE' });
    }
    throw err;
  }
};

const getExamMarks = async (examId, tenantId, subjectId, actingUser) => {
  // FIX: removed isActive:true filter so marks remain visible after an exam is deactivated
  const exam = await prisma.exam.findFirst({ where: { id: parseInt(examId), tenantId } });
  if (!exam) throw new HttpError(404, 'Exam not found', { code: 'NOT_FOUND' });

  if (actingUser.identity !== 'admin') {
    if (actingUser.identity !== 'staff' || actingUser.staffRole !== 'teacher') {
      throw new HttpError(403, 'Access denied', { code: 'FORBIDDEN' });
    }
    const teacherTimetableCount = await prisma.timetable.count({
      where: { tenantId, staffId: actingUser.staffId, isActive: true },
    });
    if (teacherTimetableCount > 0) {
      if (subjectId) {
        await assertCanManageMarks(tenantId, actingUser, exam.classId, subjectId);
      } else {
        const timetabled = await prisma.timetable.findFirst({
          where: { tenantId, staffId: actingUser.staffId, classId: exam.classId, isActive: true }
        });
        if (!timetabled) {
          throw new HttpError(403, 'You are not timetabled for this class', { code: 'FORBIDDEN' });
        }
      }
    }
  }

  return prisma.examMark.findMany({
    where: {
      tenantId,
      examId: exam.id,
      ...(subjectId && { subjectId: parseInt(subjectId) })
    },
    include: {
      student: { select: { id: true, studentName: true, admissionNo: true, rollNo: true } },
      subject: { select: { id: true, name: true, code: true } },
      enteredBy: { select: { id: true, name: true } }
    },
    orderBy: [
      { subject: { name: 'asc' } },
      { student: { rollNo: 'asc' } }
    ]
  });
};

const getStudentReportCard = async (tenantId, studentId, academicYearId, actingUser) => {
  const student = await prisma.student.findFirst({
    where: { id: parseInt(studentId), tenantId, isDeleted: false },
    include: { class: true }
  });
  if (!student) throw new HttpError(404, 'Student not found', { code: 'NOT_FOUND' });

  if (actingUser.identity !== 'admin') {
    if (actingUser.identity !== 'staff' || actingUser.staffRole !== 'teacher') {
      throw new HttpError(403, 'Only teachers or admins can view report cards', { code: 'FORBIDDEN' });
    }
    const teacherTimetableCount = await prisma.timetable.count({
      where: { tenantId, staffId: actingUser.staffId, isActive: true },
    });
    if (teacherTimetableCount > 0) {
      const assignment = await prisma.timetable.findFirst({
        where: {
          tenantId,
          staffId: actingUser.staffId,
          classId: student.classId,
          isActive: true,
        }
      });
      if (!assignment) {
        throw new HttpError(403, 'You are not authorized to view this student\'s report card', { code: 'FORBIDDEN' });
      }
    }
  }

  let acYearId = academicYearId ? parseInt(academicYearId) : null;
  if (!acYearId) {
    const activeAY = await prisma.academicYear.findFirst({
      where: { tenantId, isActive: true, isDeleted: false }
    });
    if (!activeAY) throw new HttpError(400, 'No active academic year found. Please specify academicYearId', { code: 'VALIDATION_ERROR' });
    acYearId = activeAY.id;
  }

  // FIX: removed isActive:true filter on exam so deactivated exams still
  // appear on the historical report card instead of vanishing.
  const marks = await prisma.examMark.findMany({
    where: {
      tenantId,
      studentId: student.id,
      exam: {
        academicYearId: acYearId
      }
    },
    include: {
      exam: true,
      subject: true,
      enteredBy: { select: { id: true, name: true } }
    },
    orderBy: [
      { exam: { startDate: 'asc' } },
      { subject: { name: 'asc' } }
    ]
  });

  const examMap = {};
  marks.forEach(mark => {
    const examId = mark.exam.id;
    if (!examMap[examId]) {
      examMap[examId] = {
        examId: mark.exam.id,
        examName: mark.exam.name,
        examType: mark.exam.examType,
        startDate: mark.exam.startDate,
        endDate: mark.exam.endDate,
        subjects: []
      };
    }
    examMap[examId].subjects.push({
      markId: mark.id,
      subjectId: mark.subject.id,
      subjectName: mark.subject.name,
      subjectCode: mark.subject.code,
      maxMarks: Number(mark.maxMarks),
      marksObtained: mark.marksObtained !== null ? Number(mark.marksObtained) : null,
      isAbsent: mark.isAbsent,
      grade: mark.grade,
      gradePoint: mark.gradePoint !== null ? Number(mark.gradePoint) : null,
      remark: mark.remark,
      enteredBy: mark.enteredBy.name
    });
  });

  return {
    student: {
      id: student.id,
      name: student.studentName,
      admissionNo: student.admissionNo,
      rollNo: student.rollNo,
      class: student.class.name
    },
    academicYearId: acYearId,
    exams: Object.values(examMap)
  };
};

module.exports = {
  createExam,
  getAllExams,
  getExamById,
  updateExam,
  deleteExam,
  bulkEnterMarks,
  getExamMarks,
  getStudentReportCard
};
