import "./Roles.css";

function Roles() {
  return (
    <section className="roles">

      <div className="roles-container">

        {/* Background Decorations */}
        <div className="roles-circle circle-one"></div>
        <div className="roles-circle circle-two"></div>
        <div className="roles-circle circle-three"></div>

        {/* Heading */}
        <div className="roles-title-box">
          <span>Made for every role</span>
        </div>

        <h2>
          One Platform for the Entire School
        </h2>

        <p className="roles-subtitle">
          From administrators and teachers to students and parents,
          Campus IQ provides powerful tools for everyone to stay
          connected, organized and productive.
        </p>

        {/* Cards */}

        <div className="roles-grid">

          {/* Admin */}

          <div className="role-card">

            <div className="role-icon">
              <i className="fas fa-user-shield"></i>
            </div>

            <h3>Admin</h3>

            <p>
              Manage admissions, staff, attendance,
              academics and every school activity from
              one centralized dashboard.
            </p>

          </div>

          {/* Student */}

          <div className="role-card">

            <div className="role-icon">
              <i className="fas fa-user-graduate"></i>
            </div>

            <h3>Student</h3>

            <p>
              Access assignments, attendance,
              results, notices and learning resources
              anytime from one place.
            </p>

          </div>

          {/* Teacher */}

          <div className="role-card">

            <div className="role-icon">
              <i className="fas fa-chalkboard-teacher"></i>
            </div>

            <h3>Teacher</h3>

            <p>
              Conduct classes, upload assignments,
              mark attendance and track every student's
              academic progress.
            </p>

          </div>

          {/* Parent */}

          <div className="role-card">

            <div className="role-icon">
              <i className="fas fa-users"></i>
            </div>

            <h3>Parent</h3>

            <p>
              Stay informed about attendance,
              fees, academic performance and important
              school announcements.
            </p>

          </div>

        </div>

      </div>

    </section>
  );
}

export default Roles;