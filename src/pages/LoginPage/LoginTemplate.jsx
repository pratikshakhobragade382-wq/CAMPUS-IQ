import "./LoginTemplate.css";
import logo from "../../assets/logo.png";

function LoginTemplate() {
  return (
    <div className="login-page">

      {/* ================= Navbar ================= */}
      <header className="login-navbar">
        <div className="login-logo">
          <img src={logo} alt="CampusIQ Logo" />
        </div>

        <nav className="login-nav-links">
          <a href="#">Home</a>
          <a href="#">About</a>
          <a href="#">Features</a>
          <a href="#">Pricing</a>
        </nav>
      </header>

      {/* ================= Hero ================= */}
      <section className="login-content">

        <div className="login-heading">
          <h1>SignUp to access your roles</h1>

          <p>
            Select your portal below and continue your journey with
            CampusIQ. Choose the role that best matches your account.
          </p>
        </div>

        {/* ================= Role Buttons ================= */}

        <div className="role-buttons">

          <button className="portal-btn admin-btn">
            <div className="portal-left">
              <i className="fas fa-user-shield"></i>
              <span>Admin Portal</span>
            </div>

            <i className="fas fa-arrow-right"></i>
          </button>

          <button className="portal-btn student-btn">
            <div className="portal-left">
              <i className="fas fa-user-graduate"></i>
              <span>Student Portal</span>
            </div>

            <i className="fas fa-arrow-right"></i>
          </button>

          <button className="portal-btn teacher-btn">
            <div className="portal-left">
              <i className="fas fa-chalkboard-teacher"></i>
              <span>Teacher Portal</span>
            </div>

            <i className="fas fa-arrow-right"></i>
          </button>

          <button className="portal-btn parent-btn">
            <div className="portal-left">
              <i className="fas fa-users"></i>
              <span>Parent Portal</span>
            </div>

            <i className="fas fa-arrow-right"></i>
          </button>

        </div>

      </section>

    </div>
  );
}

export default LoginTemplate;