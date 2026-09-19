import { useEffect, useMemo, useState } from "react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import {
  Activity,
  AlertCircle,
  Award,
  BarChart3,
  BookOpen,
  Brain,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  Lightbulb,
  Loader2,
  Target,
  UserRound,
  Users,
} from "lucide-react";

import axiosClient from "../api/axios";
import "./AIPerformancePredictor.css";

// ============================================================
// SUBJECT COLORS
// ============================================================

const SUBJECT_COLORS = [
  "#4F46E5",
  "#06B6D4",
  "#10B981",
  "#F59E0B",
  "#EC4899",
  "#8B5CF6",
  "#EF4444",
  "#14B8A6",
  "#F97316",
  "#3B82F6",
  "#84CC16",
  "#A855F7",
];

// ============================================================
// PIE COLORS
// ============================================================

const PIE_COLORS = [
  "#2563EB",
  "#E5E7EB",
];

// ============================================================
// HELPERS
// ============================================================

const clamp = (
  value,
  min = 0,
  max = 100
) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return null;
  }

  return Math.min(
    max,
    Math.max(min, number)
  );
};

const numberOrNull = (value) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
};

const firstNumber = (...values) => {
  for (const value of values) {
    const number = numberOrNull(value);

    if (number !== null) {
      return number;
    }
  }

  return null;
};

const formatPercent = (value) => {
  const number = numberOrNull(value);

  if (number === null) {
    return "—";
  }

  return `${Math.round(number)}%`;
};

const formatScore = (value) => {
  const number = numberOrNull(value);

  if (number === null) {
    return "—";
  }

  return `${Math.round(number)}`;
};

// ============================================================
// STATUS
// ============================================================

const getStatus = (score) => {
  const value = numberOrNull(score);

  if (value === null) {
    return {
      label: "Not available",
      className: "status-neutral",
      description:
        "More academic information is needed to determine the current performance outlook.",
    };
  }

  if (value >= 80) {
    return {
      label: "Strong progress",
      className: "status-positive",
      description:
        "The available academic indicators show consistent progress.",
    };
  }

  if (value >= 60) {
    return {
      label: "Progressing",
      className: "status-medium",
      description:
        "The student is progressing, with some areas that can benefit from additional attention.",
    };
  }

  return {
    label: "Needs attention",
    className: "status-attention",
    description:
      "The available indicators suggest that some additional academic support may be useful.",
  };
};

// ============================================================
// SUBJECT NORMALIZER
// ============================================================

const normalizeSubject = (
  subject,
  index
) => {
  const score = clamp(
    firstNumber(
      subject?.score,
      subject?.average,
      subject?.percentage,
      subject?.marksPercentage,
      subject?.performance
    )
  );

  const name =
    subject?.name ||
    subject?.subjectName ||
    subject?.subject?.name ||
    subject?.title ||
    `Subject ${index + 1}`;

  return {
    id:
      subject?.id ||
      subject?.subjectId ||
      `${name}-${index}`,

    name,

    score,

    color:
      SUBJECT_COLORS[
        index % SUBJECT_COLORS.length
      ],
  };
};

// ============================================================
// PERFORMANCE TREND
// IMPORTANT:
// Attendance is intentionally NOT included here.
// ============================================================

const normalizeTrend = (trend) => {
  if (!Array.isArray(trend)) {
    return [];
  }

  return trend
    .map((item, index) => {
      const score = clamp(
        firstNumber(
          item?.score,
          item?.average,
          item?.percentage,
          item?.value,
          item?.performance
        )
      );

      const label =
        item?.label ||
        item?.month ||
        item?.period ||
        item?.name ||
        item?.date ||
        `Period ${index + 1}`;

      return {
        label: String(label),
        score,
      };
    })
    .filter(
      (item) =>
        item.score !== null
    );
};

// ============================================================
// ATTENDANCE TREND
// Kept separately in case backend provides it.
// It is NOT displayed in Performance Trend.
// ============================================================

const normalizeAttendanceTrend = (
  trend
) => {
  if (!Array.isArray(trend)) {
    return [];
  }

  return trend
    .map((item, index) => {
      const percentage = clamp(
        firstNumber(
          item?.attendance,
          item?.attendancePercentage,
          item?.percentage,
          item?.value,
          item?.presentPercentage
        )
      );

      return {
        label:
          item?.label ||
          item?.month ||
          item?.period ||
          item?.name ||
          item?.date ||
          `Period ${index + 1}`,

        percentage,
      };
    })
    .filter(
      (item) =>
        item.percentage !== null
    );
};

// ============================================================
// API RESPONSE NORMALIZER
// ============================================================

const extractTracker = (
  responseData
) => {
  const payload =
    responseData?.data ??
    responseData ??
    {};

  return (
    payload?.tracker ||
    payload?.performance ||
    payload?.result ||
    payload
  );
};

// ============================================================
// GET PERFORMANCE
// ============================================================
// Academic year is intentionally NOT sent from frontend.
// Backend returns the current/available performance data.
// ============================================================

const getPerformance = async () => {
  const response =
    await axiosClient.get(
      "/parents/performance"
    );

  return extractTracker(
    response?.data
  );
};

// ============================================================
// RECOMMENDATIONS
// ============================================================

const buildRecommendations = ({
  attendance,
  assignmentCompletion,
  examAverage,
  subjects,
  score,
}) => {
  const recommendations = [];

  if (
    attendance !== null &&
    attendance < 75
  ) {
    recommendations.push({
      title:
        "Improve attendance consistency",

      description:
        "Regular class participation can provide more consistent learning opportunities. Review missed classes and try to maintain a steady attendance routine.",

      icon: CalendarDays,

      type: "attention",
    });
  } else if (
    attendance !== null &&
    attendance < 85
  ) {
    recommendations.push({
      title:
        "Maintain regular attendance",

      description:
        "Keeping attendance consistent can support continuity in classroom learning.",

      icon: CalendarDays,

      type: "medium",
    });
  }

  if (
    assignmentCompletion !== null &&
    assignmentCompletion < 70
  ) {
    recommendations.push({
      title:
        "Complete assignments regularly",

      description:
        "Set aside a fixed study period for pending assignments and avoid leaving multiple tasks until the deadline.",

      icon: ClipboardCheck,

      type: "attention",
    });
  } else if (
    assignmentCompletion !== null &&
    assignmentCompletion < 85
  ) {
    recommendations.push({
      title:
        "Strengthen assignment consistency",

      description:
        "A regular assignment routine can help maintain steady academic progress.",

      icon: ClipboardCheck,

      type: "medium",
    });
  }

  if (
    examAverage !== null &&
    examAverage < 60
  ) {
    recommendations.push({
      title:
        "Focus on examination preparation",

      description:
        "Review previous assessment topics, identify difficult chapters and use shorter, regular revision sessions.",

      icon: GraduationCap,

      type: "attention",
    });
  } else if (
    examAverage !== null &&
    examAverage < 75
  ) {
    recommendations.push({
      title:
        "Increase revision before assessments",

      description:
        "Regular revision of recently covered topics may help improve examination performance.",

      icon: BookOpen,

      type: "medium",
    });
  }

  const weakSubjects = subjects
    .filter(
      (subject) =>
        subject.score !== null &&
        subject.score < 60
    )
    .sort(
      (a, b) =>
        a.score - b.score
    )
    .slice(0, 2);

  weakSubjects.forEach(
    (subject) => {
      recommendations.push({
        title:
          `Give additional attention to ${subject.name}`,

        description:
          `Consider scheduling focused practice for ${subject.name}, especially on topics where recent assessment performance has been lower.`,

        icon: Target,

        type: "attention",
      });
    }
  );

  if (
    score !== null &&
    score >= 80
  ) {
    recommendations.push({
      title:
        "Maintain the current study routine",

      description:
        "Continue the habits that are supporting the student's current progress and avoid reducing consistency.",

      icon: Award,

      type: "positive",
    });
  }

  if (
    recommendations.length === 0
  ) {
    recommendations.push({
      title:
        "Continue regular academic monitoring",

      description:
        "Keep reviewing attendance, assignments and assessment performance regularly so that progress can be supported consistently.",

      icon: Activity,

      type: "positive",
    });
  }

  return recommendations.slice(0, 5);
};

// ============================================================
// FOCUS AREAS
// ============================================================

const buildFocusAreas = ({
  attendance,
  assignmentCompletion,
  examAverage,
  subjects,
}) => {
  const focusAreas = [];

  if (
    attendance !== null &&
    attendance < 85
  ) {
    focusAreas.push(
      "Maintain more consistent attendance."
    );
  }

  if (
    assignmentCompletion !== null &&
    assignmentCompletion < 85
  ) {
    focusAreas.push(
      "Improve assignment completion consistency."
    );
  }

  if (
    examAverage !== null &&
    examAverage < 75
  ) {
    focusAreas.push(
      "Strengthen revision and assessment preparation."
    );
  }

  subjects
    .filter(
      (subject) =>
        subject.score !== null &&
        subject.score < 70
    )
    .sort(
      (a, b) =>
        a.score - b.score
    )
    .slice(0, 2)
    .forEach(
      (subject) => {
        focusAreas.push(
          `${subject.name} could benefit from additional practice.`
        );
      }
    );

  if (
    focusAreas.length === 0
  ) {
    focusAreas.push(
      "Continue monitoring progress across all academic areas."
    );
  }

  return focusAreas.slice(0, 4);
};

// ============================================================
// STRENGTHS
// ============================================================

const buildStrengths = ({
  attendance,
  assignmentCompletion,
  examAverage,
  subjects,
}) => {
  const strengths = [];

  if (
    attendance !== null &&
    attendance >= 90
  ) {
    strengths.push(
      "Attendance is strong and supports consistent participation."
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

  if (
    examAverage !== null &&
    examAverage >= 75
  ) {
    strengths.push(
      "Assessment performance is showing a positive level of achievement."
    );
  }

  const strongSubjects = subjects
    .filter(
      (subject) =>
        subject.score !== null &&
        subject.score >= 80
    )
    .sort(
      (a, b) =>
        b.score - a.score
    )
    .slice(0, 2);

  strongSubjects.forEach(
    (subject) => {
      strengths.push(
        `${subject.name} is currently a strong academic area.`
      );
    }
  );

  if (
    strengths.length === 0
  ) {
    strengths.push(
      "The available academic information is being monitored for progress."
    );
  }

  return strengths.slice(0, 4);
};

// ============================================================
// PERFORMANCE TOOLTIP
// ============================================================

const PerformanceTooltip = ({
  active,
  payload,
  label,
}) => {
  if (
    !active ||
    !payload?.length
  ) {
    return null;
  }

  return (
    <div className="performance-tooltip">
      <strong>{label}</strong>

      {payload.map(
        (item) => (
          <div
            key={item.dataKey}
            className="tooltip-row"
          >
            <span>
              {item.name}
            </span>

            <b>
              {item.value !== null &&
              item.value !== undefined
                ? `${Math.round(
                    item.value
                  )}%`
                : "—"}
            </b>
          </div>
        )
      )}
    </div>
  );
};

// ============================================================
// METRIC CARD
// ============================================================

const MetricCard = ({
  icon: Icon,
  title,
  value,
  subtitle,
  className = "",
}) => {
  return (
    <div
      className={`metric-card ${className}`}
    >
      <div className="metric-icon">
        <Icon size={20} />
      </div>

      <div className="metric-content">
        <span>{title}</span>

        <strong>
          {value}
        </strong>

        <small>
          {subtitle}
        </small>
      </div>
    </div>
  );
};

// ============================================================
// EMPTY CHART
// ============================================================

const EmptyChart = ({
  title = "No chart data available",

  description =
    "This chart will appear when the system has sufficient academic records.",
}) => {
  return (
    <div className="chart-empty">
      <BarChart3 size={34} />

      <strong>
        {title}
      </strong>

      <span>
        {description}
      </span>
    </div>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function AIPerformancePredictor() {
  const [tracker, setTracker] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // ==========================================================
  // LOAD PERFORMANCE
  // ==========================================================

  useEffect(() => {
    let mounted = true;

    const loadPerformance =
      async () => {
        setLoading(true);
        setError("");

        try {
          const data =
            await getPerformance();

          if (!mounted) {
            return;
          }

          if (
            !data ||
            typeof data !==
              "object"
          ) {
            throw new Error(
              "Performance information is not available."
            );
          }

          setTracker(data);
        } catch (err) {
          console.error(
            "Unable to load performance:",
            err
          );

          if (mounted) {
            setTracker(null);

            setError(
              err?.response
                ?.data?.message ||
                err?.message ||
                "Unable to load performance information."
            );
          }
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      };

    loadPerformance();

    return () => {
      mounted = false;
    };
  }, []);

  // ==========================================================
  // DATA
  // ==========================================================

  const student =
    tracker?.student || {};

  const prediction =
    tracker?.prediction || {};

  const metrics =
    tracker?.metrics || {};

  const attendance =
    tracker?.attendance || {};

  const exams =
    tracker?.exams ||
    tracker?.examination ||
    {};

  const assignments =
    tracker?.assignments || {};

  const rawSubjects =
    Array.isArray(
      tracker?.subjects
    )
      ? tracker.subjects
      : [];

  // ==========================================================
  // SUBJECT DATA
  // ==========================================================

  const subjects = useMemo(
    () =>
      rawSubjects
        .map(normalizeSubject)
        .filter(
          (subject) =>
            subject.score !== null
        ),
    [rawSubjects]
  );

  // ==========================================================
  // OVERALL SCORE
  // ==========================================================

  const score = useMemo(
    () =>
      clamp(
        firstNumber(
          prediction?.score,
          prediction?.value,
          prediction?.percentage,
          tracker?.predictedScore,
          tracker?.overallScore,
          metrics?.overallScore,
          metrics?.performanceScore
        )
      ),
    [
      prediction,
      tracker,
      metrics,
    ]
  );

  // ==========================================================
  // ATTENDANCE
  // ==========================================================

  const attendancePercentage =
    useMemo(
      () =>
        clamp(
          firstNumber(
            attendance?.percentage,
            attendance?.attendancePercentage,
            attendance?.percent,
            metrics?.attendancePercentage,
            metrics?.attendance,
            tracker?.attendancePercentage
          )
        ),
      [
        attendance,
        metrics,
        tracker,
      ]
    );

  // ==========================================================
  // ASSIGNMENTS
  // ==========================================================

  const assignmentCompletion =
    useMemo(
      () =>
        clamp(
          firstNumber(
            assignments?.completionPercentage,
            assignments?.completion,
            assignments?.percentage,
            metrics?.assignmentCompletion,
            metrics?.assignmentCompletionPercentage,
            tracker?.assignmentCompletion
          )
        ),
      [
        assignments,
        metrics,
        tracker,
      ]
    );

  // ==========================================================
  // EXAMS
  // ==========================================================

  const examAverage = useMemo(
    () =>
      clamp(
        firstNumber(
          exams?.average,
          exams?.averagePercentage,
          exams?.percentage,
          metrics?.examAverage,
          metrics?.examPercentage,
          tracker?.examAverage
        )
      ),
    [
      exams,
      metrics,
      tracker,
    ]
  );

  // ==========================================================
  // STATUS
  // ==========================================================

  const status =
    getStatus(score);

  // ==========================================================
  // PERFORMANCE TREND
  // ==========================================================

  const trendData =
    useMemo(() => {
      const source =
        tracker?.trend?.data ||
        tracker?.trend?.points ||
        tracker?.trend ||
        tracker?.performanceTrend ||
        [];

      return normalizeTrend(
        source
      );
    }, [tracker]);

  // ==========================================================
  // ATTENDANCE TREND
  // ==========================================================

  const attendanceTrendData =
    useMemo(() => {
      const source =
        tracker?.attendanceTrend ||
        attendance?.trend ||
        attendance?.history ||
        [];

      return normalizeAttendanceTrend(
        source
      );
    }, [
      tracker,
      attendance,
    ]);

  // ==========================================================
  // RECOMMENDATIONS
  // ==========================================================

  const recommendationList =
    useMemo(
      () =>
        buildRecommendations({
          attendance:
            attendancePercentage,

          assignmentCompletion,

          examAverage,

          subjects,

          score,
        }),
      [
        attendancePercentage,
        assignmentCompletion,
        examAverage,
        subjects,
        score,
      ]
    );

  // ==========================================================
  // FOCUS AREAS
  // ==========================================================

  const focusAreas =
    useMemo(
      () =>
        buildFocusAreas({
          attendance:
            attendancePercentage,

          assignmentCompletion,

          examAverage,

          subjects,
        }),
      [
        attendancePercentage,
        assignmentCompletion,
        examAverage,
        subjects,
      ]
    );

  // ==========================================================
  // STRENGTHS
  // ==========================================================

  const strengths =
    useMemo(
      () =>
        buildStrengths({
          attendance:
            attendancePercentage,

          assignmentCompletion,

          examAverage,

          subjects,
        }),
      [
        attendancePercentage,
        assignmentCompletion,
        examAverage,
        subjects,
      ]
    );

  // ==========================================================
  // SCORE DISTRIBUTION
  // ==========================================================

  const scoreDistribution =
    useMemo(() => {
      if (score === null) {
        return [];
      }

      return [
        {
          name: "Current score",
          value: score,
        },

        {
          name: "Remaining",
          value: Math.max(
            0,
            100 - score
          ),
        },
      ];
    }, [score]);

  // ==========================================================
  // STRONGEST / WEAKEST SUBJECT
  // ==========================================================

  const strongestSubject =
    subjects.length > 0
      ? [...subjects].sort(
          (a, b) =>
            b.score - a.score
        )[0]
      : null;

  const weakestSubject =
    subjects.length > 0
      ? [...subjects].sort(
          (a, b) =>
            a.score - b.score
        )[0]
      : null;

  // ==========================================================
  // AI INSIGHTS
  // ==========================================================

  const aiInsights =
    tracker?.aiInsights ||
    tracker?.insights ||
    tracker?.ai ||
    null;

  const aiSummary =
    aiInsights?.summary ||
    tracker?.summary ||
    status.description;

  const aiStrengths =
    Array.isArray(
      aiInsights?.strengths
    ) &&
    aiInsights.strengths.length >
      0
      ? aiInsights.strengths
      : strengths;

  const aiFocusAreas =
    Array.isArray(
      aiInsights?.focusAreas
    ) &&
    aiInsights.focusAreas.length >
      0
      ? aiInsights.focusAreas
      : focusAreas;

  const aiRecommendations =
    Array.isArray(
      aiInsights?.recommendations
    ) &&
    aiInsights.recommendations
      .length > 0
      ? aiInsights.recommendations
      : recommendationList.map(
          (item) =>
            item.description
        );

  // ==========================================================
  // LOADING
  // ==========================================================

  if (
    loading &&
    !tracker
  ) {
    return (
      <div className="performance-page">
        <div className="performance-loading">
          <div className="loading-spinner">
            <Loader2
              size={34}
              className="spin"
            />
          </div>

          <h2>
            Loading performance
            insights
          </h2>

          <p>
            We are securely
            retrieving the
            available academic
            information.
          </p>
        </div>
      </div>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (
    error &&
    !tracker
  ) {
    return (
      <div className="performance-page">
        <div className="performance-error">
          <div className="error-icon">
            <AlertCircle
              size={32}
            />
          </div>

          <h2>
            Unable to load
            performance
            information
          </h2>

          <p>
            {error}
          </p>

          <button
            className="retry-button"
            onClick={() =>
              window.location.reload()
            }
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <div className="performance-page">

      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div className="performance-topbar">
        <div>
          <div className="page-eyebrow">
            Parent Portal
          </div>

          <h1>
            AI Performance Predictor
          </h1>

          <p>
            A clear view of your
            child's academic
            progress, trends and
            recommended areas of
            focus.
          </p>
        </div>
      </div>

      {/* ======================================================
          STUDENT HERO
      ====================================================== */}

      <section className="student-hero">
        <div className="student-identity">

          {student?.photoUrl ||
          student?.photo ||
          student?.image ? (
            <img
              src={
                student.photoUrl ||
                student.photo ||
                student.image
              }
              alt={
                student?.name ||
                student?.studentName ||
                "Student"
              }
              className="student-photo"
            />
          ) : (
            <div className="student-photo-placeholder">
              <UserRound size={30} />
            </div>
          )}

          <div>
            <span className="student-label">
              Student Performance
              Overview
            </span>

            <h2>
              {student?.name ||
                student?.studentName ||
                "Student"}
            </h2>

            <div className="student-meta">

              {student?.class?.name ||
              student?.className ? (
                <span>
                  <GraduationCap
                    size={15}
                  />

                  {student?.class
                    ?.name ||
                    student.className}
                </span>
              ) : null}

              {student?.section
                ?.name ||
              student?.sectionName ? (
                <span>
                  <Users size={15} />

                  Section{" "}
                  {student?.section
                    ?.name ||
                    student.sectionName}
                </span>
              ) : null}

            </div>
          </div>
        </div>

        <div className="hero-status">
          <div
            className={`status-pill ${status.className}`}
          >
            {score !== null &&
            score >= 80 ? (
              <CheckCircle2
                size={16}
              />
            ) : score !== null &&
              score < 60 ? (
              <AlertCircle
                size={16}
              />
            ) : (
              <Activity
                size={16}
              />
            )}

            {status.label}
          </div>

          <p>
            {status.description}
          </p>
        </div>
      </section>

      {/* ======================================================
          MAIN SCORE + KPI
      ====================================================== */}

      <section className="overview-grid">

        <div className="score-card">

          <div className="score-card-heading">

            <div>
              <span className="section-kicker">
                Overall outlook
              </span>

              <h3>
                Current Performance
              </h3>
            </div>

            <Brain size={22} />
          </div>

          <div className="score-main">

            <div className="score-ring">

              <svg
                viewBox="0 0 160 160"
                className="score-svg"
              >

                <circle
                  cx="80"
                  cy="80"
                  r="68"
                  className="score-track"
                />

                <circle
                  cx="80"
                  cy="80"
                  r="68"
                  className="score-progress"
                  strokeDasharray={`${
                    score !== null
                      ? (score / 100) *
                        427.26
                      : 0
                  } 427.26`}
                />

              </svg>

              <div className="score-value">
                <strong>
                  {formatScore(
                    score
                  )}
                </strong>

                <span>
                  / 100
                </span>
              </div>

            </div>

            <div className="score-explanation">

              <div
                className={`score-status ${status.className}`}
              >
                {status.label}
              </div>

              <p>
                {prediction?.description ||
                  prediction?.message ||
                  aiSummary}
              </p>

              {prediction?.confidence !==
                undefined &&
              prediction?.confidence !==
                null ? (
                <div className="confidence-row">

                  <span>
                    Confidence indicator
                  </span>

                  <strong>
                    {formatPercent(
                      prediction.confidence
                    )}
                  </strong>

                </div>
              ) : null}

            </div>

          </div>
        </div>

        <div className="metrics-grid">

          <MetricCard
            icon={Activity}
            title="Attendance"
            value={formatPercent(
              attendancePercentage
            )}
            subtitle="Participation consistency"
          />

          <MetricCard
            icon={ClipboardCheck}
            title="Assignments"
            value={formatPercent(
              assignmentCompletion
            )}
            subtitle="Completion rate"
          />

          <MetricCard
            icon={GraduationCap}
            title="Assessments"
            value={formatPercent(
              examAverage
            )}
            subtitle="Average performance"
          />

          <MetricCard
            icon={BookOpen}
            title="Subjects"
            value={
              subjects.length > 0
                ? subjects.length
                : "—"
            }
            subtitle="With available scores"
          />

        </div>
      </section>

      {/* ======================================================
          PERFORMANCE TREND
          ONLY PERFORMANCE
          ATTENDANCE REMOVED
      ====================================================== */}

      <section className="chart-card">

        <div className="chart-header">

          <div>

            <span className="section-kicker">
              Academic progress
            </span>

            <h3>
              Performance Trend
            </h3>

            <p>
              Track how available
              academic performance
              has changed over time.
            </p>

          </div>

          <div className="chart-icon">
            <BarChart3 size={21} />
          </div>

        </div>

        {trendData.length >
        0 ? (
          <div className="chart-container">

            <ResponsiveContainer
              width="100%"
              height={330}
            >

              <LineChart
                data={trendData}
                margin={{
                  top: 10,
                  right: 20,
                  left: 0,
                  bottom: 10,
                }}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  domain={[0, 100]}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(
                    value
                  ) =>
                    `${value}%`
                  }
                />

                <Tooltip
                  content={
                    <PerformanceTooltip />
                  }
                />

                <Legend />

                <Line
                  type="monotone"
                  dataKey="score"
                  name="Performance"
                  stroke="#4F46E5"
                  strokeWidth={4}
                  dot={{
                    r: 5,
                    fill: "#4F46E5",
                  }}
                  activeDot={{
                    r: 7,
                    fill: "#4F46E5",
                  }}
                  connectNulls
                />

              </LineChart>

            </ResponsiveContainer>

          </div>
        ) : (
          <EmptyChart
            title="Performance trend is not available yet"
            description="The trend chart will appear when historical academic performance records are available."
          />
        )}

      </section>

      {/* ======================================================
          SUBJECT PERFORMANCE + SCORE
      ====================================================== */}

      <section className="two-column-grid">

        {/* SUBJECT-WISE PERFORMANCE */}

        <div className="chart-card">

          <div className="chart-header">

            <div>

              <span className="section-kicker">
                Subject analysis
              </span>

              <h3>
                Subject-wise Performance
              </h3>

              <p>
                Compare the student's
                available subject
                scores.
              </p>

            </div>

            <div className="chart-icon">
              <BookOpen size={21} />
            </div>

          </div>

          {subjects.length >
          0 ? (
            <div className="chart-container subject-chart">

              <ResponsiveContainer
                width="100%"
                height={350}
              >

                <BarChart
                  data={subjects}
                  margin={{
                    top: 10,
                    right: 10,
                    left: 0,
                    bottom: 55,
                  }}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="name"
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                    height={70}
                    tickLine={false}
                    axisLine={false}
                  />

                  <YAxis
                    domain={[
                      0,
                      100,
                    ]}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(
                      value
                    ) =>
                      `${value}%`
                    }
                  />

                  <Tooltip
                    formatter={(
                      value
                    ) => [
                      `${Math.round(
                        value
                      )}%`,
                      "Score",
                    ]}
                  />

                  {/* =========================================
                      COLORFUL SUBJECT BARS
                  ========================================= */}

                  <Bar
                    dataKey="score"
                    name="Score"
                    radius={[
                      8,
                      8,
                      0,
                      0,
                    ]}
                  >

                    {subjects.map(
                      (
                        subject,
                        index
                      ) => (
                        <Cell
                          key={
                            subject.id ||
                            index
                          }
                          fill={
                            subject.color
                          }
                        />
                      )
                    )}

                  </Bar>

                </BarChart>

              </ResponsiveContainer>

            </div>
          ) : (
            <EmptyChart
              title="Subject scores are not available"
              description="Subject comparison will appear once assessment scores are recorded."
            />
          )}

        </div>

        {/* PERFORMANCE SCORE */}

        <div className="chart-card distribution-card">

          <div className="chart-header">

            <div>

              <span className="section-kicker">
                Current snapshot
              </span>

              <h3>
                Performance Score
              </h3>

              <p>
                Current available
                performance
                indicator.
              </p>

            </div>

            <div className="chart-icon">
              <Target size={21} />
            </div>

          </div>

          {score !== null ? (
            <>

              <div className="pie-container">

                <ResponsiveContainer
                  width="100%"
                  height={260}
                >

                  <PieChart>

                    <Pie
                      data={
                        scoreDistribution
                      }
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={72}
                      outerRadius={98}
                      startAngle={90}
                      endAngle={-270}
                      paddingAngle={2}
                      strokeWidth={0}
                    >

                      {scoreDistribution.map(
                        (
                          entry,
                          index
                        ) => (
                          <Cell
                            key={
                              entry.name
                            }
                            fill={
                              PIE_COLORS[
                                index %
                                  PIE_COLORS.length
                              ]
                            }
                          />
                        )
                      )}

                    </Pie>

                    <Tooltip
                      formatter={(
                        value
                      ) => [
                        `${Math.round(
                          value
                        )}%`,
                        "Percentage",
                      ]}
                    />

                  </PieChart>

                </ResponsiveContainer>

                <div className="pie-center">

                  <strong>
                    {Math.round(
                      score
                    )}
                    %
                  </strong>

                  <span>
                    Current score
                  </span>

                </div>

              </div>

              <div className="score-legend">

                <div>

                  <span className="legend-dot current" />

                  Current score

                  <strong>
                    {Math.round(
                      score
                    )}
                    %
                  </strong>

                </div>

                <div>

                  <span className="legend-dot remaining" />

                  Remaining

                  <strong>
                    {Math.round(
                      100 - score
                    )}
                    %
                  </strong>

                </div>

              </div>

            </>
          ) : (
            <EmptyChart
              title="Score not available"
              description="A score will be shown when sufficient academic information is available."
            />
          )}

        </div>

      </section>

      {/* ======================================================
          ATTENDANCE TREND
          SEPARATE SECTION
      ====================================================== */}

      {attendanceTrendData.length >
        0 && (
        <section className="chart-card">

          <div className="chart-header">

            <div>

              <span className="section-kicker">
                Participation
              </span>

              <h3>
                Attendance Trend
              </h3>

              <p>
                Review attendance
                consistency across
                the available
                periods.
              </p>

            </div>

            <div className="chart-icon">
              <Activity size={21} />
            </div>

          </div>

          <div className="chart-container">

            <ResponsiveContainer
              width="100%"
              height={300}
            >

              <LineChart
                data={
                  attendanceTrendData
                }
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  domain={[
                    0,
                    100,
                  ]}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(
                    value
                  ) =>
                    `${value}%`
                  }
                />

                <Tooltip
                  formatter={(
                    value
                  ) => [
                    `${Math.round(
                      value
                    )}%`,
                    "Attendance",
                  ]}
                />

                <Line
                  type="monotone"
                  dataKey="percentage"
                  name="Attendance"
                  stroke="#10B981"
                  strokeWidth={3}
                  dot={{
                    r: 4,
                    fill: "#10B981",
                  }}
                  activeDot={{
                    r: 6,
                    fill: "#10B981",
                  }}
                />

              </LineChart>

            </ResponsiveContainer>

          </div>

        </section>
      )}

      {/* ======================================================
          QUICK INSIGHTS
      ====================================================== */}

      <section className="insight-summary-grid">

        <div className="mini-insight-card">

          <div className="mini-insight-icon positive">
            <Award size={20} />
          </div>

          <div>

            <span>
              Strongest subject
            </span>

            <strong>
              {strongestSubject
                ? strongestSubject.name
                : "Not available"}
            </strong>

            {strongestSubject && (
              <small>
                {Math.round(
                  strongestSubject.score
                )}
                % available score
              </small>
            )}

          </div>

        </div>

        <div className="mini-insight-card">

          <div className="mini-insight-icon attention">
            <Target size={20} />
          </div>

          <div>

            <span>
              Area needing focus
            </span>

            <strong>
              {weakestSubject
                ? weakestSubject.name
                : "No specific area"}
            </strong>

            {weakestSubject && (
              <small>
                {Math.round(
                  weakestSubject.score
                )}
                % available score
              </small>
            )}

          </div>

        </div>

        <div className="mini-insight-card">

          <div className="mini-insight-icon neutral">
            <BarChart3 size={20} />
          </div>

          <div>

            <span>
              Subjects reviewed
            </span>

            <strong>
              {subjects.length ||
                "—"}
            </strong>

            <small>
              Based on available
              records
            </small>

          </div>

        </div>

      </section>

      {/* ======================================================
          AI EXPLANATION
      ====================================================== */}

      <section className="ai-explanation-card">

        <div className="ai-heading">

          <div className="ai-heading-icon">
            <Brain size={23} />
          </div>

          <div>

            <span className="section-kicker">
              Personalized insight
            </span>

            <h3>
              AI Performance
              Explanation
            </h3>

          </div>

        </div>

        <div className="ai-summary">
          <p>
            {aiSummary}
          </p>
        </div>

        <div className="ai-columns">

          <div className="ai-column">

            <div className="ai-column-title positive-title">

              <CheckCircle2
                size={18}
              />

              Strengths

            </div>

            <ul>

              {aiStrengths.map(
                (
                  item,
                  index
                ) => (
                  <li
                    key={index}
                  >
                    {item}
                  </li>
                )
              )}

            </ul>

          </div>

          <div className="ai-column">

            <div className="ai-column-title attention-title">

              <AlertCircle
                size={18}
              />

              Areas to monitor

            </div>

            <ul>

              {aiFocusAreas.map(
                (
                  item,
                  index
                ) => (
                  <li
                    key={index}
                  >
                    {item}
                  </li>
                )
              )}

            </ul>

          </div>

        </div>

      </section>

      {/* ======================================================
          RECOMMENDATIONS
      ====================================================== */}

      <section className="recommendation-section">

        <div className="section-heading">

          <div>

            <span className="section-kicker">
              Parent action plan
            </span>

            <h3>
              Recommendations
            </h3>

            <p>
              Practical steps based
              on the available
              academic information.
            </p>

          </div>

          <div className="recommendation-heading-icon">
            <Lightbulb size={22} />
          </div>

        </div>

        <div className="recommendations-grid">

          {recommendationList.map(
            (
              recommendation,
              index
            ) => {
              const Icon =
                recommendation.icon;

              return (
                <div
                  className={`recommendation-card recommendation-${recommendation.type}`}
                  key={index}
                >

                  <div className="recommendation-icon">
                    <Icon size={20} />
                  </div>

                  <div>

                    <span className="recommendation-number">
                      Recommendation{" "}
                      {index + 1}
                    </span>

                    <h4>
                      {
                        recommendation.title
                      }
                    </h4>

                    <p>
                      {
                        recommendation.description
                      }
                    </p>

                  </div>

                </div>
              );
            }
          )}

        </div>

      </section>

      {/* ======================================================
          AI RECOMMENDATIONS
      ====================================================== */}

      {aiRecommendations.length >
        0 && (
        <section className="action-plan-card">

          <div className="action-plan-header">

            <div className="action-plan-icon">
              <ClipboardCheck
                size={22}
              />
            </div>

            <div>

              <span className="section-kicker">
                Suggested next steps
              </span>

              <h3>
                Academic Action Plan
              </h3>

            </div>

          </div>

          <div className="action-plan-list">

            {aiRecommendations.map(
              (
                item,
                index
              ) => (
                <div
                  className="action-plan-item"
                  key={index}
                >

                  <div className="action-number">
                    {index + 1}
                  </div>

                  <p>
                    {item}
                  </p>

                </div>
              )
            )}

          </div>

        </section>
      )}

      {/* ======================================================
          PARENT MESSAGE
      ====================================================== */}

      <section className="parent-message">

        <div className="parent-message-icon">
          <Users size={23} />
        </div>

        <div>

          <span className="section-kicker">
            For parents
          </span>

          <h3>
            Supporting your
            child's progress
          </h3>

          <p>
            {aiInsights?.parentMessage ||
              "Use these insights as a guide for supporting consistent learning habits. Regular communication with the student and teachers can help address areas that need additional attention."}
          </p>

        </div>

      </section>

      {/* ======================================================
          FOOTER
      ====================================================== */}

      <div className="performance-footer">

        <span>
          Performance information
          is based only on the
          academic records available
          to your account.
        </span>

        <span>
          CampusIQ Parent Portal
        </span>

      </div>

    </div>
  );
}