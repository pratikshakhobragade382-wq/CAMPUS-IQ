// src/pages/IndexPage/Navbar/Navbar.jsx
//
// Site-wide navbar, used on the landing page AND the About page.
// Because it's shared across pages, navigation links point to
// their respective routes.

import "./Navbar.css";
import logo from "../../../assets/logo.png";
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar-container">

        {/* Logo */}
        <div className="logo">
          <img
            src={logo}
            alt="Campus IQ Logo"
          />
        </div>

        {/* Navigation Links */}
        <nav className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
          <Link to="/features">Features</Link>
          {/* <Link to="/#pricing">Pricing</Link> */}
        </nav>

        {/* Login + Register Buttons */}
        <div className="nav-buttons">

          {/* Login */}
          <Link
            to="/login"
            className="login-btn"
          >
            Admin Login
          </Link>

          {/* Register */}
          <Link
            to="/register"
            className="signup-btn"
          >
            Admin Register
          </Link>

        </div>

      </div>
    </header>
  );
}

export default Navbar;