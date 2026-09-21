import {
  Outlet,
  useLocation,
} from "react-router-dom";

import StudentSidebar from "./StudentSidebar";
import StudentNavbar from "./StudentNavbar";

import StudentPerformance from "../StudentPerformance";

import "./StudentLayout.css";

export default function StudentLayout() {
  const location =
    useLocation();

  const isPerformancePage =
    location.pathname ===
    "/student/performance";

  return (
    <div className="student-portal">

      <StudentSidebar />

      <div className="student-main">

        <StudentNavbar />

        <main className="student-content">

          {isPerformancePage ? (
            <StudentPerformance />
          ) : (
            <Outlet />
          )}

        </main>

      </div>

    </div>
  );
}