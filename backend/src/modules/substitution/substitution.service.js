const prisma = require("../../prisma/prismaClient");

/* ============================================================
   FIND AVAILABLE SUBSTITUTES FOR A TIMETABLE ENTRY ON A DATE
============================================================ */
const getAvailableSubstitutes = async (tenantId, timetableId, date) => {
  const entry = await prisma.timetable.findFirst({
    where: { id: Number(timetableId), tenantId, isActive: true },
    include: { subject: true, periodSlot: true, staff: true, class: true, section: true },
  });

  if (!entry) {
    throw new Error("Timetable entry not found");
  }

  const targetDate = new Date(date);
  targetDate.setUTCHours(0, 0, 0, 0);

  // 1. Teachers qualified to teach this subject (excluding the original teacher)
  const qualified = await prisma.staffSubject.findMany({
    where: {
      tenantId,
      subjectId: entry.subjectId,
      staffId: { not: entry.staffId },
    },
    include: {
      staff: {
        select: { id: true, name: true, employeeId: true, role: true, isDeleted: true, departmentId: true },
      },
    },
  });

  let candidates = qualified
    .map((qs) => qs.staff)
    .filter((s) => s && !s.isDeleted && s.role === "teacher");

  if (candidates.length === 0) {
    return { entry, availableSubstitutes: [] };
  }

  const candidateIds = candidates.map((c) => c.id);

  // 2. Exclude teachers on leave / marked absent for this date
  const absentToday = await prisma.staffAttendance.findMany({
    where: {
      tenantId,
      date: targetDate,
      staffId: { in: candidateIds },
      status: "absent",
    },
    select: { staffId: true },
  });
  const absentIds = new Set(absentToday.map((a) => a.staffId));

  // 3. Exclude teachers who already have a regular timetable entry at this exact day+period
  const busyRegular = await prisma.timetable.findMany({
    where: {
      tenantId,
      isActive: true,
      dayOfWeek: entry.dayOfWeek,
      periodSlotId: entry.periodSlotId,
      staffId: { in: candidateIds },
    },
    select: { staffId: true },
  });
  const busyIds = new Set(busyRegular.map((b) => b.staffId));

  // 4. Exclude teachers already assigned as a substitute elsewhere at this exact day+period on this date
  const sameSlotTimetableIds = (
    await prisma.timetable.findMany({
      where: { tenantId, isActive: true, dayOfWeek: entry.dayOfWeek, periodSlotId: entry.periodSlotId },
      select: { id: true },
    })
  ).map((t) => t.id);

  const busySubs = await prisma.substitution.findMany({
    where: {
      tenantId,
      date: targetDate,
      status: "confirmed",
      timetableId: { in: sameSlotTimetableIds },
      substituteStaffId: { in: candidateIds },
    },
    select: { substituteStaffId: true },
  });
  const busySubIds = new Set(busySubs.map((b) => b.substituteStaffId));

  const availableSubstitutes = candidates.filter(
    (c) => !absentIds.has(c.id) && !busyIds.has(c.id) && !busySubIds.has(c.id)
  );

  return { entry, availableSubstitutes };
};

/* ============================================================
   ASSIGN A SUBSTITUTE
============================================================ */
const assignSubstitute = async (tenantId, data, assignedById) => {
  const { timetableId, date, substituteStaffId, remark } = data;

  if (!timetableId || !date || !substituteStaffId) {
    throw new Error("timetableId, date and substituteStaffId are required");
  }

  const { entry, availableSubstitutes } = await getAvailableSubstitutes(tenantId, timetableId, date);

  const chosen = availableSubstitutes.find((s) => Number(s.id) === Number(substituteStaffId));
  if (!chosen) {
    throw new Error("Selected teacher is not available for this period on this date");
  }

  const targetDate = new Date(date);
  targetDate.setUTCHours(0, 0, 0, 0);

  const existing = await prisma.substitution.findFirst({
    where: { tenantId, timetableId: entry.id, date: targetDate },
  });

  if (existing) {
    if (existing.status === "confirmed") {
      throw new Error("A substitute is already assigned for this period on this date");
    }
    return prisma.substitution.update({
      where: { id: existing.id },
      data: { substituteStaffId: Number(substituteStaffId), status: "confirmed", remark: remark || null, assignedById },
      include: substitutionInclude(),
    });
  }

  return prisma.substitution.create({
    data: {
      tenantId,
      timetableId: entry.id,
      originalStaffId: entry.staffId,
      substituteStaffId: Number(substituteStaffId),
      date: targetDate,
      status: "confirmed",
      remark: remark || null,
      assignedById,
    },
    include: substitutionInclude(),
  });
};

/* ============================================================
   CANCEL A SUBSTITUTION
============================================================ */
const cancelSubstitution = async (tenantId, id) => {
  const existing = await prisma.substitution.findFirst({
    where: { id: Number(id), tenantId },
  });
  if (!existing) {
    throw new Error("Substitution not found");
  }
  return prisma.substitution.update({
    where: { id: existing.id },
    data: { status: "cancelled" },
    include: substitutionInclude(),
  });
};

/* ============================================================
   MY SUBSTITUTIONS (as original teacher, and as assigned substitute)
============================================================ */
const getMySubstitutions = async (tenantId, staffId, date) => {
  const targetDate = new Date(date);
  targetDate.setUTCHours(0, 0, 0, 0);

  const [asOriginal, asSubstitute] = await Promise.all([
    prisma.substitution.findMany({
      where: { tenantId, originalStaffId: Number(staffId), date: targetDate, status: "confirmed" },
      include: substitutionInclude(),
    }),
    prisma.substitution.findMany({
      where: { tenantId, substituteStaffId: Number(staffId), date: targetDate, status: "confirmed" },
      include: substitutionInclude(),
    }),
  ]);

  return { asOriginal, asSubstitute };
};

function substitutionInclude() {
  return {
    timetable: { include: { subject: true, class: true, section: true, periodSlot: true } },
    originalStaff: { select: { id: true, name: true } },
    substituteStaff: { select: { id: true, name: true } },
  };
}

module.exports = {
  getAvailableSubstitutes,
  assignSubstitute,
  cancelSubstitution,
  getMySubstitutions,
};
