import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, RefreshCw, Search } from "lucide-react";
import { toast } from "react-toastify";
import { getComplaintAnalytics, getErrorMessage, listComplaints } from "../../api/complaint.api";
import {
  CATEGORY_OPTIONS,
  PRIORITY_OPTIONS,
  SENTIMENT_OPTIONS,
  STATUS_OPTIONS,
  badgeClass,
  formatDate,
  labelOf,
} from "../../utils/complaintMeta";
import ComplaintAnalytics from "./ComplaintAnalytics";
import ComplaintDetailModal from "./ComplaintDetailModal";
import "../../styles/complaint-badges.css";
import "./Complaints.css";

const RANGE_OPTIONS = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "365", label: "Last year" },
  { value: "all", label: "All time" },
];

const EMPTY_FILTERS = {
  status: "",
  category: "",
  priority: "",
  sentiment: "",
  search: "",
  sort: "newest",
};

function FilterSelect({ label, value, options, onChange }) {
  return (
    <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">{label}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export default function Complaints() {
  const [range, setRange] = useState("30");
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [list, setList] = useState({
    items: [],
    pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
  });
  const [listLoading, setListLoading] = useState(true);

  const [selectedId, setSelectedId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((key) => key + 1), []);

  /* ---------- analytics ---------- */

  useEffect(() => {
    let ignore = false;
    setAnalyticsLoading(true);

    getComplaintAnalytics(range)
      .then((data) => !ignore && setAnalytics(data))
      .catch((error) => !ignore && toast.error(getErrorMessage(error, "Could not load analytics.")))
      .finally(() => !ignore && setAnalyticsLoading(false));

    return () => {
      ignore = true;
    };
  }, [range, refreshKey]);

  /* ---------- list ---------- */

  useEffect(() => {
    let ignore = false;
    setListLoading(true);

    listComplaints({ ...filters, page, limit: 10 })
      .then((data) => !ignore && setList(data))
      .catch((error) => !ignore && toast.error(getErrorMessage(error, "Could not load complaints.")))
      .finally(() => !ignore && setListLoading(false));

    return () => {
      ignore = true;
    };
  }, [filters, page, refreshKey]);

  /* ---------- search (waits until typing pauses) ---------- */

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((current) =>
        current.search === searchInput.trim() ? current : { ...current, search: searchInput.trim() }
      );
      setPage(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const setFilter = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }));
    setPage(1);
  };

  const hasFilters = Object.entries(filters).some(
    ([key, value]) => key !== "sort" && value !== ""
  );

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setSearchInput("");
    setPage(1);
  };

  const { items, pagination } = list;

  return (
    <div className="cmp-page">
      <header className="cmp-page-head">
        <div>
          <h1>Complaint management</h1>
          <p>Complaints from parents, sorted and analysed by AI.</p>
        </div>

        <div className="cmp-head-actions">
          <select aria-label="Analytics period" value={range} onChange={(event) => setRange(event.target.value)}>
            {RANGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button type="button" className="cmp-btn" onClick={refresh}>
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </header>

      <ComplaintAnalytics data={analytics} loading={analyticsLoading} />

      {/* ---------- complaint queue ---------- */}
      <section className="cmp-panel cmp-queue">
        <div className="cmp-queue-head">
          <h3>All complaints</h3>

          <div className="cmp-filters">
            <label className="cmp-search">
              <Search size={15} />
              <input
                type="search"
                placeholder="Search subject, problem or ticket"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
              />
            </label>

            <FilterSelect label="All statuses" value={filters.status} options={STATUS_OPTIONS} onChange={(v) => setFilter("status", v)} />
            <FilterSelect label="All categories" value={filters.category} options={CATEGORY_OPTIONS} onChange={(v) => setFilter("category", v)} />
            <FilterSelect label="All priorities" value={filters.priority} options={PRIORITY_OPTIONS} onChange={(v) => setFilter("priority", v)} />
            <FilterSelect label="All sentiments" value={filters.sentiment} options={SENTIMENT_OPTIONS} onChange={(v) => setFilter("sentiment", v)} />

            <select aria-label="Sort by" value={filters.sort} onChange={(event) => setFilter("sort", event.target.value)}>
              <option value="newest">Newest first</option>
              <option value="priority">Highest priority first</option>
            </select>

            {hasFilters && (
              <button type="button" className="cmp-btn cmp-btn--ghost" onClick={clearFilters}>
                Clear filters
              </button>
            )}
          </div>
        </div>

        <div className="cmp-table-scroll">
          <table className="cmp-table">
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Complaint</th>
                <th>Student</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Sentiment</th>
                <th>Status</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {listLoading && items.length === 0 && (
                <tr>
                  <td colSpan={8} className="cmp-table-note">
                    <Loader2 className="cmp-spin" size={16} /> Loading complaints...
                  </td>
                </tr>
              )}

              {!listLoading && items.length === 0 && (
                <tr>
                  <td colSpan={8} className="cmp-table-note">
                    {hasFilters
                      ? "No complaints match these filters."
                      : "No complaints yet. They appear here as soon as a parent submits one."}
                  </td>
                </tr>
              )}

              {items.map((complaint) => {
                const analysing = complaint.aiStatus === "PENDING";

                return (
                  <tr
                    key={complaint.id}
                    tabIndex={0}
                    onClick={() => setSelectedId(complaint.id)}
                    onKeyDown={(event) => event.key === "Enter" && setSelectedId(complaint.id)}
                  >
                    <td className="cmp-ticket-cell">{complaint.ticketNo}</td>
                    <td>
                      <span className="cmp-subject">{complaint.subject}</span>
                      {complaint.issueTag && <span className="cmp-subtext">{complaint.issueTag}</span>}
                    </td>
                    <td>{complaint.student?.name || <span className="cmp-muted">General</span>}</td>
                    <td>
                      {analysing ? (
                        <span className="cmp-muted">Analysing...</span>
                      ) : (
                        <span className="cmp-badge cmp-badge--category">{labelOf(CATEGORY_OPTIONS, complaint.category)}</span>
                      )}
                    </td>
                    <td>
                      {analysing ? (
                        <span className="cmp-muted">-</span>
                      ) : (
                        <span className={badgeClass(complaint.priority)}>{labelOf(PRIORITY_OPTIONS, complaint.priority)}</span>
                      )}
                    </td>
                    <td>
                      {analysing ? (
                        <span className="cmp-muted">-</span>
                      ) : (
                        <span className={badgeClass(complaint.sentiment)}>{labelOf(SENTIMENT_OPTIONS, complaint.sentiment)}</span>
                      )}
                    </td>
                    <td>
                      <span className={badgeClass(complaint.status)}>{labelOf(STATUS_OPTIONS, complaint.status)}</span>
                    </td>
                    <td>{formatDate(complaint.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <footer className="cmp-pager">
          <span>
            {pagination.total} complaint{pagination.total === 1 ? "" : "s"}
          </span>
          <div>
            <button
              type="button"
              className="cmp-icon-btn"
              aria-label="Previous page"
              onClick={() => setPage((current) => Math.max(current - 1, 1))}
              disabled={pagination.page <= 1}
            >
              <ChevronLeft size={18} />
            </button>
            <span>
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              type="button"
              className="cmp-icon-btn"
              aria-label="Next page"
              onClick={() => setPage((current) => Math.min(current + 1, pagination.totalPages))}
              disabled={pagination.page >= pagination.totalPages}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </footer>
      </section>

      {selectedId && (
        <ComplaintDetailModal
          complaintId={selectedId}
          onClose={() => setSelectedId(null)}
          onChanged={refresh}
        />
      )}
    </div>
  );
}
