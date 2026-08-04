import "./Hero.css";
import heroImage from "../../../assets/hero.png";

function Hero() {
  return (
    <section className="hero">

      {/* ================= Background Decorations ================= */}

      <div className="bg-circle circle-1"></div>
      <div className="bg-circle circle-2"></div>
      <div className="bg-circle circle-3"></div>
      <div className="bg-circle circle-4"></div>

      <div className="small-circle small-1"></div>
      <div className="small-circle small-2"></div>
      <div className="small-circle small-3"></div>
      <div className="small-circle small-4"></div>
      <div className="small-circle small-5"></div>
      <div className="small-circle small-6"></div>

      <div className="dot-pattern"></div>

      {/* ================= Left Section ================= */}

      <div className="hero-left">

        <h1>
          Smart School <br />
          Management <br />
          Made Simple.
        </h1>

        <p>
          Campus IQ is an all-in-one school management platform that
          simplifies administration, improves communication and helps
          schools manage students, teachers and parents efficiently.
        </p>

        <button className="hero-btn">
          Explore More
        </button>

      </div>

      {/* ================= Right Section ================= */}

      <div className="hero-right">

        {/* Background Circle */}
        <div className="hero-circle"></div>

        {/* Complete Solution */}
        <div className="floating-card top">
          <div className="icon orange">
            <i className="fas fa-school"></i>
          </div>
          <span>Complete Solution</span>
        </div>

        {/* Teacher Portal */}
        <div className="floating-card left-top">
          <div className="icon purple">
            <i className="fas fa-chalkboard-teacher"></i>
          </div>
          <span>Teacher Portal</span>
        </div>

        {/* Software */}
        <div className="floating-card left-bottom">
          <div className="icon blue">
            <i className="fas fa-laptop-code"></i>
          </div>
          <span>Software</span>
        </div>

        {/* Student Portal */}
        <div className="floating-card right-top">
          <div className="icon red">
            <i className="fas fa-user-graduate"></i>
          </div>
          <span>Student Portal</span>
        </div>

        {/* Parents Portal */}
        <div className="floating-card right-bottom">
          <div className="icon green">
            <i className="fas fa-users"></i>
          </div>
          <span>Parents Portal</span>
        </div>

        {/* Hero Image */}
        <img
          src={heroImage}
          alt="Campus IQ Student"
          className="hero-image"
        />

      </div>

    </section>
  );
}

export default Hero;