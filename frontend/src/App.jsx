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
import Chatbot from "./components/chatbot/chatbot";
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
import TeacherNotifications from "./teacher/TeacherNotifications";
import TeacherLogin from "./teacher/auth/TeacherLogin";
import TeacherDashboard from "./teacher/TeacherDashboard";
import TeacherStudents from "./teacher/TeacherStudents";
import TeacherProfile from "./teacher/TeacherProfile";
import TeacherSettings from "./teacher/TeacherSettings";
import TeacherLayout from "./teacher/layouts/TeacherLayout";

import TeacherAttendance from "./teacher/Attendance/Attendance";

import AICopilot from "./teacher/Ai Copilot/AICopilot";
import MyClasses from "./teacher/classes/MyClasses";
import TeacherTimetable from "./teacher/timetable/TeacherTimetable";
import TeacherExams from "./teacher/exams/TeacherExams";
import TeacherAssignments from "./teacher/assignments/TeacherAssignments";

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

// =====================================================
// APP
// =====================================================

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SidebarProvider>
          <Routes>
            {/* =====================================================
                PUBLIC ROUTES
            ===================================================== */}

            <Route path="/" element={<IndexPage />} />
            <Route path="/about" element={<About />} />
            <Route path="/features" element={<Features />} />

            {/* ADMIN LOGIN */}
            <Route path="/login" element={<Login />} />

            {/* PORTAL LOGIN */}
            <Route path="/portal-login" element={<PortalLogin />} />

            {/* TEACHER LOGIN */}
            <Route path="/teacher-login" element={<TeacherLogin />} />

            {/* REGISTER */}
            <Route path="/register" element={<Register />} />

            {/* =====================================================
                TEACHER ROUTES
            ===================================================== */}

            <Route
              element={
                <ProtectedRoute allowedRoles={["teacher"]}>
                  <TeacherLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/teacher/dashboard" element={<TeacherDashboard />} />

              <Route
                path="/teacher/notifications"
                element={
                  <ProtectedRoute allowedRoles={["teacher"]}>
                    <TeacherNotifications />
                  </ProtectedRoute>
                }
              />

              <Route path="/teacher/students" element={<TeacherStudents />} />
              <Route path="/teacher/profile" element={<TeacherProfile />} />
              <Route path="/teacher/settings" element={<TeacherSettings />} />
              <Route path="/teacher/ai-copilot" element={<AICopilot />} />
              <Route path="/teacher/classes" element={<MyClasses />} />
              <Route path="/teacher/assignments" element={<TeacherAssignments />} />
              <Route path="/teacher/timetable" element={<TeacherTimetable />} />
              <Route path="/teacher/exams" element={<TeacherExams />} />

              <Route
                path="/teacher/attendance"
                element={
                  <ProtectedRoute allowedRoles={["teacher"]}>
                    <TeacherAttendance />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* =====================================================
                ADMIN ROUTES
            ===================================================== */}

            <Route
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/academic-year" element={<AcademicYear />} />
              <Route path="/master" element={<Master />} />
              <Route path="/master-data" element={<MasterData />} />
              <Route path="/department" element={<Department />} />
              <Route path="/class" element={<ClassPage />} />
              <Route path="/section" element={<Section />} />
              <Route path="/student" element={<Student />} />
              <Route path="/student/new" element={<StudentForm />} />
              <Route path="/student/:id" element={<StudentView />} />
              <Route path="/student/:id/edit" element={<StudentForm />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/exam" element={<Exam />} />
              <Route path="/fee" element={<Fee />} />
              <Route path="/holiday" element={<Holiday />} />
              <Route path="/timetable" element={<Timetable />} />
              <Route path="/custom-fields" element={<CustomFields />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/staff" element={<Staff />} />
              <Route path="/staff/new" element={<AddStaff />} />
              <Route path="/staff/:id/edit" element={<EditStaff />} />
              <Route path="/users/new" element={<AddUser />} />
            </Route>

            {/* FALLBACK */}
            <Route
              path="*"
              element={<Navigate to="/portal-login" replace />}
            />
          </Routes>

          <Chatbot />
        </SidebarProvider>

        <ToastContainer />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;