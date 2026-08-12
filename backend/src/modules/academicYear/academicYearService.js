const prisma = require('../../prisma/prismaClient');
const { HttpError } = require('../../utils/httpError');
const { createNotification } = require('../notification/notification.service');

/*
 * Generate academic year name automatically.
 *
 * Example:
 * Start date: 01/06/2026
 * End date:   31/05/2027
 *
 * Result:
 * 2026-2027
 */
function generateAcademicYearName(startDate, endDate) {
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();

  return `${startYear}-${endYear}`;
}

/*
 * Convert ID into a valid number.
 *
 * This prevents invalid IDs such as "abc"
 * from reaching Prisma.
 */
function getValidId(id) {
  const parsedId = parseInt(id, 10);

  if (Number.isNaN(parsedId)) {
    throw new HttpError(400, 'Invalid academic year ID', {
      code: 'INVALID_ID',
    });
  }

  return parsedId;
}

/*
 * CREATE ACADEMIC YEAR
 */
exports.createAcademicYear = async ({
  startDate,
  endDate,
  isActive = false,
  tenantId,
}) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Validate start date
  if (Number.isNaN(start.getTime())) {
    throw new HttpError(400, 'Invalid start date', {
      code: 'INVALID_DATE',
    });
  }

  // Validate end date
  if (Number.isNaN(end.getTime())) {
    throw new HttpError(400, 'Invalid end date', {
      code: 'INVALID_DATE',
    });
  }

  // End date must be after start date
  if (end <= start) {
    throw new HttpError(400, 'End date must be after start date', {
      code: 'INVALID_DATE_RANGE',
    });
  }

  // Generate academic year name automatically
  const name = generateAcademicYearName(start, end);

  // Check whether the same academic year already exists
const existing = await prisma.academicYear.findFirst({
  where: {
    startDate: start,
    endDate: end,
    tenantId,
    isDeleted: false,
  },
});

if (existing) {
  throw new HttpError(
    409,
    `An academic year with these exact dates already exists (${existing.name})`,
    {
      code: 'DUPLICATE',
    }
  );
}

  /*
   * Only one academic year can be active at a time.
   *
   * If the new academic year is active,
   * deactivate all other active academic years first.
   */
  if (isActive) {
    await prisma.academicYear.updateMany({
      where: {
        tenantId,
        isActive: true,
        isDeleted: false,
      },
      data: {
        isActive: false,
      },
    });
  }

  /*
   * Create the academic year.
   */
  const academicYear = await prisma.academicYear.create({
    data: {
      name,
      startDate: start,
      endDate: end,
      isActive,
      tenantId,
    },
  });

  /*
   * Create a notification after the academic year
   * has been successfully created.
   *
   * Audience "all" means the notification can be
   * shown to all users belonging to this tenant.
   */
  await createNotification({
    tenantId,
    title: 'New Academic Year',
    message: `Academic year ${name} has been created.`,
    type: 'academic_year',
    priority: 'normal',
    audience: 'all',
  });

  // Return the newly created academic year
  return academicYear;
};

/*
 * ACTIVATE ACADEMIC YEAR
 */
exports.activateAcademicYear = async (id, tenantId) => {
  const academicYearId = getValidId(id);

  // Check whether the academic year exists
  const year = await prisma.academicYear.findFirst({
    where: {
      id: academicYearId,
      tenantId,
      isDeleted: false,
    },
  });

  if (!year) {
    throw new HttpError(404, 'Academic year not found', {
      code: 'NOT_FOUND',
    });
  }

  /*
   * Deactivate all other academic years
   * belonging to this tenant.
   */
  await prisma.academicYear.updateMany({
    where: {
      tenantId,
      isActive: true,
      isDeleted: false,
      NOT: {
        id: academicYearId,
      },
    },
    data: {
      isActive: false,
    },
  });

  // Activate the selected academic year
  return prisma.academicYear.update({
    where: {
      id: academicYearId,
    },
    data: {
      isActive: true,
    },
  });
};

/*
 * UPDATE ACADEMIC YEAR
 */
exports.updateAcademicYear = async (
  id,
  data,
  tenantId
) => {
  const academicYearId = getValidId(id);

  // Find the existing academic year
  const year = await prisma.academicYear.findFirst({
    where: {
      id: academicYearId,
      tenantId,
      isDeleted: false,
    },
  });

  if (!year) {
    throw new HttpError(404, 'Academic year not found', {
      code: 'NOT_FOUND',
    });
  }

  const updateData = {};

  // Keep the old dates by default
  let finalStart = year.startDate;
  let finalEnd = year.endDate;

  /*
   * UPDATE START DATE
   */
  if (data.startDate !== undefined) {
    const start = new Date(data.startDate);

    if (Number.isNaN(start.getTime())) {
      throw new HttpError(400, 'Invalid start date', {
        code: 'INVALID_DATE',
      });
    }

    updateData.startDate = start;
    finalStart = start;
  }

  /*
   * UPDATE END DATE
   */
  if (data.endDate !== undefined) {
    const end = new Date(data.endDate);

    if (Number.isNaN(end.getTime())) {
      throw new HttpError(400, 'Invalid end date', {
        code: 'INVALID_DATE',
      });
    }

    updateData.endDate = end;
    finalEnd = end;
  }

  /*
   * Validate the final date range.
   */
  if (finalEnd <= finalStart) {
    throw new HttpError(
      400,
      'End date must be after start date',
      {
        code: 'INVALID_DATE_RANGE',
      }
    );
  }

  /*
   * If either date changed, generate the
   * academic year name again.
   */
  if (
    data.startDate !== undefined ||
    data.endDate !== undefined
  ) {
    updateData.name = generateAcademicYearName(
      finalStart,
      finalEnd
    );
  }

  /*
   * Check whether the generated name already
   * belongs to another academic year.
   */
  if (
    updateData.name &&
    updateData.name !== year.name
  ) {
    const existing = await prisma.academicYear.findFirst({
      where: {
        name: updateData.name,
        tenantId,
        isDeleted: false,
        NOT: {
          id: academicYearId,
        },
      },
    });

    if (existing) {
      throw new HttpError(
        409,
        `Academic year ${updateData.name} already exists`,
        {
          code: 'DUPLICATE',
        }
      );
    }
  }

  /*
   * ACTIVATE THIS ACADEMIC YEAR
   *
   * Before activating it, deactivate all
   * other academic years.
   */
  if (data.isActive === true) {
    await prisma.academicYear.updateMany({
      where: {
        tenantId,
        isActive: true,
        isDeleted: false,
        NOT: {
          id: academicYearId,
        },
      },
      data: {
        isActive: false,
      },
    });

    updateData.isActive = true;
  }

  /*
   * DEACTIVATE THIS ACADEMIC YEAR
   */
  if (data.isActive === false) {
    updateData.isActive = false;
  }

  // Update the academic year
  return prisma.academicYear.update({
    where: {
      id: academicYearId,
    },
    data: updateData,
  });
};

/*
 * DELETE ACADEMIC YEAR
 */
exports.deleteAcademicYear = async (
  id,
  tenantId
) => {
  const academicYearId = getValidId(id);

  // Find the academic year
  const year = await prisma.academicYear.findFirst({
    where: {
      id: academicYearId,
      tenantId,
      isDeleted: false,
    },
  });

  if (!year) {
    throw new HttpError(404, 'Academic year not found', {
      code: 'NOT_FOUND',
    });
  }

  /*
   * Do not allow the currently active academic
   * year to be deleted.
   */
  if (year.isActive) {
    throw new HttpError(
      400,
      'Cannot delete the active academic year',
      {
        code: 'BAD_REQUEST',
      }
    );
  }

  /*
   * Soft delete.
   *
   * We do not actually remove the database row.
   */
  await prisma.academicYear.update({
    where: {
      id: academicYearId,
    },
    data: {
      isDeleted: true,
    },
  });

  return {
    message: 'Academic year deleted successfully',
  };
};

/*
 * GET ALL ACADEMIC YEARS
 */
exports.getAcademicYears = async (tenantId) => {
  return prisma.academicYear.findMany({
    where: {
      tenantId,
      isDeleted: false,
    },
    orderBy: {
      startDate: 'desc',
    },
  });
};

/*
 * GET ACTIVE ACADEMIC YEAR
 */
exports.getActiveYear = async (tenantId) => {
  /*
   * First, look for the academic year that has
   * been explicitly marked as active.
   */
  let active = await prisma.academicYear.findFirst({
    where: {
      tenantId,
      isActive: true,
      isDeleted: false,
    },
  });

  /*
   * Fallback:
   *
   * If no academic year is marked active,
   * find the academic year containing today's date.
   */
  if (!active) {
    const today = new Date();

    active = await prisma.academicYear.findFirst({
      where: {
        tenantId,
        isDeleted: false,
        startDate: {
          lte: today,
        },
        endDate: {
          gte: today,
        },
      },
      orderBy: {
        startDate: 'desc',
      },
    });
  }

  return active;
};