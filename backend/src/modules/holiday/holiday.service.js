// const prisma = require('../../prisma/prismaClient');
// const { HttpError } = require('../../utils/httpError');

// const assertIsAdmin = (actingUser) => {
//   if (actingUser.identity !== 'admin') {
//     throw new HttpError(403, 'Only admins can manage the holiday calendar', { code: 'FORBIDDEN' });
//   }
// };

// const createHoliday = async (data, tenantId, actingUser) => {
//   assertIsAdmin(actingUser);
//   const { academicYearId, name, date, holidayType } = data;

//   const academicYear = await prisma.academicYear.findFirst({
//     where: { id: parseInt(academicYearId), tenantId },
//   });
//   if (!academicYear) throw new HttpError(404, 'Academic year not found', { code: 'NOT_FOUND' });

//   const holidayDate = new Date(date);
//   if (academicYear.startDate && academicYear.endDate) {
//     if (holidayDate < academicYear.startDate || holidayDate > academicYear.endDate) {
//       throw new HttpError(400, 'Holiday date must fall within the academic year date range', { code: 'VALIDATION_ERROR' });
//     }
//   }

//   try {
//     return await prisma.holiday.create({
//       data: {
//         tenantId,
//         academicYearId: parseInt(academicYearId),
//         name,
//         date: holidayDate,
//         holidayType: holidayType || 'public',
//       },
//     });
//   } catch (err) {
//     if (err.code === 'P2002') throw new HttpError(409, 'A holiday already exists on this date', { code: 'DUPLICATE' });
//     throw err;
//   }
// };

// const getAllHolidays = async (tenantId, academicYearId) => {
//   return prisma.holiday.findMany({
//     where: {
//       tenantId,
//       ...(academicYearId && { academicYearId: parseInt(academicYearId) }),
//     },
//     orderBy: { date: 'asc' },
//   });
// };

// const updateHoliday = async (id, data, tenantId, actingUser) => {
//   assertIsAdmin(actingUser);
//   const existing = await prisma.holiday.findFirst({ where: { id: parseInt(id), tenantId } });
//   if (!existing) throw new HttpError(404, 'Holiday not found', { code: 'NOT_FOUND' });
//   return prisma.holiday.update({
//     where: { id: parseInt(id) },
//     data: {
//       ...(data.name && { name: data.name }),
//       ...(data.date && { date: new Date(data.date) }),
//       ...(data.holidayType && { holidayType: data.holidayType }),
//     },
//   });
// };

// const deleteHoliday = async (id, tenantId, actingUser) => {
//   assertIsAdmin(actingUser);
//   const existing = await prisma.holiday.findFirst({ where: { id: parseInt(id), tenantId } });
//   if (!existing) throw new HttpError(404, 'Holiday not found', { code: 'NOT_FOUND' });
//   await prisma.holiday.delete({ where: { id: parseInt(id) } });
//   return { message: 'Holiday deleted successfully' };
// };

// const getHolidayDates = async (tenantId, academicYearId, fromDate, toDate) => {
//   const holidays = await prisma.holiday.findMany({
//     where: {
//       tenantId,
//       academicYearId: parseInt(academicYearId),
//       date: { gte: new Date(fromDate), lte: new Date(toDate) },
//     },
//     select: { date: true },
//   });
//   return holidays.map((h) => h.date.toISOString().split('T')[0]);
// };

// module.exports = { createHoliday, getAllHolidays, updateHoliday, deleteHoliday, getHolidayDates };












const prisma = require('../../prisma/prismaClient');
const { HttpError } = require('../../utils/httpError');
const notificationService = require('../notification/notification.service');

// =====================================================
// Admin Check
// =====================================================

const assertIsAdmin = (actingUser) => {
  if (actingUser.identity !== 'admin') {
    throw new HttpError(
      403,
      'Only admins can manage the holiday calendar',
      { code: 'FORBIDDEN' }
    );
  }
};

// =====================================================
// Create Holiday
// =====================================================

const createHoliday = async (data, tenantId, actingUser) => {
  assertIsAdmin(actingUser);

  const { academicYearId, name, date, holidayType } = data;

  // Validate academic year
  const academicYear = await prisma.academicYear.findFirst({
    where: {
      id: parseInt(academicYearId, 10),
      tenantId,
    },
  });

  if (!academicYear) {
    throw new HttpError(
      404,
      'Academic year not found',
      { code: 'NOT_FOUND' }
    );
  }

  // Convert holiday date
  const holidayDate = new Date(date);

  // Validate date
  if (Number.isNaN(holidayDate.getTime())) {
    throw new HttpError(
      400,
      'Invalid holiday date',
      { code: 'VALIDATION_ERROR' }
    );
  }

  // Make sure holiday falls inside academic year
  if (academicYear.startDate && academicYear.endDate) {
    if (
      holidayDate < academicYear.startDate ||
      holidayDate > academicYear.endDate
    ) {
      throw new HttpError(
        400,
        'Holiday date must fall within the academic year date range',
        { code: 'VALIDATION_ERROR' }
      );
    }
  }

  try {
    // =================================================
    // 1. Create Holiday
    // =================================================

    const holiday = await prisma.holiday.create({
      data: {
        tenantId,
        academicYearId: parseInt(academicYearId, 10),
        name,
        date: holidayDate,
        holidayType: holidayType || 'public',
      },
    });

    // =================================================
    // 2. Create Notification
    // =================================================

    try {
      await notificationService.createNotification({
        tenantId,
        title: 'New Holiday Added',
        message: `${name} has been added to the holiday calendar for ${holidayDate
          .toISOString()
          .split('T')[0]}.`,
        type: 'holiday',
        priority: 'normal',
        audience: 'all',
        createdById: actingUser.userId,
      });
    } catch (notificationError) {
      // Notification failure should not undo
      // the successfully created holiday.
      console.error(
        'Failed to create holiday notification:',
        notificationError
      );
    }

    // Return the created holiday
    return holiday;
  } catch (err) {
    // Duplicate holiday
    if (err.code === 'P2002') {
      throw new HttpError(
        409,
        'A holiday already exists on this date',
        { code: 'DUPLICATE' }
      );
    }

    throw err;
  }
};

// =====================================================
// Get All Holidays
// =====================================================

const getAllHolidays = async (tenantId, academicYearId) => {
  return prisma.holiday.findMany({
    where: {
      tenantId,
      ...(academicYearId && {
        academicYearId: parseInt(academicYearId, 10),
      }),
    },
    orderBy: {
      date: 'asc',
    },
  });
};

// =====================================================
// Update Holiday
// =====================================================

const updateHoliday = async (id, data, tenantId, actingUser) => {
  assertIsAdmin(actingUser);

  const holidayId = parseInt(id, 10);

  const existing = await prisma.holiday.findFirst({
    where: {
      id: holidayId,
      tenantId,
    },
  });

  if (!existing) {
    throw new HttpError(
      404,
      'Holiday not found',
      { code: 'NOT_FOUND' }
    );
  }

  // If date is being changed, validate it
  let updatedDate;

  if (data.date) {
    updatedDate = new Date(data.date);

    if (Number.isNaN(updatedDate.getTime())) {
      throw new HttpError(
        400,
        'Invalid holiday date',
        { code: 'VALIDATION_ERROR' }
      );
    }

    const academicYear = await prisma.academicYear.findFirst({
      where: {
        id: existing.academicYearId,
        tenantId,
      },
    });

    if (
      academicYear &&
      academicYear.startDate &&
      academicYear.endDate
    ) {
      if (
        updatedDate < academicYear.startDate ||
        updatedDate > academicYear.endDate
      ) {
        throw new HttpError(
          400,
          'Holiday date must fall within the academic year date range',
          { code: 'VALIDATION_ERROR' }
        );
      }
    }
  }

  try {
    const updatedHoliday = await prisma.holiday.update({
      where: {
        id: holidayId,
      },
      data: {
        ...(data.name && {
          name: data.name,
        }),

        ...(data.date && {
          date: updatedDate,
        }),

        ...(data.holidayType && {
          holidayType: data.holidayType,
        }),
      },
    });

    // =================================================
    // Create notification for holiday update
    // =================================================

    try {
      await notificationService.createNotification({
        tenantId,
        title: 'Holiday Updated',
        message: `${updatedHoliday.name} has been updated in the holiday calendar.`,
        type: 'holiday',
        priority: 'normal',
        audience: 'all',
        createdById: actingUser.userId,
      });
    } catch (notificationError) {
      console.error(
        'Failed to create holiday update notification:',
        notificationError
      );
    }

    return updatedHoliday;
  } catch (err) {
    if (err.code === 'P2002') {
      throw new HttpError(
        409,
        'A holiday already exists on this date',
        { code: 'DUPLICATE' }
      );
    }

    throw err;
  }
};

// =====================================================
// Delete Holiday
// =====================================================

const deleteHoliday = async (id, tenantId, actingUser) => {
  assertIsAdmin(actingUser);

  const holidayId = parseInt(id, 10);

  const existing = await prisma.holiday.findFirst({
    where: {
      id: holidayId,
      tenantId,
    },
  });

  if (!existing) {
    throw new HttpError(
      404,
      'Holiday not found',
      { code: 'NOT_FOUND' }
    );
  }

  await prisma.holiday.delete({
    where: {
      id: holidayId,
    },
  });

  // =================================================
  // Create notification for holiday deletion
  // =================================================

  try {
    await notificationService.createNotification({
      tenantId,
      title: 'Holiday Removed',
      message: `${existing.name} has been removed from the holiday calendar.`,
      type: 'holiday',
      priority: 'normal',
      audience: 'all',
      createdById: actingUser.userId,
    });
  } catch (notificationError) {
    console.error(
      'Failed to create holiday deletion notification:',
      notificationError
    );
  }

  return {
    message: 'Holiday deleted successfully',
  };
};

// =====================================================
// Get Holiday Dates
// =====================================================

const getHolidayDates = async (
  tenantId,
  academicYearId,
  fromDate,
  toDate
) => {
  const holidays = await prisma.holiday.findMany({
    where: {
      tenantId,
      academicYearId: parseInt(academicYearId, 10),
      date: {
        gte: new Date(fromDate),
        lte: new Date(toDate),
      },
    },
    select: {
      date: true,
    },
  });

  return holidays.map((holiday) =>
    holiday.date.toISOString().split('T')[0]
  );
};

// =====================================================
// Exports
// =====================================================

module.exports = {
  createHoliday,
  getAllHolidays,
  updateHoliday,
  deleteHoliday,
  getHolidayDates,
};