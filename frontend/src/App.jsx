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
import Attendance from "./pages/Attendance/Attendance";
import Exam from "./pages/Exam/Exam";
import Fee from "./pages/Fee/Fee";
import Holiday from "./pages/Holiday/Holiday";
import Timetable from "./pages/Timetable/Timetable";
import CustomFields from "./pages/CustomFields/CustomFields";
import Settings from "./pages/Settings/Settings";

// Staff
import Staff from "./pages/staff/Staff";
import AddStaff from "./pages/staff/AddStaff";

// Admin
import AddUser from "./pages/admin/AddUser";

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

              {/* Master */}
              <Route
                path="/master"
                element={
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">Master</h1>
                    <p className="text-gray-500 mt-2">
                      Master management page
                    </p>
                  </div>
                }
              />

              {/* Master Data */}
              <Route
                path="/master-data"
                element={
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">Master Data</h1>
                    <p className="text-gray-500 mt-2">
                      Master data management page
                    </p>
                  </div>
                }
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