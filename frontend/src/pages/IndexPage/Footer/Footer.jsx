// Footer.jsx
// Simple dark footer for CampusIQ — 4 link columns and a bottom bar
// with a tagline + copyright.

import "./Footer.css";

// The 4 link columns.
const linkColumns = [
  {
    heading: "Product",
    links: ["Features", "Modules", "AI Integration", "Security", "Pricing"],
  },
  {
    heading: "For Users",
    links: ["For Administrators", "For Teachers", "For Students", "For Parents"],
  },
  {
    heading: "Resources",
    links: ["Help Center", "Documentation", "Blogs", "FAQs", "Support"],
  },
  {
    heading: "Company",
    links: ["About Us", "Careers", "Privacy Policy", "Terms & Conditions", "Contact Us"],
  },
];

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-main">
        {linkColumns.map((column) => (
          <div className="footer-column" key={column.heading}>
            <h4 className="column-heading">{column.heading}</h4>
            <ul className="column-list">
              {column.links.map((link) => (
                <li key={link}>
                  <a href="/#">{link}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* divider line */}
      <div className="footer-divider" />

      {/* bottom bar */}
      <div className="footer-bottom">
        <p className="footer-tagline">
          <strong>Secure. Reliable. Intelligent.</strong>
          <br />
          Your data, our priority.
        </p>

        <p className="footer-copyright">© 2026 CampusIQ. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;