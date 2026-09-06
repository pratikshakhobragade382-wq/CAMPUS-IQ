/**
 * Class API endpoints
 */

import axiosClient from "./axios";

// ============================================================
// GET ALL CLASSES
// ============================================================

export const getClasses = async () => {
  const response =
    await axiosClient.get("/classes");

  return response.data;
};

// ============================================================
// GET SINGLE CLASS
// ============================================================

export const getClassById = async (
  id
) => {
  const response =
    await axiosClient.get(
      `/classes/${id}`
    );

  return response.data;
};

// ============================================================
// CREATE CLASS
// ============================================================

export const createClass = async (
  data
) => {
  const response =
    await axiosClient.post(
      "/classes",
      data
    );

  return response.data;
};

// ============================================================
// UPDATE CLASS
// ============================================================

export const updateClass = async (
  id,
  data
) => {
  const response =
    await axiosClient.put(
      `/classes/${id}`,
      data
    );

  return response.data;
};

// ============================================================
// DELETE CLASS
// ============================================================

export const deleteClass = async (
  id
) => {
  const response =
    await axiosClient.delete(
      `/classes/${id}`
    );

  return response.data;
};

// ============================================================
// ADD SECTION TO CLASS
// ============================================================

export const addSectionToClass = async (
  classId,
  data
) => {
  const response =
    await axiosClient.post(
      `/classes/${classId}/sections`,
      data
    );

  return response.data;
};

// ============================================================
// GET SECTIONS FOR CLASS
// ============================================================

export const getClassSections = async (
  classId
) => {
  const response =
    await axiosClient.get(
      `/classes/${classId}/sections`
    );

  return response.data;
};

// ============================================================
// GET STUDENTS BY SECTION
// ============================================================

export const getStudentsBySection = async (
  classId,
  sectionId
) => {
  const response =
    await axiosClient.get(
      `/classes/${classId}/sections/${sectionId}/students`
    );

  return response.data;
};