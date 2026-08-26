import { Outlet } from "react-router-dom";
import TeacherSidebar from "../TeacherSidebar";

export default function TeacherLayout() {
  return (
    <div className="teacher-layout">

      {/* =====================================================
          TEACHER SIDEBAR
      ====================================================== */}

      <TeacherSidebar />


      {/* =====================================================
          TEACHER MAIN AREA
      ====================================================== */}

      <div className="teacher-layout-content">

        <main>
          <Outlet />
        </main>

      </div>

    </div>
  );
}