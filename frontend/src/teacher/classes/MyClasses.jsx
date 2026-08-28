
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  addSectionToClass,
  createClass,
  getClassById,
  getClasses,
  getStudentsBySection,
} from "../../api/class.api";

import TeacherTopbar from "../components/TeacherTopbar";

import "./MyClasses.css";

const FAVORITES_KEY = "campusiq_teacher_class_favorites";
const RECENT_KEY = "campusiq_teacher_recent_classes";

/* ============================================================
   HELPERS
============================================================ */

function getResponseData(response) {
  if (response?.data !== undefined) {
    return response.data;
  }

  return response;
}

function readStorage(key, fallback = []) {
  try {
    const value = localStorage.getItem(key);

    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function formatDate(date) {
  if (!date) {
    return "Not available";
  }

  try {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "Not available";
  }
}

/**
 * Get student display name.
 * Supports different backend field names.
 */
function getStudentName(student) {
  return (
    student?.studentName ||
    student?.name ||
    student?.fullName ||
    `${student?.firstName || ""} ${student?.lastName || ""}`.trim() ||
    "Unnamed Student"
  );
}

/**
 * Get student email.
 */
function getStudentEmail(student) {
  return (
    student?.studentEmail ||
    student?.email ||
    student?.user?.email ||
    ""
  );
}

/**
 * Get admission number.
 */
function getAdmissionNo(student) {
  return (
    student?.admissionNo ||
    student?.admissionNumber ||
    student?.admission_number ||
    "-"
  );
}

/**
 * Get roll number.
 */
function getRollNo(student) {
  return (
    student?.rollNo ||
    student?.rollNumber ||
    student?.roll_number ||
    "-"
  );
}

/**
 * Get gender.
 */
function getGender(student) {
  return student?.gender || "-";
}

/**
 * Get photo.
 */
function getStudentPhoto(student) {
  return (
    student?.photoUrl ||
    student?.photo ||
    student?.profilePhoto ||
    student?.avatar ||
    ""
  );
}

/* ============================================================
   MAIN COMPONENT
============================================================ */

export default function MyClasses() {
  /* ==========================================================
     CLASSES
  ========================================================== */

  const [classes, setClasses] = useState([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [notice, setNotice] = useState("");

  /* ==========================================================
     CLASS SEARCH / FILTER
  ========================================================== */

  const [search, setSearch] = useState("");

  const [sectionFilter, setSectionFilter] = useState("all");

  const [sortBy, setSortBy] = useState("newest");

  /* ==========================================================
     FAVORITES
  ========================================================== */

  const [favoriteIds, setFavoriteIds] = useState(() =>
    readStorage(FAVORITES_KEY, [])
  );

  /* ==========================================================
     RECENT
  ========================================================== */

  const [recentIds, setRecentIds] = useState(() =>
    readStorage(RECENT_KEY, [])
  );

  /* ==========================================================
     CREATE CLASS
  ========================================================== */

  const [showCreateModal, setShowCreateModal] = useState(false);

  const [createForm, setCreateForm] = useState({
    name: "",
    section: "",
  });

  const [creating, setCreating] = useState(false);

  /* ==========================================================
     CLASS DETAILS
  ========================================================== */

  const [selectedClass, setSelectedClass] = useState(null);

  const [loadingClass, setLoadingClass] = useState(false);

  /* ==========================================================
     ADD SECTION
  ========================================================== */

  const [sectionName, setSectionName] = useState("");

  const [addingSection, setAddingSection] = useState(false);

  /* ==========================================================
     SELECTED SECTION
  ========================================================== */

  const [selectedSection, setSelectedSection] = useState(null);

  /* ==========================================================
     STUDENTS
  ========================================================== */

  const [students, setStudents] = useState([]);

  const [studentSearch, setStudentSearch] = useState("");

  const [loadingStudents, setLoadingStudents] = useState(false);

  /* ==========================================================
     SELECTED STUDENT
  ========================================================== */

  const [selectedStudent, setSelectedStudent] = useState(null);

  /* ==========================================================
     LOAD CLASSES
  ========================================================== */

  const loadClasses = useCallback(
    async (showRefresh = false) => {
      try {
        setError("");

        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const response = await getClasses();

        const data = getResponseData(response);

        const classList = Array.isArray(data)
          ? data
          : Array.isArray(data?.classes)
          ? data.classes
          : [];

        setClasses(classList);
      } catch (err) {
        console.error("Failed to load classes:", err);

        setError(
          err?.response?.data?.message ||
            "Unable to load your classes."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  /* ==========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  /* ==========================================================
     SAVE FAVORITES
  ========================================================== */

  useEffect(() => {
    localStorage.setItem(
      FAVORITES_KEY,
      JSON.stringify(favoriteIds)
    );
  }, [favoriteIds]);

  /* ==========================================================
     SAVE RECENT
  ========================================================== */

  useEffect(() => {
    localStorage.setItem(
      RECENT_KEY,
      JSON.stringify(recentIds)
    );
  }, [recentIds]);

  /* ==========================================================
     FAVORITE
  ========================================================== */

  const toggleFavorite = (classId) => {
    setFavoriteIds((current) => {
      if (current.includes(classId)) {
        return current.filter((id) => id !== classId);
      }

      return [...current, classId];
    });
  };

  /* ==========================================================
     OPEN CLASS
  ========================================================== */

  const handleViewClass = async (classItem) => {
    try {
      setError("");

      setNotice("");

      setLoadingClass(true);

      setSelectedSection(null);

      setStudents([]);

      setSelectedStudent(null);

      setStudentSearch("");

      setRecentIds((current) => [
        classItem.id,
        ...current.filter(
          (id) => id !== classItem.id
        ),
      ].slice(0, 5));

      const response = await getClassById(classItem.id);

      const data = getResponseData(response);

      setSelectedClass(data?.class || data);
    } catch (err) {
      console.error("Failed to load class:", err);

      /**
       * Even if details API fails,
       * show the class we already have.
       */
      setSelectedClass(classItem);

      setError(
        err?.response?.data?.message ||
          "Unable to load complete class details."
      );
    } finally {
      setLoadingClass(false);
    }
  };

  /* ==========================================================
     CLOSE CLASS MODAL
  ========================================================== */

  const closeViewModal = () => {
    setSelectedClass(null);

    setSelectedSection(null);

    setStudents([]);

    setStudentSearch("");

    setSelectedStudent(null);

    setSectionName("");

    setError("");

    setNotice("");
  };

  /* ==========================================================
     CREATE CLASS
  ========================================================== */

  const handleCreateClass = async (event) => {
    event.preventDefault();

    const className = createForm.name.trim();

    const section = createForm.section.trim();

    if (!className) {
      setError("Please enter a class name.");

      return;
    }

    try {
      setCreating(true);

      setError("");

      setNotice("");

      await createClass({
        name: className,
        ...(section ? { section } : {}),
      });

      setCreateForm({
        name: "",
        section: "",
      });

      setShowCreateModal(false);

      setNotice("Class created successfully.");

      await loadClasses(true);
    } catch (err) {
      console.error("Failed to create class:", err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Unable to create class."
      );
    } finally {
      setCreating(false);
    }
  };

  /* ==========================================================
     ADD SECTION
  ========================================================== */

  const handleAddSection = async (event) => {
    event.preventDefault();

    const name = sectionName.trim();

    if (!selectedClass || !name) {
      return;
    }

    try {
      setAddingSection(true);

      setError("");

      setNotice("");

      await addSectionToClass(selectedClass.id, {
        name,
      });

      const response = await getClassById(
        selectedClass.id
      );

      const data = getResponseData(response);

      setSelectedClass(data?.class || data);

      setSectionName("");

      setNotice("Section added successfully.");

      await loadClasses(true);
    } catch (err) {
      console.error("Failed to add section:", err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Unable to add section."
      );
    } finally {
      setAddingSection(false);
    }
  };

  /* ==========================================================
     LOAD STUDENTS FOR SECTION
  ========================================================== */

  const handleOpenSection = async (section) => {
    if (!selectedClass) {
      return;
    }

    try {
      setSelectedSection(section);

      setStudentSearch("");

      setSelectedStudent(null);

      setStudents([]);

      setLoadingStudents(true);

      setError("");

      setNotice("");

      /**
       * IMPORTANT:
       * This now correctly uses the imported function:
       *
       * getStudentsBySection()
       */
      const response = await getStudentsBySection(
        selectedClass.id,
        section.id
      );

      console.log(
        "Students API response:",
        response
      );

      const data = getResponseData(response);

      /**
       * Support different backend response formats.
       */
      let studentList = [];

      if (Array.isArray(data)) {
        studentList = data;
      } else if (Array.isArray(data?.students)) {
        studentList = data.students;
      } else if (
        Array.isArray(data?.data?.students)
      ) {
        studentList = data.data.students;
      } else if (
        Array.isArray(data?.data)
      ) {
        studentList = data.data;
      }

      setStudents(studentList);
    } catch (err) {
      console.error(
        "Failed to load students:",
        err
      );

      setStudents([]);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Unable to load students for this section."
      );
    } finally {
      setLoadingStudents(false);
    }
  };

  /* ==========================================================
     FILTER STUDENTS
  ========================================================== */

  const filteredStudents = useMemo(() => {
    const value = studentSearch
      .trim()
      .toLowerCase();

    if (!value) {
      return students;
    }

    return students.filter((student) => {
      const text = [
        getStudentName(student),
        getAdmissionNo(student),
        getRollNo(student),
        getStudentEmail(student),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(value);
    });
  }, [students, studentSearch]);

  /* ==========================================================
     FILTER CLASSES
  ========================================================== */

  const filteredClasses = useMemo(() => {
    const value = search
      .trim()
      .toLowerCase();

    const result = classes.filter((classItem) => {
      const sections = Array.isArray(
        classItem.sections
      )
        ? classItem.sections
        : [];

      const sectionText = sections
        .map(
          (section) =>
            section.name || ""
        )
        .join(" ")
        .toLowerCase();

      const searchableText = [
        classItem.name,
        classItem.department?.name,
        sectionText,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !value ||
        searchableText.includes(value);

      const matchesSection =
        sectionFilter === "all" ||
        (sectionFilter === "with" &&
          sections.length > 0) ||
        (sectionFilter === "without" &&
          sections.length === 0);

      return (
        matchesSearch &&
        matchesSection
      );
    });

    return result.sort((a, b) => {
      if (sortBy === "name") {
        return String(
          a.name || ""
        ).localeCompare(
          String(b.name || "")
        );
      }

      if (sortBy === "sections") {
        return (
          (b.sections?.length || 0) -
          (a.sections?.length || 0)
        );
      }

      if (sortBy === "favorite") {
        const aFav = favoriteIds.includes(
          a.id
        )
          ? 1
          : 0;

        const bFav = favoriteIds.includes(
          b.id
        )
          ? 1
          : 0;

        return bFav - aFav;
      }

      return (
        new Date(
          b.createdAt || 0
        ) -
        new Date(
          a.createdAt || 0
        )
      );
    });
  }, [
    classes,
    search,
    sectionFilter,
    sortBy,
    favoriteIds,
  ]);

  /* ==========================================================
     COUNTS
  ========================================================== */

  const totalClasses = classes.length;

  const classesWithSections =
    classes.filter(
      (item) =>
        item.sections?.length
    ).length;

  const favoriteCount =
    classes.filter((item) =>
      favoriteIds.includes(item.id)
    ).length;

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="teacher-panel">

      <TeacherTopbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search classes, departments or sections"
      />

      <main className="teacher-main-content my-classes-page">

        {/* ==================================================
            HEADER
        ================================================== */}

        <section className="my-classes-heading">

          <div>
            <span className="my-classes-eyebrow">
              TEACHER PORTAL
            </span>

            <h1>My Classes</h1>

            <p>
              Manage your classes, sections
              and students from one place.
            </p>
          </div>

          <button
            type="button"
            className="create-class-button"
            onClick={() =>
              setShowCreateModal(true)
            }
          >
            <i className="fa-solid fa-plus"></i>

            Create Class
          </button>

        </section>

        {/* ==================================================
            ALERTS
        ================================================== */}

        {(error || notice) && (
          <div
            className={
              error
                ? "my-classes-alert error"
                : "my-classes-alert success"
            }
          >
            <i
              className={
                error
                  ? "fa-solid fa-circle-exclamation"
                  : "fa-solid fa-circle-check"
              }
            ></i>

            <span>
              {error || notice}
            </span>

            <button
              type="button"
              onClick={() => {
                setError("");
                setNotice("");
              }}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        )}

        {/* ==================================================
            STATISTICS
        ================================================== */}

        <section className="class-stat-grid">

          <div className="class-stat-card">

            <div className="class-stat-icon blue">
              <i className="fa-solid fa-chalkboard"></i>
            </div>

            <div>
              <strong>
                {totalClasses}
              </strong>

              <span>
                Total Classes
              </span>
            </div>

          </div>

          <div className="class-stat-card">

            <div className="class-stat-icon green">
              <i className="fa-solid fa-layer-group"></i>
            </div>

            <div>
              <strong>
                {classesWithSections}
              </strong>

              <span>
                Classes With Sections
              </span>
            </div>

          </div>

          <div className="class-stat-card">

            <div className="class-stat-icon yellow">
              <i className="fa-solid fa-star"></i>
            </div>

            <div>
              <strong>
                {favoriteCount}
              </strong>

              <span>
                Favorite Classes
              </span>
            </div>

          </div>

          <div className="class-stat-card">

            <div className="class-stat-icon purple">
              <i className="fa-solid fa-users"></i>
            </div>

            <div>
              <strong>
                {students.length}
              </strong>

              <span>
                Students Viewed
              </span>
            </div>

          </div>

        </section>

        {/* ==================================================
            FILTER BAR
        ================================================== */}

        <section className="class-filter-card">

          <div className="class-filter-search">

            <i className="fa-solid fa-magnifying-glass"></i>

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search classes, departments or sections..."
            />

          </div>

          <select
            value={sectionFilter}
            onChange={(event) =>
              setSectionFilter(
                event.target.value
              )
            }
          >
            <option value="all">
              All Classes
            </option>

            <option value="with">
              With Sections
            </option>

            <option value="without">
              Without Sections
            </option>
          </select>

          <select
            value={sortBy}
            onChange={(event) =>
              setSortBy(
                event.target.value
              )
            }
          >
            <option value="newest">
              Newest First
            </option>

            <option value="name">
              Name A-Z
            </option>

            <option value="sections">
              Most Sections
            </option>

            <option value="favorite">
              Favorites First
            </option>
          </select>

          <button
            type="button"
            className="refresh-class-button"
            onClick={() =>
              loadClasses(true)
            }
            disabled={refreshing}
          >
            <i
              className={
                refreshing
                  ? "fa-solid fa-spinner fa-spin"
                  : "fa-solid fa-rotate"
              }
            ></i>

            Refresh
          </button>

        </section>

        {/* ==================================================
            CLASS LIST
        ================================================== */}

        {loading ? (
          <div className="my-classes-loading">

            <div className="my-classes-spinner"></div>

            <p>
              Loading your classes...
            </p>

          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="my-classes-empty">

            <div className="empty-icon">
              <i className="fa-solid fa-chalkboard"></i>
            </div>

            <h2>
              No Classes Found
            </h2>

            <p>
              {search
                ? "Try a different search term."
                : "Create your first class to get started."}
            </p>

            {!search && (
              <button
                type="button"
                className="empty-create-button"
                onClick={() =>
                  setShowCreateModal(true)
                }
              >
                <i className="fa-solid fa-plus"></i>

                Create Your First Class
              </button>
            )}

          </div>
        ) : (
          <div className="my-classes-grid">

            {filteredClasses.map(
              (classItem) => {
                const sections =
                  Array.isArray(
                    classItem.sections
                  )
                    ? classItem.sections
                    : [];

                const isFavorite =
                  favoriteIds.includes(
                    classItem.id
                  );

                return (
                  <article
                    className="my-class-card"
                    key={classItem.id}
                  >

                    <div className="my-class-card-top">

                      <div className="class-icon">
                        <i className="fa-solid fa-school"></i>
                      </div>

                      <div className="class-card-actions">

                        <span className="class-badge">
                          MY CLASS
                        </span>

                        <button
                          type="button"
                          className={
                            isFavorite
                              ? "favorite-button active"
                              : "favorite-button"
                          }
                          onClick={() =>
                            toggleFavorite(
                              classItem.id
                            )
                          }
                        >
                          <i
                            className={
                              isFavorite
                                ? "fa-solid fa-star"
                                : "fa-regular fa-star"
                            }
                          ></i>
                        </button>

                      </div>

                    </div>

                    <div className="my-class-card-body">

                      <h2>
                        {classItem.name ||
                          "Unnamed Class"}
                      </h2>

                      <p className="class-department">
                        {classItem.department
                          ?.name ||
                          "Academic Class"}
                      </p>

                      <div className="class-details">

                        <div className="class-detail">
                          <i className="fa-solid fa-layer-group"></i>

                          <span>
                            {sections.length}{" "}
                            {sections.length === 1
                              ? "Section"
                              : "Sections"}
                          </span>
                        </div>

                        <div className="class-detail">
                          <i className="fa-solid fa-users"></i>

                          <span>
                            {sections.reduce(
                              (
                                total,
                                section
                              ) =>
                                total +
                                Number(
                                  section._count
                                    ?.students ||
                                    section.studentCount ||
                                    0
                                ),
                              0
                            )}{" "}
                            Students
                          </span>
                        </div>

                        <div className="class-detail">
                          <i className="fa-regular fa-calendar"></i>

                          <span>
                            Created{" "}
                            {formatDate(
                              classItem.createdAt
                            )}
                          </span>
                        </div>

                      </div>

                      {sections.length > 0 && (
                        <div className="section-chip-list">

                          {sections
                            .slice(0, 4)
                            .map(
                              (section) => (
                                <button
                                  type="button"
                                  className="section-chip clickable"
                                  key={
                                    section.id
                                  }
                                  onClick={() =>
                                    handleViewClass(
                                      classItem
                                    )
                                  }
                                >
                                  <i className="fa-solid fa-users"></i>

                                  {section.name}
                                </button>
                              )
                            )}

                          {sections.length > 4 && (
                            <span className="section-chip more">
                              +
                              {sections.length - 4}{" "}
                              more
                            </span>
                          )}

                        </div>
                      )}

                    </div>

                    <div className="my-class-card-footer">

                      <button
                        type="button"
                        className="view-class-button"
                        onClick={() =>
                          handleViewClass(
                            classItem
                          )
                        }
                      >
                        <span>
                          View Class & Students
                        </span>

                        <i className="fa-solid fa-arrow-right"></i>
                      </button>

                    </div>

                  </article>
                );
              }
            )}

          </div>
        )}

      </main>

      {/* ====================================================
          CREATE CLASS MODAL
      ==================================================== */}

      {showCreateModal && (
        <div
          className="class-modal-overlay"
          onMouseDown={() =>
            !creating &&
            setShowCreateModal(false)
          }
        >

          <div
            className="class-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            <div className="class-modal-header">

              <div>

                <span>
                  TEACHER PORTAL
                </span>

                <h2>
                  Create New Class
                </h2>

              </div>

              <button
                type="button"
                onClick={() =>
                  !creating &&
                  setShowCreateModal(false)
                }
              >
                <i className="fa-solid fa-xmark"></i>
              </button>

            </div>

            <form
              className="class-modal-body"
              onSubmit={
                handleCreateClass
              }
            >

              <div className="form-field">

                <label>
                  Class Name
                  <span>*</span>
                </label>

                <input
                  type="text"
                  value={
                    createForm.name
                  }
                  onChange={(event) =>
                    setCreateForm(
                      (current) => ({
                        ...current,
                        name:
                          event.target
                            .value,
                      })
                    )
                  }
                  placeholder="Example: Computer Science"
                  maxLength={80}
                  required
                  autoFocus
                />

              </div>

              <div className="form-field">

                <label>
                  Initial Section
                  <small>
                    Optional
                  </small>
                </label>

                <input
                  type="text"
                  value={
                    createForm.section
                  }
                  onChange={(event) =>
                    setCreateForm(
                      (current) => ({
                        ...current,
                        section:
                          event.target
                            .value,
                      })
                    )
                  }
                  placeholder="Example: A"
                  maxLength={20}
                />

              </div>

              <div className="create-info-box">

                <i className="fa-solid fa-circle-info"></i>

                <p>
                  Create the class first.
                  You can add sections
                  and view students after
                  opening the class.
                </p>

              </div>

              <div className="class-modal-footer">

                <button
                  type="button"
                  className="modal-cancel-button"
                  onClick={() =>
                    setShowCreateModal(
                      false
                    )
                  }
                  disabled={creating}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="modal-primary-button"
                  disabled={creating}
                >
                  {creating ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i>

                      Creating...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-plus"></i>

                      Create Class
                    </>
                  )}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* ====================================================
          CLASS DETAILS MODAL
      ==================================================== */}

      {selectedClass && (
        <div
          className="class-modal-overlay"
          onMouseDown={closeViewModal}
        >

          <div
            className="class-details-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            <div className="class-details-header">

              <div className="class-details-title">

                <div className="class-details-icon">
                  <i className="fa-solid fa-school"></i>
                </div>

                <div>

                  <span>
                    MY CLASS
                  </span>

                  <h2>
                    {selectedClass.name}
                  </h2>

                </div>

              </div>

              <button
                type="button"
                onClick={
                  closeViewModal
                }
              >
                <i className="fa-solid fa-xmark"></i>
              </button>

            </div>

            {loadingClass ? (
              <div className="class-details-loading">

                <i className="fa-solid fa-spinner fa-spin"></i>

                Loading class details...

              </div>
            ) : (
              <div className="class-details-content">

                {/* ==================================================
                    CLASS INFORMATION
                ================================================== */}

                <div className="detail-section">

                  <h3>
                    Class Information
                  </h3>

                  <div className="detail-grid">

                    <div className="detail-item">

                      <span>
                        Class ID
                      </span>

                      <strong>
                        {selectedClass.id}
                      </strong>

                    </div>

                    <div className="detail-item">

                      <span>
                        Department
                      </span>

                      <strong>
                        {selectedClass.department
                          ?.name ||
                          "Academic Class"}
                      </strong>

                    </div>

                    <div className="detail-item">

                      <span>
                        Created On
                      </span>

                      <strong>
                        {formatDate(
                          selectedClass.createdAt
                        )}
                      </strong>

                    </div>

                    <div className="detail-item">

                      <span>
                        Total Sections
                      </span>

                      <strong>
                        {selectedClass.sections
                          ?.length || 0}
                      </strong>

                    </div>

                  </div>

                </div>

                {/* ==================================================
                    SECTIONS
                ================================================== */}

                <div className="detail-section">

                  <div className="section-heading-row">

                    <div>

                      <h3>
                        Sections
                      </h3>

                      <p>
                        Click a section to
                        see all students.
                      </p>

                    </div>

                  </div>

                  {selectedClass.sections
                    ?.length > 0 ? (
                    <div className="detail-section-list">

                      {selectedClass.sections.map(
                        (section) => {

                          const active =
                            selectedSection
                              ?.id ===
                            section.id;

                          return (
                            <button
                              type="button"
                              className={
                                active
                                  ? "detail-section-card active"
                                  : "detail-section-card"
                              }
                              key={
                                section.id
                              }
                              onClick={() =>
                                handleOpenSection(
                                  section
                                )
                              }
                            >

                              <div className="section-number">
                                <i className="fa-solid fa-layer-group"></i>
                              </div>

                              <div className="section-card-text">

                                <strong>
                                  Section{" "}
                                  {section.name}
                                </strong>

                                <span>
                                  {section._count?.students ??
                                    section.studentCount ??
                                    0}{" "}
                                  Students
                                </span>

                              </div>

                              <div className="section-card-arrow">

                                <i className="fa-solid fa-chevron-right"></i>

                              </div>

                            </button>
                          );
                        }
                      )}

                    </div>
                  ) : (
                    <div className="no-sections">

                      <i className="fa-solid fa-layer-group"></i>

                      <p>
                        No sections added yet.
                      </p>

                    </div>
                  )}

                  {/* ==================================================
                      ADD SECTION
                  ================================================== */}

                  <form
                    className="add-section-form"
                    onSubmit={
                      handleAddSection
                    }
                  >

                    <input
                      type="text"
                      value={
                        sectionName
                      }
                      onChange={(event) =>
                        setSectionName(
                          event.target
                            .value
                        )
                      }
                      placeholder="New section name e.g. A"
                      maxLength={20}
                    />

                    <button
                      type="submit"
                      disabled={
                        addingSection ||
                        !sectionName.trim()
                      }
                    >
                      {addingSection ? (
                        <i className="fa-solid fa-spinner fa-spin"></i>
                      ) : (
                        <i className="fa-solid fa-plus"></i>
                      )}

                      Add Section
                    </button>

                  </form>

                </div>

                {/* ==================================================
                    STUDENTS
                ================================================== */}

                {selectedSection && (
                  <div className="student-section">

                    <div className="student-section-header">

                      <div>

                        <span className="student-section-eyebrow">
                          SECTION
                        </span>

                        <h3>
                          Section{" "}
                          {selectedSection.name}
                        </h3>

                        <p>
                          {students.length}{" "}
                          Students
                        </p>

                      </div>

                      <div className="student-count-badge">

                        <i className="fa-solid fa-users"></i>

                        {students.length}

                      </div>

                    </div>

                    {/* ==================================================
                        STUDENT SEARCH
                    ================================================== */}

                    <div className="student-search-box">

                      <i className="fa-solid fa-magnifying-glass"></i>

                      <input
                        type="text"
                        value={
                          studentSearch
                        }
                        onChange={(event) =>
                          setStudentSearch(
                            event.target
                              .value
                          )
                        }
                        placeholder="Search students by name, admission number or roll number..."
                      />

                      {studentSearch && (
                        <button
                          type="button"
                          onClick={() =>
                            setStudentSearch(
                              ""
                            )
                          }
                        >
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      )}

                    </div>

                    {/* ==================================================
                        STUDENT LIST
                    ================================================== */}

                    {loadingStudents ? (
                      <div className="students-loading">

                        <i className="fa-solid fa-spinner fa-spin"></i>

                        <span>
                          Loading students...
                        </span>

                      </div>
                    ) : filteredStudents.length === 0 ? (
                      <div className="students-empty">

                        <div>
                          <i className="fa-solid fa-user-group"></i>
                        </div>

                        <h4>
                          No Students Found
                        </h4>

                        <p>
                          {studentSearch
                            ? "Try another search term."
                            : "There are no students assigned to this section yet."}
                        </p>

                      </div>
                    ) : (
                      <div className="students-table-wrapper">

                        <table className="students-table">

                          <thead>

                            <tr>

                              <th>
                                #
                              </th>

                              <th>
                                Student
                              </th>

                              <th>
                                Admission No.
                              </th>

                              <th>
                                Roll No.
                              </th>

                              <th>
                                Gender
                              </th>

                              <th>
                                Status
                              </th>

                              <th>
                                Information
                              </th>

                            </tr>

                          </thead>

                          <tbody>

                            {filteredStudents.map(
                              (
                                student,
                                index
                              ) => {

                                const studentName =
                                  getStudentName(
                                    student
                                  );

                                const photo =
                                  getStudentPhoto(
                                    student
                                  );

                                return (
                                  <tr
                                    key={
                                      student.id ||
                                      `${studentName}-${index}`
                                    }
                                  >

                                    <td>
                                      {index + 1}
                                    </td>

                                    <td>

                                      <div className="student-name-cell">

                                        {photo ? (
                                          <img
                                            src={
                                              photo
                                            }
                                            alt={
                                              studentName
                                            }
                                          />
                                        ) : (
                                          <div className="student-avatar">
                                            {studentName
                                              .charAt(
                                                0
                                              )
                                              .toUpperCase()}
                                          </div>
                                        )}

                                        <div>

                                          <strong>
                                            {studentName}
                                          </strong>

                                          {getStudentEmail(
                                            student
                                          ) && (
                                            <small>
                                              {
                                                getStudentEmail(
                                                  student
                                                )
                                              }
                                            </small>
                                          )}

                                        </div>

                                      </div>

                                    </td>

                                    <td>

                                      <span className="admission-badge">
                                        {
                                          getAdmissionNo(
                                            student
                                          )
                                        }
                                      </span>

                                    </td>

                                    <td>
                                      {
                                        getRollNo(
                                          student
                                        )
                                      }
                                    </td>

                                    <td>
                                      {
                                        getGender(
                                          student
                                        )
                                      }
                                    </td>

                                    <td>

                                      <span className="student-status active">

                                        <span></span>

                                        Active

                                      </span>

                                    </td>

                                    <td>

                                      <button
                                        type="button"
                                        className="view-student-button"
                                        onClick={() =>
                                          setSelectedStudent(
                                            student
                                          )
                                        }
                                      >

                                        <i className="fa-solid fa-eye"></i>

                                        View

                                      </button>

                                    </td>

                                  </tr>
                                );
                              }
                            )}

                          </tbody>

                        </table>

                      </div>
                    )}

                  </div>
                )}

                {/* ==================================================
                    FOOTER
                ================================================== */}

                <div className="class-details-footer">

                  <button
                    type="button"
                    className="modal-cancel-button"
                    onClick={
                      closeViewModal
                    }
                  >
                    Close
                  </button>

                </div>

              </div>
            )}

          </div>

        </div>
      )}

      {/* ====================================================
          STUDENT INFORMATION MODAL
      ==================================================== */}

      {selectedStudent && (
        <div
          className="student-info-overlay"
          onMouseDown={() =>
            setSelectedStudent(null)
          }
        >

          <div
            className="student-info-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            <div className="student-info-header">

              <div>

                <span>
                  STUDENT INFORMATION
                </span>

                <h2>
                  {getStudentName(
                    selectedStudent
                  )}
                </h2>

              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedStudent(null)
                }
              >
                <i className="fa-solid fa-xmark"></i>
              </button>

            </div>

            <div className="student-info-body">

              <div className="student-profile-top">

                {getStudentPhoto(
                  selectedStudent
                ) ? (
                  <img
                    src={getStudentPhoto(
                      selectedStudent
                    )}
                    alt={getStudentName(
                      selectedStudent
                    )}
                  />
                ) : (
                  <div className="large-student-avatar">
                    {getStudentName(
                      selectedStudent
                    )
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}

                <div>

                  <h3>
                    {getStudentName(
                      selectedStudent
                    )}
                  </h3>

                  <p>
                    Section{" "}
                    {selectedSection?.name || "-"}
                  </p>

                </div>

              </div>

              <div className="student-info-grid">

                <div className="student-info-item">

                  <span>
                    Admission Number
                  </span>

                  <strong>
                    {getAdmissionNo(
                      selectedStudent
                    )}
                  </strong>

                </div>

                <div className="student-info-item">

                  <span>
                    Roll Number
                  </span>

                  <strong>
                    {getRollNo(
                      selectedStudent
                    )}
                  </strong>

                </div>

                <div className="student-info-item">

                  <span>
                    Gender
                  </span>

                  <strong>
                    {getGender(
                      selectedStudent
                    )}
                  </strong>

                </div>

                <div className="student-info-item">

                  <span>
                    Email
                  </span>

                  <strong>
                    {getStudentEmail(
                      selectedStudent
                    ) || "-"}
                  </strong>

                </div>

                <div className="student-info-item">

                  <span>
                    Student ID
                  </span>

                  <strong>
                    {selectedStudent.id ||
                      "-"}
                  </strong>

                </div>

                <div className="student-info-item">

                  <span>
                    Status
                  </span>

                  <strong className="student-info-active">
                    Active
                  </strong>

                </div>

              </div>

            </div>

            <div className="student-info-footer">

              <button
                type="button"
                className="modal-cancel-button"
                onClick={() =>
                  setSelectedStudent(null)
                }
              >
                Close
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

