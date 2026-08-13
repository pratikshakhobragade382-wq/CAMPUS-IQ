// src/pages/IndexPage/Navbar/About/About.jsx
//
// About page for CampusIQ - designed around actual school materials
// instead of generic SaaS blocks:
//   - Hero sits on a notebook-paper grid, with a hand-tagged nameplate
//   - Mission is paired with a "report card" style stat sheet
//   - Values are shown as index cards pinned to a corkboard
//   - Closing section is a chalkboard
// Still no buttons, this page is read-only, no actions to take.

import React from "react";

import Navbar from "../Navbar";
import Footer from "../../Footer/Footer";

import "./About.css";

// One pinned index card for the corkboard section.
function IndexCard({ tag, title, text, tilt }) {
  return (
    <div className={`about-index-card about-tilt-${tilt}`}>
      <span className="about-pin" aria-hidden="true" />
      <span className="about-card-tag">{tag}</span>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

// One row of the "report card" stat sheet, label on the left,
// value on the right, dotted leader line in between.
function ReportRow({ label, value }) {
  return (
    <div className="about-report-row">
      <span className="about-report-label">{label}</span>
      <span className="about-report-dots" aria-hidden="true" />
      <span className="about-report-value">{value}</span>
    </div>
  );
}

export default function About() {
  return (
    <>
      <Navbar />

      <main className="about-page">
        {/* ---------- HERO : notebook paper ---------- */}
        <section className="about-hero">
          <div className="about-nameplate">
            <span className="about-nameplate-pin" aria-hidden="true" />
            About CampusIQ
          </div>

          <h1>
            We build the school 
            <br /> everyone actually wants to use.
          </h1>

          {/* small hand-drawn underline under the heading, our one signature squiggle */}
          <svg
            className="about-underline"
            viewBox="0 0 240 18"
            width="220"
            height="16"
            aria-hidden="true"
          >
            <path
              d="M4 12c40-10 80-10 118-4s78 6 116-4"
              fill="none"
              stroke="#3aa0e8"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>

          <p className="about-hero-sub">
            CampusIQ started with a simple frustration: school admin work
            was scattered across registers, spreadsheets and phone calls.
            We put admissions, attendance, fees, timetables and
            communication in one place, so admins, teachers, students and
            parents all look at the same source of truth.
          </p>
        </section>

        {/* ---------- MISSION : text + report card ---------- */}
        <section className="about-mission">
          <div className="about-mission-text">
            <span className="about-eyebrow">Our Mission</span>
            <h2>Less admin work, more time for teaching</h2>
            <p>
              Every school runs on people, not paperwork. Our mission is to
              take the repetitive, error-prone parts of running a school,
              attendance registers, fee tracking, report cards, notices, and
              turn them into something that takes minutes instead of days.
              When the busywork shrinks, teachers get more time with
              students, admins get fewer fires to put out, and parents stay
              in the loop without having to ask.
            </p>
          </div>

          {/* styled like an actual school report card */}
          <div className="about-report-card">
            <div className="about-report-header">
              <span>CampusIQ</span>
              <span>Platform Report</span>
            </div>
            <ReportRow label="Modules covering real school work" value="18+" />
            <ReportRow label="Role based portals" value="4" />
            <ReportRow label="Runs on" value="Any device" />
            <ReportRow label="Paperwork required" value="None" />
          </div>
        </section>

        {/* ---------- VALUES : corkboard of pinned index cards ---------- */}
        <section className="about-values">
          <span className="about-eyebrow about-center">What Drives Us</span>
          <h2 className="about-center">The principles behind every module</h2>
          <p className="about-values-sub about-center">
            These aren't slogans on a wall, they're the questions we ask
            before shipping any feature.
          </p>

          <div className="about-corkboard">
            <IndexCard
              tag="Rule 1"
              title="Simplicity First"
              text="If a task takes more than a few clicks, we redesign it. Powerful doesn't have to mean complicated."
              tilt="left"
            />
            <IndexCard
              tag="Rule 2"
              title="Built for Every Role"
              text="Admins, teachers, students and parents don't need the same screen, they need the right one."
              tilt="right"
            />
            <IndexCard
              tag="Rule 3"
              title="Data You Can Trust"
              text="Attendance, fees and results stay accurate and auditable, because school decisions depend on them."
              tilt="left"
            />
            <IndexCard
              tag="Rule 4"
              title="Always Improving"
              text="We ship based on what real schools ask for, not what looks good on a feature list."
              tilt="right"
            />
          </div>
        </section>

        {/* ---------- CLOSING : chalkboard ---------- */}
        <section className="about-chalkboard">
          <div className="about-chalkboard-inner">
            <span className="about-chalk-eyebrow">Multiagent AI Platform</span>
            <h2>One platform, every stakeholder</h2>
            <p>
              CampusIQ brings administrators, teachers, students and parents
              onto one connected, role-based platform, built for how schools
              actually run day to day.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}