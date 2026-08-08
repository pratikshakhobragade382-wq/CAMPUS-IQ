/**
 * Routes configuration
 * Central place for all route definitions
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import Dashboard from '../pages/Dashboard/Dashboard';
import AcademicYear from '../pages/AcademicYear/AcademicYear';
import Department from '../pages/Department/Department';
import ClassPage from '../pages/Class/Class';
import Section from '../pages/Section/Section';
import Student from '../pages/Student/Student';
import Staff from '../pages/Staff/Staff';
import Attendance from '../pages/Attendance/Attendance';
import Exam from '../pages/Exam/Exam';
import Fee from '../pages/Fee/Fee';
import Holiday from '../pages/Holiday/Holiday';
import Timetable from '../pages/Timetable/Timetable';
import CustomFields from '../pages/CustomFields/CustomFields';
import Settings from '../pages/Settings/Settings';
import { ROUTES } from '../utils/constants';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
        <Route path={ROUTES.ACADEMIC_YEAR} element={<AcademicYear />} />
        <Route path={ROUTES.DEPARTMENT} element={<Department />} />
        <Route path={ROUTES.CLASS} element={<ClassPage />} />
        <Route path={ROUTES.SECTION} element={<Section />} />
        <Route path={ROUTES.STUDENT} element={<Student />} />
        <Route path={ROUTES.STAFF} element={<Staff />} />
        <Route path={ROUTES.ATTENDANCE} element={<Attendance />} />
        <Route path={ROUTES.EXAM} element={<Exam />} />
        <Route path={ROUTES.FEE} element={<Fee />} />
        <Route path={ROUTES.HOLIDAY} element={<Holiday />} />
        <Route path={ROUTES.TIMETABLE} element={<Timetable />} />
        <Route path={ROUTES.CUSTOM_FIELDS} element={<CustomFields />} />
        <Route path={ROUTES.SETTINGS} element={<Settings />} />
      </Route>
      <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
    </Routes>
  );
};
