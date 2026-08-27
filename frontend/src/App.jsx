import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { AuthProvider } from "./context/AuthContext";
import { SidebarProvider } from "./context/SidebarContext";

import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";

// =====================================================
// PUBLIC PAGES
// =====================================================

import IndexPage from "./pages/IndexPage/IndexPage";
import About from "./pages/IndexPage/Navbar/About/About";
import Features from "./pages/IndexPage/Navbar/Features/Features";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import PortalLogin from "./pages/PortalLogin/PortalLogin";

// =====================================================
// TEACHER
// =====================================================

import TeacherLogin from "./teacher/auth/TeacherLogin";
import TeacherDashboard from "./teacher/TeacherDashboard";
import TeacherStudents from "./teacher/TeacherStudents";
import TeacherProfile from "./teacher/TeacherProfile";
import TeacherSettings from "./teacher/TeacherSettings";
import TeacherLayout from "./teacher/layouts/TeacherLayout";

// AI Teacher Co-Pilot
import AICopilot from "./teacher/Ai Copilot/AICopilot";

// =====================================================
// ADMIN DASHBOARD
// =====================================================

import Dashboard from "./pages/dashboard/Dashboard";

import AcademicYear from "./pages/AcademicYear/AcademicYear";
import Department from "./pages/Department/Department";
import ClassPage from "./pages/Class/Class";
import Section from "./pages/Section/Section";

import Student from "./pages/Student/Student";
import StudentForm from "./pages/Student/StudentForm";
import StudentView from "./pages/Student/StudentView";

import Attendance from "./pages/Attendance/Attendance";
import Exam from "./pages/Exam/Exam";
import Fee from "./pages/Fee/Fee";
import Holiday from "./pages/Holiday/Holiday";
import Timetable from "./pages/Timetable/Timetable";
import CustomFields from "./pages/CustomFields/CustomFields";

import Master from "./pages/Master/Master";
import MasterData from "./pages/MasterData/MasterData";
import Settings from "./pages/Settings/Settings";

// =====================================================
// STAFF
// =====================================================

import Staff from "./pages/staff/StaffList";
import AddStaff from "./pages/staff/AddStaff";
import EditStaff from "./pages/staff/EditStaff";

// =====================================================
// ADMIN
// =====================================================

import AddUser from "./pages/admin/AddUser";

// =====================================================
// OTHER
// =====================================================

import Notifications from "./pages/Notifications/Notifications";
import Profile from "./pages/Profile/Profile";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SidebarProvider>
          <Routes>

            {/* =====================================================
                PUBLIC ROUTES
            ====================================================== */}

            <Route
              path="/"
              element={<IndexPage />}
            />

            <Route
              path="/about"
              element={<About />}
            />

            <Route
              path="/features"
              element={<Features />}
            />

            {/* =====================================================
                ADMIN LOGIN
            ====================================================== */}

            <Route
              path="/login"
              element={<Login />}
            />

            {/* =====================================================
                PORTAL LOGIN
            ====================================================== */}

            <Route
              path="/portal-login"
              element={<PortalLogin />}
            />

            {/* =====================================================
                TEACHER LOGIN
            ====================================================== */}

            <Route
              path="/teacher-login"
              element={<TeacherLogin />}
            />

            {/* =====================================================
                REGISTER
            ====================================================== */}

            <Route
              path="/register"
              element={<Register />}
            />

            {/* =====================================================
                TEACHER ROUTES
                Protected - Teacher Only
            ====================================================== */}

            <Route
              element={
                <ProtectedRoute allowedRoles={["teacher"]}>
                  <TeacherLayout />
                </ProtectedRoute>
              }
            >

              {/* -----------------------------------------------------
                  TEACHER DASHBOARD
              ------------------------------------------------------ */}

              <Route
                path="/teacher/dashboard"
                element={<TeacherDashboard />}
              />

              {/* -----------------------------------------------------
                  TEACHER STUDENTS
              ------------------------------------------------------ */}

              <Route
                path="/teacher/students"
                element={<TeacherStudents />}
              />

              {/* -----------------------------------------------------
                  TEACHER PROFILE
              ------------------------------------------------------ */}

              <Route
                path="/teacher/profile"
                element={<TeacherProfile />}
              />

              {/* -----------------------------------------------------
                  TEACHER SETTINGS
              ------------------------------------------------------ */}

              <Route
                path="/teacher/settings"
                element={<TeacherSettings />}
              />

              {/* -----------------------------------------------------
                  AI TEACHER CO-PILOT
              ------------------------------------------------------ */}

              <Route
                path="/teacher/ai-copilot"
                element={<AICopilot />}
              />

            </Route>

            {/* =====================================================
                ADMIN ROUTES
                Protected - Admin Only
            ====================================================== */}

            <Route
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >

              {/* =================================================
                  ADMIN DASHBOARD
              ================================================= */}

              <Route
                path="/dashboard"
                element={<Dashboard />}
              />

              {/* =================================================
                  ACADEMIC YEAR
              ================================================= */}

              <Route
                path="/academic-year"
                element={<AcademicYear />}
              />

              {/* =================================================
                  MASTER
              ================================================= */}

              <Route
                path="/master"
                element={<Master />}
              />

              {/* =================================================
                  MASTER DATA
              ================================================= */}

              <Route
                path="/master-data"
                element={<MasterData />}
              />

              {/* =================================================
                  DEPARTMENT
              ================================================= */}

              <Route
                path="/department"
                element={<Department />}
              />

              {/* =================================================
                  CLASS
              ================================================= */}

              <Route
                path="/class"
                element={<ClassPage />}
              />

              {/* =================================================
                  SECTION
              ================================================= */}

              <Route
                path="/section"
                element={<Section />}
              />

              {/* =================================================
                  STUDENT
              ================================================= */}

              <Route
                path="/student"
                element={<Student />}
              />

              <Route
                path="/student/new"
                element={<StudentForm />}
              />

              <Route
                path="/student/:id"
                element={<StudentView />}
              />

              <Route
                path="/student/:id/edit"
                element={<StudentForm />}
              />

              {/* =================================================
                  ATTENDANCE
              ================================================= */}

              <Route
                path="/attendance"
                element={<Attendance />}
              />

              {/* =================================================
                  EXAM
              ================================================= */}

              <Route
                path="/exam"
                element={<Exam />}
              />

              {/* =================================================
                  FEE
              ================================================= */}

              <Route
                path="/fee"
                element={<Fee />}
              />

              {/* =================================================
                  HOLIDAY
              ================================================= */}

              <Route
                path="/holiday"
                element={<Holiday />}
              />

              {/* =================================================
                  TIMETABLE
              ================================================= */}

              <Route
                path="/timetable"
                element={<Timetable />}
              />

              {/* =================================================
                  CUSTOM FIELDS
              ================================================= */}

              <Route
                path="/custom-fields"
                element={<CustomFields />}
              />

              {/* =================================================
                  SETTINGS
              ================================================= */}

              <Route
                path="/settings"
                element={<Settings />}
              />

              {/* =================================================
                  NOTIFICATIONS
              ================================================= */}

              <Route
                path="/notifications"
                element={<Notifications />}
              />

              {/* =================================================
                  PROFILE
              ================================================= */}

              <Route
                path="/profile"
                element={<Profile />}
              />

              {/* =================================================
                  STAFF
                  ADMIN ONLY
              ================================================= */}

              <Route
                path="/staff"
                element={<Staff />}
              />

              <Route
                path="/staff/new"
                element={<AddStaff />}
              />

              <Route
                path="/staff/:id/edit"
                element={<EditStaff />}
              />

              {/* =================================================
                  ADMIN USER MANAGEMENT
              ================================================= */}

              <Route
                path="/users/new"
                element={<AddUser />}
              />

            </Route>

            {/* =====================================================
                FALLBACK
            ====================================================== */}

            <Route
              path="*"
              element={
                <Navigate
                  to="/portal-login"
                  replace
                />
              }
            />

          </Routes>
        </SidebarProvider>
      </AuthProvider>

      <ToastContainer />

    </BrowserRouter>
  );
}

export default App;