const prisma = require('../../prisma/prismaClient');
const { HttpError } = require('../../utils/httpError');

const assertIsAdmin = (actingUser) => {
  if (actingUser.identity !== 'admin') {
    throw new HttpError(403, 'Only admins can manage the holiday calendar', { code: 'FORBIDDEN' });
  }
};

const createHoliday = async (data, tenantId, actingUser) => {
  assertIsAdmin(actingUser);
  const { academicYearId, name, date, holidayType } = data;

  const academicYear = await prisma.academicYear.findFirst({
    where: { id: parseInt(academicYearId), tenantId },
  });
  if (!academicYear) throw new HttpError(404, 'Academic year not found', { code: 'NOT_FOUND' });

  const holidayDate = new Date(date);
  if (academicYear.startDate && academicYear.endDate) {
    if (holidayDate < academicYear.startDate || holidayDate > academicYear.endDate) {
      throw new HttpError(400, 'Holiday date must fall within the academic year date range', { code: 'VALIDATION_ERROR' });
    }
  }

  try {
    return await prisma.holiday.create({
      data: {
        tenantId,
        academicYearId: parseInt(academicYearId),
        name,
        date: holidayDate,
        holidayType: holidayType || 'public',
      },
    });
  } catch (err) {
    if (err.code === 'P2002') throw new HttpError(409, 'A holiday already exists on this date', { code: 'DUPLICATE' });
    throw err;
  }
};

const getAllHolidays = async (tenantId, academicYearId) => {
  return prisma.holiday.findMany({
    where: {
      tenantId,
      ...(academicYearId && { academicYearId: parseInt(academicYearId) }),
    },
    orderBy: { date: 'asc' },
  });
};

const updateHoliday = async (id, data, tenantId, actingUser) => {
  assertIsAdmin(actingUser);
  const existing = await prisma.holiday.findFirst({ where: { id: parseInt(id), tenantId } });
  if (!existing) throw new HttpError(404, 'Holiday not found', { code: 'NOT_FOUND' });
  return prisma.holiday.update({
    where: { id: parseInt(id) },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.date && { date: new Date(data.date) }),
      ...(data.holidayType && { holidayType: data.holidayType }),
    },
  });
};

const deleteHoliday = async (id, tenantId, actingUser) => {
  assertIsAdmin(actingUser);
  const existing = await prisma.holiday.findFirst({ where: { id: parseInt(id), tenantId } });
  if (!existing) throw new HttpError(404, 'Holiday not found', { code: 'NOT_FOUND' });
  await prisma.holiday.delete({ where: { id: parseInt(id) } });
  return { message: 'Holiday deleted successfully' };
};

const getHolidayDates = async (tenantId, academicYearId, fromDate, toDate) => {
  const holidays = await prisma.holiday.findMany({
    where: {
      tenantId,
      academicYearId: parseInt(academicYearId),
      date: { gte: new Date(fromDate), lte: new Date(toDate) },
    },
    select: { date: true },
  });
  return holidays.map((h) => h.date.toISOString().split('T')[0]);
};

module.exports = { createHoliday, getAllHolidays, updateHoliday, deleteHoliday, getHolidayDates };
