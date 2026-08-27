import { useEffect, useMemo, useState } from "react";
import { getClasses } from "../../api/class.api";
import { getStudents } from "../../api/student.api";
import TeacherTopbar from "../components/TeacherTopbar";
import "./MyClasses.css";

function getResponseData(response) {
  if (response?.data !== undefined) {
    return response.data;
  }

  return response;
}

export default function MyClasses() {
  const [classes, setClasses] = useState([]);
  const [studentCounts, setStudentCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadClasses() {
      try {
        const response = await getClasses();
        const data = getResponseData(response);

        const classList = Array.isArray(data)
          ? data
          : Array.isArray(data?.classes)
            ? data.classes
            : [];

        if (cancelled) return;

        setClasses(classList);

        const counts = {};

        await Promise.all(
          classList.map(async (classItem) => {
            try {
              const studentResponse = await getStudents({
                classId: classItem.id,
                page: 1,
                limit: 1,
              });

              const studentData = getResponseData(studentResponse);

              counts[classItem.id] =
                studentData?.pagination?.total ??
                studentData?.total ??
                (Array.isArray(studentData?.students)
                  ? studentData.students.length
                  : 0);
            } catch (studentError) {
              console.error(
                `Failed to load students for class ${classItem.id}:`,
                studentError
              );

              counts[classItem.id] = 0;
            }
          })
        );

        if (cancelled) return;

        setStudentCounts(counts);
      } catch (err) {
        console.error("Failed to load classes:", err);

        if (cancelled) return;

        if (err?.response?.status === 401) {
          setError(
            "Your teacher session has expired. Please login again."
          );
        } else if (err?.response?.status === 403) {
          setError(
            "You do not have permission to view classes."
          );
        } else {
          setError(
            "Unable to load classes. Please try again."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadClasses();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredClasses = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    if (!searchValue) {
      return classes;
    }

    return classes.filter((classItem) => {
      return (
        String(classItem.name || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(classItem.department?.name || "")
          .toLowerCase()
          .includes(searchValue)
      );
    });
  }, [classes, search]);

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="teacher-panel">
      <TeacherTopbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search classes"
      />

      <main className="teacher-main-content my-classes-page">
        <div className="my-classes-heading">
          <div>
            <span className="my-classes-eyebrow">
              TEACHER PORTAL
            </span>

            <h1>My Classes</h1>

            <p>
              View the classes available to you and their student
              information.
            </p>
          </div>

          <div className="my-classes-summary">
            <div className="summary-icon">
              <i className="fa-solid fa-chalkboard"></i>
            </div>

            <div>
              <strong>{filteredClasses.length}</strong>
              <span>Classes</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="my-classes-error">
            <i className="fa-solid fa-circle-exclamation"></i>

            <span>{error}</span>

            <button
              type="button"
              onClick={handleRetry}
            >
              Try Again
            </button>
          </div>
        )}

        {loading ? (
          <div className="my-classes-loading">
            <div className="my-classes-spinner"></div>

            <p>Loading your classes...</p>
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="my-classes-empty">
            <div className="empty-icon">
              <i className="fa-solid fa-chalkboard"></i>
            </div>

            <h2>No Classes Found</h2>

            <p>
              No classes are currently available.
            </p>
          </div>
        ) : (
          <div className="my-classes-grid">
            {filteredClasses.map((classItem) => (
              <article
                className="my-class-card"
                key={classItem.id}
              >
                <div className="my-class-card-top">
                  <div className="class-icon">
                    <i className="fa-solid fa-school"></i>
                  </div>

                  <span className="class-badge">
                    CLASS
                  </span>
                </div>

                <div className="my-class-card-body">
                  <h2>
                    {classItem.name || "Unnamed Class"}
                  </h2>

                  <p className="class-department">
                    {classItem.department?.name ||
                      "Academic Class"}
                  </p>

                  <div className="class-details">
                    <div className="class-detail">
                      <i className="fa-solid fa-users"></i>

                      <span>
                        {studentCounts[classItem.id] ?? 0} Students
                      </span>
                    </div>

                    <div className="class-detail">
                      <i className="fa-solid fa-layer-group"></i>

                      <span>
                        {classItem.sections?.length || 0} Sections
                      </span>
                    </div>
                  </div>
                </div>

                <div className="my-class-card-footer">
                  <button
                    type="button"
                    className="view-class-button"
                    onClick={() => {
                      alert(
                        `Selected ${classItem.name}`
                      );
                    }}
                  >
                    View Class

                    <i className="fa-solid fa-arrow-right"></i>
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}