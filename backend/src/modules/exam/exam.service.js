// ============================================================
// EXAM SERVICE
// ============================================================

const prisma = require("../../prisma/prismaClient");

const {
  HttpError,
} = require("../../utils/httpError");

const {
  createNotification,
} = require("../notification/notification.service");

// ============================================================
// AUTHORIZATION
// ============================================================

const assertIsAdmin = (actingUser) => {
  if (actingUser.identity !== "admin") {
    throw new HttpError(
      403,
      "Only admins can manage exams",
      {
        code: "FORBIDDEN",
      }
    );
  }
};

const assertCanManageMarks = async (
  tenantId,
  actingUser,
  classId,
  subjectId
) => {
  if (actingUser.identity === "admin") {
    return;
  }

  if (
    actingUser.identity !== "staff" ||
    actingUser.staffRole !== "teacher"
  ) {
    throw new HttpError(
      403,
      "Only teachers or admins can manage marks",
      {
        code: "FORBIDDEN",
      }
    );
  }

  if (!actingUser.staffId) {
    throw new HttpError(
      403,
      "This account is not linked to a staff record",
      {
        code: "FORBIDDEN",
      }
    );
  }

  const teacherTimetableCount =
    await prisma.timetable.count({
      where: {
        tenantId,
        staffId: actingUser.staffId,
        isActive: true,
      },
    });

  if (teacherTimetableCount > 0) {
    const assignment =
      await prisma.timetable.findFirst({
        where: {
          tenantId,
          staffId: actingUser.staffId,
          classId: parseInt(classId),
          subjectId: parseInt(subjectId),
          isActive: true,
        },
      });

    if (!assignment) {
      throw new HttpError(
        403,
        "You are not timetabled to teach this subject to this class",
        {
          code: "FORBIDDEN",
        }
      );
    }
  }
};

// ============================================================
// BUILT-IN INDIAN HOLIDAYS
// ============================================================

const BUILT_IN_HOLIDAYS = {
  2026: {
    "2026-01-01": "New Year's Day",
    "2026-01-14": "Makar Sankranti",
    "2026-01-26": "Republic Day",
    "2026-03-03": "Holi",
    "2026-03-19": "Gudi Padwa",
    "2026-03-21": "Eid-ul-Fitr",
    "2026-03-26": "Ram Navami",
    "2026-03-31": "Mahavir Jayanti",
    "2026-04-03": "Good Friday",
    "2026-04-14": "Dr. Babasaheb Ambedkar Jayanti",
    "2026-05-01": "Maharashtra Day / Buddha Purnima",
    "2026-05-28": "Bakrid",
    "2026-06-26": "Muharram",
    "2026-08-15": "Independence Day",
    "2026-08-26": "Eid-e-Milad",
    "2026-08-28": "Raksha Bandhan",
    "2026-09-04": "Janmashtami",
    "2026-09-14": "Ganesh Chaturthi",
    "2026-10-02": "Mahatma Gandhi Jayanti",
    "2026-10-20": "Dussehra",
    "2026-11-08": "Diwali / Deepavali",
    "2026-11-10": "Diwali Padwa",
    "2026-11-24": "Guru Nanak Jayanti",
    "2026-12-25": "Christmas Day",
  },

  2027: {
    "2027-01-01": "New Year's Day",
    "2027-01-15": "Makar Sankranti / Pongal",
    "2027-01-26": "Republic Day",
    "2027-02-19": "Chhatrapati Shivaji Maharaj Jayanti",
    "2027-03-06": "Maha Shivratri",
    "2027-03-10": "Ramzan Eid",
    "2027-03-22": "Holi",
    "2027-03-26": "Good Friday",
    "2027-04-07": "Gudi Padwa / Ugadi",
    "2027-04-14": "Dr. Babasaheb Ambedkar Jayanti",
    "2027-04-15": "Ram Navami",
    "2027-04-19": "Mahavir Jayanti",
    "2027-05-17": "Bakrid",
    "2027-05-20": "Buddha Purnima",
    "2027-06-16": "Muharram",
    "2027-07-05": "Rath Yatra",
    "2027-08-15": "Independence Day",
    "2027-08-17": "Raksha Bandhan",
    "2027-08-25": "Janmashtami",
    "2027-09-04": "Ganesh Chaturthi",
    "2027-10-02": "Mahatma Gandhi Jayanti",
    "2027-10-09": "Dussehra",
    "2027-10-29": "Diwali / Deepavali",
    "2027-11-04": "Chhat Puja",
    "2027-11-14": "Guru Nanak Jayanti",
    "2027-12-25": "Christmas Day",
  },
};

// ============================================================
// DATE HELPERS
// ============================================================

const DAY_MS = 24 * 60 * 60 * 1000;

const toDateKey = (date) => {
  const d = new Date(date);

  if (Number.isNaN(d.getTime())) {
    return null;
  }

  return d.toISOString().slice(0, 10);
};

const normalizeUTCDate = (date) => {
  const d = new Date(date);

  return new Date(
    Date.UTC(
      d.getUTCFullYear(),
      d.getUTCMonth(),
      d.getUTCDate()
    )
  );
};

const addDaysUTC = (date, days) => {
  const d = normalizeUTCDate(date);

  d.setUTCDate(
    d.getUTCDate() + days
  );

  return d;
};

const getInclusiveDayCount = (
  startDate,
  endDate
) => {
  const start =
    normalizeUTCDate(startDate);

  const end =
    normalizeUTCDate(endDate);

  return (
    Math.floor(
      (end.getTime() -
        start.getTime()) /
        DAY_MS
    ) + 1
  );
};

const isSunday = (date) => {
  return (
    normalizeUTCDate(date).getUTCDay() === 0
  );
};

const getDateRange = (
  startDate,
  endDate
) => {
  const dates = [];

  let current =
    normalizeUTCDate(startDate);

  const end =
    normalizeUTCDate(endDate);

  while (current <= end) {
    dates.push(
      new Date(current)
    );

    current =
      addDaysUTC(current, 1);
  }

  return dates;
};

// ============================================================
// GET ADMIN HOLIDAYS
// ============================================================

const getAdminHolidayMap = async ({
  tenantId,
  academicYearId,
  startDate,
  endDate,
}) => {
  const holidays =
    await prisma.holiday.findMany({
      where: {
        tenantId,

        academicYearId:
          parseInt(
            academicYearId,
            10
          ),

        date: {
          gte: startDate,
          lte: endDate,
        },
      },

      select: {
        date: true,
        name: true,
      },
    });

  const map = new Map();

  for (const holiday of holidays) {
    const key =
      toDateKey(holiday.date);

    if (key) {
      map.set(
        key,
        holiday.name ||
          "School Holiday"
      );
    }
  }

  return map;
};

// ============================================================
// GET BLOCKED DATE REASON
// ============================================================

const getBlockedReason = (
  date,
  adminHolidayMap
) => {
  const key =
    toDateKey(date);

  if (!key) {
    return null;
  }

  // Admin holiday takes priority.
  if (
    adminHolidayMap.has(key)
  ) {
    return adminHolidayMap.get(
      key
    );
  }

  const year =
    normalizeUTCDate(
      date
    ).getUTCFullYear();

  const builtIn =
    BUILT_IN_HOLIDAYS[year]?.[key];

  if (builtIn) {
    return builtIn;
  }

  if (isSunday(date)) {
    return "Sunday";
  }

  return null;
};

// ============================================================
// GET BLOCKED DATES
// ============================================================

const getBlockedExamDates = async ({
  tenantId,
  academicYearId,
  startDate,
  endDate,
}) => {
  const blocked =
    new Map();

  const adminHolidayMap =
    await getAdminHolidayMap({
      tenantId,
      academicYearId,
      startDate,
      endDate,
    });

  const dates =
    getDateRange(
      startDate,
      endDate
    );

  for (const date of dates) {
    const key =
      toDateKey(date);

    const reason =
      getBlockedReason(
        date,
        adminHolidayMap
      );

    if (reason) {
      blocked.set(
        key,
        reason
      );
    }
  }

  return blocked;
};

// ============================================================
// ADJUST EXAM DATES
// ============================================================
//
// IMPORTANT:
//
// The old code rejected the complete exam range if it
// contained even one holiday or Sunday.
//
// The new code treats the requested range as a number of
// EXAM DAYS.
//
// Example:
//
// User selects:
// 23 Nov -> 30 Nov
//
// That is 8 requested exam days.
//
// If 24 Nov is a holiday and 29 Nov is Sunday:
//
// 23 = Exam Day
// 24 = Holiday - SKIP
// 25 = Exam Day
// 26 = Exam Day
// 27 = Exam Day
// 28 = Exam Day
// 29 = Sunday - SKIP
// 30 = Exam Day
// 01 Dec = Exam Day
// 02 Dec = Exam Day
//
// Final exam range becomes:
// 23 Nov -> 02 Dec
//
// Therefore holidays/Sundays never become exam days.
// ============================================================

const adjustExamDates = async ({
  tenantId,
  academicYearId,
  startDate,
  endDate,
  academicYearEndDate,
}) => {
  const requestedDays =
    getInclusiveDayCount(
      startDate,
      endDate
    );

  if (requestedDays <= 0) {
    throw new HttpError(
      400,
      "Invalid exam date range",
      {
        code:
          "VALIDATION_ERROR",
      }
    );
  }

  /*
   * We need enough future dates to find all required
   * working/exam days.
   *
   * Using roughly twice the requested duration gives
   * enough room for Sundays + holidays.
   */
  let lookupEnd =
    addDaysUTC(
      endDate,
      Math.max(
        30,
        requestedDays
      )
    );

  /*
   * Never look beyond academic year unnecessarily.
   */
  if (
    academicYearEndDate &&
    lookupEnd >
      normalizeUTCDate(
        academicYearEndDate
      )
  ) {
    lookupEnd =
      normalizeUTCDate(
        academicYearEndDate
      );
  }

  let adminHolidayMap =
    await getAdminHolidayMap({
      tenantId,
      academicYearId,
      startDate:
        normalizeUTCDate(
          startDate
        ),
      endDate: lookupEnd,
    });

  let current =
    normalizeUTCDate(
      startDate
    );

  /*
   * First valid exam day.
   */
  while (
    getBlockedReason(
      current,
      adminHolidayMap
    )
  ) {
    current =
      addDaysUTC(
        current,
        1
      );

    if (
      academicYearEndDate &&
      current >
        normalizeUTCDate(
          academicYearEndDate
        )
    ) {
      throw new HttpError(
        400,
        "There are not enough working days left in the academic year for this exam period.",
        {
          code:
            "INSUFFICIENT_WORKING_DAYS",
        }
      );
    }
  }

  const adjustedStart =
    new Date(current);

  let examDaysCompleted = 0;

  let adjustedEnd =
    new Date(current);

  const skippedDates = [];

  while (
    examDaysCompleted <
    requestedDays
  ) {
    const reason =
      getBlockedReason(
        current,
        adminHolidayMap
      );

    if (reason) {
      skippedDates.push({
        date:
          toDateKey(
            current
          ),
        reason,
      });

      current =
        addDaysUTC(
          current,
          1
        );

      if (
        academicYearEndDate &&
        current >
          normalizeUTCDate(
            academicYearEndDate
          )
      ) {
        throw new HttpError(
          400,
          "There are not enough working days left in the academic year for this exam period.",
          {
            code:
              "INSUFFICIENT_WORKING_DAYS",
          }
        );
      }

      continue;
    }

    examDaysCompleted +=
      1;

    adjustedEnd =
      new Date(current);

    if (
      examDaysCompleted <
      requestedDays
    ) {
      current =
        addDaysUTC(
          current,
          1
        );
    }
  }

  /*
   * Final safety check.
   */
  if (
    academicYearEndDate &&
    adjustedEnd >
      normalizeUTCDate(
        academicYearEndDate
      )
  ) {
    throw new HttpError(
      400,
      "Adjusted exam dates exceed the academic year.",
      {
        code:
          "VALIDATION_ERROR",
      }
    );
  }

  return {
    startDate:
      adjustedStart,

    endDate:
      adjustedEnd,

    requestedDays,

    skippedDates,
  };
};

// ============================================================
// GRADING SYSTEM
// ============================================================

const getGradingScale =
  async (tenantId) => {
    const record =
      await prisma.masterData.findFirst({
        where: {
          category:
            "GradingScale",

          tenantId,

          isActive: true,
        },
      });

    if (record) {
      try {
        return JSON.parse(
          record.value
        );
      } catch (e) {
        try {
          const parts =
            record.value.split(",");

          return parts.map(
            (part) => {
              const [
                range,
                grade,
                gp,
              ] =
                part.split(":");

              const [
                min,
                max,
              ] =
                range
                  .split("-")
                  .map(Number);

              return {
                min,
                max,
                grade,
                gp: Number(gp),
              };
            }
          );
        } catch (err) {
          // Use default grading scale.
        }
      }
    }

    return [
      {
        min: 91,
        max: 100,
        grade: "A1",
        gp: 10,
      },
      {
        min: 81,
        max: 90,
        grade: "A2",
        gp: 9,
      },
      {
        min: 71,
        max: 80,
        grade: "B1",
        gp: 8,
      },
      {
        min: 61,
        max: 70,
        grade: "B2",
        gp: 7,
      },
      {
        min: 51,
        max: 60,
        grade: "C1",
        gp: 6,
      },
      {
        min: 41,
        max: 50,
        grade: "C2",
        gp: 5,
      },
      {
        min: 33,
        max: 40,
        grade: "D",
        gp: 4,
      },
      {
        min: 0,
        max: 32.99,
        grade: "E",
        gp: 0,
      },
    ];
  };

const computeGradeAndGP = (
  marksObtained,
  maxMarks,
  scale,
  explicitGrade
) => {
  if (
    marksObtained ===
      undefined ||
    marksObtained === null
  ) {
    return {
      grade: null,
      gradePoint: null,
      remarkAdd: "",
    };
  }

  const percentage =
    (parseFloat(
      marksObtained
    ) /
      parseFloat(maxMarks)) *
    100;

  if (explicitGrade) {
    const rule =
      scale.find(
        (r) =>
          r.grade.toLowerCase() ===
          explicitGrade.toLowerCase()
      );

    return {
      grade:
        explicitGrade,

      gradePoint:
        rule
          ? rule.gp
          : null,

      remarkAdd:
        " [Manually Overridden]",
    };
  }

  const rule =
    scale.find(
      (r) =>
        percentage >= r.min &&
        percentage <= r.max
    );

  if (rule) {
    return {
      grade:
        rule.grade,

      gradePoint:
        rule.gp,

      remarkAdd: "",
    };
  }

  return {
    grade: "E",
    gradePoint: 0,
    remarkAdd: "",
  };
};

// ============================================================
// CREATE EXAM
// ============================================================

const createExam = async (
  data,
  tenantId,
  actingUser
) => {
  assertIsAdmin(
    actingUser
  );

  const {
    academicYearId,
    name,
    examType,
    classId,
    startDate,
    endDate,
  } = data;

  if (
    !academicYearId ||
    !name ||
    !examType ||
    !classId ||
    !startDate ||
    !endDate
  ) {
    throw new HttpError(
      400,
      "academicYearId, name, examType, classId, startDate and endDate are required",
      {
        code:
          "VALIDATION_ERROR",
      }
    );
  }

  const [
    academicYear,
    cls,
  ] = await Promise.all([
    prisma.academicYear.findFirst({
      where: {
        id: parseInt(
          academicYearId
        ),
        tenantId,
      },
    }),

    prisma.class.findFirst({
      where: {
        id: parseInt(classId),
        tenantId,
      },
    }),
  ]);

  if (!academicYear) {
    throw new HttpError(
      404,
      "Academic year not found",
      {
        code: "NOT_FOUND",
      }
    );
  }

  if (!cls) {
    throw new HttpError(
      404,
      "Class not found",
      {
        code: "NOT_FOUND",
      }
    );
  }

  let requestedStart =
    new Date(startDate);

  let requestedEnd =
    new Date(endDate);

  if (
    Number.isNaN(
      requestedStart.getTime()
    ) ||
    Number.isNaN(
      requestedEnd.getTime()
    )
  ) {
    throw new HttpError(
      400,
      "Invalid exam date",
      {
        code:
          "VALIDATION_ERROR",
      }
    );
  }

  requestedStart =
    normalizeUTCDate(
      requestedStart
    );

  requestedEnd =
    normalizeUTCDate(
      requestedEnd
    );

  if (
    requestedStart >
    requestedEnd
  ) {
    throw new HttpError(
      400,
      "startDate cannot be after endDate",
      {
        code:
          "VALIDATION_ERROR",
      }
    );
  }

  /*
   * First validate the USER'S requested range against
   * academic-year boundaries.
   */
  if (
    academicYear.startDate &&
    academicYear.endDate
  ) {
    const academicStart =
      normalizeUTCDate(
        academicYear.startDate
      );

    const academicEnd =
      normalizeUTCDate(
        academicYear.endDate
      );

    if (
      requestedStart <
        academicStart ||
      requestedStart >
        academicEnd ||
      requestedEnd <
        academicStart ||
      requestedEnd >
        academicEnd
    ) {
      throw new HttpError(
        400,
        "Exam dates must fall within the academic year date range",
        {
          code:
            "VALIDATION_ERROR",
        }
      );
    }
  }

  // ==========================================================
  // AUTOMATICALLY SKIP HOLIDAYS + SUNDAYS
  // ==========================================================

  const adjusted =
    await adjustExamDates({
      tenantId,

      academicYearId,

      startDate:
        requestedStart,

      endDate:
        requestedEnd,

      academicYearEndDate:
        academicYear.endDate,
    });

  const start =
    adjusted.startDate;

  const end =
    adjusted.endDate;

  // ==========================================================
  // CREATE EXAM
  // ==========================================================

  const exam =
    await prisma.exam.create({
      data: {
        tenantId,

        academicYearId:
          parseInt(
            academicYearId
          ),

        name,

        examType,

        classId:
          parseInt(classId),

        startDate: start,

        endDate: end,

        isActive: true,
      },
    });

  // ==========================================================
  // NOTIFICATION
  // ==========================================================

  try {
    let message =
      `${name} (${examType}) has been scheduled from ${start.toLocaleDateString(
        "en-IN"
      )} to ${end.toLocaleDateString(
        "en-IN"
      )}.`;

    if (
      adjusted.skippedDates.length >
      0
    ) {
      message +=
        ` Holidays/Sundays were automatically skipped and the exam period was adjusted to ${start.toLocaleDateString(
          "en-IN"
        )} - ${end.toLocaleDateString(
          "en-IN"
        )}.`;
    }

    await createNotification({
      tenantId,

      title:
        "New Exam Schedule",

      message,

      type: "exam",

      priority: "high",

      audience: "student",

      classId:
        parseInt(classId),

      sectionId: null,

      createdById:
        actingUser.userId ||
        null,
    });
  } catch (
    notificationError
  ) {
    console.error(
      "Failed to create student exam notification:",
      notificationError
    );
  }

  return {
    ...exam,

    schedulingInfo: {
      requestedStartDate:
        requestedStart,

      requestedEndDate:
        requestedEnd,

      actualStartDate:
        start,

      actualEndDate:
        end,

      requestedExamDays:
        adjusted.requestedDays,

      skippedDates:
        adjusted.skippedDates,
    },
  };
};

// ============================================================
// GET ALL EXAMS
// ============================================================

const getAllExams = async (
  tenantId,
  filters = {}
) => {
  const {
    academicYearId,
    classId,
    examType,
    includeInactive,
  } = filters;

  return prisma.exam.findMany({
    where: {
      tenantId,

      ...(!includeInactive && {
        isActive: true,
      }),

      ...(academicYearId && {
        academicYearId:
          parseInt(
            academicYearId
          ),
      }),

      ...(classId && {
        classId:
          parseInt(classId),
      }),

      ...(examType && {
        examType,
      }),
    },

    include: {
      class: {
        select: {
          id: true,
          name: true,
        },
      },

      academicYear: {
        select: {
          id: true,
          name: true,
        },
      },
    },

    orderBy: {
      startDate: "desc",
    },
  });
};

// ============================================================
// GET EXAM BY ID
// ============================================================

const getExamById = async (
  id,
  tenantId,
  includeInactive
) => {
  const exam =
    await prisma.exam.findFirst({
      where: {
        id: parseInt(id),
        tenantId,

        ...(!includeInactive && {
          isActive: true,
        }),
      },

      include: {
        class: {
          select: {
            id: true,
            name: true,
          },
        },

        academicYear: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

  if (!exam) {
    throw new HttpError(
      404,
      "Exam not found",
      {
        code: "NOT_FOUND",
      }
    );
  }

  const totalStudents =
    await prisma.student.count({
      where: {
        classId:
          exam.classId,

        tenantId,

        isDeleted: false,
      },
    });

  const enteredMarksCount =
    await prisma.examMark.groupBy({
      by: ["studentId"],

      where: {
        examId: exam.id,
        tenantId,
      },
    });

  const markedStudents =
    enteredMarksCount.length;

  return {
    exam,

    summary: {
      totalStudents,

      markedStudents,

      completionPercentage:
        totalStudents > 0
          ? (
              (markedStudents /
                totalStudents) *
              100
            ).toFixed(2) + "%"
          : "0%",
    },
  };
};

// ============================================================
// UPDATE EXAM
// ============================================================

const updateExam = async (
  id,
  data,
  tenantId,
  actingUser
) => {
  assertIsAdmin(
    actingUser
  );

  const exam =
    await prisma.exam.findFirst({
      where: {
        id: parseInt(id),
        tenantId,
      },
    });

  if (!exam) {
    throw new HttpError(
      404,
      "Exam not found",
      {
        code: "NOT_FOUND",
      }
    );
  }

  const updateData = {};

  if (data.name) {
    updateData.name =
      data.name;
  }

  if (data.examType) {
    updateData.examType =
      data.examType;
  }

  if (
    data.isActive !==
    undefined
  ) {
    updateData.isActive =
      data.isActive;
  }

  let finalStartDate =
    new Date(
      exam.startDate
    );

  let finalEndDate =
    new Date(
      exam.endDate
    );

  if (
    data.startDate ||
    data.endDate
  ) {
    let requestedStart =
      data.startDate
        ? new Date(
            data.startDate
          )
        : new Date(
            exam.startDate
          );

    let requestedEnd =
      data.endDate
        ? new Date(
            data.endDate
          )
        : new Date(
            exam.endDate
          );

    if (
      Number.isNaN(
        requestedStart.getTime()
      ) ||
      Number.isNaN(
        requestedEnd.getTime()
      )
    ) {
      throw new HttpError(
        400,
        "Invalid exam date",
        {
          code:
            "VALIDATION_ERROR",
        }
      );
    }

    requestedStart =
      normalizeUTCDate(
        requestedStart
      );

    requestedEnd =
      normalizeUTCDate(
        requestedEnd
      );

    if (
      requestedStart >
      requestedEnd
    ) {
      throw new HttpError(
        400,
        "startDate cannot be after endDate",
        {
          code:
            "VALIDATION_ERROR",
        }
      );
    }

    const academicYear =
      await prisma.academicYear.findFirst(
        {
          where: {
            id:
              exam.academicYearId,

            tenantId,
          },
        }
      );

    if (
      academicYear &&
      academicYear.startDate &&
      academicYear.endDate
    ) {
      const academicStart =
        normalizeUTCDate(
          academicYear.startDate
        );

      const academicEnd =
        normalizeUTCDate(
          academicYear.endDate
        );

      if (
        requestedStart <
          academicStart ||
        requestedStart >
          academicEnd ||
        requestedEnd <
          academicStart ||
        requestedEnd >
          academicEnd
      ) {
        throw new HttpError(
          400,
          "Exam dates must fall within the academic year date range",
          {
            code:
              "VALIDATION_ERROR",
          }
        );
      }
    }

    // ========================================================
    // AUTOMATICALLY SKIP HOLIDAYS + SUNDAYS
    // ========================================================

    const adjusted =
      await adjustExamDates({
        tenantId,

        academicYearId:
          exam.academicYearId,

        startDate:
          requestedStart,

        endDate:
          requestedEnd,

        academicYearEndDate:
          academicYear?.endDate ||
          null,
      });

    finalStartDate =
      adjusted.startDate;

    finalEndDate =
      adjusted.endDate;

    updateData.startDate =
      finalStartDate;

    updateData.endDate =
      finalEndDate;
  }

  const updatedExam =
    await prisma.exam.update({
      where: {
        id: parseInt(id),
      },

      data: updateData,
    });

  // ==========================================================
  // UPDATE NOTIFICATION
  // ==========================================================

  try {
    await createNotification({
      tenantId,

      title:
        "Exam Schedule Updated",

      message:
        `${updatedExam.name} exam schedule is ${new Date(
          updatedExam.startDate
        ).toLocaleDateString(
          "en-IN"
        )} to ${new Date(
          updatedExam.endDate
        ).toLocaleDateString(
          "en-IN"
        )}. Sundays and holidays are automatically skipped.`,

      type: "exam",

      priority: "high",

      audience: "student",

      classId:
        updatedExam.classId,

      sectionId: null,

      createdById:
        actingUser.userId ||
        null,
    });
  } catch (
    notificationError
  ) {
    console.error(
      "Failed to create student exam update notification:",
      notificationError
    );
  }

  return updatedExam;
};

// ============================================================
// DELETE EXAM
// ============================================================

const deleteExam = async (
  id,
  tenantId,
  actingUser
) => {
  assertIsAdmin(
    actingUser
  );

  const exam =
    await prisma.exam.findFirst({
      where: {
        id: parseInt(id),
        tenantId,
      },
    });

  if (!exam) {
    throw new HttpError(
      404,
      "Exam not found",
      {
        code: "NOT_FOUND",
      }
    );
  }

  const marksCount =
    await prisma.examMark.count({
      where: {
        examId: exam.id,
        tenantId,
      },
    });

  if (marksCount > 0) {
    await prisma.exam.update({
      where: {
        id: exam.id,
      },

      data: {
        isActive: false,
      },
    });

    return {
      message:
        "Exam has marks associated. Deactivated successfully",
    };
  }

  await prisma.exam.delete({
    where: {
      id: exam.id,
    },
  });

  return {
    message:
      "Exam deleted successfully",
  };
};

// ============================================================
// BULK ENTER MARKS
// ============================================================

const bulkEnterMarks = async (
  examId,
  data,
  tenantId,
  actingUser
) => {
  const {
    subjectId,
    maxMarks,
    records,
  } = data;

  if (
    !subjectId ||
    maxMarks === undefined ||
    !Array.isArray(records) ||
    records.length === 0
  ) {
    throw new HttpError(
      400,
      "subjectId, maxMarks, and records array are required",
      {
        code:
          "VALIDATION_ERROR",
      }
    );
  }

  const parsedMaxMarks =
    parseFloat(maxMarks);

  if (parsedMaxMarks <= 0) {
    throw new HttpError(
      400,
      "maxMarks must be greater than 0",
      {
        code:
          "VALIDATION_ERROR",
      }
    );
  }

  const enteredById =
    actingUser.staffId;

  if (!enteredById) {
    throw new HttpError(
      403,
      "This account is not linked to a staff record and cannot enter marks",
      {
        code:
          "FORBIDDEN",
      }
    );
  }

  const exam =
    await prisma.exam.findFirst({
      where: {
        id: parseInt(examId),
        tenantId,
        isActive: true,
      },
    });

  if (!exam) {
    throw new HttpError(
      404,
      "Exam not found",
      {
        code: "NOT_FOUND",
      }
    );
  }

  await assertCanManageMarks(
    tenantId,
    actingUser,
    exam.classId,
    subjectId
  );

  const subject =
    await prisma.subject.findFirst({
      where: {
        id: parseInt(subjectId),
        tenantId,
        isDeleted: false,
      },
    });

  if (!subject) {
    throw new HttpError(
      404,
      "Subject not found",
      {
        code: "NOT_FOUND",
      }
    );
  }

  const studentIds =
    records.map((r) =>
      parseInt(r.studentId)
    );

  const students =
    await prisma.student.findMany({
      where: {
        id: {
          in: studentIds,
        },

        tenantId,

        classId:
          exam.classId,

        isDeleted: false,
      },

      select: {
        id: true,
      },
    });

  if (
    students.length !==
    new Set(studentIds).size
  ) {
    throw new HttpError(
      400,
      "One or more student IDs are invalid, deleted, or do not belong to the class",
      {
        code:
          "VALIDATION_ERROR",
      }
    );
  }

  const scale =
    await getGradingScale(
      tenantId
    );

  const transactions = [];

  for (
    const r of records
  ) {
    const studentId =
      parseInt(r.studentId);

    const isAbsent =
      !!r.isAbsent;

    let marksObtained =
      r.marksObtained !==
        undefined &&
      r.marksObtained !==
        null
        ? parseFloat(
            r.marksObtained
          )
        : null;

    if (isAbsent) {
      marksObtained =
        null;
    } else if (
      marksObtained === null
    ) {
      throw new HttpError(
        400,
        `marksObtained is required if student is present (studentId: ${studentId})`,
        {
          code:
            "VALIDATION_ERROR",
        }
      );
    } else if (
      marksObtained < 0 ||
      marksObtained >
        parsedMaxMarks
    ) {
      throw new HttpError(
        400,
        `marksObtained must be between 0 and maxMarks (studentId: ${studentId})`,
        {
          code:
            "VALIDATION_ERROR",
        }
      );
    }

    const {
      grade,
      gradePoint,
      remarkAdd,
    } =
      computeGradeAndGP(
        marksObtained,
        parsedMaxMarks,
        scale,
        r.grade
      );

    const remark =
      (r.remark || "") +
      remarkAdd;

    transactions.push(
      prisma.examMark.create({
        data: {
          tenantId,

          examId:
            exam.id,

          studentId,

          subjectId:
            parseInt(
              subjectId
            ),

          maxMarks:
            parsedMaxMarks,

          marksObtained,

          isAbsent,

          grade,

          gradePoint,

          remark:
            remark || null,

          enteredById,
        },
      })
    );
  }

  try {
    const results =
      await prisma.$transaction(
        transactions
      );

    return {
      message:
        `Marks recorded for ${results.length} students`,

      count:
        results.length,
    };
  } catch (err) {
    if (
      err.code ===
      "P2002"
    ) {
      throw new HttpError(
        409,
        "Marks already exist for one or more student/subject combinations",
        {
          code:
            "DUPLICATE",
        }
      );
    }

    throw err;
  }
};

// ============================================================
// GET EXAM MARKS
// ============================================================

const getExamMarks = async (
  examId,
  tenantId,
  subjectId,
  actingUser
) => {
  const exam =
    await prisma.exam.findFirst({
      where: {
        id: parseInt(examId),
        tenantId,
      },
    });

  if (!exam) {
    throw new HttpError(
      404,
      "Exam not found",
      {
        code: "NOT_FOUND",
      }
    );
  }

  if (
    actingUser.identity !==
    "admin"
  ) {
    if (
      actingUser.identity !==
        "staff" ||
      actingUser.staffRole !==
        "teacher"
    ) {
      throw new HttpError(
        403,
        "Access denied",
        {
          code:
            "FORBIDDEN",
        }
      );
    }

    const teacherTimetableCount =
      await prisma.timetable.count({
        where: {
          tenantId,
          staffId:
            actingUser.staffId,
          isActive: true,
        },
      });

    if (
      teacherTimetableCount >
      0
    ) {
      if (subjectId) {
        await assertCanManageMarks(
          tenantId,
          actingUser,
          exam.classId,
          subjectId
        );
      } else {
        const timetabled =
          await prisma.timetable.findFirst({
            where: {
              tenantId,
              staffId:
                actingUser.staffId,
              classId:
                exam.classId,
              isActive: true,
            },
          });

        if (!timetabled) {
          throw new HttpError(
            403,
            "You are not timetabled for this class",
            {
              code:
                "FORBIDDEN",
            }
          );
        }
      }
    }
  }

  return prisma.examMark.findMany({
    where: {
      tenantId,

      examId:
        exam.id,

      ...(subjectId && {
        subjectId:
          parseInt(
            subjectId
          ),
      }),
    },

    include: {
      student: {
        select: {
          id: true,
          studentName: true,
          admissionNo: true,
          rollNo: true,
        },
      },

      subject: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },

      enteredBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },

    orderBy: [
      {
        subject: {
          name: "asc",
        },
      },

      {
        student: {
          rollNo: "asc",
        },
      },
    ],
  });
};

// ============================================================
// GET STUDENT REPORT CARD
// ============================================================

const getStudentReportCard =
  async (
    tenantId,
    studentId,
    academicYearId,
    actingUser
  ) => {
    const student =
      await prisma.student.findFirst({
        where: {
          id:
            parseInt(
              studentId
            ),

          tenantId,

          isDeleted: false,
        },

        include: {
          class: true,
        },
      });

    if (!student) {
      throw new HttpError(
        404,
        "Student not found",
        {
          code:
            "NOT_FOUND",
        }
      );
    }

    if (
      actingUser.identity !==
      "admin"
    ) {
      if (
        actingUser.identity !==
          "staff" ||
        actingUser.staffRole !==
          "teacher"
      ) {
        throw new HttpError(
          403,
          "Only teachers or admins can view report cards",
          {
            code:
              "FORBIDDEN",
          }
        );
      }

      const teacherTimetableCount =
        await prisma.timetable.count({
          where: {
            tenantId,

            staffId:
              actingUser.staffId,

            isActive: true,
          },
        });

      if (
        teacherTimetableCount >
        0
      ) {
        const assignment =
          await prisma.timetable.findFirst({
            where: {
              tenantId,

              staffId:
                actingUser.staffId,

              classId:
                student.classId,

              isActive: true,
            },
          });

        if (!assignment) {
          throw new HttpError(
            403,
            "You are not authorized to view this student's report card",
            {
              code:
                "FORBIDDEN",
            }
          );
        }
      }
    }

    let acYearId =
      academicYearId
        ? parseInt(
            academicYearId
          )
        : null;

    if (!acYearId) {
      const activeAY =
        await prisma.academicYear.findFirst({
          where: {
            tenantId,

            isActive: true,

            isDeleted: false,
          },
        });

      if (!activeAY) {
        throw new HttpError(
          400,
          "No active academic year found. Please specify academicYearId",
          {
            code:
              "VALIDATION_ERROR",
          }
        );
      }

      acYearId =
        activeAY.id;
    }

    const allExamsForClass =
      await prisma.exam.findMany({
        where: {
          tenantId,

          classId:
            student.classId,

          academicYearId:
            acYearId,
        },

        orderBy: {
          startDate: "asc",
        },
      });

    const allSubjects =
      await prisma.subject.findMany({
        where: {
          tenantId,

          isDeleted: false,
        },

        orderBy: {
          name: "asc",
        },
      });

    const marks =
      await prisma.examMark.findMany({
        where: {
          tenantId,

          studentId:
            student.id,

          exam: {
            academicYearId:
              acYearId,
          },
        },

        include: {
          exam: true,

          subject: true,

          enteredBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },

        orderBy: [
          {
            exam: {
              startDate:
                "asc",
            },
          },

          {
            subject: {
              name: "asc",
            },
          },
        ],
      });

    const markLookup =
      {};

    marks.forEach(
      (mark) => {
        if (
          !markLookup[
            mark.examId
          ]
        ) {
          markLookup[
            mark.examId
          ] = {};
        }

        markLookup[
          mark.examId
        ][
          mark.subjectId
        ] = mark;
      }
    );

    const exams =
      allExamsForClass.map(
        (exam) => {
          const examMarks =
            markLookup[
              exam.id
            ] || {};

          const hasAnyMarks =
            Object.keys(
              examMarks
            ).length > 0;

          const subjects =
            allSubjects.map(
              (subject) => {
                const mark =
                  examMarks[
                    subject.id
                  ];

                if (mark) {
                  return {
                    markId:
                      mark.id,

                    subjectId:
                      subject.id,

                    subjectName:
                      subject.name,

                    subjectCode:
                      subject.code,

                    maxMarks:
                      Number(
                        mark.maxMarks
                      ),

                    marksObtained:
                      mark.marksObtained !==
                      null
                        ? Number(
                            mark.marksObtained
                          )
                        : null,

                    isAbsent:
                      mark.isAbsent,

                    grade:
                      mark.grade,

                    gradePoint:
                      mark.gradePoint !==
                      null
                        ? Number(
                            mark.gradePoint
                          )
                        : null,

                    remark:
                      mark.remark,

                    enteredBy:
                      mark.enteredBy
                        .name,

                    status:
                      "entered",
                  };
                }

                return {
                  markId: null,

                  subjectId:
                    subject.id,

                  subjectName:
                    subject.name,

                  subjectCode:
                    subject.code,

                  maxMarks: null,

                  marksObtained:
                    null,

                  isAbsent:
                    false,

                  grade: null,

                  gradePoint:
                    null,

                  remark:
                    null,

                  enteredBy:
                    null,

                  status:
                    "not_entered",
                };
              }
            );

          return {
            examId:
              exam.id,

            examName:
              exam.name,

            examType:
              exam.examType,

            startDate:
              exam.startDate,

            endDate:
              exam.endDate,

            isActive:
              exam.isActive,

            hasAnyMarks,

            subjects,
          };
        }
      );

    return {
      student: {
        id:
          student.id,

        name:
          student.studentName,

        admissionNo:
          student.admissionNo,

        rollNo:
          student.rollNo,

        class:
          student.class.name,
      },

      academicYearId:
        acYearId,

      exams,
    };
  };

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  createExam,
  getAllExams,
  getExamById,
  updateExam,
  deleteExam,
  bulkEnterMarks,
  getExamMarks,
  getStudentReportCard,
};