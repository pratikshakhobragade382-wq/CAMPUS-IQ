import { Outlet } from "react-router-dom";

import StudentSidebar from "./StudentSidebar";
import StudentNavbar from "./StudentNavbar";

import "./StudentLayout.css";

export default function StudentLayout() {
  return (
    <div className="student-portal">
      <StudentSidebar />

      <div className="student-main">
        <StudentNavbar />

        <main className="student-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
