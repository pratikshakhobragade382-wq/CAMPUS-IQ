import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import { SidebarProvider } from "./context/SidebarContext";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";

// Public pages
import IndexPage from "./pages/IndexPage/IndexPage";
import About from "./pages/IndexPage/Navbar/About/About";
import Features from "./pages/IndexPage/Navbar/Features/Features";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// Dashboard
import Dashboard from "./pages/dashboard/Dashboard";

// Main pages
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

// Staff
import Staff from "./pages/staff/StaffList";
import AddStaff from "./pages/staff/AddStaff";
import EditStaff from "./pages/staff/EditStaff";

// Admin
import AddUser from "./pages/admin/AddUser";

import Notifications from "./pages/Notifications/Notifications";

// Profile — NEW
import Profile from "./pages/Profile/Profile";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SidebarProvider>
          <Routes>

            {/* =========================
                PUBLIC ROUTES
            ========================== */}

            <Route path="/" element={<IndexPage />} />

            <Route path="/about" element={<About />} />

            <Route path="/features" element={<Features />} />

            <Route path="/login" element={<Login />} />

            <Route path="/register" element={<Register />} />


            {/* =========================
                PROTECTED ROUTES
            ========================== */}

            <Route
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >

              {/* Dashboard */}
              <Route
                path="/dashboard"
                element={<Dashboard />}
              />

              {/* Academic Year */}
              <Route
                path="/academic-year"
                element={<AcademicYear />}
              />

              {/* Master (Subjects) */}
              <Route
                path="/master"
                element={<Master />}
              />

              {/* Master Data */}
              <Route
                path="/master-data"
                element={<MasterData />}
              />

              {/* Department */}
              <Route
                path="/department"
                element={<Department />}
              />

              {/* Class */}
              <Route
                path="/class"
                element={<ClassPage />}
              />

              {/* Section */}
              <Route
                path="/section"
                element={<Section />}
              />

              {/* Student */}
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

              {/* Attendance */}
              <Route
                path="/attendance"
                element={<Attendance />}
              />

              {/* Exam */}
              <Route
                path="/exam"
                element={<Exam />}
              />

              {/* Fee */}
              <Route
                path="/fee"
                element={<Fee />}
              />

              {/* Holiday */}
              <Route
                path="/holiday"
                element={<Holiday />}
              />

              {/* Timetable */}
              <Route
                path="/timetable"
                element={<Timetable />}
              />

              {/* Custom Fields */}
              <Route
                path="/custom-fields"
                element={<CustomFields />}
              />

              {/* Settings */}
              <Route
                path="/settings"
                element={<Settings />}
              />

              {/* Notifications */}
              <Route
                path="/notifications"
                element={<Notifications />}
              />

              {/* Profile — NEW */}
              <Route
                path="/profile"
                element={<Profile />}
              />

              {/* =========================
                  STAFF
              ========================== */}

              <Route
                path="/staff"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <Staff />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/staff/new"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AddStaff />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/staff/:id/edit"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <EditStaff />
                  </ProtectedRoute>
                }
              />

              {/* =========================
                  ADMIN
              ========================== */}

              <Route
                path="/users/new"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AddUser />
                  </ProtectedRoute>
                }
              />

            </Route>


            {/* =========================
                FALLBACK ROUTE
            ========================== */}

            <Route
              path="*"
              element={<Navigate to="/dashboard" replace />}
            />

          </Routes>
        </SidebarProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;