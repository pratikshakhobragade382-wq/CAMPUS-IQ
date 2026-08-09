const prisma = require("../../prisma/prismaClient");
const { HttpError } = require("../../utils/httpError");

/**
 * ============================================================
 * CREATE CLASS
 * ============================================================
 */
exports.createClass = async ({ name, tenantId }) => {
  return await prisma.class.create({
    data: {
      name,
      tenantId,
    },
    include: {
      sections: {
        where: {
          isDeleted: false,
        },
      },
    },
  });
};

/**
 * ============================================================
 * GET ALL CLASSES
 * ============================================================
 */
exports.getClasses = async (tenantId) => {
  return await prisma.class.findMany({
    where: {
      tenantId,
      isDeleted: false,
    },
    include: {
      sections: {
        where: {
          isDeleted: false,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

/**
 * ============================================================
 * GET SINGLE CLASS
 * ============================================================
 */
exports.getClassById = async (classId, tenantId) => {
  const classData = await prisma.class.findFirst({
    where: {
      id: classId,
      tenantId,
      isDeleted: false,
    },
    include: {
      sections: {
        where: {
          isDeleted: false,
        },
      },
    },
  });

  if (!classData) {
    throw new HttpError(404, "Class not found", {
      code: "CLASS_NOT_FOUND",
    });
  }

  return classData;
};

/**
 * ============================================================
 * UPDATE CLASS
 *
 * Updates:
 * - Class name
 * - Section name
 * ============================================================
 */
exports.updateClass = async ({
  classId,
  name,
  section,
  tenantId,
}) => {
  const existingClass = await prisma.class.findFirst({
    where: {
      id: classId,
      tenantId,
      isDeleted: false,
    },
    include: {
      sections: {
        where: {
          isDeleted: false,
        },
      },
    },
  });

  if (!existingClass) {
    throw new HttpError(404, "Class not found", {
      code: "CLASS_NOT_FOUND",
    });
  }

  return await prisma.$transaction(async (tx) => {
    /**
     * Update class name
     */
    const updatedClass = await tx.class.update({
      where: {
        id: classId,
      },
      data: {
        name,
      },
      include: {
        sections: {
          where: {
            isDeleted: false,
          },
        },
      },
    });

    /**
     * If a section was supplied,
     * update the first active section.
     */
    if (section !== undefined) {
      const existingSection = existingClass.sections[0];

      if (existingSection) {
        await tx.section.update({
          where: {
            id: existingSection.id,
          },
          data: {
            name: section,
          },
        });
      } else if (section.trim()) {
        await tx.section.create({
          data: {
            name: section,
            classId,
            tenantId,
          },
        });
      }
    }

    return await tx.class.findUnique({
      where: {
        id: classId,
      },
      include: {
        sections: {
          where: {
            isDeleted: false,
          },
        },
      },
    });
  });
};

/**
 * ============================================================
 * DELETE CLASS
 *
 * Soft delete
 * ============================================================
 */
exports.deleteClass = async ({ classId, tenantId }) => {
  const existingClass = await prisma.class.findFirst({
    where: {
      id: classId,
      tenantId,
      isDeleted: false,
    },
    select: {
      id: true,
    },
  });

  if (!existingClass) {
    throw new HttpError(404, "Class not found", {
      code: "CLASS_NOT_FOUND",
    });
  }

  return await prisma.$transaction(async (tx) => {
    /**
     * Soft delete class
     */
    const deletedClass = await tx.class.update({
      where: {
        id: classId,
      },
      data: {
        isDeleted: true,
      },
    });

    /**
     * Soft delete its sections as well
     */
    await tx.section.updateMany({
      where: {
        classId,
        tenantId,
        isDeleted: false,
      },
      data: {
        isDeleted: true,
      },
    });

    return deletedClass;
  });
};

/**
 * ============================================================
 * ADD SECTION TO CLASS
 * ============================================================
 */
exports.addSection = async ({
  name,
  classId,
  tenantId,
}) => {
  const klass = await prisma.class.findFirst({
    where: {
      id: Number(classId),
      tenantId,
      isDeleted: false,
    },
    select: {
      id: true,
    },
  });

  if (!klass) {
    throw new HttpError(400, "Invalid classId for this tenant", {
      code: "INVALID_REFERENCE",
    });
  }

  return await prisma.section.create({
    data: {
      name,
      classId,
      tenantId,
    },
  });
};

/**
 * ============================================================
 * GET SECTIONS BY CLASS
 * ============================================================
 */
exports.getSectionsByClass = async (
  classId,
  tenantId
) => {
  return await prisma.section.findMany({
    where: {
      classId,
      tenantId,
      isDeleted: false,
    },
    orderBy: {
      name: "asc",
    },
  });
};