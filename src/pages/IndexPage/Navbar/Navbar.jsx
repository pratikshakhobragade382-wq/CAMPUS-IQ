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
          <a href="#">Home</a>
          <a href="#">About</a>
          <a href="#">Features</a>
          <a href="#">Pricing</a>
        </nav>

        {/* Buttons */}
        <div className="nav-buttons">
          <button className="login-btn">Login</button>
          <Link to="/signup" className="signup-btn">
             Sign Up
          </Link>
        </div>

      </div>
    </header>
  );
}

export default Navbar;