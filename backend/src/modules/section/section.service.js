const prisma = require("../../prisma/prismaClient");
const { HttpError } = require("../../utils/httpError");

/* ============================================================
   SECTION INCLUDE
============================================================ */

const sectionInclude = {
  class: {
    select: {
      id: true,
      name: true,
    },
  },

  classTeacher: {
    select: {
      id: true,
      name: true,
    },
  },
};

/* ============================================================
   CREATE SECTION
============================================================ */

exports.createSection = async (data) => {
  const {
    classId,
    tenantId,
    classTeacherId,
  } = data;

  const klass =
    await prisma.class.findFirst({
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
    throw new HttpError(
      400,
      "Invalid classId for this tenant",
      {
        code: "INVALID_REFERENCE",
      }
    );
  }

  if (classTeacherId !== undefined) {
    const teacher =
      await prisma.staff.findFirst({
        where: {
          id: Number(classTeacherId),
          tenantId,
          isDeleted: false,
        },

        select: {
          id: true,
        },
      });

    if (!teacher) {
      throw new HttpError(
        400,
        "Invalid class teacher for this tenant",
        {
          code: "INVALID_REFERENCE",
        }
      );
    }
  }

  const section =
    await prisma.section.create({
      data: {
        tenantId,
        classId: Number(classId),

        name: data.name,

        classTeacherId:
          classTeacherId !==
          undefined
            ? Number(
                classTeacherId
              )
            : null,

        isDeleted: false,
      },

      include: sectionInclude,
    });

  return section;
};

/* ============================================================
   GET ALL SECTIONS
============================================================ */

exports.getAllSections = async (
  tenantId,
  classId
) => {
  return prisma.section.findMany({
    where: {
      tenantId,

      isDeleted: false,

      ...(classId !== undefined
        ? {
            classId: Number(
              classId
            ),
          }
        : {}),
    },

    include: sectionInclude,

    orderBy: [
      {
        class: {
          name: "asc",
        },
      },
      {
        name: "asc",
      },
    ],
  });
};

/* ============================================================
   GET SECTION BY ID
============================================================ */

exports.getSectionById = async (
  id,
  tenantId
) => {
  const section =
    await prisma.section.findFirst({
      where: {
        id: Number(id),
        tenantId,
        isDeleted: false,
      },

      include: sectionInclude,
    });

  if (!section) {
    throw new HttpError(
      404,
      "Section not found",
      {
        code: "NOT_FOUND",
      }
    );
  }

  return section;
};

/* ============================================================
   UPDATE SECTION
============================================================ */

exports.updateSection = async (
  id,
  data,
  tenantId
) => {
  const section =
    await prisma.section.findFirst({
      where: {
        id: Number(id),
        tenantId,
        isDeleted: false,
      },
    });

  if (!section) {
    throw new HttpError(
      404,
      "Section not found",
      {
        code: "NOT_FOUND",
      }
    );
  }

  if (data.classId !== undefined) {
    const klass =
      await prisma.class.findFirst({
        where: {
          id: Number(
            data.classId
          ),
          tenantId,
          isDeleted: false,
        },

        select: {
          id: true,
        },
      });

    if (!klass) {
      throw new HttpError(
        400,
        "Invalid classId for this tenant",
        {
          code: "INVALID_REFERENCE",
        }
      );
    }
  }

  if (
    data.classTeacherId !==
      undefined &&
    data.classTeacherId !== null
  ) {
    const teacher =
      await prisma.staff.findFirst({
        where: {
          id: Number(
            data.classTeacherId
          ),
          tenantId,
          isDeleted: false,
        },

        select: {
          id: true,
        },
      });

    if (!teacher) {
      throw new HttpError(
        400,
        "Invalid class teacher for this tenant",
        {
          code: "INVALID_REFERENCE",
        }
      );
    }
  }

  const updated =
    await prisma.section.update({
      where: {
        id: Number(id),
      },

      data: {
        name:
          data.name !== undefined
            ? data.name
            : undefined,

        classId:
          data.classId !== undefined
            ? Number(
                data.classId
              )
            : undefined,

        classTeacherId:
          data.classTeacherId !==
          undefined
            ? data.classTeacherId ===
              null
              ? null
              : Number(
                  data.classTeacherId
                )
            : undefined,
      },

      include: sectionInclude,
    });

  return updated;
};

/* ============================================================
   DELETE SECTION
============================================================ */

exports.deleteSection = async (
  id,
  tenantId
) => {
  const result =
    await prisma.section.updateMany({
      where: {
        id: Number(id),
        tenantId,
        isDeleted: false,
      },

      data: {
        isDeleted: true,
        classTeacherId: null,
      },
    });

  if (result.count === 0) {
    throw new HttpError(
      404,
      "Section not found",
      {
        code: "NOT_FOUND",
      }
    );
  }

  return {
    deleted: true,
  };
};