import {
  useEffect,
  useMemo,
  useState,
} from "react";

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
  Cell,
} from "recharts";

import {
  Activity,
  Award,
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  Lightbulb,
  Loader2,
  Target,
  TrendingUp,
  UserRound,
} from "lucide-react";

import axiosClient from "../api/axios";

import "./StudentPerformance.css";

/* ============================================================
   COLORS
============================================================ */

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
];

/* ============================================================
   HELPERS
============================================================ */

const numberOrNull = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
};

const firstValidNumber = (...values) => {
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

  return Math.round(number);
};

const getStatus = (score) => {
  const value = numberOrNull(score);

  if (value === null) {
    return {
      label: "Not available",
      className:
        "student-performance-neutral",
      description:
        "More academic information is needed to show the current performance outlook.",
    };
  }

  if (value >= 80) {
    return {
      label: "Strong progress",
      className:
        "student-performance-positive",
      description:
        "The available academic indicators show consistent progress.",
    };
  }

  if (value >= 60) {
    return {
      label: "Progressing",
      className:
        "student-performance-medium",
      description:
        "The student is progressing with some areas that can benefit from additional attention.",
    };
  }

  return {
    label: "Needs attention",
    className:
      "student-performance-attention",
    description:
      "Some additional academic support may be useful based on the available records.",
  };
};

/* ============================================================
   COMPONENT
============================================================ */

export default function StudentPerformance() {
  const [data, setData] = useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /* ==========================================================
     LOAD PERFORMANCE
  ========================================================== */

  useEffect(() => {
    let mounted = true;

    const loadPerformance = async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await axiosClient.get(
            "/student-portal/performance"
          );

        const payload =
          response?.data?.data ??
          response?.data ??
          null;

        console.log(
          "STUDENT PERFORMANCE API RESPONSE:",
          payload
        );

        if (!mounted) {
          return;
        }

        setData(payload);
      } catch (err) {
        console.error(
          "Student performance load error:",
          err
        );

        if (!mounted) {
          return;
        }

        setError(
          err?.response?.data?.error ||
            err?.response?.data?.message ||
            "Unable to load your performance information."
        );
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

  /* ==========================================================
     NORMALIZED DATA
  ========================================================== */

  const student =
    data?.student || {};

  const backendPerformance =
    data?.performance || {};

  const backendPrediction =
    data?.prediction || {};

  const backendMetrics =
    data?.metrics || {};

  /*
   * IMPORTANT:
   *
   * Different versions of the performance API may return
   * the overall score in different places.
   *
   * We check all common locations before showing 0.
   */

  const overallScore = firstValidNumber(
    backendPrediction?.score,
    backendPerformance?.score,
    backendPerformance?.overallScore,
    backendPerformance?.overallPercentage,
    backendPerformance?.percentage,
    backendPerformance?.average,
    backendMetrics?.overallScore,
    backendMetrics?.overallPercentage,
    backendMetrics?.percentage,
    data?.overallScore,
    data?.overallPercentage,
    data?.score
  );

  const prediction = {
    ...backendPrediction,

    score: overallScore,

    confidence:
      firstValidNumber(
        backendPrediction?.confidence,
        backendPerformance?.confidence,
        data?.confidence
      ),
  };

  const metrics =
    backendMetrics || {};

  const attendance =
    data?.attendance || {};

  const trend =
    Array.isArray(
      data?.trend?.points
    )
      ? data.trend.points
      : Array.isArray(data?.trend)
      ? data.trend
      : [];

  const subjects =
    Array.isArray(
      data?.subjects
    )
      ? data.subjects
      : [];

  const explanation =
    data?.explanation || {};

  const recommendations =
    Array.isArray(
      data?.recommendations
    )
      ? data.recommendations
      : [];

  /* ==========================================================
     METRIC NORMALIZATION
  ========================================================== */

  const attendancePercentage =
    firstValidNumber(
      metrics?.attendancePercentage,
      metrics?.attendance,
      attendance?.percentage,
      attendance?.attendancePercentage,
      attendance?.summary?.percentage
    );

  const assignmentCompletion =
    firstValidNumber(
      metrics?.assignmentCompletion,
      metrics?.assignmentPercentage,
      metrics?.assignmentsCompletion,
      data?.assignments?.completionPercentage,
      data?.assignments?.completion
    );

  const examAverage =
    firstValidNumber(
      metrics?.examAverage,
      metrics?.examPercentage,
      metrics?.average,
      data?.examAverage
    );

  const subjectsCount =
    firstValidNumber(
      metrics?.subjectsCount,
      metrics?.subjectCount,
      subjects.length
    );

  /* ==========================================================
     SCORE
  ========================================================== */

  const score =
    numberOrNull(
      prediction.score
    );

  const status =
    getStatus(score);

  /* ==========================================================
     CONFIDENCE
  ========================================================== */

  const calculatedConfidence =
    (() => {
      if (
        prediction.confidence !==
          null &&
        prediction.confidence !==
          undefined &&
        Number.isFinite(
          Number(
            prediction.confidence
          )
        )
      ) {
        return Math.min(
          100,
          Math.max(
            0,
            Math.round(
              Number(
                prediction.confidence
              )
            )
          )
        );
      }

      let available = 0;

      let total = 0;

      if (
        numberOrNull(
          examAverage
        ) !== null
      ) {
        available++;
      }

      total++;

      if (
        numberOrNull(
          attendancePercentage
        ) !== null
      ) {
        available++;
      }

      total++;

      if (
        numberOrNull(
          assignmentCompletion
        ) !== null
      ) {
        available++;
      }

      total++;

      if (
        score !== null
      ) {
        available++;
      }

      total++;

      if (total === 0) {
        return 0;
      }

      return Math.round(
        (available / total) *
          100
      );
    })();

  /* ==========================================================
     CHART DATA
  ========================================================== */

  const trendData =
    useMemo(() => {
      return trend
        .map(
          (item, index) => {
            const performance =
              firstValidNumber(
                item?.percentage,
                item?.score,
                item?.marksPercentage,
                item?.average,
                item?.value
              );

            return {
              name:
                item?.name ||
                item?.exam ||
                item?.examName ||
                `Assessment ${
                  index + 1
                }`,

              performance,
            };
          }
        )
        .filter(
          (item) =>
            item.performance !==
            null
        );
    }, [trend]);

  const subjectData =
    useMemo(() => {
      return subjects
        .map(
          (subject, index) => {
            const percentage =
              firstValidNumber(
                subject?.percentage,
                subject?.score,
                subject?.marksPercentage,
                subject?.average,
                subject?.value
              );

            return {
              name:
                subject?.name ||
                subject?.subjectName ||
                `Subject ${
                  index + 1
                }`,

              percentage,

              color:
                SUBJECT_COLORS[
                  index %
                    SUBJECT_COLORS.length
                ],
            };
          }
        )
        .filter(
          (item) =>
            item.percentage !==
            null
        );
    }, [subjects]);

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <div className="student-performance-loading">
        <Loader2
          size={34}
          className="student-performance-spinner"
        />

        <h2>
          Loading your performance...
        </h2>

        <p>
          We are preparing your
          academic overview.
        </p>
      </div>
    );
  }

  /* ==========================================================
     ERROR
  ========================================================== */

  if (error) {
    return (
      <div className="student-performance-error">
        <div className="student-performance-error-icon">
          <Activity size={28} />
        </div>

        <h2>
          Unable to load performance
        </h2>

        <p>{error}</p>

        <button
          type="button"
          onClick={() =>
            window.location.reload()
          }
        >
          Try Again
        </button>
      </div>
    );
  }

  /* ==========================================================
     SCORE RING
  ========================================================== */

  const scoreForRing =
    score === null
      ? 0
      : Math.min(
          100,
          Math.max(
            0,
            score
          )
        );

  const ringStyle = {
    background: `conic-gradient(
      #4F46E5 0deg,
      #06B6D4 ${
        scoreForRing * 1.2
      }deg,
      #10B981 ${
        scoreForRing * 2.4
      }deg,
      #E8EDF7 ${
        scoreForRing * 3.6
      }deg,
      #E8EDF7 360deg
    )`,
  };

  return (
    <div className="student-performance-page">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="student-performance-header">

        <div>
          <div className="student-performance-eyebrow">
            STUDENT PORTAL
          </div>

          <h1>
            Performance Overview
          </h1>

          <p>
            Track your academic
            progress, subject
            performance and areas
            of focus.
          </p>
        </div>

      </div>

      {/* ======================================================
          STUDENT CONTEXT
      ====================================================== */}

      <section className="student-performance-student-card">

        <div className="student-performance-student-icon">
          {student.photoUrl ? (
            <img
              src={
                student.photoUrl
              }
              alt={
                student.studentName ||
                "Student"
              }
            />
          ) : (
            <UserRound
              size={34}
            />
          )}
        </div>

        <div className="student-performance-student-info">

          <span>
            STUDENT PERFORMANCE
          </span>

          <h2>
            {student.studentName ||
              student.name ||
              "Student"}
          </h2>

          <div className="student-performance-student-meta">

            {student.class?.name && (
              <span>
                <GraduationCap
                  size={15}
                />

                {student.class.name}
              </span>
            )}

            {student.section?.name && (
              <span>
                <UsersIcon />

                {student.section.name}
              </span>
            )}

            {student.admissionNo && (
              <span>
                Admission No:{" "}
                {student.admissionNo}
              </span>
            )}

          </div>
        </div>

        <div
          className={`student-performance-status ${status.className}`}
        >
          <CheckCircle2
            size={16}
          />

          {status.label}
        </div>

      </section>

      {/* ======================================================
          MAIN GRID
      ====================================================== */}

      <div className="student-performance-main-grid">

        {/* ====================================================
            SCORE
        ==================================================== */}

        <section className="student-performance-score-card">

          <div className="student-performance-section-label">
            OVERALL OUTLOOK
          </div>

          <h2>
            Current Performance
          </h2>

          <div className="student-performance-score-layout">

            <div className="student-performance-score-ring-wrapper">

              <div
                className="student-performance-score-ring"
                style={ringStyle}
              >
                <div className="student-performance-score-inner">

                  <strong>
                    {formatScore(
                      score
                    )}
                  </strong>

                  <span>
                    /100
                  </span>

                </div>
              </div>

            </div>

            <div className="student-performance-score-text">

              <div
                className={`student-performance-status ${status.className}`}
              >
                <CheckCircle2
                  size={15}
                />

                {status.label}
              </div>

              <p>
                {status.description}
              </p>

              <div className="student-performance-confidence">

                <span>
                  Data confidence
                </span>

                <strong>
                  {calculatedConfidence}%
                </strong>

              </div>

            </div>

          </div>

        </section>

        {/* ====================================================
            KPI GRID
        ==================================================== */}

        <div className="student-performance-kpi-grid">

          <MetricCard
            icon={Activity}
            title="Attendance"
            value={formatPercent(
              attendancePercentage
            )}
            description="Participation consistency"
            color="blue"
          />

          <MetricCard
            icon={ClipboardCheck}
            title="Assignments"
            value={formatPercent(
              assignmentCompletion
            )}
            description="Completion rate"
            color="green"
          />

          <MetricCard
            icon={GraduationCap}
            title="Assessments"
            value={formatPercent(
              examAverage
            )}
            description="Average performance"
            color="purple"
          />

          <MetricCard
            icon={BookOpen}
            title="Subjects"
            value={
              subjectsCount ??
              subjects.length
            }
            description="With available scores"
            color="orange"
          />

        </div>

      </div>

      {/* ======================================================
          PERFORMANCE TREND
      ====================================================== */}

      <section className="student-performance-card">

        <div className="student-performance-card-header">

          <div>
            <div className="student-performance-section-label">
              ACADEMIC PROGRESS
            </div>

            <h2>
              Performance Trend
            </h2>

            <p>
              Track how your available
              assessment performance
              has changed over time.
            </p>
          </div>

          <div className="student-performance-card-icon">
            <TrendingUp size={22} />
          </div>

        </div>

        {trendData.length > 0 ? (
          <div className="student-performance-chart">

            <ResponsiveContainer
              width="100%"
              height={330}
            >
              <LineChart
                data={trendData}
                margin={{
                  top: 20,
                  right: 20,
                  left: 0,
                  bottom: 10,
                }}
              >

                <defs>
                  <linearGradient
                    id="studentPerformanceGradient"
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="0"
                  >
                    <stop
                      offset="0%"
                      stopColor="#4F46E5"
                    />

                    <stop
                      offset="50%"
                      stopColor="#06B6D4"
                    />

                    <stop
                      offset="100%"
                      stopColor="#10B981"
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  stroke="#E5E7EB"
                  strokeDasharray="4 5"
                  vertical={false}
                />

                <XAxis
                  dataKey="name"
                  tick={{
                    fill: "#64748B",
                    fontSize: 12,
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  domain={[0, 100]}
                  tick={{
                    fill: "#64748B",
                    fontSize: 12,
                  }}
                  tickFormatter={(value) =>
                    `${value}%`
                  }
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip
                  contentStyle={{
                    borderRadius: 14,
                    border:
                      "1px solid #E2E8F0",
                    boxShadow:
                      "0 12px 30px rgba(15,23,42,0.10)",
                  }}
                  formatter={(value) => [
                    `${Math.round(
                      value
                    )}%`,
                    "Performance",
                  ]}
                />

                <Line
                  type="monotone"
                  dataKey="performance"
                  stroke="url(#studentPerformanceGradient)"
                  strokeWidth={4}
                  dot={{
                    r: 5,
                    fill: "#4F46E5",
                    strokeWidth: 3,
                    stroke: "#FFFFFF",
                  }}
                  activeDot={{
                    r: 7,
                    fill: "#06B6D4",
                    stroke:
                      "#FFFFFF",
                    strokeWidth: 3,
                  }}
                  connectNulls
                />

              </LineChart>

            </ResponsiveContainer>

          </div>
        ) : (
          <EmptyChart
            message="Assessment trend will appear here once examination results are available."
          />
        )}

      </section>

      {/* ======================================================
          SUBJECT ANALYSIS
      ====================================================== */}

      <section className="student-performance-card">

        <div className="student-performance-card-header">

          <div>
            <div className="student-performance-section-label">
              SUBJECT ANALYSIS
            </div>

            <h2>
              Subject-wise Performance
            </h2>

            <p>
              Compare your available
              subject scores.
            </p>
          </div>

          <div className="student-performance-card-icon">
            <BookOpen size={22} />
          </div>

        </div>

        {subjectData.length > 0 ? (
          <div className="student-performance-chart">

            <ResponsiveContainer
              width="100%"
              height={360}
            >
              <BarChart
                data={subjectData}
                margin={{
                  top: 20,
                  right: 20,
                  left: 0,
                  bottom: 35,
                }}
              >

                <CartesianGrid
                  stroke="#E5E7EB"
                  strokeDasharray="4 5"
                  vertical={false}
                />

                <XAxis
                  dataKey="name"
                  tick={{
                    fill: "#475569",
                    fontSize: 12,
                  }}
                  angle={-20}
                  textAnchor="end"
                  height={65}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  domain={[0, 100]}
                  tick={{
                    fill: "#64748B",
                    fontSize: 12,
                  }}
                  tickFormatter={(value) =>
                    `${value}%`
                  }
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip
                  cursor={{
                    fill: "#F8FAFC",
                  }}
                  contentStyle={{
                    borderRadius: 14,
                    border:
                      "1px solid #E2E8F0",
                    boxShadow:
                      "0 12px 30px rgba(15,23,42,0.10)",
                  }}
                  formatter={(value) => [
                    `${Math.round(
                      value
                    )}%`,
                    "Score",
                  ]}
                />

                <Bar
                  dataKey="percentage"
                  radius={[
                    8,
                    8,
                    0,
                    0,
                  ]}
                  maxBarSize={58}
                >
                  {subjectData.map(
                    (
                      entry,
                      index
                    ) => (
                      <Cell
                        key={`subject-${index}`}
                        fill={
                          entry.color
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
            message="Subject performance will appear here once examination marks are available."
          />
        )}

      </section>

      {/* ======================================================
          CURRENT SNAPSHOT
      ====================================================== */}

      <section className="student-performance-card">

        <div className="student-performance-card-header">

          <div>

            <div className="student-performance-section-label">
              CURRENT SNAPSHOT
            </div>

            <h2>
              Academic Snapshot
            </h2>

            <p>
              A quick summary of the
              academic records currently
              available.
            </p>

          </div>

          <div className="student-performance-card-icon">
            <BarChart3 size={22} />
          </div>

        </div>

        <div className="student-performance-snapshot-grid">

          <SnapshotItem
            icon={GraduationCap}
            label="Assessment Average"
            value={formatPercent(
              examAverage
            )}
            color="purple"
          />

          <SnapshotItem
            icon={CalendarDays}
            label="Attendance"
            value={formatPercent(
              attendancePercentage
            )}
            color="blue"
          />

          <SnapshotItem
            icon={ClipboardCheck}
            label="Assignments"
            value={formatPercent(
              assignmentCompletion
            )}
            color="green"
          />

          <SnapshotItem
            icon={BookOpen}
            label="Subjects"
            value={
              subjectsCount ??
              subjects.length
            }
            color="orange"
          />

        </div>

      </section>

      {/* ======================================================
          INSIGHTS
      ====================================================== */}

      <div className="student-performance-insight-grid">

        {/* STRENGTHS */}

        <section className="student-performance-card student-performance-insight-card">

          <div className="student-performance-insight-title positive">

            <Award size={21} />

            <div>

              <span>
                STRENGTHS
              </span>

              <h2>
                What's going well
              </h2>

            </div>

          </div>

          <div className="student-performance-list">

            {explanation.strengths?.length ? (
              explanation.strengths.map(
                (
                  item,
                  index
                ) => (
                  <div
                    className="student-performance-list-item"
                    key={index}
                  >

                    <CheckCircle2
                      size={17}
                    />

                    <span>
                      {item}
                    </span>

                  </div>
                )
              )
            ) : (
              <div className="student-performance-empty-text">
                No specific strengths
                are available yet.
              </div>
            )}

          </div>

        </section>

        {/* FOCUS AREAS */}

        <section className="student-performance-card student-performance-insight-card">

          <div className="student-performance-insight-title focus">

            <Target size={21} />

            <div>

              <span>
                FOCUS AREAS
              </span>

              <h2>
                Areas to improve
              </h2>

            </div>

          </div>

          <div className="student-performance-list">

            {explanation.focusAreas?.length ? (
              explanation.focusAreas.map(
                (
                  item,
                  index
                ) => (
                  <div
                    className="student-performance-list-item"
                    key={index}
                  >

                    <Target
                      size={17}
                    />

                    <span>
                      {item}
                    </span>

                  </div>
                )
              )
            ) : (
              <div className="student-performance-empty-text">
                No specific focus areas
                are available yet.
              </div>
            )}

          </div>

        </section>

      </div>

      {/* ======================================================
          RECOMMENDATIONS
      ====================================================== */}

      <section className="student-performance-card">

        <div className="student-performance-card-header">

          <div>

            <div className="student-performance-section-label">
              NEXT STEPS
            </div>

            <h2>
              Recommendations
            </h2>

            <p>
              Practical steps based on
              your current academic
              records.
            </p>

          </div>

          <div className="student-performance-card-icon">
            <Lightbulb size={22} />
          </div>

        </div>

        <div className="student-performance-recommendations">

          {recommendations.length ? (
            recommendations.map(
              (
                item,
                index
              ) => (
                <div
                  className="student-performance-recommendation"
                  key={index}
                >

                  <div className="student-performance-recommendation-number">
                    {index + 1}
                  </div>

                  <div>

                    <h3>
                      {typeof item ===
                      "string"
                        ? item
                        : item?.title ||
                          "Recommendation"}
                    </h3>

                    <p>
                      {typeof item ===
                      "string"
                        ? "Continue using this as part of your regular academic routine."
                        : item?.description ||
                          ""}
                    </p>

                  </div>

                </div>
              )
            )
          ) : (
            <div className="student-performance-empty-text">
              Recommendations will
              appear when more academic
              information is available.
            </div>
          )}

        </div>

      </section>

      {/* ======================================================
          FOOTER NOTE
      ====================================================== */}

      <div className="student-performance-footer-note">

        <Activity size={16} />

        <span>
          This overview is based on
          the academic records currently
          available in CampusIQ.
        </span>

      </div>

    </div>
  );
}

/* ============================================================
   METRIC CARD
============================================================ */

function MetricCard({
  icon: Icon,
  title,
  value,
  description,
  color,
}) {
  return (
    <div className="student-performance-metric">

      <div
        className={`student-performance-metric-icon ${color}`}
      >
        <Icon size={22} />
      </div>

      <div>

        <span className="student-performance-metric-title">
          {title}
        </span>

        <strong>
          {value}
        </strong>

        <small>
          {description}
        </small>

      </div>

    </div>
  );
}

/* ============================================================
   SNAPSHOT
============================================================ */

function SnapshotItem({
  icon: Icon,
  label,
  value,
  color,
}) {
  return (
    <div className="student-performance-snapshot">

      <div
        className={`student-performance-snapshot-icon ${color}`}
      >
        <Icon size={20} />
      </div>

      <div>

        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>

      </div>

    </div>
  );
}

/* ============================================================
   EMPTY CHART
============================================================ */

function EmptyChart({
  message,
}) {
  return (
    <div className="student-performance-empty-chart">

      <BarChart3
        size={34}
      />

      <p>
        {message}
      </p>

    </div>
  );
}

/* ============================================================
   SMALL USERS ICON
============================================================ */

function UsersIcon() {
  return (
    <UserRound
      size={15}
    />
  );
}