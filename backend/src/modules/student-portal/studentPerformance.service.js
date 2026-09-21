const prisma = require("../../prisma/prismaClient");

/* ============================================================
   HELPERS
============================================================ */

const toNumber = (value, fallback = 0) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
};

const round = (value, decimals = 1) => {
  const factor = 10 ** decimals;

  return (
    Math.round(toNumber(value) * factor) /
    factor
  );
};

const clamp = (
  value,
  min = 0,
  max = 100
) => {
  return Math.min(
    max,
    Math.max(
      min,
      toNumber(value)
    )
  );
};

/* ============================================================
   ACADEMIC YEAR
============================================================ */

const getCurrentAcademicYear = async (
  tenantId
) => {
  const years =
    await prisma.academicYear.findMany({
      where: {
        tenantId,
        isDeleted: false,
      },

      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        isActive: true,
      },

      orderBy: [
        {
          isActive: "desc",
        },
        {
          startDate: "desc",
        },
      ],
    });

  return (
    years.find(
      (year) => year.isActive
    ) || years[0] || null
  );
};

/* ============================================================
   ATTENDANCE CALCULATION
============================================================ */

const calculateAttendance = (
  records
) => {
  if (!records.length) {
    return {
      percentage: null,
      totalDays: 0,
      presentDays: 0,
      absentDays: 0,
      lateDays: 0,
      halfDays: 0,
    };
  }

  let presentDays = 0;
  let absentDays = 0;
  let lateDays = 0;
  let halfDays = 0;

  records.forEach((record) => {
    const status =
      String(
        record.status || ""
      ).toLowerCase();

    if (status === "present") {
      presentDays++;
    } else if (
      status === "absent"
    ) {
      absentDays++;
    } else if (
      status === "late"
    ) {
      lateDays++;
    } else if (
      status === "half_day" ||
      status === "half-day"
    ) {
      halfDays++;
    }
  });

  const totalDays =
    presentDays +
    absentDays +
    lateDays +
    halfDays;

  if (!totalDays) {
    return {
      percentage: null,
      totalDays: 0,
      presentDays: 0,
      absentDays: 0,
      lateDays: 0,
      halfDays: 0,
    };
  }

  const effectivePresent =
    presentDays +
    lateDays +
    halfDays * 0.5;

  return {
    percentage: round(
      (effectivePresent /
        totalDays) *
        100
    ),

    totalDays,
    presentDays,
    absentDays,
    lateDays,
    halfDays,
  };
};

/* ============================================================
   EXAM PERFORMANCE
============================================================ */

const calculateExamPerformance = (
  marks
) => {
  let totalObtained = 0;
  let totalMaximum = 0;

  const subjectMap =
    new Map();

  const examMap =
    new Map();

  for (const mark of marks) {
    if (mark.isAbsent) {
      continue;
    }

    if (
      mark.marksObtained ===
        null ||
      mark.marksObtained ===
        undefined
    ) {
      continue;
    }

    const maximum =
      toNumber(
        mark.maxMarks
      );

    if (maximum <= 0) {
      continue;
    }

    const obtained =
      toNumber(
        mark.marksObtained
      );

    totalObtained += obtained;
    totalMaximum += maximum;

    /* --------------------------------------------------------
       SUBJECT
    -------------------------------------------------------- */

    if (mark.subject?.id) {
      const subjectId =
        mark.subject.id;

      if (
        !subjectMap.has(
          subjectId
        )
      ) {
        subjectMap.set(
          subjectId,
          {
            id: subjectId,

            name:
              mark.subject.name ||
              "Subject",

            code:
              mark.subject.code ||
              "",

            obtained: 0,
            maximum: 0,
          }
        );
      }

      const subject =
        subjectMap.get(
          subjectId
        );

      subject.obtained += obtained;
      subject.maximum += maximum;
    }

    /* --------------------------------------------------------
       EXAM
    -------------------------------------------------------- */

    if (mark.exam?.id) {
      const examId =
        mark.exam.id;

      if (
        !examMap.has(examId)
      ) {
        examMap.set(
          examId,
          {
            id: examId,

            name:
              mark.exam.name ||
              "Assessment",

            date:
              mark.exam.startDate ||
              null,

            obtained: 0,
            maximum: 0,
          }
        );
      }

      const exam =
        examMap.get(examId);

      exam.obtained += obtained;
      exam.maximum += maximum;
    }
  }

  const average =
    totalMaximum > 0
      ? round(
          (totalObtained /
            totalMaximum) *
            100
        )
      : null;

  const subjectAverages =
    Array.from(
      subjectMap.values()
    )
      .map((subject) => ({
        id: subject.id,

        name: subject.name,

        code: subject.code,

        percentage:
          subject.maximum > 0
            ? round(
                (subject.obtained /
                  subject.maximum) *
                  100
              )
            : 0,
      }))
      .sort(
        (a, b) =>
          b.percentage -
          a.percentage
      );

  const examTrend =
    Array.from(
      examMap.values()
    )
      .map((exam) => ({
        id: exam.id,

        name: exam.name,

        date: exam.date,

        percentage:
          exam.maximum > 0
            ? round(
                (exam.obtained /
                  exam.maximum) *
                  100
              )
            : 0,
      }))
      .sort((a, b) => {
        const first =
          new Date(
            a.date || 0
          ).getTime();

        const second =
          new Date(
            b.date || 0
          ).getTime();

        return first - second;
      });

  return {
    average,

    examsCount:
      examMap.size,

    marksCount:
      marks.length,

    subjectAverages,

    examTrend,
  };
};

/* ============================================================
   ASSIGNMENTS
============================================================ */

const calculateAssignments = (
  assignments
) => {
  const total =
    assignments.length;

  if (!total) {
    return {
      total: 0,
      completed: 0,
      pending: 0,
      graded: 0,
      completionPercentage: null,
      averageGrade: null,
    };
  }

  let completed = 0;
  let graded = 0;
  let gradeTotal = 0;

  assignments.forEach(
    (assignment) => {
      const submission =
        assignment
          .AssignmentSubmission?.[0];

      if (!submission) {
        return;
      }

      const status =
        String(
          submission.status || ""
        ).toLowerCase();

      if (
        [
          "submitted",
          "late",
          "graded",
          "completed",
        ].includes(status)
      ) {
        completed++;
      }

      if (
        status === "graded" &&
        submission.grade !== null &&
        submission.grade !==
          undefined
      ) {
        graded++;

        gradeTotal +=
          toNumber(
            submission.grade
          );
      }
    }
  );

  return {
    total,

    completed,

    pending: Math.max(
      total - completed,
      0
    ),

    graded,

    completionPercentage:
      round(
        (completed / total) *
          100
      ),

    averageGrade:
      graded > 0
        ? round(
            gradeTotal /
              graded
          )
        : null,
  };
};

/* ============================================================
   PERFORMANCE TREND
============================================================ */

const calculateTrend = (
  examTrend
) => {
  if (
    examTrend.length < 2
  ) {
    return {
      direction: "stable",
      change: 0,
    };
  }

  const first =
    examTrend[0].percentage;

  const latest =
    examTrend[
      examTrend.length - 1
    ].percentage;

  const change =
    round(
      latest - first
    );

  if (change >= 5) {
    return {
      direction: "improving",
      change,
    };
  }

  if (change <= -5) {
    return {
      direction: "declining",
      change,
    };
  }

  return {
    direction: "stable",
    change,
  };
};

/* ============================================================
   OVERALL SCORE
============================================================ */

const calculatePerformanceScore = ({
  examAverage,
  attendancePercentage,
  assignmentCompletion,
}) => {
  const values = [];

  if (
    examAverage !== null &&
    examAverage !== undefined
  ) {
    values.push({
      value: clamp(
        examAverage
      ),
      weight: 0.6,
    });
  }

  if (
    attendancePercentage !== null &&
    attendancePercentage !==
      undefined
  ) {
    values.push({
      value: clamp(
        attendancePercentage
      ),
      weight: 0.25,
    });
  }

  if (
    assignmentCompletion !== null &&
    assignmentCompletion !==
      undefined
  ) {
    values.push({
      value: clamp(
        assignmentCompletion
      ),
      weight: 0.15,
    });
  }

  if (!values.length) {
    return null;
  }

  const totalWeight =
    values.reduce(
      (sum, item) =>
        sum + item.weight,
      0
    );

  const score =
    values.reduce(
      (sum, item) =>
        sum +
        item.value *
          item.weight,
      0
    ) / totalWeight;

  return round(
    clamp(score)
  );
};

/* ============================================================
   STATUS
============================================================ */

const getStatus = (
  score
) => {
  if (score === null) {
    return {
      key: "not_available",
      label: "Not available",
    };
  }

  if (score >= 80) {
    return {
      key: "strong_progress",
      label: "Strong progress",
    };
  }

  if (score >= 60) {
    return {
      key: "progressing",
      label: "Progressing",
    };
  }

  return {
    key: "needs_attention",
    label: "Needs attention",
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
  let confidence = 0;

  if (marksCount > 0) {
    confidence += 40;
  }

  if (attendanceDays > 0) {
    confidence += 30;
  }

  if (assignmentsTotal > 0) {
    confidence += 30;
  }

  return confidence;
};

/* ============================================================
   INSIGHTS
============================================================ */

const buildInsights = ({
  examAverage,
  attendancePercentage,
  assignmentCompletion,
  subjects,
  trend,
}) => {
  const strengths = [];
  const focusAreas = [];

  if (
    examAverage !== null &&
    examAverage >= 75
  ) {
    strengths.push(
      "Assessment performance is showing a good academic foundation."
    );
  }

  if (
    attendancePercentage !== null &&
    attendancePercentage >= 85
  ) {
    strengths.push(
      "Attendance is consistent and supports regular classroom participation."
    );
  }

  if (
    assignmentCompletion !== null &&
    assignmentCompletion >= 85
  ) {
    strengths.push(
      "Assignment completion is consistent."
    );
  }

  const strongSubjects =
    subjects
      .filter(
        (subject) =>
          subject.percentage >= 75
      )
      .slice(0, 2);

  strongSubjects.forEach(
    (subject) => {
      strengths.push(
        `${subject.name} is currently showing strong assessment performance.`
      );
    }
  );

  if (
    examAverage !== null &&
    examAverage < 60
  ) {
    focusAreas.push(
      "Regular revision and examination preparation should be given additional attention."
    );
  } else if (
    examAverage !== null &&
    examAverage < 75
  ) {
    focusAreas.push(
      "Additional revision before assessments may help improve results."
    );
  }

  if (
    attendancePercentage !== null &&
    attendancePercentage < 75
  ) {
    focusAreas.push(
      "Improving attendance consistency should be a priority."
    );
  }

  if (
    assignmentCompletion !== null &&
    assignmentCompletion < 70
  ) {
    focusAreas.push(
      "Pending assignments should be completed more consistently."
    );
  }

  const weakSubjects =
    subjects
      .filter(
        (subject) =>
          subject.percentage < 60
      )
      .slice(-2);

  weakSubjects.forEach(
    (subject) => {
      focusAreas.push(
        `${subject.name} would benefit from additional practice and revision.`
      );
    }
  );

  if (
    trend.direction ===
    "declining"
  ) {
    focusAreas.push(
      "Recent assessment performance has declined compared with earlier assessments."
    );
  }

  if (!strengths.length) {
    strengths.push(
      "The available academic records provide a starting point for monitoring progress."
    );
  }

  if (!focusAreas.length) {
    focusAreas.push(
      "Continue the current study routine and monitor subject-wise performance regularly."
    );
  }

  return {
    strengths:
      strengths.slice(0, 4),

    focusAreas:
      focusAreas.slice(0, 4),
  };
};

/* ============================================================
   RECOMMENDATIONS
============================================================ */

const buildRecommendations = ({
  attendancePercentage,
  assignmentCompletion,
  examAverage,
  subjects,
  score,
}) => {
  const recommendations = [];

  if (
    attendancePercentage !== null &&
    attendancePercentage < 75
  ) {
    recommendations.push(
      "Maintain a more regular attendance routine."
    );
  }

  if (
    assignmentCompletion !== null &&
    assignmentCompletion < 70
  ) {
    recommendations.push(
      "Complete pending assignments regularly instead of waiting until the deadline."
    );
  }

  if (
    examAverage !== null &&
    examAverage < 60
  ) {
    recommendations.push(
      "Increase revision time before upcoming assessments."
    );
  }

  const weakSubject =
    [...subjects]
      .filter(
        (subject) =>
          subject.percentage < 60
      )
      .sort(
        (a, b) =>
          a.percentage -
          b.percentage
      )[0];

  if (weakSubject) {
    recommendations.push(
      `Give additional practice time to ${weakSubject.name}.`
    );
  }

  if (
    score !== null &&
    score >= 80
  ) {
    recommendations.push(
      "Continue the current study habits and maintain consistency."
    );
  }

  if (!recommendations.length) {
    recommendations.push(
      "Continue regular revision, assignment work and classroom participation."
    );

    recommendations.push(
      "Review subject-wise performance regularly to identify areas for improvement."
    );
  }

  return recommendations.slice(
    0,
    5
  );
};

/* ============================================================
   MAIN STUDENT PERFORMANCE
============================================================ */

const getStudentPerformance =
  async (
    studentId,
    tenantId
  ) => {
    if (!studentId) {
      throw new Error(
        "Student account is not linked to a student record."
      );
    }

    if (!tenantId) {
      throw new Error(
        "Tenant information is missing."
      );
    }

    /* --------------------------------------------------------
       STUDENT
    -------------------------------------------------------- */

    const student =
      await prisma.student.findFirst({
        where: {
          id: Number(studentId),

          tenantId,

          isDeleted: false,
        },

        select: {
          id: true,

          admissionNo: true,

          studentName: true,

          photoUrl: true,

          classId: true,

          sectionId: true,

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
            },
          },
        },
      });

    if (!student) {
      throw new Error(
        "Student not found."
      );
    }

    /* --------------------------------------------------------
       ACADEMIC YEAR
    -------------------------------------------------------- */

    const academicYear =
      await getCurrentAcademicYear(
        tenantId
      );

    if (!academicYear) {
      return {
        student,

        academicYear: null,

        prediction: {
          score: null,

          label: "Not available",

          confidence: 0,

          dataPoints: {
            exams: 0,
            attendanceDays: 0,
            assignments: 0,
          },
        },

        metrics: {
          examAverage: null,
          attendancePercentage: null,
          assignmentCompletion: null,
          examsCount: 0,
          marksCount: 0,
          subjectsCount: 0,
        },

        attendance: {
          percentage: null,
          totalDays: 0,
          presentDays: 0,
          absentDays: 0,
          lateDays: 0,
          halfDays: 0,
        },

        trend: {
          direction: "stable",
          change: 0,
          points: [],
        },

        subjects: [],

        explanation: {
          summary:
            "No academic year is currently available for this student.",
          strengths: [],
          focusAreas: [],
        },

        recommendations: [],
      };
    }

    /* --------------------------------------------------------
       ATTENDANCE
    -------------------------------------------------------- */

    const attendanceRecords =
      await prisma.studentAttendance.findMany(
        {
          where: {
            tenantId,

            studentId:
              Number(studentId),

            academicYearId:
              academicYear.id,
          },

          select: {
            date: true,
            status: true,
          },

          orderBy: {
            date: "asc",
          },
        }
      );

    const attendance =
      calculateAttendance(
        attendanceRecords
      );

    /* --------------------------------------------------------
       EXAM MARKS
    -------------------------------------------------------- */

    const marks =
      await prisma.examMark.findMany({
        where: {
          tenantId,

          studentId:
            Number(studentId),

          exam: {
            academicYearId:
              academicYear.id,
          },
        },

        select: {
          id: true,

          maxMarks: true,

          marksObtained: true,

          isAbsent: true,

          exam: {
            select: {
              id: true,

              name: true,

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

    const exams =
      calculateExamPerformance(
        marks
      );

    /* --------------------------------------------------------
       ASSIGNMENTS
    -------------------------------------------------------- */

    const assignments =
      await prisma.assignment.findMany(
        {
          where: {
            tenantId,

            classId:
              student.classId,

            isActive: true,

            dueDate: {
              gte: new Date(
                academicYear.startDate
              ),

              lte: new Date(
                academicYear.endDate
              ),
            },

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

          select: {
            id: true,

            title: true,

            dueDate: true,

            AssignmentSubmission: {
              where: {
                studentId:
                  Number(studentId),
              },

              select: {
                status: true,

                grade: true,

                submittedAt: true,
              },
            },
          },

          orderBy: {
            dueDate: "desc",
          },
        }
      );

    const assignmentStats =
      calculateAssignments(
        assignments
      );

    /* --------------------------------------------------------
       TREND
    -------------------------------------------------------- */

    const trend =
      calculateTrend(
        exams.examTrend
      );

    /* --------------------------------------------------------
       SCORE
    -------------------------------------------------------- */

    const score =
      calculatePerformanceScore({
        examAverage:
          exams.average,

        attendancePercentage:
          attendance.percentage,

        assignmentCompletion:
          assignmentStats.completionPercentage,
      });

    const status =
      getStatus(score);

    const confidence =
      calculateConfidence({
        marksCount:
          exams.marksCount,

        attendanceDays:
          attendance.totalDays,

        assignmentsTotal:
          assignmentStats.total,
      });

    /* --------------------------------------------------------
       INSIGHTS
    -------------------------------------------------------- */

    const insights =
      buildInsights({
        examAverage:
          exams.average,

        attendancePercentage:
          attendance.percentage,

        assignmentCompletion:
          assignmentStats.completionPercentage,

        subjects:
          exams.subjectAverages,

        trend,
      });

    /* --------------------------------------------------------
       RECOMMENDATIONS
    -------------------------------------------------------- */

    const recommendations =
      buildRecommendations({
        attendancePercentage:
          attendance.percentage,

        assignmentCompletion:
          assignmentStats.completionPercentage,

        examAverage:
          exams.average,

        subjects:
          exams.subjectAverages,

        score,
      });

    /* --------------------------------------------------------
       RESPONSE
    -------------------------------------------------------- */

    return {
      student,

      academicYear: {
        id: academicYear.id,

        name: academicYear.name,

        startDate:
          academicYear.startDate,

        endDate:
          academicYear.endDate,
      },

      prediction: {
        score,

        label:
          status.label,

        category:
          status.key,

        confidence,

        dataPoints: {
          exams:
            exams.marksCount,

          attendanceDays:
            attendance.totalDays,

          assignments:
            assignmentStats.total,
        },
      },

      metrics: {
        examAverage:
          exams.average,

        attendancePercentage:
          attendance.percentage,

        assignmentCompletion:
          assignmentStats.completionPercentage,

        examsCount:
          exams.examsCount,

        marksCount:
          exams.marksCount,

        subjectsCount:
          exams.subjectAverages.length,

        assignmentsTotal:
          assignmentStats.total,

        assignmentsCompleted:
          assignmentStats.completed,
      },

      attendance,

      trend: {
        direction:
          trend.direction,

        change:
          trend.change,

        points:
          exams.examTrend.map(
            (item) => ({
              id: item.id,

              name: item.name,

              percentage:
                item.percentage,

              date: item.date,
            })
          ),
      },

      subjects:
        exams.subjectAverages,

      explanation: {
        summary:
          "Your performance overview is based on your available examination, attendance and assignment records. Use the subject trends and recommendations to understand where you are progressing and where additional practice may help.",

        strengths:
          insights.strengths,

        focusAreas:
          insights.focusAreas,
      },

      recommendations,

      generatedAt:
        new Date().toISOString(),
    };
  };

module.exports = {
  getStudentPerformance,
};