
const prisma = require("../../prisma/prismaClient");
const { HttpError } = require("../../utils/httpError");

/**
 * ============================================================
 * CREATE CLASS
 * ============================================================
 */
exports.createClass = async ({
  name,
  section,
  tenantId,
}) => {
  if (!name || !name.trim()) {
    throw new HttpError(400, "Class name is required", {
      code: "CLASS_NAME_REQUIRED",
    });
  }

  if (!tenantId) {
    throw new HttpError(400, "Tenant ID is required", {
      code: "TENANT_REQUIRED",
    });
  }

  return await prisma.$transaction(async (tx) => {
    // Check duplicate class
    const existingClass = await tx.class.findFirst({
      where: {
        name: name.trim(),
        tenantId: Number(tenantId),
        isDeleted: false,
      },
    });

    if (existingClass) {
      throw new HttpError(409, "Class already exists", {
        code: "CLASS_ALREADY_EXISTS",
      });
    }

    // Create class
    const newClass = await tx.class.create({
      data: {
        name: name.trim(),
        tenantId: Number(tenantId),
      },
    });

    // Create initial section if provided
    if (section && section.trim()) {
      await tx.section.create({
        data: {
          name: section.trim(),
          classId: newClass.id,
          tenantId: Number(tenantId),
        },
      });
    }

    // Return complete class
    return await tx.class.findUnique({
      where: {
        id: newClass.id,
      },
      include: {
        department: true,

        sections: {
          where: {
            isDeleted: false,
          },
          orderBy: {
            name: "asc",
          },
        },
      },
    });
  });
};


/**
 * ============================================================
 * GET ALL CLASSES
 * ============================================================
 */
exports.getClasses = async ({
  tenantId,
}) => {
  if (!tenantId) {
    throw new HttpError(400, "Tenant ID is required", {
      code: "TENANT_REQUIRED",
    });
  }

  return await prisma.class.findMany({
    where: {
      tenantId: Number(tenantId),
      isDeleted: false,
    },

    include: {
      department: true,

      sections: {
        where: {
          isDeleted: false,
        },

        orderBy: {
          name: "asc",
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
exports.getClassById = async ({
  classId,
  tenantId,
}) => {
  const classData = await prisma.class.findFirst({
    where: {
      id: Number(classId),
      tenantId: Number(tenantId),
      isDeleted: false,
    },

    include: {
      department: true,

      sections: {
        where: {
          isDeleted: false,
        },

        orderBy: {
          name: "asc",
        },
      },

      students: true,

      exams: true,

      timetables: true,
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
      id: Number(classId),
      tenantId: Number(tenantId),
      isDeleted: false,
    },

    include: {
      sections: {
        where: {
          isDeleted: false,
        },

        orderBy: {
          id: "asc",
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
    // Update class name if supplied
    if (name !== undefined && name.trim()) {
      await tx.class.update({
        where: {
          id: Number(classId),
        },

        data: {
          name: name.trim(),
        },
      });
    }

    // Update/create section
    if (section !== undefined) {
      const cleanSection = section.trim();

      const existingSection = existingClass.sections[0];

      if (existingSection) {
        if (cleanSection) {
          await tx.section.update({
            where: {
              id: existingSection.id,
            },

            data: {
              name: cleanSection,
            },
          });
        }
      } else if (cleanSection) {
        await tx.section.create({
          data: {
            name: cleanSection,
            classId: Number(classId),
            tenantId: Number(tenantId),
          },
        });
      }
    }

    return await tx.class.findUnique({
      where: {
        id: Number(classId),
      },

      include: {
        department: true,

        sections: {
          where: {
            isDeleted: false,
          },

          orderBy: {
            name: "asc",
          },
        },
      },
    });
  });
};


/**
 * ============================================================
 * DELETE CLASS
 * ============================================================
 */
exports.deleteClass = async ({
  classId,
  tenantId,
}) => {
  const existingClass = await prisma.class.findFirst({
    where: {
      id: Number(classId),
      tenantId: Number(tenantId),
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
    // Soft delete class
    const deletedClass = await tx.class.update({
      where: {
        id: Number(classId),
      },

      data: {
        isDeleted: true,
      },
    });

    // Soft delete sections
    await tx.section.updateMany({
      where: {
        classId: Number(classId),
        tenantId: Number(tenantId),
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
 * ADD SECTION
 * ============================================================
 */
exports.addSection = async ({
  name,
  classId,
  tenantId,
}) => {
  if (!name || !name.trim()) {
    throw new HttpError(400, "Section name is required", {
      code: "SECTION_NAME_REQUIRED",
    });
  }

  const classData = await prisma.class.findFirst({
    where: {
      id: Number(classId),
      tenantId: Number(tenantId),
      isDeleted: false,
    },

    select: {
      id: true,
    },
  });

  if (!classData) {
    throw new HttpError(
      404,
      "Class not found",
      {
        code: "CLASS_NOT_FOUND",
      }
    );
  }

  // Check duplicate section
  const existingSection = await prisma.section.findFirst({
    where: {
      classId: Number(classId),
      tenantId: Number(tenantId),
      name: name.trim(),
      isDeleted: false,
    },
  });

  if (existingSection) {
    throw new HttpError(409, "Section already exists", {
      code: "SECTION_ALREADY_EXISTS",
    });
  }

  return await prisma.section.create({
    data: {
      name: name.trim(),
      classId: Number(classId),
      tenantId: Number(tenantId),
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
      classId: Number(classId),
      tenantId: Number(tenantId),
      isDeleted: false,
    },

    orderBy: {
      name: "asc",
    },
  });
};

/**
 * ============================================================
 * GET STUDENTS BY SECTION
 * ============================================================
 */
exports.getStudentsBySection = async ({
  classId,
  sectionId,
  tenantId,
}) => {
  const section = await prisma.section.findFirst({
    where: {
      id: Number(sectionId),
      classId: Number(classId),
      tenantId,
      isDeleted: false,
    },

    select: {
      id: true,
      name: true,
      classId: true,
    },
  });

  if (!section) {
    throw new HttpError(
      404,
      "Section not found",
      {
        code: "SECTION_NOT_FOUND",
      }
    );
  }

  const students = await prisma.student.findMany({
    where: {
      sectionId: Number(sectionId),
      classId: Number(classId),
      tenantId,
      isDeleted: false,
    },

    select: {
      id: true,
      studentName: true,
      admissionNo: true,
      rollNo: true,
      gender: true,
      studentEmail: true,
      communicationMobile: true,
      photoUrl: true,
      dateOfBirth: true,
      admissionType: true,
    },

    orderBy: [
      {
        rollNo: "asc",
      },
      {
        studentName: "asc",
      },
    ],
  });

  return {
    section,
    students,
    totalStudents: students.length,
  };
};