import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getClasses } from "../api/class.api";
import { getStudents } from "../api/student.api";
import { DataTable } from "../components/tables/DataTable";
import { Avatar } from "../components/ui/Avatar";
import { StatusBadge } from "../components/ui/Badge";
import { Pagination } from "../components/ui/Pagination";
import { Select } from "../components/ui/Select";
import { useDebounce, useToast } from "../hooks";
import TeacherTopbar from "./components/TeacherTopbar";

import "./TeacherDashboard.css";
import "./TeacherStudents.css";

const EMPTY_PAGINATION = {
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
};

function getPrimaryParent(student) {
  const parents = student?.parents || [];

  return (
    parents.find((parent) => parent.relation === "father") ||
    parents.find((parent) => parent.relation === "mother") ||
    parents.find((parent) => parent.relation === "guardian") ||
    null
  );
}

function formatGender(gender) {
  if (!gender) return "—";
  return `${gender.charAt(0).toUpperCase()}${gender.slice(1)}`;
}

function getErrorMessage(error) {
  if (!error.response) {
    return "Unable to connect to Campus IQ. Check your network and try again.";
  }

  const apiMessage =
    error.response.data?.error ||
    error.response.data?.message;

  switch (error.response.status) {
    case 401:
      return "Your session has expired. Please sign in again.";
    case 403:
      return "You do not have permission to view students.";
    case 404:
      return "The student resource could not be found.";
    case 500:
      return "Campus IQ could not load students. Please try again.";
    default:
      return apiMessage || "Failed to load students.";
  }
}

export default function TeacherStudents() {
  const { showError } = useToast();
  const studentRequestId = useRef(0);

  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [classId, setClassId] = useState("");
  const [gender, setGender] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);

  const debouncedSearch = useDebounce(search, 350);

  useEffect(
    () => () => {
      studentRequestId.current += 1;
    },
    []
  );

  useEffect(() => {
    let isCurrent = true;

    const loadClasses = async () => {
      try {
        const response = await getClasses();
        const classList = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
            ? response
            : [];

        if (isCurrent) setClasses(classList);
      } catch {
        if (isCurrent) {
          setClasses([]);
          showError("Class filters could not be loaded.");
        }
      }
    };

    loadClasses();

    return () => {
      isCurrent = false;
    };
  }, [showError]);

  const fetchStudents = useCallback(async () => {
    const requestId = studentRequestId.current + 1;
    studentRequestId.current = requestId;

    try {
      setLoading(true);
      setError("");

      const response = await getStudents({
        page,
        limit,
        search: debouncedSearch,
        classId: classId || undefined,
        gender: gender || undefined,
      });

      const payload = response?.data || {};
      const nextPagination = payload.pagination || {
        ...EMPTY_PAGINATION,
        page,
        limit,
      };

      if (requestId !== studentRequestId.current) return;

      setStudents(payload.students || []);
      setPagination(nextPagination);
    } catch (requestError) {
      if (requestId !== studentRequestId.current) return;

      const message = getErrorMessage(requestError);
      setStudents([]);
      setPagination({
        ...EMPTY_PAGINATION,
        page,
        limit,
      });
      setError(message);
      showError(message);
    } finally {
      if (requestId === studentRequestId.current) {
        setLoading(false);
      }
    }
  }, [classId, debouncedSearch, gender, limit, page, showError]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStudents();
  }, [fetchStudents]);

  const classOptions = useMemo(
    () =>
      classes.map((classItem) => ({
        value: classItem.id,
        label: classItem.name,
      })),
    [classes]
  );

  const columns = useMemo(
    () => [
      {
        header: "Student",
        render: (student) => (
          <div className="teacher-student-identity">
            <Avatar
              src={student.photoUrl}
              alt={student.studentName}
              name={student.studentName}
              size="md"
            />
            <div>
              <p className="teacher-student-name">
                {student.studentName || "Unnamed student"}
              </p>
              <p className="teacher-student-number">
                {student.admissionNo || student.grNo || "—"}
              </p>
            </div>
          </div>
        ),
      },
      {
        header: "Roll Number",
        render: (student) => student.rollNo || "—",
      },
      {
        header: "Class",
        render: (student) => student.class?.name || "—",
      },
      {
        header: "Section",
        render: (student) => student.section?.name || "—",
      },
      {
        header: "Gender",
        render: (student) => formatGender(student.gender),
      },
      {
        header: "Parent Name",
        render: (student) => {
          const parent = getPrimaryParent(student);
          return parent?.name || student.fatherName || student.motherName || "—";
        },
      },
      {
        header: "Parent Contact",
        render: (student) => {
          const parent = getPrimaryParent(student);
          const contact =
            parent?.mobile ||
            student.communicationMobile ||
            student.emergencyPhoneNo;

          return contact ? <a href={`tel:${contact}`}>{contact}</a> : "—";
        },
      },
      {
        header: "Status",
        render: () => <StatusBadge status="active">Active</StatusBadge>,
      },
    ],
    []
  );

  const handleSearchChange = (value) => {
    setSearch(value);
    setPage(1);
  };

  const resetFilters = () => {
    setSearch("");
    setClassId("");
    setGender("");
    setPage(1);
  };

  const hasFilters = Boolean(search || classId || gender);

  return (
    <div className="teacher-panel">
      <TeacherTopbar
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search students"
      />

      <main className="teacher-main-content">
        <div className="teacher-page-heading teacher-students-heading">
          <div>
            <h1>Students</h1>
            <p>View active student details, classes, and parent contacts.</p>
          </div>

          <div className="teacher-current-date">
            <i className="fa-solid fa-user-graduate" aria-hidden="true"></i>
            <span>
              {pagination.total} student{pagination.total === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        <section className="teacher-students-filter-card">
          <div className="teacher-students-filter">
            <Select
              aria-label="Filter students by class"
              placeholder="All classes"
              options={classOptions}
              value={classId}
              onChange={(event) => {
                setClassId(event.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="teacher-students-filter">
            <Select
              aria-label="Filter students by gender"
              placeholder="All genders"
              options={[
                { value: "male", label: "Male" },
                { value: "female", label: "Female" },
                { value: "other", label: "Other" },
              ]}
              value={gender}
              onChange={(event) => {
                setGender(event.target.value);
                setPage(1);
              }}
            />
          </div>

          {hasFilters && (
            <button
              type="button"
              className="teacher-students-reset"
              onClick={resetFilters}
            >
              Clear filters
            </button>
          )}

          <p className="teacher-students-search-help">
            Search supports student name, admission number, and GR number.
          </p>
        </section>

        {error && (
          <div className="teacher-students-alert" role="alert">
            <i
              className="fa-solid fa-circle-exclamation"
              aria-hidden="true"
            ></i>
            <span>{error}</span>
            <button type="button" onClick={fetchStudents}>
              Try again
            </button>
          </div>
        )}

        <section className="teacher-students-card">
          <div className="teacher-students-card-header">
            <div>
              <h2>Student List</h2>
              <p>Active students returned by the school directory.</p>
            </div>
          </div>

          {loading ? (
            <div className="teacher-students-loading" aria-live="polite">
              <span className="spinner" aria-hidden="true"></span>
              <span>Loading students...</span>
            </div>
          ) : students.length === 0 ? (
            <div className="teacher-empty-content teacher-students-empty">
              <div className="teacher-empty-icon blue">
                <i className="fa-solid fa-user-graduate" aria-hidden="true"></i>
              </div>
              <h3>No Students Found</h3>
              <p>Try changing the search or available filters.</p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={students}
              className="teacher-students-table"
            />
          )}

          {!loading && pagination.total > 0 && (
            <div className="teacher-students-pagination">
              <Pagination
                currentPage={pagination.page || page}
                totalPages={Math.max(pagination.totalPages || 1, 1)}
                pageSize={limit}
                totalItems={pagination.total}
                onPageChange={setPage}
                onPageSizeChange={(pageSize) => {
                  setLimit(pageSize);
                  setPage(1);
                }}
              />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
