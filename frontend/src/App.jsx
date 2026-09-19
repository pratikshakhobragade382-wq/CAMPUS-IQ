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
import PortalLogin from "./pages/PortalLogin/PortalLogin";

/*
============================================================
 PARENT
============================================================
*/

import ParentLogin from "./parent/ParentLogin";
import ParentLayout from "./parent/layout/ParentLayout";

import AIPerformancePredictor from "./parent/AIPerformancePredictor";
import MyChildren from "./parent/MyChildren";
import ParentAttendance from "./parent/ParentAttendance";
import ParentAssignments from "./parent/ParentAssignments";
import ParentCalendar from "./parent/ParentCalendar";
import ParentProfile from "./parent/ParentProfile";
import ParentSettings from "./parent/ParentSettings";
import ParentNotifications from "./parent/ParentNotifications";
import ParentComplaints from "./parent/complaints/ParentComplaints";

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

  const hideChatbot = [
    "/login",
    "/register",
    "/portal-login",
    "/teacher-login",
    "/parent-login",
  ].includes(location.pathname);

  return (
    <>
      <Routes>
        {/* ==================================================
            PUBLIC
        ================================================== */}

        <Route path="/" element={<IndexPage />} />

        <Route path="/about" element={<About />} />

        <Route path="/features" element={<Features />} />

        <Route path="/login" element={<Login />} />

        <Route path="/portal-login" element={<PortalLogin />} />

        <Route path="/parent-login" element={<ParentLogin />} />

        <Route path="/teacher-login" element={<TeacherLogin />} />

        <Route path="/register" element={<Register />} />

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
          <Route
            path="/parent/dashboard"
            element={
              <div
                style={{
                  padding: "30px",
                }}
              >
                <h2>Parent Dashboard</h2>

                <p>
                  Parent dashboard is coming next.
                </p>
              </div>
            }
          />

          <Route
            path="/parent/children"
            element={<MyChildren />}
          />

          {/* ==================================================
              PARENT CALENDAR
          ================================================== */}

          <Route
            path="/parent/calendar"
            element={<ParentCalendar />}
          />

          <Route
            path="/parent/attendance"
            element={<ParentAttendance />}
          />

          <Route
            path="/parent/assignments"
            element={<ParentAssignments />}
          />

          <Route
            path="/parent/ai-performance"
            element={<AIPerformancePredictor />}
          />

          <Route
            path="/parent/profile"
            element={<ParentProfile />}
          />

          <Route
            path="/parent/settings"
            element={<ParentSettings />}
          />

          <Route
            path="/parent/notifications"
            element={<ParentNotifications />}
          />

          {/* ==================================================
              PARENT COMPLAINT MANAGEMENT
          ================================================== */}

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
          <Route
            path="/teacher/dashboard"
            element={<TeacherDashboard />}
          />

          <Route
            path="/teacher/notifications"
            element={<TeacherNotifications />}
          />

          <Route
            path="/teacher/students"
            element={<TeacherStudents />}
          />

          <Route
            path="/teacher/profile"
            element={<TeacherProfile />}
          />

          <Route
            path="/teacher/settings"
            element={<TeacherSettings />}
          />

          <Route
            path="/teacher/ai-copilot"
            element={<AICopilot />}
          />

          <Route
            path="/teacher/classes"
            element={<MyClasses />}
          />

          <Route
            path="/teacher/timetable"
            element={<TeacherTimetable />}
          />

          <Route
            path="/teacher/exams"
            element={<TeacherExams />}
          />

          <Route
            path="/teacher/assignments"
            element={<TeacherAssignments />}
          />

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
          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/academic-year"
            element={<AcademicYear />}
          />

          <Route
            path="/master"
            element={<Master />}
          />

          <Route
            path="/master-data"
            element={<MasterData />}
          />

          <Route
            path="/department"
            element={<Department />}
          />

          <Route
            path="/class"
            element={<ClassPage />}
          />

          <Route
            path="/section"
            element={<Section />}
          />

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

          <Route
            path="/attendance"
            element={<Attendance />}
          />

          <Route
            path="/exam"
            element={<Exam />}
          />

          <Route
            path="/fee"
            element={<Fee />}
          />

          <Route
            path="/holiday"
            element={<Holiday />}
          />

          <Route
            path="/timetable"
            element={<Timetable />}
          />

          <Route
            path="/custom-fields"
            element={<CustomFields />}
          />

          <Route
            path="/settings"
            element={<Settings />}
          />

          <Route
            path="/notifications"
            element={<Notifications />}
          />

          <Route
            path="/profile"
            element={<Profile />}
          />

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

          <Route
            path="/users/new"
            element={<AddUser />}
          />

          {/* ================================================
              COMPLAINT MANAGEMENT
              ================================================ */}

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