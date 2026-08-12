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