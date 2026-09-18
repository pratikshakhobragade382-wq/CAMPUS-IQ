const prisma = require("../../prisma/prismaClient");

const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY;

const GEMINI_MODEL =
  process.env.GEMINI_MODEL ||
  "gemini-3.6-flash";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/interactions";

/* ============================================================
   HELPERS
============================================================ */

const toNumber = (
  value,
  fallback = 0
) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
};

const round = (
  value,
  decimals = 1
) => {
  const factor =
    10 ** decimals;

  return (
    Math.round(
      toNumber(value) * factor
    ) / factor
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
   PARENT -> CHILDREN
============================================================ */

const getParentChildren = async (
  userId,
  tenantId
) => {
  const links =
    await prisma.studentParent.findMany({
      where: {
        tenantId,

        user: {
          id: Number(userId),
        },
      },

      select: {
        studentId: true,
      },
    });

  const studentIds = [
    ...new Set(
      links
        .map((item) =>
          Number(item.studentId)
        )
        .filter(Number.isInteger)
    ),
  ];

  if (!studentIds.length) {
    return [];
  }

  return prisma.student.findMany({
    where: {
      tenantId,

      id: {
        in: studentIds,
      },

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

    orderBy: {
      studentName: "asc",
    },
  });
};

/* ============================================================
   ACADEMIC YEARS
============================================================ */

const getAcademicYears = async (
  tenantId
) => {
  return prisma.academicYear.findMany({
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
};

/* ============================================================
   RESOLVE ACADEMIC YEAR
============================================================ */

const resolveAcademicYear = async (
  tenantId,
  academicYearId
) => {
  const academicYears =
    await getAcademicYears(
      tenantId
    );

  if (!academicYears.length) {
    return {
      academicYears: [],
      selectedAcademicYear: null,
    };
  }

  if (academicYearId) {
    const selected =
      academicYears.find(
        (year) =>
          Number(year.id) ===
          Number(academicYearId)
      );

    if (!selected) {
      throw new Error(
        "Selected academic year was not found."
      );
    }

    return {
      academicYears,
      selectedAcademicYear:
        selected,
    };
  }

  const selected =
    academicYears.find(
      (year) => year.isActive
    ) ||
    academicYears[0];

  return {
    academicYears,
    selectedAcademicYear:
      selected,
  };
};

/* ============================================================
   ATTENDANCE
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
    const status = String(
      record.status || ""
    ).toLowerCase();

    if (status === "present") {
      presentDays += 1;
    } else if (
      status === "absent"
    ) {
      absentDays += 1;
    } else if (
      status === "late"
    ) {
      lateDays += 1;
    } else if (
      status === "half_day" ||
      status === "half-day"
    ) {
      halfDays += 1;
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
   EXAMS
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

    totalObtained +=
      obtained;

    totalMaximum +=
      maximum;

    /* ---------------- SUBJECT ---------------- */

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

      subject.obtained +=
        obtained;

      subject.maximum +=
        maximum;
    }

    /* ---------------- EXAM ---------------- */

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
        examMap.get(
          examId
        );

      exam.obtained +=
        obtained;

      exam.maximum +=
        maximum;
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
          subject.maximum >
          0
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

      completionPercentage:
        null,

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
          submission.status ||
            ""
        ).toLowerCase();

      if (
        [
          "submitted",
          "late",
          "graded",
          "completed",
        ].includes(status)
      ) {
        completed += 1;
      }

      if (
        status === "graded" &&
        submission.grade !==
          null &&
        submission.grade !==
          undefined
      ) {
        graded += 1;

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
   TREND
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
      direction:
        "improving",

      change,
    };
  }

  if (change <= -5) {
    return {
      direction:
        "declining",

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
    examAverage !==
      undefined
  ) {
    values.push({
      value:
        clamp(
          examAverage
        ),

      weight: 0.6,
    });
  }

  if (
    attendancePercentage !==
      null &&
    attendancePercentage !==
      undefined
  ) {
    values.push({
      value:
        clamp(
          attendancePercentage
        ),

      weight: 0.25,
    });
  }

  if (
    assignmentCompletion !==
      null &&
    assignmentCompletion !==
      undefined
  ) {
    values.push({
      value:
        clamp(
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
   PERFORMANCE CATEGORY
============================================================ */

const getCategory = (
  score
) => {
  if (score === null) {
    return {
      key:
        "insufficient_data",

      label:
        "Not enough data",
    };
  }

  if (score >= 75) {
    return {
      key: "on_track",

      label: "On Track",
    };
  }

  if (score >= 55) {
    return {
      key:
        "needs_attention",

      label:
        "Needs Attention",
    };
  }

  return {
    key:
      "needs_support",

    label:
      "Needs Support",
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
    marksCount * 5,
    40
  );

  confidence += Math.min(
    attendanceDays * 0.4,
    20
  );

  confidence += Math.min(
    assignmentsTotal * 3,
    15
  );

  return round(
    clamp(
      confidence,
      25,
      100
    )
  );
};

/* ============================================================
   EXPLAINABLE INSIGHTS
============================================================ */

const buildExplainableInsights = ({
  examAverage,
  attendancePercentage,
  assignmentCompletion,
  trend,
  subjectAverages,
}) => {
  const strengths = [];
  const focusAreas = [];

  /* ---------------- EXAM ---------------- */

  if (
    examAverage !== null &&
    examAverage >= 75
  ) {
    strengths.push(
      "Examination performance is currently strong and indicates good understanding of the assessed topics."
    );
  } else if (
    examAverage !== null &&
    examAverage >= 60
  ) {
    strengths.push(
      "Examination performance is reasonably consistent, with room to improve towards a stronger academic level."
    );
  }

  /* ---------------- ATTENDANCE ---------------- */

  if (
    attendancePercentage !==
      null &&
    attendancePercentage >= 85
  ) {
    strengths.push(
      "Attendance is strong, which supports regular classroom participation and continuity in learning."
    );
  } else if (
    attendancePercentage !==
      null &&
    attendancePercentage < 75
  ) {
    focusAreas.push(
      "Attendance is below the preferred level. Improving regular attendance may help maintain learning continuity."
    );
  }

  /* ---------------- ASSIGNMENTS ---------------- */

  if (
    assignmentCompletion !==
      null &&
    assignmentCompletion >= 85
  ) {
    strengths.push(
      "Assignment completion is strong and shows good consistency with academic tasks."
    );
  } else if (
    assignmentCompletion !==
      null &&
    assignmentCompletion < 70
  ) {
    focusAreas.push(
      "Assignment completion can be improved by reducing pending work and maintaining regular submission habits."
    );
  }

  /* ---------------- TREND ---------------- */

  if (
    trend.direction ===
    "improving"
  ) {
    strengths.push(
      "Recent assessment results show positive academic movement."
    );
  }

  if (
    trend.direction ===
    "declining"
  ) {
    focusAreas.push(
      "Recent assessment results show a downward movement and should be monitored closely."
    );
  }

  /* ---------------- SUBJECTS ---------------- */

  if (
    subjectAverages.length
  ) {
    const strongest =
      subjectAverages[0];

    const weakest =
      subjectAverages[
        subjectAverages.length -
          1
      ];

    if (
      strongest &&
      strongest.percentage >= 75
    ) {
      strengths.push(
        `${strongest.name} is currently one of the stronger performing subjects.`
      );
    }

    if (
      weakest &&
      weakest.percentage < 60
    ) {
      focusAreas.push(
        `${weakest.name} may benefit from additional revision and practice.`
      );
    }
  }

  if (!strengths.length) {
    strengths.push(
      "The available records are being monitored to identify consistent areas of progress."
    );
  }

  if (!focusAreas.length) {
    focusAreas.push(
      "Continue maintaining consistent study, attendance and assignment habits."
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
  examAverage,
  attendancePercentage,
  assignmentCompletion,
  trend,
  subjectAverages,
}) => {
  const recommendations = [];

  if (
    examAverage !== null &&
    examAverage < 60
  ) {
    recommendations.push(
      "Review recent examination topics and create a focused revision routine for weaker areas."
    );
  }

  if (
    attendancePercentage !==
      null &&
    attendancePercentage < 75
  ) {
    recommendations.push(
      "Improve regular attendance so that important classroom explanations and practice sessions are not missed."
    );
  }

  if (
    assignmentCompletion !==
      null &&
    assignmentCompletion < 75
  ) {
    recommendations.push(
      "Complete pending assignments first and maintain a regular submission schedule."
    );
  }

  if (
    trend.direction ===
    "declining"
  ) {
    recommendations.push(
      "Compare recent assessment results with earlier results and identify the topics where marks have reduced."
    );
  }

  if (
    subjectAverages.length
  ) {
    const weakest =
      subjectAverages[
        subjectAverages.length -
          1
      ];

    if (
      weakest &&
      weakest.percentage < 60
    ) {
      recommendations.push(
        `Give additional weekly practice time to ${weakest.name}.`
      );
    }
  }

  if (
    !recommendations.length
  ) {
    recommendations.push(
      "Continue the current study routine while maintaining regular attendance, timely assignments and consistent examination preparation."
    );

    recommendations.push(
      "Use subject-wise performance trends to identify opportunities for further improvement."
    );
  }

  return recommendations.slice(
    0,
    5
  );
};

/* ============================================================
   GEMINI PERSONALIZED EXPLANATION
============================================================ */

const generateAIExplanation = async ({
  student,
  academicYear,
  metrics,
  prediction,
  trend,
  subjects,
  attendance,
  assignments,
}) => {
  const fallback =
    buildExplainableInsights({
      examAverage:
        metrics.examAverage,

      attendancePercentage:
        metrics.attendancePercentage,

      assignmentCompletion:
        metrics.assignmentCompletion,

      trend,

      subjectAverages:
        subjects,
    });

  if (!GEMINI_API_KEY) {
    return {
      summary:
        "The report is based on the available examination, attendance and assignment records. The current academic pattern is shown through the score, charts and recommendations below.",

      strengths:
        fallback.strengths,

      focusAreas:
        fallback.focusAreas,

      generatedBy:
        "Academic analysis",
    };
  }

  const prompt = `
Create a concise parent-friendly academic performance explanation.

Student:
${student?.name || "Student"}

Academic year:
${academicYear?.name || "Selected academic year"}

Overall score:
${prediction?.score ?? "Not available"}

Performance category:
${prediction?.label || prediction?.category || "Not available"}

Exam average:
${metrics?.examAverage ?? "Not available"}%

Attendance:
${metrics?.attendancePercentage ?? "Not available"}%

Assignment completion:
${metrics?.assignmentCompletion ?? "Not available"}%

Trend:
${trend?.direction || "stable"}

Trend change:
${trend?.change ?? 0} percentage points

Subject performance:
${JSON.stringify(subjects)}

Attendance details:
${JSON.stringify(attendance)}

Assignment details:
${JSON.stringify(assignments)}

Return ONLY valid JSON:

{
  "summary": "2-4 sentence parent-friendly explanation",
  "strengths": [
    "strength 1",
    "strength 2"
  ],
  "focusAreas": [
    "focus area 1",
    "focus area 2"
  ]
}

Rules:
- Do not mention Random Forest.
- Do not mention machine learning.
- Do not mention algorithms.
- Do not mention Gemini.
- Do not mention AI models.
- Do not use technical terminology.
- Do not invent marks or records.
- Be supportive but honest.
- Keep the explanation understandable for a parent.
`;

  try {
    const controller =
      new AbortController();

    const timeout =
      setTimeout(() => {
        controller.abort();
      }, 8000);

    const response =
      await fetch(
        GEMINI_URL,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            "x-goog-api-key":
              GEMINI_API_KEY,
          },

          body: JSON.stringify({
            model:
              GEMINI_MODEL,

            system_instruction:
              "You are a professional school academic advisor. Give clear, factual, supportive explanations to parents.",

            input: [
              {
                type: "text",

                text: prompt,
              },
            ],

            store: false,
          }),

          signal:
            controller.signal,
        }
      );

    clearTimeout(timeout);

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data?.error?.message ||
          "Explanation request failed."
      );
    }

    const steps =
      data?.steps || [];

    let text = "";

    for (const step of steps) {
      if (
        step?.type !==
        "model_output"
      ) {
        continue;
      }

      for (const item of
        step.content || []) {
        if (
          item?.type ===
            "text" &&
          item.text
        ) {
          text += item.text;
        }
      }
    }

    if (!text.trim()) {
      throw new Error(
        "Empty explanation."
      );
    }

    const cleaned =
      text
        .trim()
        .replace(
          /^```json/i,
          ""
        )
        .replace(
          /^```/i,
          ""
        )
        .replace(
          /```$/i,
          ""
        )
        .trim();

    const parsed =
      JSON.parse(cleaned);

    return {
      summary:
        parsed.summary ||
        fallback.strengths.join(
          " "
        ),

      strengths:
        Array.isArray(
          parsed.strengths
        ) &&
        parsed.strengths.length
          ? parsed.strengths.slice(
              0,
              4
            )
          : fallback.strengths,

      focusAreas:
        Array.isArray(
          parsed.focusAreas
        ) &&
        parsed.focusAreas.length
          ? parsed.focusAreas.slice(
              0,
              4
            )
          : fallback.focusAreas,

      generatedBy:
        "Personalized academic analysis",
    };
  } catch (error) {
    console.error(
      "Performance explanation error:",
      error
    );

    return {
      summary:
        "The current academic picture is based on the available examination, attendance and assignment records. Continue monitoring the trends and recommendations shown in this report.",

      strengths:
        fallback.strengths,

      focusAreas:
        fallback.focusAreas,

      generatedBy:
        "Academic analysis",
    };
  }
};

/* ============================================================
   BUILD CHILD PERFORMANCE
============================================================ */

const buildChildPerformance =
  async ({
    child,
    tenantId,
    academicYear,
  }) => {
    /* ---------------------------------------------------------
       ATTENDANCE
    --------------------------------------------------------- */

    const attendanceRecords =
      await prisma.studentAttendance.findMany(
        {
          where: {
            tenantId,

            studentId:
              child.id,

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

    /* ---------------------------------------------------------
       EXAMS
    --------------------------------------------------------- */

    const marks =
      await prisma.examMark.findMany(
        {
          where: {
            tenantId,

            studentId:
              child.id,

            exam: {
              academicYearId:
                academicYear.id,
            },
          },

          select: {
            id: true,

            maxMarks: true,

            marksObtained:
              true,

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
              startDate:
                "asc",
            },
          },
        }
      );

    const exams =
      calculateExamPerformance(
        marks
      );

    /* ---------------------------------------------------------
       ASSIGNMENTS
    --------------------------------------------------------- */

    const assignments =
      await prisma.assignment.findMany(
        {
          where: {
            tenantId,

            classId:
              child.classId,

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
                  child.sectionId,
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

            AssignmentSubmission:
              {
                where: {
                  studentId:
                    child.id,
                },

                select: {
                  status: true,

                  grade: true,

                  submittedAt:
                    true,
                },
              },
          },

          orderBy: {
            dueDate:
              "desc",
          },
        }
      );

    const assignmentStats =
      calculateAssignments(
        assignments
      );

    /* ---------------------------------------------------------
       TREND
    --------------------------------------------------------- */

    const trend =
      calculateTrend(
        exams.examTrend
      );

    /* ---------------------------------------------------------
       SCORE
    --------------------------------------------------------- */

    const score =
      calculatePerformanceScore({
        examAverage:
          exams.average,

        attendancePercentage:
          attendance.percentage,

        assignmentCompletion:
          assignmentStats.completionPercentage,
      });

    const category =
      getCategory(score);

    const confidence =
      calculateConfidence({
        marksCount:
          exams.marksCount,

        attendanceDays:
          attendance.totalDays,

        assignmentsTotal:
          assignmentStats.total,
      });

    /* ---------------------------------------------------------
       METRICS
    --------------------------------------------------------- */

    const metrics = {
      examAverage:
        exams.average,

      attendancePercentage:
        attendance.percentage,

      assignmentCompletion:
        assignmentStats.completionPercentage,

      attendanceDays:
        attendance.totalDays,

      assignmentsTotal:
        assignmentStats.total,

      assignmentsCompleted:
        assignmentStats.completed,

      assignmentsPending:
        assignmentStats.pending,

      assignmentAverageGrade:
        assignmentStats.averageGrade,

      examsCount:
        exams.examsCount,

      marksCount:
        exams.marksCount,

      overallScore:
        score,
    };

    /* ---------------------------------------------------------
       EXPLAINABLE INSIGHTS
    --------------------------------------------------------- */

    const basicInsights =
      buildExplainableInsights({
        examAverage:
          exams.average,

        attendancePercentage:
          attendance.percentage,

        assignmentCompletion:
          assignmentStats.completionPercentage,

        trend,

        subjectAverages:
          exams.subjectAverages,
      });

    /* ---------------------------------------------------------
       RECOMMENDATIONS
    --------------------------------------------------------- */

    const recommendations =
      buildRecommendations({
        examAverage:
          exams.average,

        attendancePercentage:
          attendance.percentage,

        assignmentCompletion:
          assignmentStats.completionPercentage,

        trend,

        subjectAverages:
          exams.subjectAverages,
      });

    /* ---------------------------------------------------------
       PERFORMANCE EXPLANATION
       
       IMPORTANT:
       Do NOT wait for Gemini here.
       
       The parent performance page should load immediately
       from the real ERP data already calculated above.
       
       basicInsights is generated locally from:
       - examination performance
       - attendance
       - assignment completion
       - assessment trend
       - subject performance
    --------------------------------------------------------- */

    const explanation = {
      summary:
        "The performance report is based on the available examination, attendance and assignment records. The current academic pattern is shown through the performance score, subject performance, attendance, assignment completion and assessment trend.",

      strengths:
        basicInsights.strengths,

      focusAreas:
        basicInsights.focusAreas,

      generatedBy:
        "Academic analysis",
    };

    return {
      student: {
        id: child.id,

        name:
          child.studentName,

        admissionNo:
          child.admissionNo,

        photoUrl:
          child.photoUrl,

        class: child.class
          ? {
              id:
                child.class.id,

              name:
                child.class.name,
            }
          : null,

        section: child.section
          ? {
              id:
                child.section.id,

              name:
                child.section.name,
            }
          : null,
      },

      academicYear: {
        id:
          academicYear.id,

        name:
          academicYear.name,

        startDate:
          academicYear.startDate,

        endDate:
          academicYear.endDate,
      },

      prediction: {
        score,

        category:
          category.key,

        label:
          category.label,

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

      metrics,

      attendance: {
        percentage:
          attendance.percentage,

        totalDays:
          attendance.totalDays,

        presentDays:
          attendance.presentDays,

        absentDays:
          attendance.absentDays,

        lateDays:
          attendance.lateDays,

        halfDays:
          attendance.halfDays,
      },

      trend: {
        direction:
          trend.direction,

        change:
          trend.change,

        points:
          exams.examTrend.map(
            (item) => ({
              exam:
                item.name,

              name:
                item.name,

              percentage:
                item.percentage,

              date:
                item.date,
            })
          ),
      },

      subjects:
        exams.subjectAverages,

      explanation: {
        summary:
          explanation.summary,

        strengths:
          explanation.strengths?.length
            ? explanation.strengths
            : basicInsights.strengths,

        focusAreas:
          explanation.focusAreas?.length
            ? explanation.focusAreas
            : basicInsights.focusAreas,

        generatedBy:
          explanation.generatedBy,
      },

      recommendations,

      generatedAt:
        new Date().toISOString(),
    };
  };

/* ============================================================
   MAIN PERFORMANCE TRACKER
============================================================ */

const getPerformanceTracker =
  async ({
    userId,
    tenantId,
    academicYearId,
  }) => {
    if (!userId) {
      throw new Error(
        "Parent user ID is required."
      );
    }

    if (!tenantId) {
      throw new Error(
        "Tenant ID is required."
      );
    }

    const children =
      await getParentChildren(
        userId,
        tenantId
      );

    const {
      academicYears,
      selectedAcademicYear,
    } =
      await resolveAcademicYear(
        tenantId,
        academicYearId
      );

    if (!children.length) {
      return {
        academicYears,

        selectedAcademicYear,

        children: [],

        tracker: null,

        message:
          "No student is linked to this parent account.",
      };
    }

    if (!selectedAcademicYear) {
      return {
        academicYears,

        selectedAcademicYear:
          null,

        children,

        tracker: null,

        message:
          "No academic year is available.",
      };
    }

    /*
     * The parent-facing dashboard automatically
     * displays the first linked child.
     */

    const child =
      children[0];

    const tracker =
      await buildChildPerformance({
        child,

        tenantId,

        academicYear:
          selectedAcademicYear,
      });

    return {
      academicYears,

      selectedAcademicYear,

      children,

      tracker,

      message:
        "Academic performance loaded successfully.",
    };
  };

module.exports = {
  getPerformanceTracker,
};