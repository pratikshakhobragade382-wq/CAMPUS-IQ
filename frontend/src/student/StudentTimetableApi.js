import axiosClient from "../api/axios";

/*
============================================================
 STUDENT TIMETABLE API
============================================================

 GET /timetable/class         -> { success, message, data: { Monday: [...], ... } }
 GET /timetable/period-slots  -> { success, data: [...] }
 GET /student-portal/profile  -> used only to find the student's class / section

 Every function returns the response body ({ success, data }).
============================================================
*/

export const getStudentClassTimetable = async (params) => {
  const response = await axiosClient.get("/timetable/class", {
    params,
  });

  return response.data;
};

export const getPeriodSlots = async () => {
  const response = await axiosClient.get("/timetable/period-slots");

  return response.data;
};

export const getStudentPortalProfile = async () => {
  const response = await axiosClient.get("/student-portal/profile");

  return response.data;
};