// Tags.jsx
// "Everything under one roof" section — a chalkboard-style grid
// showing all the modules CampusIQ offers.

import "./Tags.css";

// Each module has a title, a color (used for the icon + hover glow),
// and a small line-style icon drawn as inline SVG.
const modules = [
  {
    title: "Smart Attendance",
    color: "blue",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="5" y="4" width="14" height="17" rx="2" />
        <path d="M9 3h6v3H9z" />
        <path d="M8 11l2.5 2.5L16 8" />
      </svg>
    ),
  },
  {
    title: "Executive Dashboard",
    color: "yellow",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" strokeLinecap="round" />
        <circle cx="18" cy="6" r="1.5" />
      </svg>
    ),
  },
  {
    title: "Transport Routes",
    color: "green",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="6" width="14" height="10" rx="2" />
        <circle cx="7" cy="18" r="1.5" />
        <circle cx="13" cy="18" r="1.5" />
        <path d="M17 9h3l2 3v4h-5" />
      </svg>
    ),
  },
  {
    title: "Live Vehicle Tracking",
    color: "pink",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 21s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12z" />
        <circle cx="12" cy="9" r="2.5" />
      </svg>
    ),
  },
  {
    title: "Inventory Control",
    color: "purple",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 8l8-4 8 4-8 4-8-4z" />
        <path d="M4 8v8l8 4 8-4V8" />
        <path d="M12 12v8" />
      </svg>
    ),
  },
  {
    title: "Fee Management",
    color: "orange",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="6" width="18" height="13" rx="2" />
        <path d="M3 10h18" />
        <circle cx="17" cy="14" r="1.5" />
      </svg>
    ),
  },
  {
    title: "Academic Results",
    color: "yellow",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M9 8h4M9 12h6" strokeLinecap="round" />
        <path d="M15 15l1.5 1.5L19 14" />
      </svg>
    ),
  },
  {
    title: "Grievance Management",
    color: "green",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="8" r="3" />
        <path d="M5 21c0-4 3-6 7-6s7 2 7 6" />
        <path d="M15 5a3 3 0 010 6" />
      </svg>
    ),
  },
  {
    title: "Lesson Planner",
    color: "yellow",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 6c-2-1.5-5-2-8-1v13c3-1 6-.5 8 1 2-1.5 5-2 8-1V5c-3-1-6-.5-8 1z" />
        <path d="M12 6v13" />
      </svg>
    ),
  },
  {
    title: "Performance Analytics",
    color: "pink",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 17l5-5 4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15 7h5v5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Assignment Portal",
    color: "purple",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="5" width="18" height="12" rx="2" />
        <path d="M2 19h20" strokeLinecap="round" />
        <path d="M12 13V8M9.5 10.5L12 8l2.5 2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Mock Test Center",
    color: "yellow",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M9 3v3h6V3" />
        <path d="M9 11h6M9 15h4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Smart Notifications",
    color: "blue",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M6 10a6 6 0 0112 0c0 5 2 6 2 6H4s2-1 2-6z" />
        <path d="M10 20a2 2 0 004 0" />
        <circle cx="18" cy="6" r="3" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    title: "Quiz Builder",
    color: "green",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M8 8h5M8 12h8M8 16h5" strokeLinecap="round" />
        <path d="M17 15l1 1 2-2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

function Tags() {
  return (
    <section className="tags-section">
      {/* soft background blobs, purely decorative */}
      <div className="tags-blob tags-blob--left" />
      <div className="tags-blob tags-blob--right" />

      {/* small paper-plane doodle, top-left */}
      {/* <svg className="tags-doodle tags-doodle--plane" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M22 2L11 13" strokeLinecap="round" />
        <path d="M22 2l-7 20-4-9-9-4 20-7z" strokeLinejoin="round" />
      </svg> */}

      {/* header content */}
      <div className="tags-header">
        <span className="tags-badge">18+ MODULES</span>
        <h2 className="tags-title">
          Everything under <span className="tags-title--accent">one roof.</span>
        </h2>
        <p className="tags-subtitle">
          Deep dive into each module built to handle real school complexities.
        </p>
      </div>

      {/* the chalkboard itself */}
      <div className="chalkboard-wrapper">
        <div className="chalkboard-frame">
          <div className="chalkboard">
            <div className="tags-grid">
              {modules.map((module) => (
                <div className="tag-item" key={module.title}>
                  <div className={`tag-icon tag-icon--${module.color}`}>
                    {module.icon}
                  </div>
                  <p className="tag-label">{module.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* wooden shelf under the chalkboard, with a chalk tray */}
        <div className="chalkboard-shelf">
          <div className="chalk-tray">
            <div className="eraser" />
            <span className="chalk chalk--pink" />
            <span className="chalk chalk--white" />
            <span className="chalk chalk--blue" />
          </div>

          <div className="desk-items">
            <div className="books" />
            <div className="pencil-cup">
              <span className="pencil pencil--1" />
              <span className="pencil pencil--2" />
              <span className="pencil pencil--3" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Tags;