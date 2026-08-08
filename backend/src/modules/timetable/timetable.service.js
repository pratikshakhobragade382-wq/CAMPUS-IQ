const prisma = require('../../prisma/prismaClient');

// ───────────── PERIOD SLOTS ─────────────
const createPeriodSlot = async (data, tenantId) => {
  const { slotNo, label, slotType, startTime, endTime } = data;
  const existing = await prisma.periodSlot.findFirst({ where: { tenantId, slotNo } });
  if (existing) throw new Error('Slot number already exists');
  return prisma.periodSlot.create({
    data: { tenantId, slotNo, label, slotType, startTime, endTime, isActive: true },
  });
};

const getAllPeriodSlots = async (tenantId) => {
  return prisma.periodSlot.findMany({
    where: { tenantId, isActive: true },
    orderBy: { slotNo: 'asc' },
  });
};

const updatePeriodSlot = async (id, data, tenantId) => {
  const existing = await prisma.periodSlot.findFirst({ where: { id: parseInt(id), tenantId } });
  if (!existing) throw new Error('Period slot not found');
  return prisma.periodSlot.update({
    where: { id: parseInt(id) },
    data: {
      ...(data.label && { label: data.label }),
      ...(data.slotType && { slotType: data.slotType }),
      ...(data.startTime && { startTime: data.startTime }),
      ...(data.endTime && { endTime: data.endTime }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });
};

const deletePeriodSlot = async (id, tenantId) => {
  const existing = await prisma.periodSlot.findFirst({ where: { id: parseInt(id), tenantId } });
  if (!existing) throw new Error('Period slot not found');
  await prisma.periodSlot.delete({ where: { id: parseInt(id) } });
  return { message: 'Period slot deleted successfully' };
};

// Seed the default 7-period + recess + lunch + sports structure you confirmed
const seedDefaultSlots = async (tenantId) => {
  const existing = await prisma.periodSlot.findMany({ where: { tenantId } });
  if (existing.length > 0) throw new Error('Period slots already seeded for this tenant');

  const defaultSlots = [
    { slotNo: 1, label: 'Period 1', slotType: 'period', startTime: '08:00', endTime: '08:45' },
    { slotNo: 2, label: 'Period 2', slotType: 'period', startTime: '08:45', endTime: '09:30' },
    { slotNo: 3, label: 'Period 3', slotType: 'period', startTime: '09:30', endTime: '10:15' },
    { slotNo: 4, label: 'Recess', slotType: 'recess', startTime: '10:15', endTime: '10:30' },
    { slotNo: 5, label: 'Period 4', slotType: 'period', startTime: '10:30', endTime: '11:15' },
    { slotNo: 6, label: 'Period 5', slotType: 'period', startTime: '11:15', endTime: '12:00' },
    { slotNo: 7, label: 'Lunch Break', slotType: 'lunch', startTime: '12:00', endTime: '12:30' },
    { slotNo: 8, label: 'Period 6', slotType: 'period', startTime: '12:30', endTime: '13:15' },
    { slotNo: 9, label: 'Period 7', slotType: 'period', startTime: '13:15', endTime: '14:00' },
    { slotNo: 10, label: 'Sports', slotType: 'sports', startTime: '14:00', endTime: '15:00' },
  ];

  await prisma.periodSlot.createMany({
    data: defaultSlots.map((s) => ({ ...s, tenantId, isActive: true })),
  });

  return getAllPeriodSlots(tenantId);
};

// ───────────── TIMETABLE ENTRIES ─────────────
const createTimetableEntry = async (data, tenantId) => {
  const { academicYearId, classId, sectionId, subjectId, staffId, periodSlotId, dayOfWeek } = data;

  // Only "period" and "sports" type slots can have a subject/teacher assigned
  const slot = await prisma.periodSlot.findFirst({ where: { id: parseInt(periodSlotId), tenantId } });
  if (!slot) throw new Error('Period slot not found');
  if (!['period', 'sports'].includes(slot.slotType)) {
    throw new Error(`Cannot assign a subject to a "${slot.slotType}" slot`);
  }

  // Check teacher double-booking
  const teacherConflict = await prisma.timetable.findFirst({
    where: { tenantId, academicYearId: parseInt(academicYearId), staffId: parseInt(staffId), dayOfWeek: parseInt(dayOfWeek), periodSlotId: parseInt(periodSlotId), isActive: true },
  });
  if (teacherConflict) throw new Error('This teacher is already assigned to another class at this time');

  // Check class double-booking
  const classConflict = await prisma.timetable.findFirst({
    where: { tenantId, academicYearId: parseInt(academicYearId), classId: parseInt(classId), sectionId: sectionId ? parseInt(sectionId) : null, dayOfWeek: parseInt(dayOfWeek), periodSlotId: parseInt(periodSlotId), isActive: true },
  });
  if (classConflict) throw new Error('This class already has a subject scheduled at this time');

  return prisma.timetable.create({
    data: {
      tenantId,
      academicYearId: parseInt(academicYearId),
      classId: parseInt(classId),
      sectionId: sectionId ? parseInt(sectionId) : null,
      subjectId: parseInt(subjectId),
      staffId: parseInt(staffId),
      periodSlotId: parseInt(periodSlotId),
      dayOfWeek: parseInt(dayOfWeek),
      isActive: true,
    },
    include: { class: true, section: true, subject: true, staff: { select: { id: true, name: true } }, periodSlot: true },
  });
};

const getClassTimetable = async (tenantId, classId, sectionId, academicYearId) => {
  const where = {
    tenantId, classId: parseInt(classId), isActive: true,
    ...(sectionId && { sectionId: parseInt(sectionId) }),
    ...(academicYearId && { academicYearId: parseInt(academicYearId) }),
  };
  const entries = await prisma.timetable.findMany({
    where,
    include: { subject: true, staff: { select: { id: true, name: true } }, periodSlot: true },
    orderBy: [{ dayOfWeek: 'asc' }, { periodSlot: { slotNo: 'asc' } }],
  });

  // Group by day
  const grouped = {};
  const days = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  entries.forEach((e) => {
    const day = days[e.dayOfWeek];
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(e);
  });
  return grouped;
};

const getTeacherTimetable = async (tenantId, staffId, academicYearId) => {
  const where = {
    tenantId, staffId: parseInt(staffId), isActive: true,
    ...(academicYearId && { academicYearId: parseInt(academicYearId) }),
  };
  const entries = await prisma.timetable.findMany({
    where,
    include: { class: true, section: true, subject: true, periodSlot: true },
    orderBy: [{ dayOfWeek: 'asc' }, { periodSlot: { slotNo: 'asc' } }],
  });

  const grouped = {};
  const days = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  entries.forEach((e) => {
    const day = days[e.dayOfWeek];
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(e);
  });
  return grouped;
};

const updateTimetableEntry = async (id, data, tenantId) => {
  const existing = await prisma.timetable.findFirst({ where: { id: parseInt(id), tenantId } });
  if (!existing) throw new Error('Timetable entry not found');
  return prisma.timetable.update({
    where: { id: parseInt(id) },
    data: {
      ...(data.subjectId && { subjectId: parseInt(data.subjectId) }),
      ...(data.staffId && { staffId: parseInt(data.staffId) }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });
};

const deleteTimetableEntry = async (id, tenantId) => {
  const existing = await prisma.timetable.findFirst({ where: { id: parseInt(id), tenantId } });
  if (!existing) throw new Error('Timetable entry not found');
  await prisma.timetable.delete({ where: { id: parseInt(id) } });
  return { message: 'Timetable entry deleted successfully' };
};

module.exports = {
  createPeriodSlot, getAllPeriodSlots, updatePeriodSlot, deletePeriodSlot, seedDefaultSlots,
  createTimetableEntry, getClassTimetable, getTeacherTimetable, updateTimetableEntry, deleteTimetableEntry,
};
