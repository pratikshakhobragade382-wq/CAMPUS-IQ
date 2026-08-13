// src/pages/IndexPage/Navbar/Navbar.jsx
//
// Site-wide navbar, used on the landing page AND the About page.
// Because it's shared across pages, "Home" / "Features" / "Pricing" need
// to point back to "/" (with a hash for the in-page sections), and
// "About" needs to go to the actual /about route instead of "#".

import "./Navbar.css";
import logo from "../../../assets/logo.png";
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar-container">

        {/* Logo */}
        <div className="logo">
          <img src={logo} alt="Campus IQ Logo" />
        </div>

        {/* Navigation Links */}
        <nav className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
          <Link to="/features">Features</Link>
          {/* <Link to="/#pricing">Pricing</Link> */}
        </nav>

        {/* Login Button */}
        <div className="nav-buttons">
          <Link to="/login" className="login-btn">
            Login
          </Link>
        </div>

      </div>
    </header>
  );
}

export default Navbar;