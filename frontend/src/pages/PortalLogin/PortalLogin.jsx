import { useNavigate, Link } from "react-router-dom";
import logo from "../../assets/logo.png";
import "./PortalLogin.css";

export default function PortalLogin() {
  const navigate = useNavigate();

  const portals = [
    {
      title: "Admin Portal",
      description: "Manage your school with complete control.",
      icon: "fa-solid fa-user-shield",
      path: "/login",
    },
    {
      title: "Student Portal",
      description: "Access classes, attendance, exams and more.",
      icon: "fa-solid fa-graduation-cap",
      path: "/student-login",
    },
    {
      title: "Teacher Portal",
      description: "Manage classes, attendance and academics.",
      icon: "fa-solid fa-chalkboard-user",
      path: "/teacher-login",
    },
    {
      title: "Parent Portal",
      description: "Stay updated with your child's progress.",
      icon: "fa-solid fa-users",
      path: "/parent-login",
    },
  ];

  return (
    <div className="portal-login-page">

      {/* ================= NAVBAR ================= */}

      <header className="portal-navbar">

        {/* Logo */}
        <Link
          to="/"
          className="portal-brand"
        >
          <img
            src={logo}
            alt="CampusIQ"
          />
        </Link>


        {/* Navbar Links */}
        <nav className="portal-navbar-links">

          <Link to="/">
            Home
          </Link>

          <Link to="/about">
            About
          </Link>

          <Link to="/features">
            Features
          </Link>

        </nav>

      </header>


      {/* ================= MAIN CONTENT ================= */}

      <main className="portal-main">

        {/* Heading */}
        <section className="portal-heading">

          <div className="portal-badge">
            <i className="fa-solid fa-shield-halved"></i>
            Secure School Management
          </div>

          <h1>
            Welcome to <span>CampusIQ</span>
          </h1>

          <p>
            Choose your portal to continue
          </p>

        </section>


        {/* ================= PORTAL CARDS ================= */}

        <section className="portal-cards">

          {portals.map((portal) => (

            <button
              key={portal.title}
              className="portal-card"
              onClick={() => navigate(portal.path)}
            >

              {/* Icon */}
              <div className="portal-card-icon">
                <i className={portal.icon}></i>
              </div>


              {/* Content */}
              <div className="portal-card-content">

                <h2>
                  {portal.title}
                </h2>

                <p>
                  {portal.description}
                </p>

              </div>


              {/* Arrow */}
              <div className="portal-card-arrow">
                <i className="fa-solid fa-arrow-right"></i>
              </div>

            </button>

          ))}

        </section>


        {/* Bottom Text */}
        <p className="portal-bottom-text">
          Simple management • Smarter education • Secure access
        </p>

      </main>

    </div>
  );
}