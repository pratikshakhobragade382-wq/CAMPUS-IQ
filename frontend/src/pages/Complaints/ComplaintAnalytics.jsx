import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Inbox,
  Loader2,
  Timer,
} from "lucide-react";
import {
  CATEGORY_OPTIONS,
  PRIORITY_OPTIONS,
  SENTIMENT_OPTIONS,
  formatHours,
  labelOf,
} from "../../utils/complaintMeta";

/*
============================================================
 COMPLAINT ANALYTICS
 Pure CSS charts, so no extra npm package is needed.
============================================================
*/

const SENTIMENT_COLORS = {
  POSITIVE: "#8fd14f",
  NEUTRAL: "#9db8d6",
  NEGATIVE: "#f28b6b",
};

const PRIORITY_COLORS = {
  LOW: "#b8ec7a",
  MEDIUM: "#8cc3f2",
  HIGH: "#ffb066",
  CRITICAL: "#ee6b5e",
};

const percent = (count, total) => (total ? Math.round((count / total) * 100) : 0);

/* ---------------- Summary strip ---------------- */

function SummaryStrip({ totals, avgResolutionHours }) {
  const cells = [
    { icon: Inbox, label: "Total complaints", value: totals.total },
    { icon: Clock, label: "Pending", value: totals.pending },
    { icon: Loader2, label: "In progress", value: totals.inProgress },
    {
      icon: CheckCircle2,
      label: "Resolved",
      value: totals.resolved,
      note: `${totals.resolutionRate}% resolution rate`,
    },
    {
      icon: Timer,
      label: "Avg. resolution time",
      value: formatHours(avgResolutionHours),
    },
    {
      icon: AlertTriangle,
      label: "Critical and open",
      value: totals.criticalOpen,
      tone: totals.criticalOpen > 0 ? "alert" : "",
    },
  ];

  return (
    <section className="cmp-summary" aria-label="Complaint summary">
      {cells.map(({ icon: Icon, label, value, note, tone }) => (
        <div key={label} className={`cmp-summary-cell ${tone ? `cmp-summary-cell--${tone}` : ""}`}>
          <span className="cmp-summary-icon">
            <Icon size={18} />
          </span>
          <div>
            <p className="cmp-summary-value">{value}</p>
            <p className="cmp-summary-label">{label}</p>
            {note && <p className="cmp-summary-note">{note}</p>}
          </div>
        </div>
      ))}
    </section>
  );
}

/* ---------------- Category bars ---------------- */

function CategoryBars({ items }) {
  const sorted = [...items].sort((a, b) => b.count - a.count);
  const max = Math.max(...sorted.map((i) => i.count), 1);

  return (
    <ul className="cmp-bars">
      {sorted.map((item, index) => (
        <li key={item.key} className="cmp-bar-row">
          <span className="cmp-bar-label">{labelOf(CATEGORY_OPTIONS, item.key)}</span>
          <span className="cmp-bar-track">
            <span
              className={`cmp-bar-fill ${index === 0 && item.count > 0 ? "cmp-bar-fill--top" : ""}`}
              style={{ width: `${(item.count / max) * 100}%` }}
            />
          </span>
          <span className="cmp-bar-count">{item.count}</span>
        </li>
      ))}
    </ul>
  );
}

/* ---------------- Sentiment donut ---------------- */

function SentimentDonut({ items }) {
  const total = items.reduce((sum, i) => sum + i.count, 0);

  let cursor = 0;
  const stops = total
    ? items
        .filter((i) => i.count > 0)
        .map((i) => {
          const start = cursor;
          cursor += (i.count / total) * 100;
          return `${SENTIMENT_COLORS[i.key]} ${start}% ${cursor}%`;
        })
        .join(", ")
    : "#eceff4 0% 100%";

  return (
    <div className="cmp-donut-wrap">
      <div className="cmp-donut" style={{ background: `conic-gradient(${stops})` }} role="img" aria-label="Sentiment distribution">
        <div className="cmp-donut-hole">
          <strong>{total}</strong>
          <span>complaints</span>
        </div>
      </div>

      <ul className="cmp-legend">
        {items.map((item) => (
          <li key={item.key}>
            <span className="cmp-dot" style={{ background: SENTIMENT_COLORS[item.key] }} />
            <span>{labelOf(SENTIMENT_OPTIONS, item.key)}</span>
            <strong>{item.count}</strong>
            <span className="cmp-muted">{percent(item.count, total)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- Priority split ---------------- */

function PrioritySplit({ items }) {
  const total = items.reduce((sum, i) => sum + i.count, 0);

  return (
    <>
      <div className="cmp-split" role="img" aria-label="Priority distribution">
        {total === 0 ? (
          <span className="cmp-split-empty" />
        ) : (
          items
            .filter((i) => i.count > 0)
            .map((i) => (
              <span
                key={i.key}
                className="cmp-split-part"
                style={{ width: `${(i.count / total) * 100}%`, background: PRIORITY_COLORS[i.key] }}
                title={`${labelOf(PRIORITY_OPTIONS, i.key)}: ${i.count}`}
              />
            ))
        )}
      </div>

      <ul className="cmp-legend cmp-legend--inline">
        {items.map((item) => (
          <li key={item.key}>
            <span className="cmp-dot" style={{ background: PRIORITY_COLORS[item.key] }} />
            <span>{labelOf(PRIORITY_OPTIONS, item.key)}</span>
            <strong>{item.count}</strong>
          </li>
        ))}
      </ul>
    </>
  );
}

/* ---------------- Most common problems ---------------- */

function TopIssues({ items }) {
  if (!items.length) {
    return (
      <p className="cmp-empty-note">
        No problems tagged yet. Tags appear as new complaints are analysed.
      </p>
    );
  }

  const max = Math.max(...items.map((i) => i.count), 1);

  return (
    <ol className="cmp-issues">
      {items.map((item) => (
        <li key={item.issue}>
          <div className="cmp-issue-head">
            <span>{item.issue}</span>
            <strong>{item.count}</strong>
          </div>
          <span className="cmp-bar-track cmp-bar-track--thin">
            <span className="cmp-bar-fill" style={{ width: `${(item.count / max) * 100}%` }} />
          </span>
        </li>
      ))}
    </ol>
  );
}

/* ---------------- Department table ---------------- */

function DepartmentTable({ items }) {
  if (!items.length) {
    return <p className="cmp-empty-note">No complaints in this period.</p>;
  }

  return (
    <div className="cmp-table-scroll">
      <table className="cmp-mini-table">
        <thead>
          <tr>
            <th>Department</th>
            <th>Total</th>
            <th>Open</th>
            <th>Resolved</th>
            <th>Avg. time</th>
            <th>Resolution rate</th>
          </tr>
        </thead>
        <tbody>
          {items.map((d) => (
            <tr key={d.department}>
              <td>{d.department}</td>
              <td>{d.total}</td>
              <td>{d.open}</td>
              <td>{d.resolved}</td>
              <td>{formatHours(d.avgResolutionHours)}</td>
              <td>
                <div className="cmp-rate">
                  <span className="cmp-bar-track cmp-bar-track--thin">
                    <span className="cmp-bar-fill cmp-bar-fill--green" style={{ width: `${d.resolutionRate}%` }} />
                  </span>
                  <span>{d.resolutionRate}%</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- Main ---------------- */

export default function ComplaintAnalytics({ data, loading }) {
  if (!data) {
    return (
      <div className="cmp-panel cmp-loading">
        {loading ? "Loading analytics..." : "Analytics are not available right now."}
      </div>
    );
  }

  return (
    <div className={`cmp-analytics ${loading ? "is-refreshing" : ""}`}>
      <SummaryStrip totals={data.totals} avgResolutionHours={data.avgResolutionHours} />

      <div className="cmp-grid">
        <section className="cmp-panel cmp-span-2">
          <h3>Complaints by category</h3>
          <CategoryBars items={data.byCategory} />
        </section>

        <section className="cmp-panel">
          <h3>Sentiment distribution</h3>
          <SentimentDonut items={data.bySentiment} />
          <h3 className="cmp-subhead">Priority split</h3>
          <PrioritySplit items={data.byPriority} />
        </section>

        <section className="cmp-panel">
          <h3>Most common problems</h3>
          <TopIssues items={data.topIssues} />
        </section>

        <section className="cmp-panel cmp-span-2">
          <h3>Department performance</h3>
          <DepartmentTable items={data.departments} />
        </section>
      </div>
    </div>
  );
}
