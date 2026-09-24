import {
  useEffect,
  useState,
} from "react";

import {
  Activity,
  AlertCircle,
  BarChart3,
  BookOpen,
  Brain,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  Lightbulb,
  Users,
} from "lucide-react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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

  if (number === null) {
    return null;
  }

  return Math.round(number);
};


/* ============================================================
   PERFORMANCE STATUS
============================================================ */

const getPerformanceStatus = (score) => {
  if (score === null) {
    return {
      label: "Not enough data",
      className:
        "performance-status-neutral",
    };
  }

  if (score >= 75) {
    return {
      label: "On Track",
      className:
        "performance-status-good",
    };
  }

  if (score >= 55) {
    return {
      label: "Progressing",
      className:
        "performance-status-progress",
    };
  }

  return {
    label: "Needs Attention",
    className:
      "performance-status-warning",
  };
};


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
    <div className="performance-tooltip">

      <div className="performance-tooltip-label">
        {label}
      </div>

      {payload.map(
        (item, index) => (
          <div
            key={index}
            className="performance-tooltip-value"
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
   METRIC CARD
============================================================ */

function MetricCard({
  icon: Icon,
  title,
  value,
  subtitle,
}) {
  return (
    <div className="performance-metric-card">

      <div className="performance-metric-icon">
        <Icon size={21} />
      </div>

      <div className="performance-metric-content">

        <span className="performance-metric-title">
          {title}
        </span>

        <strong className="performance-metric-value">
          {value}
        </strong>

        <span className="performance-metric-subtitle">
          {subtitle}
        </span>

      </div>

    </div>
  );
}


/* ============================================================
   MAIN COMPONENT
============================================================ */

export default function AIPerformancePredictor() {

  const [data, setData] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  /* ==========================================================
     FETCH DATA
  ========================================================== */

  useEffect(() => {

    let mounted = true;

    const fetchPerformance =
      async () => {

        try {

          setLoading(true);
          setError("");

          const response =
            await axiosClient.get(
              "/parents/performance"
            );

          if (!mounted) {
            return;
          }

          setData(
            response?.data?.data ||
            null
          );

        } catch (err) {

          console.error(
            "AI Performance Predictor error:",
            err
          );

          if (mounted) {

            setError(
              err?.response?.data?.message ||
              err?.message ||
              "Unable to load performance data."
            );

          }

        } finally {

          if (mounted) {
            setLoading(false);
          }

        }

      };

    fetchPerformance();

    return () => {
      mounted = false;
    };

  }, []);


  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {

    return (
      <div className="performance-page">

        <div className="performance-loading">

          <div className="performance-loading-spinner" />

          <h3>
            Loading performance...
          </h3>

          <p>
            Preparing your child's
            academic performance report.
          </p>

        </div>

      </div>
    );
  }


  /* ==========================================================
     ERROR
  ========================================================== */

  if (error) {

    return (
      <div className="performance-page">

        <div className="performance-error">

          <AlertCircle size={38} />

          <h3>
            Unable to load performance
          </h3>

          <p>
            {error}
          </p>

        </div>

      </div>
    );
  }


  /* ==========================================================
     SAFE DATA EXTRACTION
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
    tracker?.trend || {};

  const explanation =
    tracker?.explanation || {};

  const subjects =
    Array.isArray(
      tracker?.subjects
    )
      ? tracker.subjects
      : [];

  const recommendations =
    Array.isArray(
      tracker?.recommendations
    )
      ? tracker.recommendations
      : [];


  /* ==========================================================
     REAL ATTENDANCE
  ========================================================== */

  const attendancePercentage =
    clamp(
      metrics?.attendancePercentage ??
      attendance?.attendancePercentage ??
      attendance?.percentage
    );


  /* ==========================================================
     OVERALL SCORE
  ========================================================== */

  const overallScore =
    clamp(
      prediction?.score ??
      metrics?.overallScore
    );


  const performanceStatus =
    getPerformanceStatus(
      overallScore
    );


  /* ==========================================================
     ASSIGNMENT
  ========================================================== */

  const assignmentPercentage =
    clamp(
      metrics?.assignmentCompletion ??
      metrics?.assignmentCompletionPercentage ??
      tracker?.assignments?.completionPercentage
    );


  /* ==========================================================
     ASSESSMENT
  ========================================================== */

  const assessmentPercentage =
    clamp(
      metrics?.examAverage ??
      metrics?.assessmentAverage ??
      tracker?.exams?.average
    );


  /* ==========================================================
     TREND
  ========================================================== */

  let trendData = [];

  if (
    Array.isArray(
      trend?.points
    )
  ) {

    trendData =
      trend.points
        .map((item) => ({
          name:
            item?.name ||
            item?.exam ||
            item?.label ||
            "Assessment",

          score:
            clamp(
              item?.percentage ??
              item?.score ??
              item?.marks
            ),
        }))
        .filter(
          (item) =>
            item.score !== null
        );

  }


  /* ==========================================================
     SUBJECT COUNT
  ========================================================== */

  const subjectCount =
    subjects.length;


  /* ==========================================================
     PAGE
  ========================================================== */

  return (
    <div className="performance-page">

      {/* ====================================================
          HEADER
      ==================================================== */}

      <div className="performance-page-header">

        <div>

          <div className="performance-eyebrow">
            PARENT PORTAL
          </div>

          <h1>
            AI Performance Predictor
          </h1>

          <p>
            A clear view of your child's
            academic progress, trends and
            recommended areas of focus.
          </p>

        </div>

      </div>


      {/* ====================================================
          STUDENT
      ==================================================== */}

      <section className="student-overview-card">

        <div className="student-avatar">

          {student?.name
            ?.charAt(0)
            ?.toUpperCase() || "S"}

        </div>


        <div className="student-overview-info">

          <div className="performance-eyebrow">
            STUDENT PERFORMANCE OVERVIEW
          </div>

          <h2>
            {student?.name ||
              "Student"}
          </h2>

          <div className="student-meta">

            <span>

              <GraduationCap
                size={14}
              />

              {student?.class?.name ||
                student?.className ||
                "Class"}

            </span>


            <span>

              <Users
                size={14}
              />

              {student?.section?.name
                ? `Section ${student.section.name}`
                : "Section"}

            </span>

          </div>

        </div>


        <div className="student-overview-status">

          <div
            className={`status-pill ${performanceStatus.className}`}
          >

            <Activity size={15} />

            {prediction?.label ||
              performanceStatus.label}

          </div>

          <p>
            The student is progressing,
            with some areas that can benefit
            from additional attention.
          </p>

        </div>

      </section>


      {/* ====================================================
          SUMMARY
      ==================================================== */}

      <section className="performance-summary-grid">

        {/* OVERALL */}

        <div className="overall-performance-card">

          <div className="overall-performance-header">

            <div>

              <div className="performance-eyebrow">
                OVERALL OUTLOOK
              </div>

              <h2>
                Current Performance
              </h2>

            </div>

            <Brain
              size={22}
              className="summary-brain-icon"
            />

          </div>


          <div className="overall-performance-body">

            <div className="score-circle-wrapper">

              <div
                className="score-circle"
                style={{
                  "--score":
                    overallScore ??
                    0,
                }}
              >

                <div className="score-circle-inner">

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

            </div>


            <div className="overall-performance-details">

              <div
                className={`small-status ${performanceStatus.className}`}
              >
                {prediction?.label ||
                  performanceStatus.label}
              </div>

              <p>
                The performance report is
                based on the available
                examination, attendance and
                assignment records. The
                current academic pattern is
                shown through performance
                score, attendance, assignment
                completion and assessment
                trends.
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
                    {rounded(
                      prediction.confidence
                    )}
                    %
                  </strong>

                </div>

              ) : null}

            </div>

          </div>

        </div>


        {/* METRICS */}

        <div className="metrics-grid">

          <MetricCard
            icon={Activity}
            title="Attendance"
            value={
              attendancePercentage !==
              null
                ? `${rounded(
                    attendancePercentage
                  )}%`
                : "—"
            }
            subtitle="Teacher recorded"
          />


          <MetricCard
            icon={ClipboardCheck}
            title="Assignments"
            value={
              assignmentPercentage !==
              null
                ? `${rounded(
                    assignmentPercentage
                  )}%`
                : "—"
            }
            subtitle="Completion rate"
          />


          <MetricCard
            icon={GraduationCap}
            title="Assessments"
            value={
              assessmentPercentage !==
              null
                ? `${rounded(
                    assessmentPercentage
                  )}%`
                : "—"
            }
            subtitle="Average performance"
          />


          <MetricCard
            icon={BookOpen}
            title="Subjects"
            value={
              subjectCount
            }
            subtitle="With available scores"
          />

        </div>

      </section>


      {/* ====================================================
          TREND
      ==================================================== */}

      <section className="performance-trend-card">

        <div className="performance-card-header">

          <div>

            <div className="performance-eyebrow">
              ACADEMIC PROGRESS
            </div>

            <h2>
              Performance Trend
            </h2>

            <p>
              Track how available academic
              performance has changed over time.
            </p>

          </div>

          <div className="performance-card-icon">

            <BarChart3
              size={21}
            />

          </div>

        </div>


        {trendData.length > 0 ? (

          <div className="performance-chart">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <LineChart
                data={trendData}
                margin={{
                  top: 10,
                  right: 20,
                  left: 0,
                  bottom: 5,
                }}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey="name"
                  tick={{
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
                  dataKey="score"
                  name="Performance"
                  stroke="#5146e5"
                  strokeWidth={3}
                  dot={{
                    r: 5,
                    fill: "#5146e5",
                  }}
                  activeDot={{
                    r: 7,
                  }}
                />

              </LineChart>

            </ResponsiveContainer>

          </div>

        ) : (

          <div className="empty-trend">

            <BarChart3
              size={35}
            />

            <h3>
              Performance trend unavailable
            </h3>

            <p>
              More assessment records
              are required to display
              the trend.
            </p>

          </div>

        )}

      </section>


      {/* ====================================================
          INSIGHTS
      ==================================================== */}

      <section className="insights-card">

        <div className="performance-card-header">

          <div>

            <div className="performance-eyebrow">
              AI ANALYSIS
            </div>

            <h2>
              Performance Insights
            </h2>

          </div>

          <div className="performance-card-icon">

            <Brain
              size={21}
            />

          </div>

        </div>


        <div className="insights-summary">

          <p>
            {explanation?.summary ||
              "The performance report is generated from the available academic records."}
          </p>

        </div>


        <div className="insights-columns">

          <div className="insight-column">

            <div className="insight-title positive">

              <CheckCircle2
                size={18}
              />

              Strengths

            </div>


            <ul>

              {Array.isArray(
                explanation?.strengths
              ) &&
              explanation.strengths.length >
                0 ? (

                explanation.strengths.map(
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
                )

              ) : (

                <li>
                  Strength information
                  will appear when more
                  academic records are
                  available.
                </li>

              )}

            </ul>

          </div>


          <div className="insight-column">

            <div className="insight-title attention">

              <AlertCircle
                size={18}
              />

              Areas to Improve

            </div>


            <ul>

              {Array.isArray(
                explanation?.focusAreas
              ) &&
              explanation.focusAreas.length >
                0 ? (

                explanation.focusAreas.map(
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
                )

              ) : (

                <li>
                  Areas for improvement
                  will appear when more
                  academic records are
                  available.
                </li>

              )}

            </ul>

          </div>

        </div>

      </section>


      {/* ====================================================
          RECOMMENDATIONS
      ==================================================== */}

      <section className="recommendations-card">

        <div className="performance-card-header">

          <div>

            <div className="performance-eyebrow">
              RECOMMENDED FOCUS
            </div>

            <h2>
              Recommendations
            </h2>

            <p>
              Suggested areas of focus
              based on available records.
            </p>

          </div>

          <div className="performance-card-icon">

            <Lightbulb
              size={21}
            />

          </div>

        </div>


        <div className="recommendations-list">

          {recommendations.length >
          0 ? (

            recommendations.map(
              (
                recommendation,
                index
              ) => (

                <div
                  className="recommendation-item"
                  key={index}
                >

                  <div className="recommendation-number">
                    {index + 1}
                  </div>

                  <div>

                    <strong>
                      Recommendation{" "}
                      {index + 1}
                    </strong>

                    <p>
                      {recommendation}
                    </p>

                  </div>

                </div>

              )
            )

          ) : (

            <div className="recommendation-item">

              <div className="recommendation-number">
                1
              </div>

              <div>

                <strong>
                  Continue monitoring
                  academic progress
                </strong>

                <p>
                  Keep checking attendance,
                  assignments and assessment
                  performance regularly.
                </p>

              </div>

            </div>

          )}

        </div>

      </section>


      {/* ====================================================
          FOOTER
      ==================================================== */}

      <section className="performance-footer-card">

        <div className="performance-footer-icon">

          <GraduationCap
            size={25}
          />

        </div>

        <div>

          <div className="performance-eyebrow">
            KEEP SUPPORTING
          </div>

          <h2>
            Your child's progress matters
          </h2>

          <p>
            Use this report to understand
            strengths, identify areas that
            need more practice and maintain
            consistent academic habits.
          </p>

        </div>

      </section>

    </div>
  );
}