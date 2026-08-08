// Card.jsx
// Simple CampusIQ intro card — badge, heading, paragraph,
// a checklist of highlights, and the two main buttons.

import "./Card.css";

// Quick highlights shown as a checklist.
const highlights = [
  "Role-Based Access",
  "AI-Integrated Features",
  "Secure & Scalable",
  "Built for Every Stakeholder",
];

function Card() {
  return (
    <section className="card-section">
      {/* soft background blobs behind the card */}
      <div className="bg-blob bg-blob--1" />
      <div className="bg-blob bg-blob--2" />
      <div className="bg-blob bg-blob--3" />
      <div className="bg-blob bg-blob--4" />
      <div className="bg-blob bg-blob--5" />

      <div className="intro-card">
        <span className="intro-badge">✦ Multiagent AI Platform</span>

        <h1 className="intro-title">
          Ready to build the future of school management?
        </h1>

        <p className="intro-description">
          Campus IQ is a Multi-Agent AI platform that automates
          administration, streamlines operations, and empowers every
          stakeholder with intelligent, role-based experiences—all from
          one unified platform.
        </p>

        {/* checklist of highlights */}
        <ul className="intro-checklist">
          {highlights.map((item) => (
            <li className="checklist-item" key={item}>
              <span className="check-icon">✓</span>
              {item}
            </li>
          ))}
        </ul>

        <div className="intro-actions">
          <button className="btn btn--primary">Get Started</button>
          <button className="btn btn--secondary">See Features</button>
        </div>
      </div>
    </section>
  );
}

export default Card;