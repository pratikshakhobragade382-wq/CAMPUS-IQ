import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  getClasses,
  getClassSections,
} from "../api/class.api";

import {
  getStudents,
  getStudentsBySection,
} from "../api/student.api";

import { DataTable } from "../components/tables/DataTable";
import { Avatar } from "../components/ui/Avatar";
import { StatusBadge } from "../components/ui/Badge";
import { Pagination } from "../components/ui/Pagination";
import { Select } from "../components/ui/Select";

import {
  useDebounce,
  useToast,
} from "../hooks";

import TeacherTopbar from "./components/TeacherTopbar";

import "./TeacherDashboard.css";
import "./TeacherStudents.css";


const EMPTY_PAGINATION = {
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
};


/*
 * ============================================================
 * PARENT HELPER
 * ============================================================
 */

function getPrimaryParent(student) {
  const parents = student?.parents || [];

  return (
    parents.find(
      (parent) => parent.relation === "father"
    ) ||
    parents.find(
      (parent) => parent.relation === "mother"
    ) ||
    parents.find(
      (parent) => parent.relation === "guardian"
    ) ||
    null
  );
}


/*
 * ============================================================
 * ERROR MESSAGE
 * ============================================================
 */

function getErrorMessage(error) {
  if (!error.response) {
    return "Unable to connect to Campus IQ. Check that the backend is running.";
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
      return (
        apiMessage ||
        "The requested student information was not found."
      );

    case 500:
      return (
        apiMessage ||
        "Campus IQ could not load students. Please try again."
      );

    default:
      return (
        apiMessage ||
        "Failed to load students."
      );
  }
}


/*
 * ============================================================
 * MAIN COMPONENT
 * ============================================================
 */

export default function TeacherStudents() {

  const { showError } = useToast();

  const requestIdRef = useRef(0);

  const [students, setStudents] = useState([]);

  const [classes, setClasses] = useState([]);

  const [sections, setSections] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [classId, setClassId] = useState("");

  const [sectionId, setSectionId] =
    useState("");

  const [page, setPage] = useState(1);

  const [limit, setLimit] = useState(10);

  const [pagination, setPagination] =
    useState(EMPTY_PAGINATION);

  const debouncedSearch =
    useDebounce(search, 350);


  /*
   * ==========================================================
   * LOAD CLASSES
   * ==========================================================
   */

  useEffect(() => {

    let active = true;

    const loadClasses = async () => {

      try {

        const response =
          await getClasses();

        const classList =
          Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response)
              ? response
              : [];

        if (active) {
          setClasses(classList);
        }

      } catch (err) {

        console.error(
          "Failed to load classes:",
          err
        );

        if (active) {

          setClasses([]);

          showError(
            "Class filters could not be loaded."
          );
        }
      }
    };

    loadClasses();

    return () => {
      active = false;
    };

  }, [showError]);


  /*
   * ==========================================================
   * LOAD SECTIONS WHEN CLASS CHANGES
   * ==========================================================
   */

  useEffect(() => {

    let active = true;

    const loadSections = async () => {

      if (!classId) {

        setSections([]);

        setSectionId("");

        return;
      }

      try {

        const response =
          await getClassSections(classId);

        const sectionList =
          Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response)
              ? response
              : [];

        if (active) {

          setSections(sectionList);
        }

      } catch (err) {

        console.error(
          "Failed to load sections:",
          err
        );

        if (active) {

          setSections([]);

          setSectionId("");

          showError(
            "Sections could not be loaded."
          );
        }
      }
    };

    loadSections();

    return () => {
      active = false;
    };

  }, [classId, showError]);


  /*
   * ==========================================================
   * LOAD STUDENTS
   * ==========================================================
   */

  const fetchStudents =
    useCallback(async () => {

      const currentRequest =
        requestIdRef.current + 1;

      requestIdRef.current =
        currentRequest;

      try {

        setLoading(true);

        setError("");


        /*
         * ----------------------------------------------------
         * CASE 1:
         * SECTION SELECTED
         *
         * Use the dedicated backend endpoint.
         * ----------------------------------------------------
         */

        if (classId && sectionId) {

          const response =
            await getStudentsBySection(
              classId,
              sectionId
            );

          const sectionData =
            response?.data || {};

          let sectionStudents =
            Array.isArray(
              sectionData.students
            )
              ? sectionData.students
              : [];


          /*
           * Add class + section information
           * so the table can display it.
           */

          const selectedClass =
            classes.find(
              (item) =>
                String(item.id) ===
                String(classId)
            );

          sectionStudents =
            sectionStudents.map(
              (student) => ({
                ...student,

                class: {
                  id: Number(classId),

                  name:
                    selectedClass?.name ||
                    "—",
                },

                section: {
                  id: Number(sectionId),

                  name:
                    sectionData.section
                      ?.name || "—",
                },
              })
            );


          /*
           * Search inside the selected section.
           */

          const searchText =
            debouncedSearch
              .trim()
              .toLowerCase();

          if (searchText) {

            sectionStudents =
              sectionStudents.filter(
                (student) => {

                  const name =
                    String(
                      student.studentName ||
                      ""
                    ).toLowerCase();

                  const admissionNo =
                    String(
                      student.admissionNo ||
                      ""
                    ).toLowerCase();

                  const grNo =
                    String(
                      student.grNo ||
                      ""
                    ).toLowerCase();

                  return (
                    name.includes(searchText) ||
                    admissionNo.includes(searchText) ||
                    grNo.includes(searchText)
                  );
                }
              );
          }


          /*
           * Client-side pagination for section data.
           */

          const total =
            sectionStudents.length;

          const start =
            (page - 1) * limit;

          const end =
            start + limit;

          const pageStudents =
            sectionStudents.slice(
              start,
              end
            );


          if (
            currentRequest !==
            requestIdRef.current
          ) {
            return;
          }

          setStudents(pageStudents);

          setPagination({
            total,

            page,

            limit,

            totalPages:
              Math.ceil(
                total / limit
              ),
          });

          return;
        }


        /*
         * ----------------------------------------------------
         * CASE 2:
         * NO SECTION SELECTED
         *
         * Use the normal students endpoint.
         * ----------------------------------------------------
         */

        const response =
          await getStudents({
            page,
            limit,
            search: debouncedSearch,
            classId:
              classId || undefined,
          });


        const payload =
          response?.data || {};


        if (
          currentRequest !==
          requestIdRef.current
        ) {
          return;
        }


        setStudents(
          payload.students || []
        );


        setPagination(
          payload.pagination || {
            ...EMPTY_PAGINATION,

            page,

            limit,
          }
        );

      } catch (err) {

        console.error(
          "Failed to load students:",
          err
        );


        if (
          currentRequest !==
          requestIdRef.current
        ) {
          return;
        }


        const message =
          getErrorMessage(err);


        setStudents([]);

        setPagination({
          ...EMPTY_PAGINATION,

          page,

          limit,
        });

        setError(message);

        showError(message);

      } finally {

        if (
          currentRequest ===
          requestIdRef.current
        ) {

          setLoading(false);
        }
      }

    }, [
      classId,
      sectionId,
      page,
      limit,
      debouncedSearch,
      classes,
      showError,
    ]);


  /*
   * ==========================================================
   * FETCH WHEN FILTERS CHANGE
   * ==========================================================
   */

  useEffect(() => {

    fetchStudents();

  }, [fetchStudents]);


  /*
   * ==========================================================
   * CLASS OPTIONS
   * ==========================================================
   */

  const classOptions =
    useMemo(
      () =>
        classes.map(
          (classItem) => ({
            value:
              classItem.id,

            label:
              classItem.name,
          })
        ),

      [classes]
    );


  /*
   * ==========================================================
   * SECTION OPTIONS
   * ==========================================================
   */

  const sectionOptions =
    useMemo(
      () =>
        sections.map(
          (section) => ({
            value:
              section.id,

            label:
              section.name,
          })
        ),

      [sections]
    );


  /*
   * ==========================================================
   * TABLE COLUMNS
   * ==========================================================
   */

  const columns =
    useMemo(
      () => [

        {
          header: "Student",

          render: (student) => (

            <div className="teacher-student-identity">

              <Avatar
                src={
                  student.photoUrl
                }

                alt={
                  student.studentName
                }

                name={
                  student.studentName
                }

                size="md"
              />

              <div>

                <p className="teacher-student-name">

                  {
                    student.studentName ||
                    "Unnamed student"
                  }

                </p>

                <p className="teacher-student-number">

                  {
                    student.admissionNo ||
                    student.grNo ||
                    "—"
                  }

                </p>

              </div>

            </div>
          ),
        },


        {
          header: "Roll Number",

          render: (student) =>
            student.rollNo || "—",
        },


        {
          header: "Class",

          render: (student) =>
            student.class?.name ||
            "—",
        },


        {
          header: "Section",

          render: (student) =>
            student.section?.name ||
            "—",
        },


        {
          header: "Gender",

          render: (student) =>
            student.gender
              ? student.gender
                  .charAt(0)
                  .toUpperCase() +
                student.gender.slice(1)
              : "—",
        },


        {
          header: "Parent Name",

          render: (student) => {

            const parent =
              getPrimaryParent(
                student
              );

            return (
              parent?.name ||
              student.fatherName ||
              student.motherName ||
              "—"
            );
          },
        },


        {
          header: "Parent Contact",

          render: (student) => {

            const parent =
              getPrimaryParent(
                student
              );

            const contact =
              parent?.mobile ||
              student.communicationMobile ||
              student.emergencyPhoneNo;

            return contact ? (

              <a
                href={`tel:${contact}`}
              >
                {contact}
              </a>

            ) : (
              "—"
            );
          },
        },


        {
          header: "Status",

          render: () => (

            <StatusBadge status="active">
              Active
            </StatusBadge>

          ),
        },

      ],

      []
    );


  /*
   * ==========================================================
   * SEARCH
   * ==========================================================
   */

  const handleSearchChange =
    (value) => {

      setSearch(value);

      setPage(1);
    };


  /*
   * ==========================================================
   * RESET FILTERS
   * ==========================================================
   */

  const resetFilters = () => {

    setSearch("");

    setClassId("");

    setSectionId("");

    setSections([]);

    setPage(1);
  };


  const hasFilters =
    Boolean(
      search ||
      classId ||
      sectionId
    );


  /*
   * ==========================================================
   * UI
   * ==========================================================
   */

  return (

    <div className="teacher-panel">

      <TeacherTopbar
        searchValue={search}
        onSearchChange={
          handleSearchChange
        }
        searchPlaceholder="Search students"
      />


      <main className="teacher-main-content">


        {/* PAGE HEADER */}

        <div className="teacher-page-heading teacher-students-heading">

          <div>

            <h1>
              Students
            </h1>

            <p>
              View active student details,
              classes, sections, and parent
              contacts.
            </p>

          </div>


          <div className="teacher-current-date">

            <i
              className="fa-solid fa-user-graduate"
              aria-hidden="true"
            ></i>

            <span>

              {pagination.total}

              {" "}

              student

              {pagination.total === 1
                ? ""
                : "s"}

            </span>

          </div>

        </div>


        {/* FILTERS */}

        <section className="teacher-students-filter-card">


          {/* CLASS */}

          <div className="teacher-students-filter">

            <Select
              aria-label="Filter students by class"

              placeholder="All classes"

              options={
                classOptions
              }

              value={
                classId
              }

              onChange={
                (event) => {

                  setClassId(
                    event.target.value
                  );

                  setSectionId("");

                  setPage(1);
                }
              }
            />

          </div>


          {/* SECTION */}

          <div className="teacher-students-filter">

            <Select
              aria-label="Filter students by section"

              placeholder="All sections"

              options={
                sectionOptions
              }

              value={
                sectionId
              }

              disabled={
                !classId
              }

              onChange={
                (event) => {

                  setSectionId(
                    event.target.value
                  );

                  setPage(1);
                }
              }
            />

          </div>


          {/* CLEAR */}

          {hasFilters && (

            <button
              type="button"
              className="teacher-students-reset"
              onClick={
                resetFilters
              }
            >
              Clear filters
            </button>

          )}


          <p className="teacher-students-search-help">

            Search supports student name,
            admission number, and GR number.

          </p>

        </section>


        {/* ERROR */}

        {error && (

          <div
            className="teacher-students-alert"
            role="alert"
          >

            <i
              className="fa-solid fa-circle-exclamation"
              aria-hidden="true"
            ></i>

            <span>
              {error}
            </span>

            <button
              type="button"
              onClick={
                fetchStudents
              }
            >
              Try again
            </button>

          </div>

        )}


        {/* STUDENT LIST */}

        <section className="teacher-students-card">


          <div className="teacher-students-card-header">

            <div>

              <h2>
                Student List
              </h2>

              <p>
                Active students returned
                by the school directory.
              </p>

            </div>

          </div>


          {/* LOADING */}

          {loading ? (

            <div
              className="teacher-students-loading"
              aria-live="polite"
            >

              <span
                className="spinner"
                aria-hidden="true"
              ></span>

              <span>
                Loading students...
              </span>

            </div>

          ) : students.length === 0 ? (

            <div className="teacher-empty-content teacher-students-empty">

              <div className="teacher-empty-icon blue">

                <i
                  className="fa-solid fa-user-graduate"
                  aria-hidden="true"
                ></i>

              </div>

              <h3>
                No Students Found
              </h3>

              <p>
                Try changing the search
                or available filters.
              </p>

            </div>

          ) : (

            <DataTable
              columns={columns}
              data={students}
              className="teacher-students-table"
            />

          )}


          {/* PAGINATION */}

          {!loading &&
            pagination.total > 0 && (

              <div className="teacher-students-pagination">

                <Pagination
                  currentPage={
                    pagination.page ||
                    page
                  }

                  totalPages={
                    Math.max(
                      pagination.totalPages ||
                        1,
                      1
                    )
                  }

                  pageSize={
                    limit
                  }

                  totalItems={
                    pagination.total
                  }

                  onPageChange={
                    setPage
                  }

                  onPageSizeChange={
                    (pageSize) => {

                      setLimit(
                        pageSize
                      );

                      setPage(1);
                    }
                  }
                />

              </div>

            )}

        </section>

      </main>

    </div>
  );
}