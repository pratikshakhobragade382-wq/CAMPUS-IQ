// src/pages/IndexPage/Navbar/Features/Features.jsx
//
// Features page, take 3. The 4-card grid from before was too much
// packed into narrow columns, so this version gives each feature its
// own full-width row: a big soft color wash, a large faded number
// watermark, a floating mockup card on one side, spacious text on the
// other. One feature at a time, lots of room to breathe. No buttons.

import React from "react";

import Navbar from "../Navbar";
import Footer from "../../Footer/Footer";

import "./Features.css";

// ---- small mock UI previews, one per feature -------------------------
// Simplified visual stand-ins built from plain CSS (conic-gradient for
// the gauges), not screenshots, so each feature gets a feel of its
// real screen without needing image assets.

function PredictorPreview() {
  return (
    <div className="fx-mock">
      <div className="fx-mock-title">
        Risk Prediction
        <span className="fx-mock-bell" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M12 3a5 5 0 00-5 5v3.2c0 .5-.2 1-.5 1.4L5 15h14l-1.5-2.4c-.3-.4-.5-.9-.5-1.4V8a5 5 0 00-5-5z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
      <div className="fx-mock-body">
        <div className="fx-gauge" style={{ "--pct": 72 }}>
          <span className="fx-gauge-num">72%</span>
          <span className="fx-gauge-label">High Risk</span>
        </div>
        <div className="fx-factor-list">
          {["Attendance", "Marks", "Assignments", "Quizzes"].map((f) => (
            <div className="fx-factor-row" key={f}>
              <span className="fx-factor-bar" />
              <span>{f}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CopilotPreview() {
  return (
    <div className="fx-mock">
      <div className="fx-mock-band">Generate Question Paper</div>
      <div className="fx-mock-field">
        <span>Subject</span>
        <div className="fx-mock-input">Physics</div>
      </div>
      <div className="fx-mock-field">
        <span>Topics</span>
        <div className="fx-mock-input">Newton&apos;s Laws, Motion, Energy</div>
      </div>
      <div className="fx-mock-generated">
        <span className="fx-mock-generated-dot" />
        Answer key generated
      </div>
    </div>
  );
}

function ChatbotPreview() {
  return (
    <div className="fx-mock">
      <div className="fx-mock-title fx-mock-title-row">
        <span className="fx-bot-avatar" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <rect x="4" y="8" width="16" height="11" rx="3" stroke="currentColor" strokeWidth="1.6" />
            <circle cx="9" cy="13.5" r="1.2" fill="currentColor" />
            <circle cx="15" cy="13.5" r="1.2" fill="currentColor" />
            <path d="M12 8V5" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        </span>
        CampusIQ Assistant
        <span className="fx-online-dot" aria-hidden="true" />
      </div>

      <div className="fx-chat-bubble fx-chat-user">Show my attendance</div>
      <div className="fx-chat-bubble fx-chat-bot">Here&apos;s your attendance for this month</div>

      <div className="fx-attendance-card">
        <div className="fx-donut" style={{ "--pct": 92 }}>
          <span>92%</span>
        </div>
        <div className="fx-attendance-rows">
          <div>
            <span>Present</span>
            <span>23</span>
          </div>
          <div>
            <span>Absent</span>
            <span>2</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ComplaintPreview() {
  return (
    <div className="fx-mock">
      <div className="fx-mock-title">New Complaint</div>

      <div className="fx-complaint-user">
        <span className="fx-avatar-circle" aria-hidden="true" />
        <div>
          <strong>Riya Sharma</strong>
          <p>The wifi is not working in the computer lab.</p>
        </div>
      </div>

      <div className="fx-complaint-tags">
        <span>Infrastructure</span>
        <span className="fx-tag-high">High Priority</span>
        <span>IT Department</span>
      </div>

      <div className="fx-suggested-reply">
        <span className="fx-reply-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        We are looking into this and will fix it shortly.
      </div>
    </div>
  );
}

// ---- feature content ---------------------------------------------------

const FEATURES = [
  {
    number: "01",
    accent: "purple",
    tag: "Prediction",
    title: "AI Academic Performance Predictor",
    description:
      "Predicts students who may struggle academically, before it shows up on a report card, so teachers can step in early instead of reacting late.",
    chips: ["Attendance & marks", "ML risk scoring", "Teacher alerts"],
    preview: <PredictorPreview />,
  },
  {
    number: "02",
    accent: "blue",
    tag: "Teaching",
    title: "AI Teacher Copilot",
    description:
      "A teacher enters the subject and topics, and gets a draft question paper with an answer key, ready to review and edit, in a fraction of the usual time.",
    chips: ["MCQs & long answers", "Auto answer keys", "Any subject, any topic"],
    preview: <CopilotPreview />,
  },
  {
    number: "03",
    accent: "green",
    tag: "Support",
    title: "AI Chatbot",
    description:
      "Ask in plain English, things like \u201cshow my attendance\u201d, and get an answer pulled straight from live CampusIQ data, no forms, no waiting.",
    chips: ["Plain-English queries", "Live ERP data", "Students, parents & staff"],
    preview: <ChatbotPreview />,
  },
  {
    number: "04",
    accent: "orange",
    tag: "Operations",
    title: "AI Complaint Management System",
    description:
      "Every complaint is read the moment it's filed, its category, priority and sentiment are worked out automatically, and it's routed before it gets lost.",
    chips: ["Auto categorization", "Sentiment analysis", "Suggested replies"],
    preview: <ComplaintPreview />,
  },
];

export default function Features() {
  return (
    <>
      <Navbar />

      <main className="features-page">
        {/* ---------- HERO ---------- */}
        <section className="features-hero">
          <div className="features-hero-blob" aria-hidden="true" />
          <div className="features-hero-cube-wrap" aria-hidden="true">
            <div className="features-orbit" />
            <div className="features-cube">
              <span className="fx-face fx-face-top" />
              <span className="fx-face fx-face-left" />
              <span className="fx-face fx-face-right" />
            </div>
          </div>

          <span className="features-pill">
            Powered by AI &nbsp;•&nbsp; Designed for Education
          </span>

          <h1>
            Powerful AI Features for
            <br />
            <span className="features-heading-accent">
              Smarter Campus Management
            </span>
          </h1>

          <p className="features-hero-sub">
            CampusIQ brings intelligent automation to academics, teaching,
            communication and administration, all in one place.
          </p>
        </section>

        {/* ---------- FEATURE ROWS ---------- */}
        {FEATURES.map((feature, index) => (
          <section
            key={feature.number}
            className={`fx-row fx-tint-${feature.accent} ${
              index % 2 === 1 ? "fx-row-reverse" : ""
            }`}
          >
            <div className="fx-row-visual">{feature.preview}</div>

            <div className="fx-row-text">
              <span className="fx-tag">{feature.tag}</span>
              <h2>{feature.title}</h2>
              <p>{feature.description}</p>

              <div className="fx-chip-row">
                {feature.chips.map((chip) => (
                  <span className="fx-chip" key={chip}>
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          </section>
        ))}

        {/* ---------- CLOSING ---------- */}
      </main>

      <Footer />
    </>
  );
}