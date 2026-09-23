const prisma = require("../../prisma/prismaClient");

/* ============================================================
   STUDENT RECORD
============================================================ */

async function getOwnStudentRecord(studentId, tenantId) {
  if (!studentId) {
    throw new Error("Student not found");
  }

  const student = await prisma.student.findFirst({
    where: {
      id: studentId,
      tenantId,
      isDeleted: false,
    },
    select: {
      id: true,
      studentName: true,
      admissionNo: true,
      photoUrl: true,
      classId: true,
      sectionId: true,
    },
  });

  if (!student) {
    throw new Error("Student not found");
  }

  return student;
}

/* ============================================================
   HELPERS
============================================================ */

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const round = (value, decimals = 2) => {
  const factor = 10 ** decimals;
  return Math.round(toNumber(value) * factor) / factor;
};

const clamp = (value, min = 0, max = 100) => {
  return Math.min(max, Math.max(min, toNumber(value)));
};

/* ============================================================
   ACADEMIC YEAR
============================================================ */

const getActiveAcademicYear = async (tenantId) => {
  let academicYear = await prisma.academicYear.findFirst({
    where: {
      tenantId,
      isActive: true,
    },
    orderBy: {
      startDate: "desc",
    },
  });

  if (!academicYear) {
    academicYear = await prisma.academicYear.findFirst({
      where: {
        tenantId,
      },
      orderBy: {
        startDate: "desc",
      },
    });
  }

  return academicYear;
};

/* ============================================================
   ATTENDANCE CALCULATION

   IMPORTANT:
   Attendance percentage is:

   PRESENT / TOTAL RECORDS * 100

   Example:

   Present = 2
   Absent  = 1
   Total   = 3

   Result = 66.67 -> 67%
============================================================ */

const calculateAttendance = (records = []) => {
  const total = records.length;

  let present = 0;
  let absent = 0;
  let late = 0;
  let halfDay = 0;

  records.forEach((record) => {
    const status = String(record?.status || "").toLowerCase();

    if (status === "present") {
      present++;
    } else if (status === "absent") {
      absent++;
    } else if (status === "late") {
      late++;
    } else if (
      status === "half_day" ||
      status === "halfday" ||
      status === "half-day"
    ) {
      halfDay++;
    }
  });

  const attendancePercentage =
    total > 0 ? round((present / total) * 100) : null;

  return {
    total,
    present,
    absent,
    late,
    halfDay,
    attendancePercentage,
  };
};

/* ============================================================
   EXAM CALCULATION
============================================================ */

const calculateExamPerformance = (marks = []) => {
  if (!marks.length) {
    return {
      examAverage: null,
      subjectAverages: [],
      examTrend: [],
    };
  }

  const validMarks = marks.filter(
    (mark) =>
      !mark?.isAbsent &&
      mark?.marksObtained !== null &&
      mark?.marksObtained !== undefined &&
      mark?.maxMarks !== null &&
      mark?.maxMarks !== undefined &&
      toNumber(mark.maxMarks) > 0
  );

  if (!validMarks.length) {
    return {
      examAverage: null,
      subjectAverages: [],
      examTrend: [],
    };
  }

  const percentages = validMarks.map((mark) => {
    return clamp(
      (toNumber(mark.marksObtained) / toNumber(mark.maxMarks)) * 100
    );
  });

  const examAverage =
    percentages.reduce((sum, value) => sum + value, 0) /
    percentages.length;

  const subjectMap = new Map();

  validMarks.forEach((mark) => {
    const subjectId = mark.subject?.id || mark.subjectId;
    const subjectName = mark.subject?.name || "Subject";

    const percentage = clamp(
      (toNumber(mark.marksObtained) / toNumber(mark.maxMarks)) * 100
    );

    if (!subjectMap.has(subjectId)) {
      subjectMap.set(subjectId, {
        id: subjectId,
        name: subjectName,
        values: [],
      });
    }

    subjectMap.get(subjectId).values.push(percentage);
  });

  const subjectAverages = Array.from(subjectMap.values()).map(
    (subject) => ({
      id: subject.id,
      name: subject.name,
      percentage: round(
        subject.values.reduce((sum, value) => sum + value, 0) /
          subject.values.length
      ),
    })
  );

  const examMap = new Map();

  validMarks.forEach((mark) => {
    const examId = mark.exam?.id || mark.examId;
    const examName = mark.exam?.name || "Assessment";
    const startDate = mark.exam?.startDate;

    const percentage = clamp(
      (toNumber(mark.marksObtained) / toNumber(mark.maxMarks)) * 100
    );

    if (!examMap.has(examId)) {
      examMap.set(examId, {
        id: examId,
        name: examName,
        startDate,
        values: [],
      });
    }

    examMap.get(examId).values.push(percentage);
  });

  const examTrend = Array.from(examMap.values())
    .sort(
      (a, b) =>
        new Date(a.startDate || 0) - new Date(b.startDate || 0)
    )
    .map((exam) => ({
      id: exam.id,
      name: exam.name,
      percentage: round(
        exam.values.reduce((sum, value) => sum + value, 0) /
          exam.values.length
      ),
    }));

  return {
    examAverage: round(examAverage),
    subjectAverages,
    examTrend,
  };
};

/* ============================================================
   ASSIGNMENT CALCULATION
============================================================ */

const calculateAssignments = (assignments = []) => {
  const total = assignments.length;

  let completed = 0;
  let pending = 0;
  let graded = 0;

  const grades = [];

  assignments.forEach((assignment) => {
    const submission =
      assignment?.AssignmentSubmission?.[0] ||
      assignment?.submission ||
      null;

    if (submission) {
      completed++;

      const status = String(submission.status || "").toLowerCase();

      if (
        submission.grade !== null &&
        submission.grade !== undefined &&
        submission.grade !== ""
      ) {
        graded++;

        const grade = toNumber(submission.grade);
        const maxMarks = toNumber(assignment.maxMarks);

        if (maxMarks > 0) {
          grades.push(clamp((grade / maxMarks) * 100));
        }
      }

      if (status === "pending") {
        pending++;
      }
    } else {
      pending++;
    }
  });

  const completionPercentage =
    total > 0 ? round((completed / total) * 100) : null;

  const averageGrade =
    grades.length > 0
      ? round(
          grades.reduce((sum, value) => sum + value, 0) /
            grades.length
        )
      : null;

  return {
    total,
    completed,
    pending,
    graded,
    completionPercentage,
    averageGrade,
  };
};

/* ============================================================
   TREND
============================================================ */

const calculateTrend = (examTrend = []) => {
  if (examTrend.length < 2) {
    return {
      direction: "stable",
      change: 0,
      points: examTrend,
    };
  }

  const previous = examTrend[examTrend.length - 2];
  const latest = examTrend[examTrend.length - 1];

  const change = round(
    toNumber(latest.percentage) -
      toNumber(previous.percentage)
  );

  let direction = "stable";

  if (change > 5) {
    direction = "improving";
  } else if (change < -5) {
    direction = "declining";
  }

  return {
    direction,
    change,
    points: examTrend,
  };
};

/* ============================================================
   OVERALL PERFORMANCE
============================================================ */

const calculatePerformanceScore = ({
  examAverage,
  attendancePercentage,
  assignmentCompletion,
}) => {
  const values = [];

  if (examAverage !== null && examAverage !== undefined) {
    values.push({
      value: clamp(examAverage),
      weight: 0.6,
    });
  }

  if (
    attendancePercentage !== null &&
    attendancePercentage !== undefined
  ) {
    values.push({
      value: clamp(attendancePercentage),
      weight: 0.25,
    });
  }

  if (
    assignmentCompletion !== null &&
    assignmentCompletion !== undefined
  ) {
    values.push({
      value: clamp(assignmentCompletion),
      weight: 0.15,
    });
  }

  if (!values.length) {
    return null;
  }

  const totalWeight = values.reduce(
    (sum, item) => sum + item.weight,
    0
  );

  const score =
    values.reduce(
      (sum, item) => sum + item.value * item.weight,
      0
    ) / totalWeight;

  return round(clamp(score));
};

/* ============================================================
   PERFORMANCE CATEGORY
============================================================ */

const getPerformanceCategory = (score) => {
  if (score === null || score === undefined) {
    return {
      category: "no-data",
      label: "No Data Available",
    };
  }

  if (score >= 85) {
    return {
      category: "excellent",
      label: "Excellent",
    };
  }

  if (score >= 75) {
    return {
      category: "very-good",
      label: "Very Good",
    };
  }

  if (score >= 60) {
    return {
      category: "good",
      label: "Good",
    };
  }

  if (score >= 40) {
    return {
      category: "average",
      label: "Average",
    };
  }

  return {
    category: "needs-attention",
    label: "Needs Attention",
  };
};

/* ============================================================
   CONFIDENCE
============================================================ */

const calculateConfidence = ({
  marksCount,
  attendanceDays,
  assignmentsTotal,
}) => {
  let confidence = 25;

  confidence += Math.min(
    40,
    toNumber(marksCount) * 5
  );

  confidence += Math.min(
    20,
    toNumber(attendanceDays) * 0.4
  );

  confidence += Math.min(
    15,
    toNumber(assignmentsTotal) * 3
  );

  return Math.round(
    Math.min(100, confidence)
  );
};

/* ============================================================
   INSIGHTS
============================================================ */

const buildInsights = ({
  examAverage,
  attendancePercentage,
  assignmentCompletion,
  subjectAverages,
  trend,
}) => {
  const strengths = [];
  const focusAreas = [];
  const recommendations = [];

  if (
    examAverage !== null &&
    examAverage >= 75
  ) {
    strengths.push(
      `Assessment performance is currently ${Math.round(
        examAverage
      )}%.`
    );
  }

  if (
    attendancePercentage !== null &&
    attendancePercentage >= 75
  ) {
    strengths.push(
      `Attendance is currently ${Math.round(
        attendancePercentage
      )}%.`
    );
  }

  if (
    assignmentCompletion !== null &&
    assignmentCompletion >= 75
  ) {
    strengths.push(
      `Assignment completion is currently ${Math.round(
        assignmentCompletion
      )}%.`
    );
  }

  if (trend?.direction === "improving") {
    strengths.push(
      "Recent assessment performance is showing an improving trend."
    );
  }

  if (
    attendancePercentage !== null &&
    attendancePercentage < 75
  ) {
    focusAreas.push(
      `Attendance is currently ${Math.round(
        attendancePercentage
      )}%, so regular attendance can help improve academic consistency.`
    );

    recommendations.push({
      title: "Improve attendance consistency",
      description:
        "Attend classes regularly and avoid unnecessary absences.",
    });
  }

  if (
    assignmentCompletion !== null &&
    assignmentCompletion < 75
  ) {
    focusAreas.push(
      `Assignment completion is currently ${Math.round(
        assignmentCompletion
      )}%.`
    );

    recommendations.push({
      title: "Complete pending assignments",
      description:
        "Submit pending assignments on time to improve academic consistency.",
    });
  }

  if (
    examAverage !== null &&
    examAverage < 60
  ) {
    focusAreas.push(
      `Assessment performance is currently ${Math.round(
        examAverage
      )}%.`
    );

    recommendations.push({
      title: "Focus on assessment preparation",
      description:
        "Review weaker topics and practise regularly before upcoming assessments.",
    });
  }

  if (
    Array.isArray(subjectAverages) &&
    subjectAverages.length
  ) {
    const weakest = [...subjectAverages].sort(
      (a, b) => a.percentage - b.percentage
    )[0];

    if (
      weakest &&
      weakest.percentage < 60
    ) {
      focusAreas.push(
        `${weakest.name} currently has the lowest available subject performance at ${Math.round(
          weakest.percentage
        )}%.`
      );
    }
  }

  if (!recommendations.length) {
    recommendations.push({
      title: "Continue your current routine",
      description:
        "Keep maintaining your attendance, assignment completion and assessment preparation.",
    });
  }

  return {
    strengths,
    focusAreas,
    recommendations,
  };
};

/* ============================================================
   STUDENT PERFORMANCE
============================================================ */

const getStudentPerformance = async (
  studentId,
  tenantId
) => {
  const student = await getOwnStudentRecord(
    studentId,
    tenantId
  );

  const academicYear = await getActiveAcademicYear(
    tenantId
  );

  if (!academicYear) {
    return {
      student,
      academicYear: null,

      performance: {
        score: null,
        category: "no-data",
        label: "No Data Available",
      },

      prediction: {
        score: null,
        category: "no-data",
        label: "No Data Available",
        confidence: 0,
      },

      metrics: {
        examAverage: null,
        attendancePercentage: null,
        assignmentCompletion: null,
        overallScore: null,
        subjectsCount: 0,
        examinations: 0,
        marks: 0,
        attendanceDays: 0,
        assignments: 0,
        assignmentsSubmitted: 0,
        assignmentsPending: 0,
      },

      attendance: {
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        halfDay: 0,
        percentage: null,
        attendancePercentage: null,
        records: [],
      },

      exams: [],
      subjects: [],

      assignments: {
        total: 0,
        submitted: 0,
        pending: 0,
        completionPercentage: null,
        records: [],
      },

      trend: {
        direction: "stable",
        change: 0,
        points: [],
      },

      explanation: {
        strengths: [],
        focusAreas: [],
      },

      recommendations: [],
      generatedAt: new Date().toISOString(),
    };
  }

  /* ==========================================================
     ATTENDANCE

     IMPORTANT FIX:
     Do NOT force academicYearId here.

     The Attendance module gets the student's attendance
     records using studentId + tenantId.

     Performance now uses the same records.
  ========================================================== */

  const attendanceRecords =
    await prisma.studentAttendance.findMany({
      where: {
        studentId,
        tenantId,
      },

      orderBy: {
        date: "asc",
      },

      select: {
        id: true,
        date: true,
        status: true,
        remark: true,
        academicYearId: true,
      },
    });

  const attendance = calculateAttendance(
    attendanceRecords
  );

  /* ==========================================================
     EXAM MARKS
  ========================================================== */

  const allMarks =
    await prisma.examMark.findMany({
      where: {
        studentId,
        tenantId,

        exam: {
          academicYearId: academicYear.id,
          isActive: true,
        },
      },

      select: {
        id: true,
        examId: true,
        subjectId: true,
        marksObtained: true,
        maxMarks: true,
        isAbsent: true,
        grade: true,
        gradePoint: true,

        exam: {
          select: {
            id: true,
            name: true,
            examType: true,
            startDate: true,
          },
        },

        subject: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },

      orderBy: {
        exam: {
          startDate: "asc",
        },
      },
    });

  /* ==========================================================
     PUBLISHED RESULTS
  ========================================================== */

  const publications =
    await prisma.resultPublication.findMany({
      where: {
        tenantId,
        classId: student.classId,
        isPublished: true,
        examId: {
          not: null,
        },
      },

      select: {
        examId: true,
      },
    });

  const publishedExamIds = new Set(
    publications.map(
      (item) => item.examId
    )
  );

  const visibleMarks =
    publications.length > 0
      ? allMarks.filter(
          (mark) =>
            publishedExamIds.has(
              mark.examId
            )
        )
      : allMarks;

  /* ==========================================================
     EXAM SUMMARY
  ========================================================== */

  const examCalculation =
    calculateExamPerformance(
      visibleMarks
    );

  const examAverage =
    examCalculation.examAverage;

  const subjectAverages =
    examCalculation.subjectAverages;

  const examTrend =
    examCalculation.examTrend;

  /* ==========================================================
     EXAM DISPLAY DATA
  ========================================================== */

  const examMap = new Map();

  visibleMarks.forEach((mark) => {
    const examId =
      mark.exam?.id ||
      mark.examId;

    if (!examMap.has(examId)) {
      examMap.set(examId, {
        id: examId,
        name:
          mark.exam?.name ||
          "Assessment",
        examType:
          mark.exam?.examType ||
          null,
        startDate:
          mark.exam?.startDate ||
          null,
        subjects: [],
      });
    }

    const percentage =
      !mark.isAbsent &&
      toNumber(mark.maxMarks) > 0
        ? round(
            (toNumber(
              mark.marksObtained
            ) /
              toNumber(
                mark.maxMarks
              )) *
              100
          )
        : null;

    examMap
      .get(examId)
      .subjects.push({
        subjectId:
          mark.subject?.id ||
          mark.subjectId,

        subjectName:
          mark.subject?.name ||
          "Subject",

        code:
          mark.subject?.code ||
          null,

        marksObtained:
          mark.marksObtained,

        maxMarks:
          mark.maxMarks,

        percentage,

        grade:
          mark.grade,

        gradePoint:
          mark.gradePoint,

        isAbsent:
          Boolean(mark.isAbsent),
      });
  });

  const exams =
    Array.from(
      examMap.values()
    ).map((exam) => {
      const validSubjects =
        exam.subjects.filter(
          (item) =>
            item.percentage !==
              null &&
            !item.isAbsent
        );

      const percentage =
        validSubjects.length
          ? round(
              validSubjects.reduce(
                (sum, item) =>
                  sum +
                  item.percentage,
                0
              ) /
                validSubjects.length
            )
          : null;

      return {
        ...exam,
        percentage,
      };
    });

  /* ==========================================================
     ASSIGNMENTS
  ========================================================== */

  const assignments =
    await prisma.assignment.findMany({
      where: {
        tenantId,
        classId:
          student.classId,
        isActive: true,

        OR: [
          {
            sectionId:
              student.sectionId,
          },
          {
            sectionId: null,
          },
        ],

        dueDate: {
          gte:
            academicYear.startDate,
          lte:
            academicYear.endDate,
        },
      },

      include: {
        AssignmentSubmission: {
          where: {
            studentId,
          },

          select: {
            id: true,
            status: true,
            grade: true,
            feedback: true,
            submittedAt: true,
            content: true,
            attachmentUrl: true,
          },
        },
      },

      orderBy: {
        dueDate: "asc",
      },
    });

  const assignmentCalculation =
    calculateAssignments(
      assignments
    );

  /* ==========================================================
     OVERALL SCORE
  ========================================================== */

  const overallScore =
    calculatePerformanceScore({
      examAverage,

      attendancePercentage:
        attendance.attendancePercentage,

      assignmentCompletion:
        assignmentCalculation.completionPercentage,
    });

  const category =
    getPerformanceCategory(
      overallScore
    );

  const confidence =
    calculateConfidence({
      marksCount:
        visibleMarks.length,

      attendanceDays:
        attendance.total,

      assignmentsTotal:
        assignmentCalculation.total,
    });

  /* ==========================================================
     TREND
  ========================================================== */

  const trend =
    calculateTrend(
      examTrend
    );

  /* ==========================================================
     SUBJECTS
  ========================================================== */

  const subjects =
    subjectAverages.map(
      (subject) => ({
        id: subject.id,
        name: subject.name,
        percentage:
          subject.percentage,
      })
    );

  /* ==========================================================
     INSIGHTS
  ========================================================== */

  const insights =
    buildInsights({
      examAverage,

      attendancePercentage:
        attendance.attendancePercentage,

      assignmentCompletion:
        assignmentCalculation.completionPercentage,

      subjectAverages,

      trend,
    });

  /* ==========================================================
     ASSIGNMENT DISPLAY DATA
  ========================================================== */

  const assignmentRecords =
    assignments.map(
      (assignment) => {
        const submission =
          assignment
            .AssignmentSubmission?.[0] ||
          null;

        return {
          id:
            assignment.id,

          title:
            assignment.title,

          description:
            assignment.description,

          dueDate:
            assignment.dueDate,

          maxMarks:
            assignment.maxMarks,

          attachmentUrl:
            assignment.attachmentUrl,

          submission,
        };
      }
    );

  /* ==========================================================
     FINAL RESPONSE
  ========================================================== */

  return {
    student: {
      id: student.id,

      studentName:
        student.studentName,

      admissionNo:
        student.admissionNo,

      photoUrl:
        student.photoUrl,

      classId:
        student.classId,

      sectionId:
        student.sectionId,
    },

    academicYear: {
      id: academicYear.id,
      name: academicYear.name,
      startDate:
        academicYear.startDate,
      endDate:
        academicYear.endDate,
    },

    performance: {
      score: overallScore,
      category:
        category.category,
      label:
        category.label,
      confidence,
    },

    prediction: {
      score: overallScore,
      category:
        category.category,
      label:
        category.label,
      confidence,

      dataPoints: {
        exams:
          visibleMarks.length,

        attendance:
          attendance.total,

        assignments:
          assignmentCalculation.total,
      },
    },

    metrics: {
      examAverage,

      /* FIXED ATTENDANCE VALUE */
      attendancePercentage:
        attendance.attendancePercentage,

      assignmentCompletion:
        assignmentCalculation.completionPercentage,

      overallScore,

      subjectsCount:
        subjects.length,

      examinations:
        exams.length,

      marks:
        visibleMarks.length,

      attendanceDays:
        attendance.total,

      assignments:
        assignmentCalculation.total,

      assignmentsSubmitted:
        assignmentCalculation.completed,

      assignmentsPending:
        assignmentCalculation.pending,

      assignmentAverageGrade:
        assignmentCalculation.averageGrade,
    },

    attendance: {
      total:
        attendance.total,

      present:
        attendance.present,

      absent:
        attendance.absent,

      late:
        attendance.late,

      halfDay:
        attendance.halfDay,

      percentage:
        attendance.attendancePercentage,

      attendancePercentage:
        attendance.attendancePercentage,

      records:
        attendanceRecords,
    },

    exams,

    subjects,

    assignments: {
      total:
        assignmentCalculation.total,

      submitted:
        assignmentCalculation.completed,

      pending:
        assignmentCalculation.pending,

      completionPercentage:
        assignmentCalculation.completionPercentage,

      averageGrade:
        assignmentCalculation.averageGrade,

      records:
        assignmentRecords,
    },

    trend,

    explanation: {
      strengths:
        insights.strengths,

      focusAreas:
        insights.focusAreas,
    },

    recommendations:
      insights.recommendations,

    generatedAt:
      new Date().toISOString(),
  };
};

/* ============================================================
   MY PROFILE
============================================================ */

const getMyProfile = async (
  studentId,
  tenantId
) => {
  await getOwnStudentRecord(
    studentId,
    tenantId
  );

  const student =
    await prisma.student.findFirst({
      where: {
        id: studentId,
        tenantId,
        isDeleted: false,
      },

      include: {
        class: {
          select: {
            id: true,
            name: true,
          },
        },

        section: {
          select: {
            id: true,
            name: true,

            classTeacher: {
              select: {
                id: true,
                name: true,
                employeeId: true,
              },
            },
          },
        },

        parents: {
          select: {
            id: true,
            relation: true,
            name: true,
            mobile: true,
            email: true,
          },
        },
      },
    });

  return student;
};

/* ============================================================
   MY ATTENDANCE
============================================================ */

const getMyAttendance = async (
  studentId,
  tenantId,
  query = {}
) => {
  await getOwnStudentRecord(
    studentId,
    tenantId
  );

  const {
    month,
    year,
    academicYearId,
  } = query;

  const where = {
    studentId,
    tenantId,
  };

  if (month && year) {
    const start = new Date(
      Date.UTC(
        parseInt(year),
        parseInt(month) - 1,
        1
      )
    );

    const end = new Date(
      Date.UTC(
        parseInt(year),
        parseInt(month),
        1
      )
    );

    where.date = {
      gte: start,
      lt: end,
    };
  }

  if (academicYearId) {
    where.academicYearId =
      parseInt(
        academicYearId
      );
  }

  const records =
    await prisma.studentAttendance.findMany({
      where,

      orderBy: {
        date: "desc",
      },

      select: {
        id: true,
        date: true,
        status: true,
        remark: true,
        academicYearId: true,
      },
    });

  const summary =
    records.reduce(
      (acc, record) => {
        const status =
          String(
            record.status || ""
          ).toLowerCase();

        acc[status] =
          (acc[status] || 0) + 1;

        acc.total++;

        return acc;
      },
      {
        total: 0,
      }
    );

  const attendance =
    calculateAttendance(
      records
    );

  return {
    records,

    summary: {
      ...summary,

      total:
        attendance.total,

      present:
        attendance.present,

      absent:
        attendance.absent,

      late:
        attendance.late,

      halfDay:
        attendance.halfDay,

      attendancePercentage:
        attendance.attendancePercentage,

      percentage:
        attendance.attendancePercentage,
    },
  };
};

/* ============================================================
   MY EXAM MARKS
============================================================ */

const getMyExamMarks = async (
  studentId,
  tenantId,
  query = {}
) => {
  const student =
    await getOwnStudentRecord(
      studentId,
      tenantId
    );

  const { examId } =
    query;

  const where = {
    studentId,
    tenantId,
  };

  if (examId) {
    where.examId =
      parseInt(examId);
  }

  const marks =
    await prisma.examMark.findMany({
      where,

      include: {
        exam: {
          select: {
            id: true,
            name: true,
            examType: true,
            startDate: true,
          },
        },

        subject: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },

      orderBy: {
        exam: {
          startDate: "desc",
        },
      },
    });

  const publishedExamIds =
    new Set(
      (
        await prisma.resultPublication.findMany({
          where: {
            tenantId,

            classId:
              student.classId,

            isPublished: true,

            examId: {
              not: null,
            },
          },

          select: {
            examId: true,
          },
        })
      ).map(
        (record) =>
          record.examId
      )
    );

  if (
    publishedExamIds.size ===
    0
  ) {
    return marks;
  }

  return marks.filter(
    (mark) =>
      publishedExamIds.has(
        mark.examId
      )
  );
};

/* ============================================================
   STUDENT TIMETABLE
============================================================ */

const getMyTimetable = async (
  studentId,
  tenantId
) => {
  const student =
    await getOwnStudentRecord(
      studentId,
      tenantId
    );

  const timetable =
    await prisma.timetable.findMany({
      where: {
        tenantId,

        classId:
          student.classId,

        isActive: true,

        OR: [
          {
            sectionId:
              student.sectionId,
          },
          {
            sectionId: null,
          },
        ],
      },

      include: {
        subject: {
          select: {
            id: true,
            name: true,
          },
        },

        staff: {
          select: {
            id: true,
            name: true,
          },
        },

        periodSlot: {
          select: {
            slotNo: true,
            label: true,
            startTime: true,
            endTime: true,
          },
        },

        section: {
          select: {
            id: true,
            name: true,

            classTeacher: {
              select: {
                id: true,
                name: true,
                employeeId: true,
              },
            },
          },
        },
      },

      orderBy: [
        {
          dayOfWeek:
            "asc",
        },

        {
          periodSlot: {
            slotNo: "asc",
          },
        },
      ],
    });

  return timetable;
};

/* ============================================================
   MY FEES
============================================================ */

const getMyFees = async (
  studentId,
  tenantId
) => {
  const student =
    await getOwnStudentRecord(
      studentId,
      tenantId
    );

  const collections =
    await prisma.feeCollection.findMany({
      where: {
        studentId,
        tenantId,
      },

      include: {
        feeStructure: {
          include: {
            feeCategory: {
              select: {
                name: true,
              },
            },
          },
        },
      },

      orderBy: {
        paymentDate:
          "desc",
      },
    });

  const structures =
    await prisma.feeStructure.findMany({
      where: {
        tenantId,

        classId:
          student.classId,

        isActive: true,
      },

      include: {
        feeCategory: {
          select: {
            name: true,
          },
        },
      },
    });

  const totalDue =
    structures.reduce(
      (sum, structure) =>
        sum +
        Number(
          structure.amount
        ),
      0
    );

  const totalPaid =
    collections.reduce(
      (sum, collection) =>
        sum +
        Number(
          collection.netAmount
        ),
      0
    );

  return {
    totalDue,

    totalPaid,

    balance:
      Math.max(
        totalDue -
          totalPaid,
        0
      ),

    structures,

    collections,
  };
};

/* ============================================================
   MY ASSIGNMENTS
============================================================ */

const getMyAssignments = async (
  studentId,
  tenantId
) => {
  const student =
    await getOwnStudentRecord(
      studentId,
      tenantId
    );

  const assignments =
    await prisma.assignment.findMany({
      where: {
        tenantId,

        classId:
          student.classId,

        isActive: true,

        OR: [
          {
            sectionId:
              student.sectionId,
          },
          {
            sectionId: null,
          },
        ],
      },

      include: {
        AssignmentSubmission: {
          where: {
            studentId,
          },

          select: {
            id: true,
            status: true,
            grade: true,
            feedback: true,
            submittedAt: true,
            content: true,
            attachmentUrl: true,
          },
        },
      },

      orderBy: {
        dueDate:
          "desc",
      },
    });

  return assignments.map(
    (assignment) => ({
      id:
        assignment.id,

      title:
        assignment.title,

      description:
        assignment.description,

      dueDate:
        assignment.dueDate,

      maxMarks:
        assignment.maxMarks,

      attachmentUrl:
        assignment.attachmentUrl,

      submission:
        assignment
          .AssignmentSubmission?.[0] ||
        null,
    })
  );
};

/* ============================================================
   SUBMIT ASSIGNMENT
============================================================ */

const submitAssignment = async (
  studentId,
  tenantId,
  assignmentId,
  data
) => {
  const student =
    await getOwnStudentRecord(
      studentId,
      tenantId
    );

  const assignment =
    await prisma.assignment.findFirst({
      where: {
        id: parseInt(
          assignmentId
        ),

        tenantId,

        classId:
          student.classId,

        isActive: true,

        OR: [
          {
            sectionId:
              student.sectionId,
          },
          {
            sectionId: null,
          },
        ],
      },
    });

  if (!assignment) {
    throw new Error(
      "Assignment not found"
    );
  }

  const {
    content,
    attachmentUrl,
  } = data;

  const now = new Date();

  const status =
    now >
    new Date(
      assignment.dueDate
    )
      ? "late"
      : "submitted";

  const submission =
    await prisma.assignmentSubmission.upsert({
      where: {
        tenantId_assignmentId_studentId:
          {
            tenantId,
            assignmentId:
              assignment.id,
            studentId,
          },
      },

      update: {
        content,
        attachmentUrl,
        status,
        submittedAt: now,
      },

      create: {
        tenantId,
        assignmentId:
          assignment.id,
        studentId,
        content,
        attachmentUrl,
        status,
        submittedAt: now,
      },
    });

  return submission;
};

/* ============================================================
   MY CALENDAR
============================================================ */

const getMyCalendar = async (
  studentId,
  tenantId,
  query = {}
) => {
  const student =
    await getOwnStudentRecord(
      studentId,
      tenantId
    );

  const {
    month,
    year,
  } = query;

  let rangeStart;
  let rangeEnd;

  if (month && year) {
    rangeStart = new Date(
      Date.UTC(
        parseInt(year),
        parseInt(month) - 1,
        1
      )
    );

    rangeEnd = new Date(
      Date.UTC(
        parseInt(year),
        parseInt(month),
        1
      )
    );
  } else {
    const now =
      new Date();

    rangeStart = new Date(
      Date.UTC(
        now.getFullYear(),
        now.getMonth(),
        1
      )
    );

    rangeEnd = new Date(
      Date.UTC(
        now.getFullYear(),
        now.getMonth() + 1,
        1
      )
    );
  }

  const [
    holidays,
    exams,
    assignments,
  ] = await Promise.all([
    prisma.holiday.findMany({
      where: {
        tenantId,

        date: {
          gte: rangeStart,
          lt: rangeEnd,
        },
      },

      select: {
        id: true,
        name: true,
        date: true,
        holidayType: true,
      },
    }),

    prisma.exam.findMany({
      where: {
        tenantId,

        isActive: true,

        classId:
          student.classId,

        startDate: {
          gte: rangeStart,
          lt: rangeEnd,
        },
      },

      select: {
        id: true,
        name: true,
        examType: true,
        startDate: true,
        endDate: true,
      },
    }),

    prisma.assignment.findMany({
      where: {
        tenantId,

        classId:
          student.classId,

        isActive: true,

        OR: [
          {
            sectionId:
              student.sectionId,
          },
          {
            sectionId: null,
          },
        ],

        dueDate: {
          gte: rangeStart,
          lt: rangeEnd,
        },
      },

      select: {
        id: true,
        title: true,
        dueDate: true,
      },
    }),
  ]);

  const events = [
    ...holidays.map(
      (holiday) => ({
        id:
          `holiday-${holiday.id}`,
        type: "holiday",
        title:
          holiday.name,
        date:
          holiday.date,

        meta: {
          holidayType:
            holiday.holidayType,
        },
      })
    ),

    ...exams.map(
      (exam) => ({
        id:
          `exam-${exam.id}`,
        type: "exam",
        title:
          exam.name,
        date:
          exam.startDate,
        endDate:
          exam.endDate,

        meta: {
          examType:
            exam.examType,
        },
      })
    ),

    ...assignments.map(
      (assignment) => ({
        id:
          `assignment-${assignment.id}`,
        type: "assignment",
        title:
          assignment.title,
        date:
          assignment.dueDate,

        meta: {},
      })
    ),
  ].sort(
    (a, b) =>
      new Date(a.date) -
      new Date(b.date)
  );

  return {
    rangeStart,
    rangeEnd,
    events,
  };
};

/* ============================================================
   EXPORTS
============================================================ */

module.exports = {
  getStudentPerformance,
  getMyProfile,
  getMyAttendance,
  getMyExamMarks,
  getMyTimetable,
  getMyFees,
  getMyAssignments,
  submitAssignment,
  getMyCalendar,
};