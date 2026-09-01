const prisma = require('../../prisma/prismaClient');
const { HttpError } = require('../../utils/httpError');

// ─── HELPERS ─────────────────────────────────

const isSecondSaturday = (date) => {
  const d = new Date(date);
  if (d.getDay() !== 6) return false;
  const firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
  const firstSaturday = new Date(firstDay);
  while (firstSaturday.getDay() !== 6) firstSaturday.setDate(firstSaturday.getDate() + 1);
  const secondSaturday = new Date(firstSaturday);
  secondSaturday.setDate(firstSaturday.getDate() + 7);
  return d.getDate() === secondSaturday.getDate();
};

const isWorkingDay = (date, holidayDates) => {
  const d = new Date(date);
  const dayOfWeek = d.getDay();
  if (dayOfWeek === 0) return false;
  if (isSecondSaturday(d)) return false;
  const dateStr = d.toISOString().split('T')[0];
  if (holidayDates.includes(dateStr)) return false;
  return true;
};

const countWorkingDays = (fromDate, toDate, holidayDates) => {
  let count = 0;
  const current = new Date(fromDate);
  const end = new Date(toDate);
  while (current <= end) {
    if (isWorkingDay(current, holidayDates)) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
};

// ─── AUTHORIZATION HELPERS ────────────────────

const assertCanMarkClassAttendance = async (tenantId, actingUser, classId, sectionId, attendanceDate) => {
  if (actingUser.identity === 'admin') return;

  if (actingUser.identity !== 'staff' || actingUser.staffRole !== 'teacher') {
    throw new HttpError(403, 'Only teachers or admins can mark class attendance', { code: 'FORBIDDEN' });
  }
  if (!actingUser.staffId) {
    throw new HttpError(403, 'This account is not linked to a staff record', { code: 'FORBIDDEN' });
  }

  const teacherTimetableCount = await prisma.timetable.count({
    where: { tenantId, staffId: actingUser.staffId, isActive: true },
  });
  if (teacherTimetableCount > 0) {
    const dayOfWeek = new Date(attendanceDate).getDay(); // 1=Mon..6=Sat, matches Timetable.dayOfWeek

    const assignment = await prisma.timetable.findFirst({
      where: {
        tenantId,
        staffId: actingUser.staffId,
        classId: parseInt(classId),
        ...(sectionId && { sectionId: parseInt(sectionId) }),
        dayOfWeek,
        isActive: true,
      },
    });

    if (!assignment) {
      throw new HttpError(403, 'You are not timetabled to teach this class on this day', { code: 'FORBIDDEN' });
    }
  }
};

// ─── STUDENT ATTENDANCE ───────────────────────

const markClassAttendance = async (data, tenantId, actingUser) => {
  const { academicYearId, classId, sectionId, date, records } = data;

  if (!Array.isArray(records) || records.length === 0)
    throw new HttpError(400, 'records array is required', { code: 'VALIDATION_ERROR' });

  const attendanceDate = new Date(date);

  const holidays = await prisma.holiday.findMany({
    where: { tenantId, academicYearId: parseInt(academicYearId), date: attendanceDate },
  });
  if (holidays.length > 0) throw new HttpError(400, 'Cannot mark attendance on a holiday', { code: 'VALIDATION_ERROR' });
  if (attendanceDate.getDay() === 0) throw new HttpError(400, 'Cannot mark attendance on Sunday', { code: 'VALIDATION_ERROR' });
  if (isSecondSaturday(attendanceDate)) throw new HttpError(400, 'Cannot mark attendance on 2nd Saturday (half day holiday)', { code: 'VALIDATION_ERROR' });

  await assertCanMarkClassAttendance(tenantId, actingUser, classId, sectionId, attendanceDate);

  // markedById is ALWAYS derived from the authenticated user, never the request body.
  const markedById = actingUser.staffId || null;

  const studentIds = records.map(r => parseInt(r.studentId));
  const validStudents = await prisma.student.findMany({
    where: {
      id: { in: studentIds },
      tenantId,
      classId: parseInt(classId),
      ...(sectionId && { sectionId: parseInt(sectionId) }),
      isDeleted: false
    },
    select: { id: true }
  });

  if (validStudents.length !== new Set(studentIds).size) {
    throw new HttpError(400, 'One or more student IDs are invalid, deleted, or do not belong to the class', { code: 'VALIDATION_ERROR' });
  }

  const results = await prisma.$transaction(
    records.map((r) =>
      prisma.studentAttendance.upsert({
        where: { tenantId_studentId_date: { tenantId, studentId: parseInt(r.studentId), date: attendanceDate } },
        update: { status: r.status, remark: r.remark || null, markedById },
        create: {
          tenantId,
          academicYearId: parseInt(academicYearId),
          studentId: parseInt(r.studentId),
          classId: parseInt(classId),
          sectionId: sectionId ? parseInt(sectionId) : null,
          date: attendanceDate,
          status: r.status,
          remark: r.remark || null,
          markedById,
        },
      })
    )
  );

  return { message: `Attendance marked for ${results.length} students`, count: results.length };
};

const getClassAttendanceByDate = async (tenantId, classId, sectionId, date) => {
  return prisma.studentAttendance.findMany({
    where: {
      tenantId,
      classId: parseInt(classId),
      ...(sectionId && { sectionId: parseInt(sectionId) }),
      date: new Date(date),
    },
    include: {
      student: { select: { id: true, studentName: true, admissionNo: true, rollNo: true } },
      markedBy: { select: { id: true, name: true } },
    },
    orderBy: { student: { rollNo: 'asc' } },
  });
};

const getStudentAttendanceHistory = async (tenantId, studentId, academicYearId, fromDate, toDate) => {
  const student = await prisma.student.findFirst({
    where: { id: parseInt(studentId), tenantId, isDeleted: false },
  });
  if (!student) throw new HttpError(404, 'Student not found', { code: 'NOT_FOUND' });

  const from = fromDate ? new Date(fromDate) : new Date(new Date().getFullYear(), 0, 1);
  const to = toDate ? new Date(toDate) : new Date();

  const holidayRecords = await prisma.holiday.findMany({
    where: {
      tenantId,
      ...(academicYearId && { academicYearId: parseInt(academicYearId) }),
      date: { gte: from, lte: to },
    },
    select: { date: true },
  });
  const holidayDates = holidayRecords.map((h) => h.date.toISOString().split('T')[0]);

  const records = await prisma.studentAttendance.findMany({
    where: { tenantId, studentId: parseInt(studentId), date: { gte: from, lte: to } },
    orderBy: { date: 'desc' },
  });

  const totalWorkingDays = countWorkingDays(from, to, holidayDates);
  const presentDays = records.filter((r) => r.status === 'present' || r.status === 'late').length;
  const absentDays = records.filter((r) => r.status === 'absent').length;
  const percentage = totalWorkingDays > 0 ? ((presentDays / totalWorkingDays) * 100).toFixed(2) : '0.00';

  return {
    student: { id: student.id, name: student.studentName, admissionNo: student.admissionNo },
    summary: {
      totalWorkingDays,
      presentDays,
      absentDays,
      unmarkedDays: totalWorkingDays - records.length,
      percentage: `${percentage}%`,
    },
    records,
  };
};

const getClassMonthlyAttendanceSummary = async (tenantId, classId, sectionId, month, year, academicYearId) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const holidayRecords = await prisma.holiday.findMany({
    where: {
      tenantId,
      ...(academicYearId && { academicYearId: parseInt(academicYearId) }),
      date: { gte: startDate, lte: endDate },
    },
    select: { date: true },
  });
  const holidayDates = holidayRecords.map((h) => h.date.toISOString().split('T')[0]);
  const totalWorkingDays = countWorkingDays(startDate, endDate, holidayDates);

  const students = await prisma.student.findMany({
    where: {
      tenantId,
      classId: parseInt(classId),
      ...(sectionId && { sectionId: parseInt(sectionId) }),
      isDeleted: false,
    },
    select: { id: true, studentName: true, admissionNo: true, rollNo: true },
    orderBy: { rollNo: 'asc' },
  });

  const summary = await Promise.all(
    students.map(async (student) => {
      const records = await prisma.studentAttendance.findMany({
        where: { tenantId, studentId: student.id, date: { gte: startDate, lte: endDate } },
      });
      const presentDays = records.filter((r) => r.status === 'present' || r.status === 'late').length;
      const percentage = totalWorkingDays > 0 ? ((presentDays / totalWorkingDays) * 100).toFixed(2) : '0.00';
      return { ...student, totalWorkingDays, presentDays, absentDays: totalWorkingDays - presentDays, percentage: `${percentage}%` };
    })
  );

  return { month, year, totalWorkingDays, holidayDates, students: summary };
};

// ─── STAFF ATTENDANCE ────────────────────────

const markStaffAttendance = async (data, tenantId, actingUser) => {
  if (actingUser.identity !== 'admin') {
    throw new HttpError(403, 'Only admins can mark staff attendance', { code: 'FORBIDDEN' });
  }

  const { academicYearId, staffId, date, status, inTime, outTime, remark } = data;
  const attendanceDate = new Date(date);

  const staff = await prisma.staff.findFirst({ where: { id: parseInt(staffId), tenantId, isDeleted: false } });
  if (!staff) throw new HttpError(404, 'Staff not found', { code: 'NOT_FOUND' });

  return prisma.staffAttendance.upsert({
    where: { tenantId_staffId_date: { tenantId, staffId: parseInt(staffId), date: attendanceDate } },
    update: { status, inTime: inTime || null, outTime: outTime || null, remark: remark || null },
    create: {
      tenantId,
      academicYearId: parseInt(academicYearId),
      staffId: parseInt(staffId),
      date: attendanceDate,
      status,
      inTime: inTime || null,
      outTime: outTime || null,
      remark: remark || null,
    },
  });
};

const getStaffAttendanceHistory = async (tenantId, staffId, academicYearId, fromDate, toDate) => {
  const staff = await prisma.staff.findFirst({ where: { id: parseInt(staffId), tenantId, isDeleted: false } });
  if (!staff) throw new HttpError(404, 'Staff not found', { code: 'NOT_FOUND' });

  const from = fromDate ? new Date(fromDate) : new Date(new Date().getFullYear(), 0, 1);
  const to = toDate ? new Date(toDate) : new Date();

  const holidayRecords = await prisma.holiday.findMany({
    where: {
      tenantId,
      ...(academicYearId && { academicYearId: parseInt(academicYearId) }),
      date: { gte: from, lte: to },
    },
    select: { date: true },
  });
  const holidayDates = holidayRecords.map((h) => h.date.toISOString().split('T')[0]);
  const totalWorkingDays = countWorkingDays(from, to, holidayDates);

  const records = await prisma.staffAttendance.findMany({
    where: { tenantId, staffId: parseInt(staffId), date: { gte: from, lte: to } },
    orderBy: { date: 'desc' },
  });

  const presentDays = records.filter((r) => r.status === 'present' || r.status === 'late').length;
  const percentage = totalWorkingDays > 0 ? ((presentDays / totalWorkingDays) * 100).toFixed(2) : '0.00';

  return {
    staff: { id: staff.id, name: staff.name, employeeId: staff.employeeId },
    summary: { totalWorkingDays, presentDays, absentDays: totalWorkingDays - presentDays, percentage: `${percentage}%` },
    records,
  };
};

const getAllStaffAttendanceByDate = async (tenantId, date) => {
  return prisma.staffAttendance.findMany({
    where: { tenantId, date: new Date(date) },
    include: { staff: { select: { id: true, name: true, employeeId: true, role: true } } },
    orderBy: { staff: { name: 'asc' } },
  });
};

module.exports = {
  markClassAttendance, getClassAttendanceByDate,
  getStudentAttendanceHistory, getClassMonthlyAttendanceSummary,
  markStaffAttendance, getStaffAttendanceHistory, getAllStaffAttendanceByDate,
};
