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
  UserRound,
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

import "./StudentPerformance.css";

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
  const number = clamp(value);

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

const getStatus = (score) => {
  const value = clamp(score);

  if (value === null) {
    return {
      label: "Not enough data",
      className:
        "student-performance-neutral",
      icon: Activity,
    };
  }

  if (value >= 80) {
    return {
      label: "Strong progress",
      className:
        "student-performance-positive",
      icon: TrendingUp,
    };
  }

  if (value >= 60) {
    return {
      label: "Progressing",
      className:
        "student-performance-medium",
      icon: Activity,
    };
  }

  return {
    label: "Needs attention",
    className:
      "student-performance-attention",
    icon: TrendingDown,
  };
};

/* ============================================================
   TOOLTIP
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
    <div className="student-performance-tooltip">

      <div className="student-performance-tooltip-title">
        {label}
      </div>

      {payload.map(
        (item, index) => (
          <div
            key={index}
            className="student-performance-tooltip-row"
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
   KPI
============================================================ */

function MetricCard({
  icon: Icon,
  title,
  value,
  description,
}) {
  return (
    <div className="student-performance-metric">

      <div className="student-performance-metric-icon">
        <Icon size={20} />
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
}) {
  return (
    <div className="student-performance-snapshot">

      <div className="student-performance-snapshot-icon">
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
   MAIN
============================================================ */

export default function StudentPerformance() {
  const [data, setData] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /* ==========================================================
     LOAD
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
              "/student-portal/performance"
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
            "Student performance error:",
            err
          );

          if (!mounted) {
            return;
          }

          setError(
            err?.response?.data?.error ||
              err?.response?.data?.message ||
              err?.message ||
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
     DATA
  ========================================================== */

  const student =
    data?.student || {};

  const prediction =
    data?.prediction || {};

  const metrics =
    data?.metrics || {};

  const attendance =
    data?.attendance || {};

  const explanation =
    data?.explanation || {};

  const recommendations =
    Array.isArray(
      data?.recommendations
    )
      ? data.recommendations
      : [];

  const trend =
    Array.isArray(
      data?.trend?.points
    )
      ? data.trend.points
      : [];

  const subjects =
    Array.isArray(
      data?.subjects
    )
      ? data.subjects
      : [];

  const overallScore =
    clamp(
      prediction?.score ??
        data?.performance?.score ??
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
     TREND
  ========================================================== */

  const trendData =
    useMemo(() => {
      return trend
        .map(
          (item, index) => ({
            name:
              item?.name ||
              item?.exam ||
              `Assessment ${index + 1}`,

            performance:
              clamp(
                item?.percentage ??
                  item?.score
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
     SUBJECT
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
      <div className="student-performance-loading">

        <Loader2
          size={34}
          className="student-performance-spinner"
        />

        <h2>
          Preparing your performance
        </h2>

        <p>
          Loading your academic
          performance information.
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
    <div className="student-performance-page">

      {/* ====================================================
          HEADER
      ==================================================== */}

      <header className="student-performance-header">

        <div>
          <div className="student-performance-eyebrow">
            AI ACADEMIC INTELLIGENCE
          </div>

          <h1>
            Performance Analytics
          </h1>

          <p>
            Understand your academic progress,
            subject performance, trends and
            recommended areas of focus.
          </p>
        </div>

        <div className="student-performance-ai-badge">

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
          STUDENT
      ==================================================== */}

      <section className="student-performance-student-card">

        <div className="student-performance-student-icon">

          {student?.photoUrl ? (
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
              size={31}
            />
          )}

        </div>

        <div className="student-performance-student-info">

          <span>
            STUDENT PERFORMANCE
          </span>

          <h2>
            {student?.studentName ||
              student?.name ||
              "Student"}
          </h2>

          <div className="student-performance-student-meta">

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

        <div className="student-performance-status-area">

          <div
            className={`student-performance-status ${status.className}`}
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
          SCORE + KPI
      ==================================================== */}

      <section className="student-performance-main-grid">

        <div className="student-performance-score-card">

          <div className="student-performance-section-label">
            OVERALL OUTLOOK
          </div>

          <h2>
            Current Performance
          </h2>

          <div className="student-performance-score-layout">

            <div
              className="student-performance-score-ring"
              style={ringStyle}
            >

              <div className="student-performance-score-inner">

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

            <div className="student-performance-score-details">

              <div
                className={`student-performance-status ${status.className}`}
              >
                <StatusIcon size={15} />

                {prediction?.label ||
                  status.label}
              </div>

              <p>
                This overview combines
                available assessment,
                attendance and assignment
                indicators.
              </p>

              <div className="student-performance-confidence">

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
                    {metrics?.marks ??
                      0}
                  </strong>
                </div>

              </div>

            </div>

          </div>

        </div>

        <div className="student-performance-kpi-grid">

          <MetricCard
            icon={Activity}
            title="Attendance"
            value={formatPercent(
              attendancePercentage
            )}
            description="Participation consistency"
          />

          <MetricCard
            icon={ClipboardCheck}
            title="Assignments"
            value={formatPercent(
              assignmentCompletion
            )}
            description="Completion rate"
          />

          <MetricCard
            icon={GraduationCap}
            title="Assessments"
            value={formatPercent(
              examAverage
            )}
            description="Average performance"
          />

          <MetricCard
            icon={BookOpen}
            title="Subjects"
            value={
              subjects.length
            }
            description="With available scores"
          />

        </div>

      </section>

      {/* ====================================================
          TREND
      ==================================================== */}

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
              Track your assessment performance
              across available examinations.
            </p>
          </div>

          <div className="student-performance-card-icon">
            <TrendingUp size={21} />
          </div>

        </div>

        {trendData.length > 0 ? (
          <div className="student-performance-chart">

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
                    stroke: "#ffffff",
                    strokeWidth: 3,
                  }}
                  activeDot={{
                    r: 8,
                    fill: "#06b6d4",
                    stroke: "#ffffff",
                    strokeWidth: 3,
                  }}
                />

              </LineChart>
            </ResponsiveContainer>

          </div>
        ) : (
          <div className="student-performance-empty-chart">
            <BarChart3 size={35} />

            <h3>
              Performance trend unavailable
            </h3>

            <p>
              Assessment results are required
              before a trend can be displayed.
            </p>
          </div>
        )}

      </section>

      {/* ====================================================
          SUBJECT GRAPH
      ==================================================== */}

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
              Compare your available scores
              across different subjects.
            </p>
          </div>

          <div className="student-performance-card-icon">
            <BookOpen size={21} />
          </div>

        </div>

        {subjectData.length > 0 ? (
          <div className="student-performance-chart">

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
          <div className="student-performance-empty-chart">
            <BookOpen size={35} />

            <h3>
              Subject analysis unavailable
            </h3>

            <p>
              Subject-wise results will appear
              after examination marks are available.
            </p>
          </div>
        )}

      </section>

      {/* ====================================================
          SNAPSHOT
      ==================================================== */}

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
              A quick summary of your current
              academic records.
            </p>
          </div>

          <div className="student-performance-card-icon">
            <BarChart3 size={21} />
          </div>

        </div>

        <div className="student-performance-snapshot-grid">

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

      <section className="student-performance-ai-section">

        <div className="student-performance-ai-header">

          <div className="student-performance-ai-title">

            <div className="student-performance-ai-icon">
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

          <div className="student-performance-ai-status">
            <ShieldCheck size={15} />

            Academic decision support
          </div>

        </div>

        <div className="student-performance-ai-summary">

          <Lightbulb size={19} />

          <p>
            {explanation?.summary ||
              "Your available academic records are being analysed to identify useful performance patterns and areas of focus."}
          </p>

        </div>

        <div className="student-performance-insight-grid">

          <div className="student-performance-insight-card strengths">

            <div className="student-performance-insight-heading">
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

            <div className="student-performance-insight-list">

              {explanation?.strengths?.length ? (
                explanation.strengths.map(
                  (
                    item,
                    index
                  ) => (
                    <div
                      key={index}
                      className="student-performance-insight-item"
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
                <p className="student-performance-empty-text">
                  No specific strengths
                  are available yet.
                </p>
              )}

            </div>

          </div>

          <div className="student-performance-insight-card focus">

            <div className="student-performance-insight-heading">
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

            <div className="student-performance-insight-list">

              {explanation?.focusAreas?.length ? (
                explanation.focusAreas.map(
                  (
                    item,
                    index
                  ) => (
                    <div
                      key={index}
                      className="student-performance-insight-item"
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
                <p className="student-performance-empty-text">
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

      <section className="student-performance-card">

        <div className="student-performance-card-header">

          <div>
            <div className="student-performance-section-label">
              AI-SUPPORTED ACTION PLAN
            </div>

            <h2>
              Recommended Focus
            </h2>

            <p>
              Practical steps based on your
              available academic records.
            </p>
          </div>

          <div className="student-performance-card-icon">
            <Lightbulb size={21} />
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
                  key={index}
                  className="student-performance-recommendation"
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
                          "Recommended action"}
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
            <p className="student-performance-empty-text">
              Recommendations will appear
              when more academic information
              is available.
            </p>
          )}

        </div>

      </section>

      {/* ====================================================
          METHODOLOGY
      ==================================================== */}

      <section className="student-performance-methodology">

        <div className="student-performance-methodology-icon">
          <Brain size={20} />
        </div>

        <div className="student-performance-methodology-content">

          <div className="student-performance-section-label">
            AI PERFORMANCE FRAMEWORK
          </div>

          <h3>
            Data-driven academic monitoring
          </h3>

          <p>
            Performance insights are designed
            to help identify useful academic
            patterns and encourage timely
            improvement.
          </p>

        </div>

        <div className="student-performance-methodology-tags">

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

      <div className="student-performance-footer-note">

        <ShieldCheck size={16} />

        <span>
          This overview is based on the academic
          records currently available in CampusIQ.
        </span>

      </div>

    </div>
  );
}