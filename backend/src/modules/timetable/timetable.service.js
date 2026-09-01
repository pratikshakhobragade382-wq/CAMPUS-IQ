const prisma = require("../../prisma/prismaClient");

/* ============================================================
   HELPERS
============================================================ */

function clean(value) {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value).trim();
}

function numberOrNull(value) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

/* ============================================================
   ACADEMIC YEAR
============================================================ */

async function resolveAcademicYear(data, tenantId) {
  const academicYearId =
    numberOrNull(data.academicYearId);

  if (academicYearId) {
    const year =
      await prisma.academicYear.findFirst({
        where: {
          id: academicYearId,
          tenantId,
        },
      });

    if (!year) {
      throw new Error(
        "Academic year not found"
      );
    }

    return year;
  }

  const academicYearName =
    clean(data.academicYearName);

  if (!academicYearName) {
    throw new Error(
      "Academic year is required"
    );
  }

  const year =
    await prisma.academicYear.findFirst({
      where: {
        tenantId,
        name: {
          equals: academicYearName,
          mode: "insensitive",
        },
      },
    });

  if (!year) {
    throw new Error(
      `Academic year "${academicYearName}" not found`
    );
  }

  return year;
}

/* ============================================================
   CLASS
============================================================ */

async function resolveClass(data, tenantId) {
  const classId =
    numberOrNull(data.classId);

  if (classId) {
    const schoolClass =
      await prisma.class.findFirst({
        where: {
          id: classId,
          tenantId,
        },
      });

    if (!schoolClass) {
      throw new Error(
        "Class not found"
      );
    }

    return schoolClass;
  }

  const className =
    clean(data.className);

  if (!className) {
    throw new Error(
      "Class is required"
    );
  }

  const schoolClass =
    await prisma.class.findFirst({
      where: {
        tenantId,
        name: {
          equals: className,
          mode: "insensitive",
        },
      },
    });

  if (!schoolClass) {
    throw new Error(
      `Class "${className}" not found. Create the class first in the Class module.`
    );
  }

  return schoolClass;
}

/* ============================================================
   SECTION
============================================================ */

async function resolveSection(
  data,
  tenantId,
  classId
) {
  const sectionId =
    numberOrNull(data.sectionId);

  if (sectionId) {
    const section =
      await prisma.section.findFirst({
        where: {
          id: sectionId,
          tenantId,
          classId,
          isDeleted: false,
        },
      });

    if (!section) {
      throw new Error(
        "Section not found for the selected class"
      );
    }

    return section;
  }

  const sectionName =
    clean(data.sectionName);

  if (!sectionName) {
    return null;
  }

  let section =
    await prisma.section.findFirst({
      where: {
        tenantId,
        classId,
        name: {
          equals: sectionName,
          mode: "insensitive",
        },
        isDeleted: false,
      },
    });

  /*
   * If admin typed a section that does not exist,
   * create it automatically for this class.
   */

  if (!section) {
    section =
      await prisma.section.create({
        data: {
          tenantId,
          classId,
          name: sectionName,
          isDeleted: false,
        },
      });
  }

  return section;
}

/* ============================================================
   SUBJECT
============================================================ */

async function resolveSubject(
  data,
  tenantId
) {
  const subjectId =
    numberOrNull(data.subjectId);

  if (subjectId) {
    const subject =
      await prisma.subject.findFirst({
        where: {
          id: subjectId,
          tenantId,
        },
      });

    if (!subject) {
      throw new Error(
        "Subject not found"
      );
    }

    return subject;
  }

  const subjectName =
    clean(data.subjectName);

  if (!subjectName) {
    throw new Error(
      "Subject is required"
    );
  }

  let subject =
    await prisma.subject.findFirst({
      where: {
        tenantId,
        name: {
          equals: subjectName,
          mode: "insensitive",
        },
      },
    });

  /*
   * Manual subject creation.
   *
   * Existing subjects are reused.
   * If the admin types a new subject,
   * create it automatically.
   */

  if (!subject) {
    const generatedCode =
      subjectName
        .replace(/[^a-zA-Z0-9]+/g, "")
        .substring(0, 10)
        .toUpperCase() ||
      `SUB${Date.now()}`;

    subject =
      await prisma.subject.create({
        data: {
          tenantId,
          name: subjectName,
          code: generatedCode,
        },
      });
  }

  return subject;
}

/* ============================================================
   TEACHER
============================================================ */

async function resolveStaff(
  data,
  tenantId
) {
  const staffId =
    numberOrNull(data.staffId);

  if (staffId) {
    const staff =
      await prisma.staff.findFirst({
        where: {
          id: staffId,
          tenantId,
          isDeleted: false,
        },
      });

    if (!staff) {
      throw new Error(
        "Teacher not found"
      );
    }

    return staff;
  }

  const teacherName =
    clean(data.teacherName);

  if (!teacherName) {
    throw new Error(
      "Teacher is required"
    );
  }

  const staff =
    await prisma.staff.findFirst({
      where: {
        tenantId,
        isDeleted: false,
        name: {
          equals: teacherName,
          mode: "insensitive",
        },
      },
    });

  if (!staff) {
    throw new Error(
      `Teacher "${teacherName}" not found`
    );
  }

  return staff;
}

/* ============================================================
   PERIOD / TIME SLOT
============================================================ */

const createPeriodSlot = async (
  data,
  tenantId
) => {
  const slotNo = Number(data.slotNo);

  if (!slotNo) {
    throw new Error(
      "Slot number is required"
    );
  }

  const existing =
    await prisma.periodSlot.findFirst({
      where: {
        tenantId,
        slotNo,
      },
    });

  if (existing) {
    throw new Error(
      "Slot number already exists"
    );
  }

  return prisma.periodSlot.create({
    data: {
      tenantId,
      slotNo,
      label:
        clean(data.label) ||
        `Period ${slotNo}`,
      slotType:
        clean(data.slotType) ||
        "period",
      startTime: clean(
        data.startTime
      ),
      endTime: clean(
        data.endTime
      ),
      isActive: true,
    },
  });
};

const getAllPeriodSlots = async (
  tenantId
) => {
  return prisma.periodSlot.findMany({
    where: {
      tenantId,
      isActive: true,
    },
    orderBy: {
      slotNo: "asc",
    },
  });
};

const updatePeriodSlot = async (
  id,
  data,
  tenantId
) => {
  const slotId = Number(id);

  const existing =
    await prisma.periodSlot.findFirst({
      where: {
        id: slotId,
        tenantId,
      },
    });

  if (!existing) {
    throw new Error(
      "Period slot not found"
    );
  }

  return prisma.periodSlot.update({
    where: {
      id: slotId,
    },
    data: {
      ...(data.label !== undefined && {
        label: clean(data.label),
      }),

      ...(data.slotType !== undefined && {
        slotType: clean(
          data.slotType
        ),
      }),

      ...(data.startTime !== undefined && {
        startTime: clean(
          data.startTime
        ),
      }),

      ...(data.endTime !== undefined && {
        endTime: clean(
          data.endTime
        ),
      }),

      ...(data.isActive !== undefined && {
        isActive: data.isActive,
      }),
    },
  });
};

const deletePeriodSlot = async (
  id,
  tenantId
) => {
  const slotId = Number(id);

  const existing =
    await prisma.periodSlot.findFirst({
      where: {
        id: slotId,
        tenantId,
      },
    });

  if (!existing) {
    throw new Error(
      "Period slot not found"
    );
  }

  const timetableUsingSlot =
    await prisma.timetable.count({
      where: {
        tenantId,
        periodSlotId: slotId,
        isActive: true,
      },
    });

  if (timetableUsingSlot > 0) {
    throw new Error(
      "This time is already used in a timetable. Edit the time instead of deleting it."
    );
  }

  await prisma.periodSlot.delete({
    where: {
      id: slotId,
    },
  });

  return {
    message:
      "Time slot deleted successfully",
  };
};

/* ============================================================
   DEFAULT TIME SLOTS
============================================================ */

const seedDefaultSlots = async (
  tenantId
) => {
  const existing =
    await prisma.periodSlot.findMany({
      where: {
        tenantId,
      },
    });

  if (existing.length > 0) {
    throw new Error(
      "Period slots already exist for this tenant"
    );
  }

  const defaultSlots = [
    {
      slotNo: 1,
      label: "Period 1",
      slotType: "period",
      startTime: "08:00",
      endTime: "09:00",
    },
    {
      slotNo: 2,
      label: "Period 2",
      slotType: "period",
      startTime: "09:00",
      endTime: "10:00",
    },
    {
      slotNo: 3,
      label: "Period 3",
      slotType: "period",
      startTime: "10:00",
      endTime: "11:00",
    },
    {
      slotNo: 4,
      label: "Recess",
      slotType: "recess",
      startTime: "11:00",
      endTime: "11:15",
    },
    {
      slotNo: 5,
      label: "Period 4",
      slotType: "period",
      startTime: "11:15",
      endTime: "12:15",
    },
    {
      slotNo: 6,
      label: "Period 5",
      slotType: "period",
      startTime: "12:15",
      endTime: "13:15",
    },
    {
      slotNo: 7,
      label: "Lunch",
      slotType: "lunch",
      startTime: "13:15",
      endTime: "14:00",
    },
    {
      slotNo: 8,
      label: "Period 6",
      slotType: "period",
      startTime: "14:00",
      endTime: "15:00",
    },
    {
      slotNo: 9,
      label: "Period 7",
      slotType: "period",
      startTime: "15:00",
      endTime: "16:00",
    },
  ];

  await prisma.periodSlot.createMany({
    data: defaultSlots.map(
      (slot) => ({
        ...slot,
        tenantId,
        isActive: true,
      })
    ),
  });

  return getAllPeriodSlots(
    tenantId
  );
};

/* ============================================================
   CREATE TIMETABLE
============================================================ */

const createTimetableEntry = async (
  data,
  tenantId
) => {
  const academicYear =
    await resolveAcademicYear(
      data,
      tenantId
    );

  const schoolClass =
    await resolveClass(
      data,
      tenantId
    );

  const section =
    await resolveSection(
      data,
      tenantId,
      schoolClass.id
    );

  const subject =
    await resolveSubject(
      data,
      tenantId
    );

  const staff =
    await resolveStaff(
      data,
      tenantId
    );

  const periodSlotId =
    numberOrNull(
      data.periodSlotId
    );

  if (!periodSlotId) {
    throw new Error(
      "Time slot is required"
    );
  }

  const dayOfWeek =
    Number(data.dayOfWeek);

  if (
    !Number.isInteger(dayOfWeek) ||
    dayOfWeek < 1 ||
    dayOfWeek > 6
  ) {
    throw new Error(
      "Day must be Monday to Saturday"
    );
  }

  const slot =
    await prisma.periodSlot.findFirst({
      where: {
        id: periodSlotId,
        tenantId,
        isActive: true,
      },
    });

  if (!slot) {
    throw new Error(
      "Time slot not found"
    );
  }

  if (
    !["period", "sports"].includes(
      slot.slotType
    )
  ) {
    throw new Error(
      `The selected time is a ${slot.slotType} slot and cannot have a normal subject assigned.`
    );
  }

  /* ----------------------------------------------------------
     TEACHER CONFLICT
  ---------------------------------------------------------- */

  const teacherConflict =
    await prisma.timetable.findFirst({
      where: {
        tenantId,
        academicYearId:
          academicYear.id,
        staffId: staff.id,
        dayOfWeek,
        periodSlotId,
        isActive: true,
      },
    });

  if (teacherConflict) {
    throw new Error(
      "This teacher is already assigned to another class at this time."
    );
  }

  /* ----------------------------------------------------------
     CLASS CONFLICT
  ---------------------------------------------------------- */

  const classConflict =
    await prisma.timetable.findFirst({
      where: {
        tenantId,
        academicYearId:
          academicYear.id,
        classId:
          schoolClass.id,
        sectionId:
          section?.id || null,
        dayOfWeek,
        periodSlotId,
        isActive: true,
      },
    });

  if (classConflict) {
    throw new Error(
      "This class already has a timetable entry at this time."
    );
  }

  /* ----------------------------------------------------------
     CREATE
  ---------------------------------------------------------- */

  return prisma.timetable.create({
    data: {
      tenantId,

      academicYearId:
        academicYear.id,

      classId:
        schoolClass.id,

      sectionId:
        section?.id || null,

      subjectId:
        subject.id,

      staffId:
        staff.id,

      periodSlotId,

      dayOfWeek,

      isActive: true,
    },

    include: {
      academicYear: true,
      class: true,
      section: true,
      subject: true,

      staff: {
        select: {
          id: true,
          name: true,
        },
      },

      periodSlot: true,
    },
  });
};

/* ============================================================
   GET CLASS TIMETABLE
============================================================ */

const getClassTimetable = async (
  tenantId,
  classId,
  sectionId,
  academicYearId,
  className,
  sectionName,
  academicYearName
) => {
  let resolvedClassId =
    numberOrNull(classId);

  let resolvedSectionId =
    numberOrNull(sectionId);

  let resolvedAcademicYearId =
    numberOrNull(academicYearId);

  if (!resolvedClassId) {
    const schoolClass =
      await resolveClass(
        {
          className,
        },
        tenantId
      );

    resolvedClassId =
      schoolClass.id;
  }

  if (
    sectionName &&
    !resolvedSectionId
  ) {
    const section =
      await resolveSection(
        {
          sectionName,
        },
        tenantId,
        resolvedClassId
      );

    resolvedSectionId =
      section?.id || null;
  }

  if (
    academicYearName &&
    !resolvedAcademicYearId
  ) {
    const year =
      await resolveAcademicYear(
        {
          academicYearName,
        },
        tenantId
      );

    resolvedAcademicYearId =
      year.id;
  }

  const where = {
    tenantId,

    classId:
      resolvedClassId,

    isActive: true,

    ...(resolvedSectionId
      ? {
          sectionId:
            resolvedSectionId,
        }
      : {}),

    ...(resolvedAcademicYearId
      ? {
          academicYearId:
            resolvedAcademicYearId,
        }
      : {}),
  };

  const entries =
    await prisma.timetable.findMany({
      where,

      include: {
        academicYear: true,
        class: true,
        section: true,
        subject: true,

        staff: {
          select: {
            id: true,
            name: true,
          },
        },

        periodSlot: true,
      },

      orderBy: [
        {
          dayOfWeek: "asc",
        },
        {
          periodSlot: {
            slotNo: "asc",
          },
        },
      ],
    });

  return groupByDay(entries);
};

/* ============================================================
   GET TEACHER TIMETABLE
============================================================ */

const getTeacherTimetable = async (
  tenantId,
  staffId,
  academicYearId,
  academicYearName,
  teacherName
) => {
  let resolvedStaffId =
    numberOrNull(staffId);

  if (!resolvedStaffId) {
    const staff =
      await resolveStaff(
        {
          teacherName,
        },
        tenantId
      );

    resolvedStaffId =
      staff.id;
  }

  let resolvedAcademicYearId =
    numberOrNull(academicYearId);

  if (
    academicYearName &&
    !resolvedAcademicYearId
  ) {
    const year =
      await resolveAcademicYear(
        {
          academicYearName,
        },
        tenantId
      );

    resolvedAcademicYearId =
      year.id;
  }

  const where = {
    tenantId,

    staffId:
      resolvedStaffId,

    isActive: true,

    ...(resolvedAcademicYearId
      ? {
          academicYearId:
            resolvedAcademicYearId,
        }
      : {}),
  };

  const entries =
    await prisma.timetable.findMany({
      where,

      include: {
        academicYear: true,
        class: true,
        section: true,
        subject: true,
        periodSlot: true,
      },

      orderBy: [
        {
          dayOfWeek: "asc",
        },
        {
          periodSlot: {
            slotNo: "asc",
          },
        },
      ],
    });

  return groupByDay(entries);
};

/* ============================================================
   GROUP BY DAY
============================================================ */

function groupByDay(entries) {
  const days = {
    1: "Monday",
    2: "Tuesday",
    3: "Wednesday",
    4: "Thursday",
    5: "Friday",
    6: "Saturday",
  };

  const grouped = {};

  entries.forEach((entry) => {
    const day =
      days[entry.dayOfWeek];

    if (!day) {
      return;
    }

    if (!grouped[day]) {
      grouped[day] = [];
    }

    grouped[day].push(entry);
  });

  return grouped;
}

/* ============================================================
   UPDATE TIMETABLE
============================================================ */

const updateTimetableEntry = async (
  id,
  data,
  tenantId
) => {
  const entryId =
    Number(id);

  const existing =
    await prisma.timetable.findFirst({
      where: {
        id: entryId,
        tenantId,
      },
    });

  if (!existing) {
    throw new Error(
      "Timetable entry not found"
    );
  }

  let subjectId =
    existing.subjectId;

  let staffId =
    existing.staffId;

  if (
    data.subjectId ||
    data.subjectName
  ) {
    const subject =
      await resolveSubject(
        data,
        tenantId
      );

    subjectId =
      subject.id;
  }

  if (
    data.staffId ||
    data.teacherName
  ) {
    const staff =
      await resolveStaff(
        data,
        tenantId
      );

    staffId =
      staff.id;
  }

  return prisma.timetable.update({
    where: {
      id: entryId,
    },

    data: {
      subjectId,
      staffId,

      ...(data.isActive !== undefined && {
        isActive: data.isActive,
      }),
    },

    include: {
      academicYear: true,
      class: true,
      section: true,
      subject: true,

      staff: {
        select: {
          id: true,
          name: true,
        },
      },

      periodSlot: true,
    },
  });
};

/* ============================================================
   DELETE TIMETABLE
============================================================ */

const deleteTimetableEntry = async (
  id,
  tenantId
) => {
  const entryId =
    Number(id);

  const existing =
    await prisma.timetable.findFirst({
      where: {
        id: entryId,
        tenantId,
      },
    });

  if (!existing) {
    throw new Error(
      "Timetable entry not found"
    );
  }

  await prisma.timetable.delete({
    where: {
      id: entryId,
    },
  });

  return {
    message:
      "Timetable entry deleted successfully",
  };
};

/* ============================================================
   EXPORT
============================================================ */

module.exports = {
  createPeriodSlot,
  getAllPeriodSlots,
  updatePeriodSlot,
  deletePeriodSlot,
  seedDefaultSlots,

  createTimetableEntry,
  getClassTimetable,
  getTeacherTimetable,

  updateTimetableEntry,
  deleteTimetableEntry,
};