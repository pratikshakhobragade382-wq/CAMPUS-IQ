const prisma = require('../../prisma/prismaClient');

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function percentChange(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

const toNum = (d) => (d == null ? 0 : Number(d));

const DAY_LABELS = [
  'Sun',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat'
];

const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
];

/*
 * ============================================================
 * UTC DATE HELPERS
 * ============================================================
 */

function utcStartOfDay(d) {
  const x = new Date(d);

  return new Date(
    Date.UTC(
      x.getUTCFullYear(),
      x.getUTCMonth(),
      x.getUTCDate()
    )
  );
}

function utcAddDays(d, n) {
  const x = new Date(d);

  x.setUTCDate(
    x.getUTCDate() + n
  );

  return x;
}

/*
 * ============================================================
 * ADMIN DASHBOARD
 * ============================================================
 */

async function getSummary(tenantId) {
  const now = new Date();

  const todayStart = startOfDay(now);
  const tomorrowStart = addDays(todayStart, 1);
  const weekStart = addDays(todayStart, -6);
  const monthStart = startOfMonth(now);

  const lastMonthStart = new Date(monthStart);

  lastMonthStart.setMonth(
    lastMonthStart.getMonth() - 1
  );

  const thirtyDaysAgo = addDays(
    todayStart,
    -30
  );

  const sixMonthsAgo = addDays(
    todayStart,
    -180
  );

  const [
    totalStudents,
    newStudents30,
    totalTeachers,
    newTeachers30,
    presentToday,
    weekAttendanceRows,
    feesThisMonthAgg,
    feesLastMonthAgg,
    feeCollectionRows,
    feeStructures,
    studentsWithDept,
    recentStudents,
    recentFees,
    recentStaff,
    upcomingHolidays,
    upcomingExams
  ] = await Promise.all([
    prisma.student.count({
      where: {
        tenantId,
        isDeleted: false
      }
    }),

    prisma.student.count({
      where: {
        tenantId,
        isDeleted: false,
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    }),

    prisma.staff.count({
      where: {
        tenantId,
        isDeleted: false,
        role: 'teacher'
      }
    }),

    prisma.staff.count({
      where: {
        tenantId,
        isDeleted: false,
        role: 'teacher',
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    }),

    prisma.studentAttendance.count({
      where: {
        tenantId,
        date: {
          gte: todayStart,
          lt: tomorrowStart
        },
        status: 'present'
      }
    }),

    prisma.studentAttendance.findMany({
      where: {
        tenantId,
        date: {
          gte: weekStart,
          lt: tomorrowStart
        }
      },
      select: {
        date: true,
        status: true
      }
    }),

    prisma.feeCollection.aggregate({
      where: {
        tenantId,
        paymentDate: {
          gte: monthStart
        }
      },
      _sum: {
        netAmount: true
      }
    }),

    prisma.feeCollection.aggregate({
      where: {
        tenantId,
        paymentDate: {
          gte: lastMonthStart,
          lt: monthStart
        }
      },
      _sum: {
        netAmount: true
      }
    }),

    prisma.feeCollection.findMany({
      where: {
        tenantId,
        paymentDate: {
          gte: sixMonthsAgo
        }
      },
      select: {
        paymentDate: true,
        netAmount: true
      }
    }),

    prisma.feeStructure.findMany({
      where: {
        tenantId,
        isActive: true
      },
      select: {
        amount: true,
        classId: true,
        class: {
          select: {
            _count: {
              select: {
                students: {
                  where: {
                    isDeleted: false
                  }
                }
              }
            }
          }
        }
      }
    }),

    prisma.student.findMany({
      where: {
        tenantId,
        isDeleted: false
      },
      select: {
        class: {
          select: {
            department: {
              select: {
                name: true
              }
            }
          }
        }
      }
    }),

    prisma.student.findMany({
      where: {
        tenantId,
        isDeleted: false
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 3,
      select: {
        studentName: true,
        createdAt: true,
        class: {
          select: {
            name: true
          }
        }
      }
    }),

    prisma.feeCollection.findMany({
      where: {
        tenantId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 3,
      select: {
        netAmount: true,
        createdAt: true,
        student: {
          select: {
            studentName: true
          }
        }
      }
    }),

    prisma.staff.findMany({
      where: {
        tenantId,
        isDeleted: false
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 3,
      select: {
        name: true,
        role: true,
        createdAt: true
      }
    }),

    prisma.holiday.findMany({
      where: {
        tenantId,
        date: {
          gte: todayStart
        }
      },
      orderBy: {
        date: 'asc'
      },
      take: 4,
      select: {
        name: true,
        date: true
      }
    }),

    prisma.exam.findMany({
      where: {
        tenantId,
        startDate: {
          gte: todayStart
        }
      },
      orderBy: {
        startDate: 'asc'
      },
      take: 3,
      select: {
        name: true,
        startDate: true
      }
    })
  ]);

  const baselineStudents =
    totalStudents - newStudents30;

  const studentsTrend =
    percentChange(
      totalStudents,
      baselineStudents
    );

  const baselineTeachers =
    totalTeachers - newTeachers30;

  const teachersTrend =
    percentChange(
      totalTeachers,
      baselineTeachers
    );

  /*
   * Weekly attendance
   */

  const byDate = {};

  for (const row of weekAttendanceRows) {
    const key = row.date
      .toISOString()
      .slice(0, 10);

    if (!byDate[key]) {
      byDate[key] = {
        present: 0,
        absent: 0,
        late: 0
      };
    }

    if (row.status === 'present') {
      byDate[key].present++;
    } else if (row.status === 'absent') {
      byDate[key].absent++;
    } else if (row.status === 'late') {
      byDate[key].late++;
    }
  }

  const weeklyAttendance = [];

  for (let i = 6; i >= 0; i--) {
    const d = addDays(
      todayStart,
      -i
    );

    const key = d
      .toISOString()
      .slice(0, 10);

    const bucket =
      byDate[key] || {
        present: 0,
        absent: 0,
        late: 0
      };

    weeklyAttendance.push({
      name: DAY_LABELS[d.getDay()],
      ...bucket
    });
  }

  const todayPct =
    totalStudents > 0
      ? Math.round(
          (presentToday /
            totalStudents) *
            100
        )
      : 0;

  const otherDaysPct =
    weeklyAttendance
      .slice(0, -1)
      .map((d) =>
        totalStudents > 0
          ? (d.present /
              totalStudents) *
            100
          : 0
      );

  const avgPrevPct =
    otherDaysPct.length
      ? otherDaysPct.reduce(
          (a, b) => a + b,
          0
        ) / otherDaysPct.length
      : 0;

  const attendanceTrend =
    percentChange(
      todayPct,
      Math.round(avgPrevPct)
    );

  /*
   * Fees
   */

  const feesThisMonth = toNum(
    feesThisMonthAgg._sum.netAmount
  );

  const feesLastMonth = toNum(
    feesLastMonthAgg._sum.netAmount
  );

  const feesTrend =
    percentChange(
      feesThisMonth,
      feesLastMonth
    );

  /*
   * Fee collection trend
   */

  const monthBuckets = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(
      now.getFullYear(),
      now.getMonth() - i,
      1
    );

    monthBuckets.push({
      year: d.getFullYear(),
      month: d.getMonth(),
      name: MONTH_LABELS[d.getMonth()],
      collected: 0
    });
  }

  for (const row of feeCollectionRows) {
    const d = new Date(
      row.paymentDate
    );

    const bucket =
      monthBuckets.find(
        (b) =>
          b.year === d.getFullYear() &&
          b.month === d.getMonth()
      );

    if (bucket) {
      bucket.collected += toNum(
        row.netAmount
      );
    }
  }

  const feeCollectionTrend =
    monthBuckets.map(
      ({ name, collected }) => ({
        name,
        collected: Math.round(
          collected
        )
      })
    );

  /*
   * Fee summary
   */

  const totalExpected =
    feeStructures.reduce(
      (sum, fs) =>
        sum +
        toNum(fs.amount) *
          (fs.class?._count
            ?.students || 0),
      0
    );

  const totalCollectedAggAll =
    await prisma.feeCollection.aggregate({
      where: {
        tenantId
      },
      _sum: {
        netAmount: true
      }
    });

  const collectedAllTime =
    toNum(
      totalCollectedAggAll._sum
        .netAmount
    );

  const pending = Math.max(
    totalExpected -
      collectedAllTime,
    0
  );

  const feeSummary = [
    {
      name: 'Paid',
      value: Math.round(
        collectedAllTime
      ),
      fill: '#10b981'
    },
    {
      name: 'Pending',
      value: Math.round(
        pending
      ),
      fill: '#f59e0b'
    }
  ];

  /*
   * Department distribution
   */

  const deptMap = {};

  for (const s of studentsWithDept) {
    const name =
      s.class?.department?.name ||
      'Unassigned';

    deptMap[name] =
      (deptMap[name] || 0) + 1;
  }

  const departmentDistribution =
    Object.entries(deptMap).map(
      ([name, value]) => ({
        name,
        value
      })
    );

  /*
   * Recent activities
   */

  const activities = [
    ...recentStudents.map(
      (s) => ({
        type: 'student',
        title:
          'New student admission',
        desc: `${s.studentName} added to ${
          s.class?.name ||
          'a class'
        }`,
        time: s.createdAt
      })
    ),

    ...recentFees.map(
      (f) => ({
        type: 'fee',
        title:
          'Fee payment received',
        desc: `${
          f.student
            ?.studentName ||
          'A student'
        } paid ₹${toNum(
          f.netAmount
        ).toLocaleString(
          'en-IN'
        )}`,
        time: f.createdAt
      })
    ),

    ...recentStaff.map(
      (s) => ({
        type: 'staff',
        title:
          'Staff appointment',
        desc: `${s.name} joined${
          s.role
            ? ` as ${s.role}`
            : ''
        }`,
        time: s.createdAt
      })
    )
  ]
    .sort(
      (a, b) =>
        new Date(b.time) -
        new Date(a.time)
    )
    .slice(0, 5);

  /*
   * Upcoming events
   */

  const upcomingEvents = [
    ...upcomingHolidays.map(
      (h) => ({
        title: h.name,
        date: h.date,
        kind: 'holiday'
      })
    ),

    ...upcomingExams.map(
      (e) => ({
        title: e.name,
        date: e.startDate,
        kind: 'exam'
      })
    )
  ]
    .sort(
      (a, b) =>
        new Date(a.date) -
        new Date(b.date)
    )
    .slice(0, 4);

  return {
    stats: {
      totalStudents,
      studentsTrend,
      totalTeachers,
      teachersTrend,
      todayAttendancePercentage:
        todayPct,
      attendanceTrend,
      feesCollectedThisMonth:
        Math.round(
          feesThisMonth
        ),
      feesTrend
    },

    weeklyAttendance,

    feeCollectionTrend,

    feeSummary,

    departmentDistribution,

    recentActivities:
      activities,

    upcomingEvents
  };
}

/*
 * ============================================================
 * TEACHER DASHBOARD
 * ============================================================
 */

async function getTeacherSummary(
  tenantId,
  staffId
) {
  const now = new Date();

  const todayStart =
    utcStartOfDay(now);

  const tomorrowStart =
    utcAddDays(
      todayStart,
      1
    );

  const sevenDaysAgo =
    utcAddDays(
      todayStart,
      -6
    );

  const jsDay =
    now.getDay();

  /*
   * 1 = Monday
   * 2 = Tuesday
   * ...
   * 6 = Saturday
   * 0 = Sunday
   */

  const dayOfWeek =
    jsDay === 0
      ? null
      : jsDay;

  /*
   * ============================================================
   * STEP 1: Teacher timetable
   * ============================================================
   */

  const teacherTimetables =
    await prisma.timetable.findMany({
      where: {
        tenantId,
        staffId,
        isActive: true
      },

      distinct: [
        'classId',
        'sectionId'
      ],

      select: {
        classId: true,
        sectionId: true
      }
    });

  const studentConditions =
    teacherTimetables.map(
      (t) =>
        t.sectionId
          ? {
              classId: t.classId,
              sectionId:
                t.sectionId
            }
          : {
              classId:
                t.classId
            }
    );

  /*
   * ============================================================
   * STEP 2: Dashboard data
   * ============================================================
   */

  const [
    todaySchedule,
    activeSubjectAssignments,
    attendanceMarkedToday,
    assignedStudents,
    recentAssignments,
    upcomingExams,
    weeklyAttendanceRows,
    recentAttendance
  ] = await Promise.all([
    /*
     * Today's classes
     */

    dayOfWeek
      ? prisma.timetable.findMany({
          where: {
            tenantId,
            staffId,
            dayOfWeek,
            isActive: true
          },

          include: {
            class: {
              select: {
                id: true,
                name: true
              }
            },

            section: {
              select: {
                id: true,
                name: true
              }
            },

            subject: {
              select: {
                id: true,
                name: true
              }
            },

            periodSlot: {
              select: {
                slotNo: true,
                label: true,
                startTime: true,
                endTime: true
              }
            }
          },

          orderBy: {
            periodSlot: {
              slotNo: 'asc'
            }
          }
        })
      : Promise.resolve([]),

    /*
     * Subjects assigned
     */

    prisma.staffSubject.count({
      where: {
        staffId
      }
    }),

    /*
     * Attendance marked today
     */

    prisma.studentAttendance.count({
      where: {
        tenantId,

        date: {
          gte: todayStart,
          lt: tomorrowStart
        },

        markedById: staffId
      }
    }),

    /*
     * Students belonging to teacher classes
     */

    studentConditions.length
      ? prisma.student.findMany({
          where: {
            tenantId,
            isDeleted: false,
            OR: studentConditions
          },

          select: {
            id: true,
            classId: true,
            sectionId: true
          }
        })
      : Promise.resolve([]),

    /*
     * Recent assignments
     */

    prisma.assignment.findMany({
      where: {
        tenantId,
        teacherId: staffId,
        isActive: true
      },

      orderBy: {
        createdAt: 'desc'
      },

      take: 10,

      select: {
        id: true,
        title: true,
        dueDate: true,
        createdAt: true,
        classId: true,
        sectionId: true
      }
    }),

    /*
     * Upcoming exams
     */

    prisma.exam.findMany({
      where: {
        tenantId,
        isActive: true,
        startDate: {
          gte: todayStart
        },

        class: {
          timetables: {
            some: {
              staffId,
              isActive: true
            }
          }
        }
      },

      select: {
        id: true,
        name: true,
        examType: true,
        startDate: true,
        endDate: true,

        class: {
          select: {
            id: true,
            name: true
          }
        }
      },

      orderBy: {
        startDate: 'asc'
      },

      take: 5
    }),

    /*
     * Attendance for last 7 days
     */

    studentConditions.length
      ? prisma.studentAttendance.findMany({
          where: {
            tenantId,

            date: {
              gte: sevenDaysAgo,
              lt: tomorrowStart
            },

            student: {
              isDeleted: false,
              OR: studentConditions
            }
          },

          select: {
            date: true,
            status: true,
            studentId: true
          }
        })
      : Promise.resolve([]),

    /*
     * Recent attendance activity
     */

    prisma.studentAttendance.findMany({
      where: {
        tenantId,
        markedById: staffId
      },

      orderBy: {
        updatedAt: 'desc'
      },

      take: 10,

      select: {
        id: true,
        date: true,
        status: true,
        updatedAt: true,

        student: {
          select: {
            studentName: true,
            class: {
              select: {
                name: true
              }
            },
            section: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })
  ]);

  /*
   * ============================================================
   * STEP 3: Today's attendance
   * ============================================================
   */

  const todayAttendanceRows =
    weeklyAttendanceRows.filter(
      (row) => {
        const rowDate =
          utcStartOfDay(
            row.date
          );

        return (
          rowDate.getTime() ===
          todayStart.getTime()
        );
      }
    );

  let todayPresent = 0;

  for (const row of todayAttendanceRows) {
    if (
      row.status === 'present' ||
      row.status === 'late'
    ) {
      todayPresent++;
    }
  }

  const todayAttendancePercentage =
    assignedStudents.length > 0
      ? Math.round(
          (todayPresent /
            assignedStudents.length) *
            100
        )
      : 0;

  /*
   * ============================================================
   * STEP 4: Attendance overview
   * ============================================================
   */

  const attendanceByDate = {};

  for (const row of weeklyAttendanceRows) {
    const key = row.date
      .toISOString()
      .slice(0, 10);

    if (!attendanceByDate[key]) {
      attendanceByDate[key] = {
        present: 0,
        absent: 0,
        late: 0
      };
    }

    if (
      row.status === 'present'
    ) {
      attendanceByDate[key]
        .present++;
    } else if (
      row.status === 'absent'
    ) {
      attendanceByDate[key]
        .absent++;
    } else if (
      row.status === 'late'
    ) {
      attendanceByDate[key]
        .late++;
    }
  }

  const attendanceOverview = [];

  for (let i = 6; i >= 0; i--) {
    const date =
      utcAddDays(
        todayStart,
        -i
      );

    const key = date
      .toISOString()
      .slice(0, 10);

    const bucket =
      attendanceByDate[key] || {
        present: 0,
        absent: 0,
        late: 0
      };

    attendanceOverview.push({
      name:
        DAY_LABELS[
          date.getUTCDay()
        ],

      date: key,

      present:
        bucket.present,

      absent:
        bucket.absent,

      late:
        bucket.late
    });
  }

  /*
   * ============================================================
   * STEP 5: UPCOMING CLASSES
   * ============================================================
   */

  const allTeacherTimetable =
    await prisma.timetable.findMany({
      where: {
        tenantId,
        staffId,
        isActive: true
      },

      include: {
        class: {
          select: {
            id: true,
            name: true
          }
        },

        section: {
          select: {
            id: true,
            name: true
          }
        },

        subject: {
          select: {
            id: true,
            name: true
          }
        },

        periodSlot: {
          select: {
            slotNo: true,
            label: true,
            startTime: true,
            endTime: true
          }
        }
      }
    });

  const currentDay =
    jsDay === 0
      ? 7
      : jsDay;

  const currentTime =
    now.getHours() * 60 +
    now.getMinutes();

  const parseTime = (time) => {
    if (!time) return 0;

    const parts =
      time
        .split(':')
        .map(Number);

    return (
      parts[0] * 60 +
      (parts[1] || 0)
    );
  };

  /*
   * Calculate how many days from today
   * each timetable entry occurs.
   */

  const upcomingClassList =
    allTeacherTimetable
      .map((item) => {
        let daysUntil =
          item.dayOfWeek -
          currentDay;

        if (daysUntil < 0) {
          daysUntil += 7;
        }

        /*
         * If the class is today but
         * already finished, move it to
         * next week's occurrence.
         */

        if (
          daysUntil === 0 &&
          parseTime(
            item.periodSlot.startTime
          ) <= currentTime
        ) {
          daysUntil = 7;
        }

        return {
          ...item,
          daysUntil
        };
      })

      .sort((a, b) => {
        if (
          a.daysUntil !==
          b.daysUntil
        ) {
          return (
            a.daysUntil -
            b.daysUntil
          );
        }

        return (
          a.periodSlot.slotNo -
          b.periodSlot.slotNo
        );
      })

      .slice(0, 5)

      .map((item) => ({
        id: item.id,

        dayOfWeek:
          item.dayOfWeek,

        period:
          item.periodSlot.label,

        slotNo:
          item.periodSlot.slotNo,

        startTime:
          item.periodSlot.startTime,

        endTime:
          item.periodSlot.endTime,

        class:
          item.class.name,

        section:
          item.section
            ? item.section.name
            : null,

        subject:
          item.subject.name,

        daysUntil:
          item.daysUntil
      }));

  /*
   * ============================================================
   * STEP 6: Pending assignments
   * ============================================================
   */

  const pendingAssignments =
    recentAssignments.filter(
      (assignment) =>
        new Date(
          assignment.dueDate
        ) >= todayStart
    ).length;

  /*
   * ============================================================
   * STEP 7: RECENT ACTIVITY
   * ============================================================
   *
   * We combine:
   *
   * 1. Assignments created
   * 2. Attendance marked
   *
   * Then sort everything by latest date.
   */

  const assignmentActivities =
    recentAssignments.map(
      (assignment) => ({
        id:
          `assignment-${assignment.id}`,

        type: 'assignment',

        title:
          'Assignment created',

        description:
          assignment.title,

        date:
          assignment.createdAt
      })
    );

  const attendanceActivities =
    recentAttendance.map(
      (attendance) => {
        const className =
          attendance.student
            ?.class?.name ||
          'Class';

        const sectionName =
          attendance.student
            ?.section?.name;

        const classText =
          sectionName
            ? `${className} - ${sectionName}`
            : className;

        return {
          id:
            `attendance-${attendance.id}`,

          type: 'attendance',

          title:
            'Attendance marked',

          description:
            `${classText} attendance marked`,

          date:
            attendance.updatedAt
        };
      }
    );

  const recentActivity = [
    ...assignmentActivities,
    ...attendanceActivities
  ]
    .sort(
      (a, b) =>
        new Date(b.date) -
        new Date(a.date)
    )
    .slice(0, 5);

  /*
   * ============================================================
   * FINAL RESPONSE
   * ============================================================
   */

  return {
    todaySchedule:
      todaySchedule.map(
        (t) => ({
          id: t.id,

          period:
            t.periodSlot.label,

          slotNo:
            t.periodSlot.slotNo,

          startTime:
            t.periodSlot.startTime,

          endTime:
            t.periodSlot.endTime,

          class:
            t.class.name,

          section:
            t.section
              ? t.section.name
              : null,

          subject:
            t.subject.name
        })
      ),

    /*
     * Dynamic upcoming classes
     */

    upcomingClasses:
      upcomingClassList,

    /*
     * Dynamic attendance
     */

    attendanceOverview,

    /*
     * Dynamic recent activity
     */

    recentActivity,

    stats: {
      classesAssigned:
        teacherTimetables.length,

      subjectsAssigned:
        activeSubjectAssignments,

      studentsAssigned:
        assignedStudents.length,

      attendanceMarkedToday,

      todayAttendancePercentage,

      pendingAssignments
    },

    upcomingExams
  };
}

module.exports = {
  getSummary,
  getTeacherSummary
};