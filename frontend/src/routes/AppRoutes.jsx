/**
 * Routes configuration
 * Central place for all route definitions
 */

import { Routes, Route, Navigate } from "react-router-dom";

import { DashboardLayout } from "../layouts/DashboardLayout";

import Dashboard from "../pages/Dashboard/Dashboard";
import AcademicYear from "../pages/AcademicYear/AcademicYear";
import Department from "../pages/Department/Department";
import ClassPage from "../pages/Class/Class";
import Section from "../pages/Section/Section";
import Student from "../pages/Student/Student";
import Staff from "../pages/Staff/Staff";
import Attendance from "../pages/Attendance/Attendance";
import Exam from "../pages/Exam/Exam";
import Fee from "../pages/Fee/Fee";
import Holiday from "../pages/Holiday/Holiday";
import Timetable from "../pages/Timetable/Timetable";
import CustomFields from "../pages/CustomFields/CustomFields";
import Settings from "../pages/Settings/Settings";

// Notifications
import Notifications from "../pages/Notifications/Notifications";

// Profile
import Profile from "../pages/Profile/Profile";

import { ROUTES } from "../utils/constants";

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Dashboard Layout */}
      <Route element={<DashboardLayout />}>

        {/* Dashboard */}
        <Route
          path={ROUTES.DASHBOARD}
          element={<Dashboard />}
        />

        {/* Academic Year */}
        <Route
          path={ROUTES.ACADEMIC_YEAR}
          element={<AcademicYear />}
        />

        {/* Department */}
        <Route
          path={ROUTES.DEPARTMENT}
          element={<Department />}
        />

        {/* Class */}
        <Route
          path={ROUTES.CLASS}
          element={<ClassPage />}
        />

        {/* Section */}
        <Route
          path={ROUTES.SECTION}
          element={<Section />}
        />

        {/* Student */}
        <Route
          path={ROUTES.STUDENT}
          element={<Student />}
        />

        {/* Staff */}
        <Route
          path={ROUTES.STAFF}
          element={<Staff />}
        />

        {/* Attendance */}
        <Route
          path={ROUTES.ATTENDANCE}
          element={<Attendance />}
        />

        {/* Exam */}
        <Route
          path={ROUTES.EXAM}
          element={<Exam />}
        />

        {/* Fee */}
        <Route
          path={ROUTES.FEE}
          element={<Fee />}
        />

        {/* Holiday */}
        <Route
          path={ROUTES.HOLIDAY}
          element={<Holiday />}
        />

        {/* Timetable */}
        <Route
          path={ROUTES.TIMETABLE}
          element={<Timetable />}
        />

        {/* Custom Fields */}
        <Route
          path={ROUTES.CUSTOM_FIELDS}
          element={<CustomFields />}
        />

        {/* Settings */}
        <Route
          path={ROUTES.SETTINGS}
          element={<Settings />}
        />

        {/* Profile */}
        <Route
          path={ROUTES.PROFILE}
          element={<Profile />}
        />

        {/* Notifications */}
        <Route
          path={ROUTES.NOTIFICATIONS}
          element={<Notifications />}
        />

      </Route>

      {/* Default Route */}
      <Route
        path="/"
        element={
          <Navigate
            to={ROUTES.DASHBOARD}
            replace
          />
        }
      />
    </Routes>
  );
};