const prisma = require('../../prisma/prismaClient');
const { HttpError } = require('../../utils/httpError');

/**
 * Generate academic year name automatically
 *
 * Example:
 * Start: 01/06/2026
 * End:   31/05/2027
 *
 * Result:
 * 2026-2027
 */
function generateAcademicYearName(startDate, endDate) {
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();

  return `${startYear}-${endYear}`;
}

/**
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
    throw new HttpError(
      400,
      'End date must be after start date',
      {
        code: 'INVALID_DATE_RANGE',
      }
    );
  }

  // Generate academic year name automatically
  const name = generateAcademicYearName(start, end);

  // Check duplicate academic year
  const existing = await prisma.academicYear.findFirst({
    where: {
      name,
      tenantId,
      isDeleted: false,
    },
  });

  if (existing) {
    throw new HttpError(
      409,
      `Academic year ${name} already exists`,
      {
        code: 'DUPLICATE',
      }
    );
  }

  // If this year is active,
  // deactivate all other academic years first.
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

  // Create academic year
  return prisma.academicYear.create({
    data: {
      name,
      startDate: start,
      endDate: end,
      isActive,
      tenantId,
    },
  });
};

/**
 * ACTIVATE ACADEMIC YEAR
 */
exports.activateAcademicYear = async (id, tenantId) => {
  const academicYearId = parseInt(id, 10);

  const year = await prisma.academicYear.findFirst({
    where: {
      id: academicYearId,
      tenantId,
      isDeleted: false,
    },
  });

  if (!year) {
    throw new HttpError(
      404,
      'Academic year not found',
      {
        code: 'NOT_FOUND',
      }
    );
  }

  // Deactivate all other academic years
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

  // Activate selected year
  return prisma.academicYear.update({
    where: {
      id: academicYearId,
    },
    data: {
      isActive: true,
    },
  });
};

/**
 * UPDATE ACADEMIC YEAR
 */
exports.updateAcademicYear = async (
  id,
  data,
  tenantId
) => {
  const academicYearId = parseInt(id, 10);

  const year = await prisma.academicYear.findFirst({
    where: {
      id: academicYearId,
      tenantId,
      isDeleted: false,
    },
  });

  if (!year) {
    throw new HttpError(
      404,
      'Academic year not found',
      {
        code: 'NOT_FOUND',
      }
    );
  }

  const updateData = {};

  let finalStart = year.startDate;
  let finalEnd = year.endDate;

  /**
   * UPDATE START DATE
   */
  if (data.startDate !== undefined) {
    const start = new Date(data.startDate);

    if (Number.isNaN(start.getTime())) {
      throw new HttpError(
        400,
        'Invalid start date',
        {
          code: 'INVALID_DATE',
        }
      );
    }

    updateData.startDate = start;
    finalStart = start;
  }

  /**
   * UPDATE END DATE
   */
  if (data.endDate !== undefined) {
    const end = new Date(data.endDate);

    if (Number.isNaN(end.getTime())) {
      throw new HttpError(
        400,
        'Invalid end date',
        {
          code: 'INVALID_DATE',
        }
      );
    }

    updateData.endDate = end;
    finalEnd = end;
  }

  /**
   * Validate date range
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

  /**
   * If either date changes,
   * regenerate academic year name.
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

  /**
   * Check duplicate generated name
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

  /**
   * ACTIVATE
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

  /**
   * DEACTIVATE
   */
  if (data.isActive === false) {
    updateData.isActive = false;
  }

  return prisma.academicYear.update({
    where: {
      id: academicYearId,
    },
    data: updateData,
  });
};

/**
 * DELETE ACADEMIC YEAR
 */
exports.deleteAcademicYear = async (
  id,
  tenantId
) => {
  const academicYearId = parseInt(id, 10);

  const year = await prisma.academicYear.findFirst({
    where: {
      id: academicYearId,
      tenantId,
      isDeleted: false,
    },
  });

  if (!year) {
    throw new HttpError(
      404,
      'Academic year not found',
      {
        code: 'NOT_FOUND',
      }
    );
  }

  // Active academic year cannot be deleted
  if (year.isActive) {
    throw new HttpError(
      400,
      'Cannot delete the active academic year',
      {
        code: 'BAD_REQUEST',
      }
    );
  }

  // Soft delete
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

/**
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

/**
 * GET ACTIVE ACADEMIC YEAR
 */
exports.getActiveYear = async (tenantId) => {
  let active = await prisma.academicYear.findFirst({
    where: {
      tenantId,
      isActive: true,
      isDeleted: false,
    },
  });

  // Fallback:
  // Find academic year containing today's date
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
    });
  }

  return active;
};