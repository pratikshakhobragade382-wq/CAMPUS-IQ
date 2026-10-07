import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Activity,
  AlertCircle,
  Award,
  BarChart3,
  BookOpen,
  Brain,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  Lightbulb,
  Loader2,
  ShieldCheck,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";

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

import axiosClient from "../api/axios";

import "./AIPerformancePredictor.css";

/* ============================================================
   HELPERS
============================================================ */

const toNumber = (value) => {
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

const clamp = (value) => {
  const number = toNumber(value);

  if (number === null) {
    return null;
  }

  return Math.max(
    0,
    Math.min(100, number)
  );
};

const rounded = (value) => {
  const number = toNumber(value);

  return number === null
    ? null
    : Math.round(number);
};

const formatPercent = (value) => {
  const number = clamp(value);

  return number === null
    ? "—"
    : `${Math.round(number)}%`;
};

/* ============================================================
   STATUS
============================================================ */

const getStatus = (score) => {
  const value = clamp(score);

  if (value === null) {
    return {
      label: "Not enough data",
      className: "parent-performance-neutral",
      icon: Activity,
    };
  }

  if (value >= 80) {
    return {
      label: "Strong progress",
      className: "parent-performance-good",
      icon: TrendingUp,
    };
  }

  if (value >= 60) {
    return {
      label: "Progressing",
      className: "parent-performance-medium",
      icon: Activity,
    };
  }

  return {
    label: "Needs attention",
    className: "parent-performance-warning",
    icon: TrendingDown,
  };
};

/* ============================================================
   SUBJECT COLORS
============================================================ */

const SUBJECT_COLORS = [
  "#5146e5",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#8b5cf6",
  "#ef4444",
  "#14b8a6",
  "#f97316",
  "#3b82f6",
];

/* ============================================================
   CUSTOM TOOLTIP
============================================================ */

function PerformanceTooltip({
  active,
  payload,
  label,
}) {
  if (
    !active ||
    !payload ||
    !payload.length
  ) {
    return null;
  }

  return (
    <div className="parent-performance-tooltip">
      <div className="parent-performance-tooltip-title">
        {label}
      </div>

      {payload.map(
        (item, index) => (
          <div
            key={index}
            className="parent-performance-tooltip-row"
          >
            <span>
              {item.name}
            </span>

            <strong>
              {rounded(item.value)}%
            </strong>
          </div>
        )
      )}
    </div>
  );
}

/* ============================================================
   KPI CARD
============================================================ */

function MetricCard({
  icon: Icon,
  title,
  value,
  subtitle,
}) {
  return (
    <div className="parent-performance-metric">
      <div className="parent-performance-metric-icon">
        <Icon size={20} />
      </div>

      <div className="parent-performance-metric-content">
        <span>
          {title}
        </span>

        <strong>
          {value}
        </strong>

        <small>
          {subtitle}
        </small>
      </div>
    </div>
  );
}

/* ============================================================
   SNAPSHOT ITEM
============================================================ */

function SnapshotItem({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="parent-performance-snapshot">
      <div className="parent-performance-snapshot-icon">
        <Icon size={19} />
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
   MAIN COMPONENT
============================================================ */

export default function AIPerformancePredictor() {
  const [data, setData] = useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /* ==========================================================
     LOAD DATA
  ========================================================== */

  useEffect(() => {
    let mounted = true;

    const loadPerformance =
      async () => {
        try {
          setLoading(true);
          setError("");

          const response =
            await axiosClient.get(
              "/parents/performance"
            );

          const payload =
            response?.data?.data ??
            response?.data ??
            null;

          if (!mounted) {
            return;
          }

          setData(payload);
        } catch (err) {
          console.error(
            "Parent performance error:",
            err
          );

          if (!mounted) {
            return;
          }

          setError(
            err?.response?.data?.message ||
              err?.response?.data?.error ||
              err?.message ||
              "Unable to load performance information."
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
     DATA
  ========================================================== */

  const tracker =
    data?.tracker || {};

  const student =
    tracker?.student || {};

  const prediction =
    tracker?.prediction || {};

  const metrics =
    tracker?.metrics || {};

  const attendance =
    tracker?.attendance || {};

  const trend =
    Array.isArray(
      tracker?.trend?.points
    )
      ? tracker.trend.points
      : [];

  const subjects =
    Array.isArray(
      tracker?.subjects
    )
      ? tracker.subjects
      : [];

  const explanation =
    tracker?.explanation || {};

  const recommendations =
    Array.isArray(
      tracker?.recommendations
    )
      ? tracker.recommendations
      : [];

  const overallScore =
    clamp(
      prediction?.score ??
        metrics?.overallScore
    );

  const attendancePercentage =
    clamp(
      metrics?.attendancePercentage ??
        attendance?.percentage ??
        attendance?.attendancePercentage
    );

  const assignmentCompletion =
    clamp(
      metrics?.assignmentCompletion
    );

  const examAverage =
    clamp(
      metrics?.examAverage
    );

  const status =
    getStatus(
      overallScore
    );

  const StatusIcon =
    status.icon;

  /* ==========================================================
     TREND DATA
  ========================================================== */

  const trendData =
    useMemo(() => {
      return trend
        .map(
          (item, index) => ({
            name:
              item?.name ||
              item?.exam ||
              item?.label ||
              `Assessment ${index + 1}`,

            performance:
              clamp(
                item?.percentage ??
                  item?.score ??
                  item?.marks
              ),
          })
        )
        .filter(
          (item) =>
            item.performance !==
            null
        );
    }, [trend]);

  /* ==========================================================
     SUBJECT DATA
  ========================================================== */

  const subjectData =
    useMemo(() => {
      return subjects
        .map(
          (subject, index) => ({
            name:
              subject?.name ||
              subject?.subjectName ||
              `Subject ${index + 1}`,

            percentage:
              clamp(
                subject?.percentage ??
                  subject?.score ??
                  subject?.average
              ),

            color:
              SUBJECT_COLORS[
                index %
                  SUBJECT_COLORS.length
              ],
          })
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
      <div className="parent-performance-loading">
        <div className="parent-performance-loader">
          <Loader2
            size={32}
          />
        </div>

        <h2>
          Preparing performance insights
        </h2>

        <p>
          Loading your child's academic
          performance data.
        </p>
      </div>
    );
  }

  /* ==========================================================
     ERROR
  ========================================================== */

  if (error) {
    return (
      <div className="parent-performance-error">
        <div className="parent-performance-error-icon">
          <AlertCircle size={28} />
        </div>

        <h2>
          Unable to load performance
        </h2>

        <p>
          {error}
        </p>

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
     RING
  ========================================================== */

  const score =
    overallScore === null
      ? 0
      : overallScore;

  const ringStyle = {
    background: `conic-gradient(
      #5146e5 0deg,
      #6366f1 ${score * 1.8}deg,
      #06b6d4 ${score * 2.8}deg,
      #10b981 ${score * 3.6}deg,
      #e9e7f8 ${score * 3.6}deg
    )`,
  };

  return (
    <div className="parent-performance-page">

      {/* ====================================================
          HEADER
      ==================================================== */}

      <header className="parent-performance-header">

        <div>
          <div className="parent-performance-eyebrow">
            AI ACADEMIC INTELLIGENCE
          </div>

          <h1>
            Performance Analytics
          </h1>

          <p>
            A professional overview of your
            child's academic progress, trends,
            subject performance and areas that
            may need attention.
          </p>
        </div>

        <div className="parent-performance-ai-badge">
          <Brain size={17} />

          <div>
            <strong>
              AI Performance
            </strong>

            <span>
              Academic decision support
            </span>
          </div>
        </div>

      </header>

      {/* ====================================================
          STUDENT OVERVIEW
      ==================================================== */}

      <section className="parent-performance-student-card">

        <div className="parent-performance-avatar">
          {student?.photoUrl ? (
            <img
              src={
                student.photoUrl
              }
              alt={
                student.name ||
                "Student"
              }
            />
          ) : (
            student?.name
              ?.charAt(0)
              ?.toUpperCase() || "S"
          )}
        </div>

        <div className="parent-performance-student-info">

          <span>
            STUDENT
          </span>

          <h2>
            {student?.name ||
              student?.studentName ||
              "Student"}
          </h2>

          <div className="parent-performance-student-meta">

            {student?.class?.name && (
              <span>
                <GraduationCap
                  size={15}
                />

                {student.class.name}
              </span>
            )}

            {student?.section?.name && (
              <span>
                <Users
                  size={15}
                />

                Section{" "}
                {student.section.name}
              </span>
            )}

            {student?.admissionNo && (
              <span>
                Admission No:{" "}
                {student.admissionNo}
              </span>
            )}

          </div>
        </div>

        <div className="parent-performance-status-area">

          <div
            className={`parent-performance-status ${status.className}`}
          >
            <StatusIcon size={15} />

            {prediction?.label ||
              status.label}
          </div>

          <span>
            Current academic outlook
          </span>

        </div>

      </section>

      {/* ====================================================
          TOP ANALYTICS
      ==================================================== */}

      <section className="parent-performance-main-grid">

        {/* SCORE */}

        <div className="parent-performance-score-card">

          <div className="parent-performance-card-label">
            OVERALL OUTLOOK
          </div>

          <h2>
            Current Performance
          </h2>

          <div className="parent-performance-score-layout">

            <div
              className="parent-performance-score-ring"
              style={ringStyle}
            >
              <div className="parent-performance-score-inner">

                <strong>
                  {overallScore !==
                  null
                    ? rounded(
                        overallScore
                      )
                    : "—"}
                </strong>

                <span>
                  /100
                </span>

              </div>
            </div>

            <div className="parent-performance-score-details">

              <div
                className={`parent-performance-status ${status.className}`}
              >
                <StatusIcon size={15} />

                {prediction?.label ||
                  status.label}
              </div>

              <p>
                The current score combines
                available assessment,
                attendance and assignment
                information.
              </p>

              <div className="parent-performance-confidence">

                <div>
                  <span>
                    Data confidence
                  </span>

                  <strong>
                    {prediction?.confidence ??
                      "—"}
                    %
                  </strong>
                </div>

                <div>
                  <span>
                    Assessments
                  </span>

                  <strong>
                    {metrics?.marksCount ??
                      0}
                  </strong>
                </div>

              </div>

            </div>

          </div>

        </div>

        {/* KPI */}

        <div className="parent-performance-kpi-grid">

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
              subjects.length
            }
            subtitle="With available scores"
          />

        </div>

      </section>

      {/* ====================================================
          PERFORMANCE TREND
      ==================================================== */}

      <section className="parent-performance-card">

        <div className="parent-performance-card-header">

          <div>
            <div className="parent-performance-card-label">
              ACADEMIC PROGRESS
            </div>

            <h2>
              Performance Trend
            </h2>

            <p>
              Follow how assessment performance
              has changed across available exams.
            </p>
          </div>

          <div className="parent-performance-card-icon">
            <TrendingUp size={21} />
          </div>

        </div>

        {trendData.length > 0 ? (
          <div className="parent-performance-chart">

            <ResponsiveContainer
              width="100%"
              height={340}
            >
              <LineChart
                data={trendData}
                margin={{
                  top: 15,
                  right: 20,
                  left: 0,
                  bottom: 10,
                }}
              >

                <CartesianGrid
                  stroke="#e5e7eb"
                  strokeDasharray="4 5"
                  vertical={false}
                />

                <XAxis
                  dataKey="name"
                  tick={{
                    fill: "#64748b",
                    fontSize: 12,
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  domain={[
                    0,
                    100,
                  ]}
                  tick={{
                    fill: "#64748b",
                    fontSize: 12,
                  }}
                  tickFormatter={(value) =>
                    `${value}%`
                  }
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip
                  content={
                    <PerformanceTooltip />
                  }
                />

                <Line
                  type="monotone"
                  dataKey="performance"
                  name="Performance"
                  stroke="#5146e5"
                  strokeWidth={4}
                  dot={{
                    r: 5,
                    fill: "#5146e5",
                    stroke: "#fff",
                    strokeWidth: 3,
                  }}
                  activeDot={{
                    r: 8,
                    fill: "#06b6d4",
                    stroke: "#fff",
                    strokeWidth: 3,
                  }}
                />

              </LineChart>
            </ResponsiveContainer>

          </div>
        ) : (
          <div className="parent-performance-empty-chart">
            <BarChart3 size={35} />

            <h3>
              Performance trend unavailable
            </h3>

            <p>
              More assessment results are
              required before a trend can be
              displayed.
            </p>
          </div>
        )}

      </section>

      {/* ====================================================
          SUBJECT ANALYSIS
      ==================================================== */}

      <section className="parent-performance-card">

        <div className="parent-performance-card-header">

          <div>
            <div className="parent-performance-card-label">
              SUBJECT ANALYSIS
            </div>

            <h2>
              Subject-wise Performance
            </h2>

            <p>
              Compare performance across
              subjects using the available
              examination records.
            </p>
          </div>

          <div className="parent-performance-card-icon">
            <BookOpen size={21} />
          </div>

        </div>

        {subjectData.length > 0 ? (
          <div className="parent-performance-chart">

            <ResponsiveContainer
              width="100%"
              height={370}
            >
              <BarChart
                data={subjectData}
                margin={{
                  top: 20,
                  right: 20,
                  left: 0,
                  bottom: 55,
                }}
              >

                <CartesianGrid
                  stroke="#e5e7eb"
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
                  height={70}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  domain={[
                    0,
                    100,
                  ]}
                  tick={{
                    fill: "#64748b",
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
                    fill: "#f8fafc",
                  }}
                  contentStyle={{
                    border:
                      "1px solid #e2e8f0",
                    borderRadius: 14,
                    boxShadow:
                      "0 14px 35px rgba(15,23,42,0.10)",
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
                    9,
                    9,
                    2,
                    2,
                  ]}
                  maxBarSize={62}
                >
                  {subjectData.map(
                    (
                      entry,
                      index
                    ) => (
                      <Cell
                        key={
                          `subject-${index}`
                        }
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
          <div className="parent-performance-empty-chart">
            <BookOpen size={35} />

            <h3>
              Subject analysis unavailable
            </h3>

            <p>
              Subject-wise results will
              appear after examination marks
              are available.
            </p>
          </div>
        )}

      </section>

      {/* ====================================================
          SNAPSHOT
      ==================================================== */}

      <section className="parent-performance-card">

        <div className="parent-performance-card-header">

          <div>
            <div className="parent-performance-card-label">
              CURRENT SNAPSHOT
            </div>

            <h2>
              Academic Snapshot
            </h2>

            <p>
              Quick indicators from the
              records currently available.
            </p>
          </div>

          <div className="parent-performance-card-icon">
            <BarChart3 size={21} />
          </div>

        </div>

        <div className="parent-performance-snapshot-grid">

          <SnapshotItem
            icon={GraduationCap}
            label="Assessment Average"
            value={formatPercent(
              examAverage
            )}
          />

          <SnapshotItem
            icon={Activity}
            label="Attendance"
            value={formatPercent(
              attendancePercentage
            )}
          />

          <SnapshotItem
            icon={ClipboardCheck}
            label="Assignments"
            value={formatPercent(
              assignmentCompletion
            )}
          />

          <SnapshotItem
            icon={BookOpen}
            label="Subjects"
            value={
              subjects.length
            }
          />

        </div>

      </section>

      {/* ====================================================
          AI INSIGHTS
      ==================================================== */}

      <section className="parent-performance-ai-section">

        <div className="parent-performance-ai-header">

          <div className="parent-performance-ai-title">

            <div className="parent-performance-ai-icon">
              <Brain size={21} />
            </div>

            <div>
              <span>
                AI ANALYSIS
              </span>

              <h2>
                Performance Insights
              </h2>
            </div>

          </div>

          <div className="parent-performance-ai-status">
            <ShieldCheck size={15} />

            Academic decision support
          </div>

        </div>

        <div className="parent-performance-ai-summary">

          <div className="parent-performance-ai-summary-icon">
            <Lightbulb size={19} />
          </div>

          <p>
            {explanation?.summary ||
              "The available academic records are being analysed to identify useful performance patterns and areas of focus."}
          </p>

        </div>

        <div className="parent-performance-insight-grid">

          {/* STRENGTHS */}

          <div className="parent-performance-insight-card strengths">

            <div className="parent-performance-insight-heading">
              <CheckCircle2 size={19} />

              <div>
                <span>
                  STRENGTHS
                </span>

                <h3>
                  What's going well
                </h3>
              </div>
            </div>

            <div className="parent-performance-insight-list">

              {explanation?.strengths?.length ? (
                explanation.strengths.map(
                  (
                    item,
                    index
                  ) => (
                    <div
                      key={index}
                      className="parent-performance-insight-item"
                    >
                      <CheckCircle2
                        size={16}
                      />

                      <span>
                        {item}
                      </span>
                    </div>
                  )
                )
              ) : (
                <p className="parent-performance-empty-text">
                  No specific strengths
                  are available yet.
                </p>
              )}

            </div>

          </div>

          {/* FOCUS */}

          <div className="parent-performance-insight-card focus">

            <div className="parent-performance-insight-heading">
              <Target size={19} />

              <div>
                <span>
                  FOCUS AREAS
                </span>

                <h3>
                  Areas to improve
                </h3>
              </div>
            </div>

            <div className="parent-performance-insight-list">

              {explanation?.focusAreas?.length ? (
                explanation.focusAreas.map(
                  (
                    item,
                    index
                  ) => (
                    <div
                      key={index}
                      className="parent-performance-insight-item"
                    >
                      <Target
                        size={16}
                      />

                      <span>
                        {item}
                      </span>
                    </div>
                  )
                )
              ) : (
                <p className="parent-performance-empty-text">
                  No specific focus areas
                  are available yet.
                </p>
              )}

            </div>

          </div>

        </div>

      </section>

      {/* ====================================================
          RECOMMENDATIONS
      ==================================================== */}

      <section className="parent-performance-card">

        <div className="parent-performance-card-header">

          <div>
            <div className="parent-performance-card-label">
              AI-SUPPORTED ACTION PLAN
            </div>

            <h2>
              Recommended Focus
            </h2>

            <p>
              Practical academic steps based
              on the available performance data.
            </p>
          </div>

          <div className="parent-performance-card-icon">
            <Lightbulb size={21} />
          </div>

        </div>

        <div className="parent-performance-recommendations">

          {recommendations.length ? (
            recommendations.map(
              (
                item,
                index
              ) => (
                <div
                  key={index}
                  className="parent-performance-recommendation"
                >

                  <div className="parent-performance-recommendation-number">
                    {index + 1}
                  </div>

                  <div>
                    <h3>
                      {typeof item ===
                      "string"
                        ? item
                        : item?.title ||
                          "Recommended action"}
                    </h3>

                    <p>
                      {typeof item ===
                      "string"
                        ? "Continue using this as part of a regular academic routine."
                        : item?.description ||
                          ""}
                    </p>
                  </div>

                </div>
              )
            )
          ) : (
            <div className="parent-performance-empty-text">
              Recommendations will appear
              when more academic information
              becomes available.
            </div>
          )}

        </div>

      </section>

      {/* ====================================================
          METHODOLOGY
      ==================================================== */}

      <section className="parent-performance-methodology">

        <div className="parent-performance-methodology-icon">
          <Brain size={20} />
        </div>

        <div className="parent-performance-methodology-content">

          <div className="parent-performance-card-label">
            AI PERFORMANCE FRAMEWORK
          </div>

          <h3>
            Data-driven academic monitoring
          </h3>

          <p>
            Performance insights are intended
            to support early academic attention
            and communication between students,
            parents and the school. They should
            not be treated as a final academic
            decision.
          </p>

        </div>

        <div className="parent-performance-methodology-tags">

          <span>
            Academic Data
          </span>

          <span>
            Risk Analysis
          </span>

          <span>
            AI Insights
          </span>

        </div>

      </section>

      {/* ====================================================
          FOOTER
      ==================================================== */}

      <div className="parent-performance-footer">

        <ShieldCheck size={17} />

        <span>
          This report is generated from the
          academic records currently available
          in CampusIQ.
        </span>

      </div>

    </div>
  );
}