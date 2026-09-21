import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { AuthProvider } from "./context/AuthContext";
import { SidebarProvider } from "./context/SidebarContext";

import ProtectedRoute from "./components/ProtectedRoute";
import Chatbot from "./components/chatbot/chatbot";
import DashboardLayout from "./layouts/DashboardLayout";

/*
============================================================
 PUBLIC
============================================================
*/

import IndexPage from "./pages/IndexPage/IndexPage";
import About from "./pages/IndexPage/Navbar/About/About";
import Features from "./pages/IndexPage/Navbar/Features/Features";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ChangePassword from "./pages/auth/ChangePassword";
import PortalLogin from "./pages/PortalLogin/PortalLogin";

/*
============================================================
 STUDENT
============================================================
*/

import StudentLogin from "./student/Login Form/StudentLogin";
import StudentLayout from "./student/Layout/StudentLayout";
import StudentDashboard from "./student/dashboard/StudentDashboard";
import StudentComplaints from "./student/complaints/StudentComplaints";
import StudentProfile from "./student/StudentProfile";
import StudentSettings from "./student/StudentSettings";
import StudentNotifications from "./student/Notifications/StudentNotifications";
import StudentAttendance from "./student/StudentAttendance";
import StudentAssignments from "./student/StudentAssignments";

/*
============================================================
 PARENT
============================================================
*/

import ParentLogin from "./parent/ParentLogin";
import ParentLayout from "./parent/layout/ParentLayout";
import ParentDashboard from "./parent/dashboard/ParentDashboard";

import AIPerformancePredictor from "./parent/AIPerformancePredictor";
import MyChildren from "./parent/MyChildren";
import ParentAttendance from "./parent/ParentAttendance";
import ParentAssignments from "./parent/ParentAssignments";
import ParentCalendar from "./parent/ParentCalendar";
import ParentProfile from "./parent/ParentProfile";
import ParentSettings from "./parent/ParentSettings";
import ParentNotifications from "./parent/ParentNotifications";
import ParentComplaints from "./parent/complaints/ParentComplaints";
import ParentTimetable from "./parent/ParentTimetable";
import ParentExams from "./parent/ParentExams";

/*
============================================================
 TEACHER
============================================================
*/

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

/*
============================================================
 ADMIN
============================================================
*/

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

/*
============================================================
 COMPLAINT MANAGEMENT
============================================================
*/

import Complaints from "./pages/Complaints/Complaints";

/*
============================================================
 STAFF
============================================================
*/

import Staff from "./pages/staff/StaffList";
import AddStaff from "./pages/staff/AddStaff";
import EditStaff from "./pages/staff/EditStaff";

/*
============================================================
 ADMIN USER
============================================================
*/

import AddUser from "./pages/admin/AddUser";

/*
============================================================
 OTHER
============================================================
*/

import Notifications from "./pages/Notifications/Notifications";
import Profile from "./pages/Profile/Profile";

/*
============================================================
 APP CONTENT
============================================================
*/

function AppContent() {
  const location = useLocation();

  /*
  ============================================================
  HIDE CHATBOT ON LOGIN / PUBLIC PORTAL PAGES
  ============================================================
  */

  const hideChatbot = [
    "/login",
    "/register",
    "/change-password",
    "/portal-login",
    "/portal",
    "/teacher-login",
    "/parent-login",
    "/student-login",
    "/student/login",
  ].includes(location.pathname);

  return (
    <>
      <Routes>

        {/* ==================================================
            PUBLIC
        ================================================== */}

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

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/portal-login"
          element={<PortalLogin />}
        />

        <Route
          path="/portal"
          element={<PortalLogin />}
        />

        <Route
          path="/parent-login"
          element={<ParentLogin />}
        />

        <Route
          path="/teacher-login"
          element={<TeacherLogin />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/change-password"
          element={<ChangePassword />}
        />

        {/* ==================================================
            STUDENT LOGIN
        ================================================== */}

        <Route
          path="/student-login"
          element={<StudentLogin />}
        />

        <Route
          path="/student/login"
          element={<StudentLogin />}
        />

        {/* ==================================================
            STUDENT PORTAL
        ================================================== */}

        <Route
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentLayout />
            </ProtectedRoute>
          }
        >

          {/* STUDENT DASHBOARD */}

          <Route
            path="/student/dashboard"
            element={<StudentDashboard />}
          />

          {/* STUDENT ATTENDANCE */}

          <Route
            path="/student/attendance"
            element={<StudentAttendance />}
          />

          {/* STUDENT ASSIGNMENTS */}

          <Route
            path="/student/assignments"
            element={<StudentAssignments />}
          />

          {/* STUDENT TIMETABLE */}

          <Route
            path="/student/timetable"
            element={
              <div style={{ padding: "30px" }}>
                <h2>Timetable</h2>
                <p>
                  Student timetable will appear here.
                </p>
              </div>
            }
          />

          {/* STUDENT EXAMS */}

          <Route
            path="/student/exams"
            element={
              <div style={{ padding: "30px" }}>
                <h2>Exams & Results</h2>
                <p>
                  Student exams and results will appear here.
                </p>
              </div>
            }
          />

          {/* STUDENT PERFORMANCE */}

          <Route
            path="/student/performance"
            element={
              <div style={{ padding: "30px" }}>
                <h2>Performance</h2>
                <p>
                  Student performance will appear here.
                </p>
              </div>
            }
          />

          {/* STUDENT NOTIFICATIONS */}

          <Route
            path="/student/notifications"
            element={<StudentNotifications />}
          />

          {/* STUDENT COMPLAINTS */}

          <Route
            path="/student/complaints"
            element={<StudentComplaints />}
          />

          {/* STUDENT PROFILE */}

          <Route
            path="/student/profile"
            element={<StudentProfile />}
          />

          {/* STUDENT SETTINGS */}

          <Route
            path="/student/settings"
            element={<StudentSettings />}
          />

        </Route>

        {/* ==================================================
            PARENT PORTAL
        ================================================== */}

        <Route
          element={
            <ProtectedRoute allowedRoles={["parent"]}>
              <ParentLayout />
            </ProtectedRoute>
          }
        >

          {/* PARENT DASHBOARD */}

          <Route
            path="/parent/dashboard"
            element={<ParentDashboard />}
          />

          {/* CHILDREN */}

          <Route
            path="/parent/children"
            element={<MyChildren />}
          />

          {/* CALENDAR */}

          <Route
            path="/parent/calendar"
            element={<ParentCalendar />}
          />

          {/* ATTENDANCE */}

          <Route
            path="/parent/attendance"
            element={<ParentAttendance />}
          />

          {/* ASSIGNMENTS */}

          <Route
            path="/parent/assignments"
            element={<ParentAssignments />}
          />

          {/* TIMETABLE */}

          <Route
            path="/parent/timetable"
            element={<ParentTimetable />}
          />

          {/* EXAMS */}

          <Route
            path="/parent/exams"
            element={<ParentExams />}
          />

          {/* AI PERFORMANCE */}

          <Route
            path="/parent/ai-performance"
            element={<AIPerformancePredictor />}
          />

          {/* PROFILE */}

          <Route
            path="/parent/profile"
            element={<ParentProfile />}
          />

          {/* SETTINGS */}

          <Route
            path="/parent/settings"
            element={<ParentSettings />}
          />

          {/* NOTIFICATIONS */}

          <Route
            path="/parent/notifications"
            element={<ParentNotifications />}
          />

          {/* COMPLAINTS */}

          <Route
            path="/parent/complaints"
            element={<ParentComplaints />}
          />

        </Route>

        {/* ==================================================
            TEACHER PORTAL
        ================================================== */}

        <Route
          element={
            <ProtectedRoute allowedRoles={["teacher"]}>
              <TeacherLayout />
            </ProtectedRoute>
          }
        >

          {/* TEACHER DASHBOARD */}

          <Route
            path="/teacher/dashboard"
            element={<TeacherDashboard />}
          />

          {/* NOTIFICATIONS */}

          <Route
            path="/teacher/notifications"
            element={<TeacherNotifications />}
          />

          {/* STUDENTS */}

          <Route
            path="/teacher/students"
            element={<TeacherStudents />}
          />

          {/* PROFILE */}

          <Route
            path="/teacher/profile"
            element={<TeacherProfile />}
          />

          {/* SETTINGS */}

          <Route
            path="/teacher/settings"
            element={<TeacherSettings />}
          />

          {/* AI COPILOT */}

          <Route
            path="/teacher/ai-copilot"
            element={<AICopilot />}
          />

          {/* CLASSES */}

          <Route
            path="/teacher/classes"
            element={<MyClasses />}
          />

          {/* TIMETABLE */}

          <Route
            path="/teacher/timetable"
            element={<TeacherTimetable />}
          />

          {/* EXAMS */}

          <Route
            path="/teacher/exams"
            element={<TeacherExams />}
          />

          {/* ASSIGNMENTS */}

          <Route
            path="/teacher/assignments"
            element={<TeacherAssignments />}
          />

          {/* ATTENDANCE */}

          <Route
            path="/teacher/attendance"
            element={<TeacherAttendance />}
          />

        </Route>

        {/* ==================================================
            ADMIN DASHBOARD
        ================================================== */}

        <Route
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >

          {/* ADMIN DASHBOARD */}

          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          {/* ACADEMIC YEAR */}

          <Route
            path="/academic-year"
            element={<AcademicYear />}
          />

          {/* MASTER */}

          <Route
            path="/master"
            element={<Master />}
          />

          <Route
            path="/master-data"
            element={<MasterData />}
          />

          {/* DEPARTMENT */}

          <Route
            path="/department"
            element={<Department />}
          />

          {/* CLASS */}

          <Route
            path="/class"
            element={<ClassPage />}
          />

          {/* SECTION */}

          <Route
            path="/section"
            element={<Section />}
          />

          {/* ==================================================
              ADMIN STUDENT MANAGEMENT
          ================================================== */}

          <Route
            path="/student"
            element={<Student />}
          />

          <Route
            path="/student/new"
            element={<StudentForm />}
          />

          <Route
            path="/student/:id/edit"
            element={<StudentForm />}
          />

          <Route
            path="/student/:id"
            element={<StudentView />}
          />

          {/* ATTENDANCE */}

          <Route
            path="/attendance"
            element={<Attendance />}
          />

          {/* EXAM */}

          <Route
            path="/exam"
            element={<Exam />}
          />

          {/* FEE */}

          <Route
            path="/fee"
            element={<Fee />}
          />

          {/* HOLIDAY */}

          <Route
            path="/holiday"
            element={<Holiday />}
          />

          {/* TIMETABLE */}

          <Route
            path="/timetable"
            element={<Timetable />}
          />

          {/* CUSTOM FIELDS */}

          <Route
            path="/custom-fields"
            element={<CustomFields />}
          />

          {/* SETTINGS */}

          <Route
            path="/settings"
            element={<Settings />}
          />

          {/* ADMIN NOTIFICATIONS */}

          <Route
            path="/notifications"
            element={<Notifications />}
          />

          {/* ADMIN PROFILE */}

          <Route
            path="/profile"
            element={<Profile />}
          />

          {/* ==================================================
              STAFF
          ================================================== */}

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

          {/* ==================================================
              ADMIN USERS
          ================================================== */}

          <Route
            path="/users/new"
            element={<AddUser />}
          />

          {/* ==================================================
              COMPLAINT MANAGEMENT
          ================================================== */}

          <Route
            path="/complaints"
            element={<Complaints />}
          />

        </Route>

        {/* ==================================================
            FALLBACK
        ================================================== */}

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

      {/* ======================================================
          GLOBAL CHATBOT
      ====================================================== */}

      {!hideChatbot && <Chatbot />}

    </>
  );
}

/*
============================================================
 ROOT APP
============================================================
*/

function App() {
  return (
    <BrowserRouter>

      <AuthProvider>

        <SidebarProvider>

          <AppContent />

        </SidebarProvider>

        <ToastContainer />

      </AuthProvider>

    </BrowserRouter>
  );
}

export default App;