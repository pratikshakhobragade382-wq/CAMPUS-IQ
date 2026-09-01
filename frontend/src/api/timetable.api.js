import axiosClient from "./axios";

// ============================================================
// TIME SLOTS
// ============================================================

export const getPeriodSlots = async () => {
  const response = await axiosClient.get(
    "/timetable/period-slots"
  );

  return response.data;
};

export const createPeriodSlot = async (
  data
) => {
  const response = await axiosClient.post(
    "/timetable/period-slots",
    data
  );

  return response.data;
};

export const updatePeriodSlot = async (
  id,
  data
) => {
  const response = await axiosClient.put(
    `/timetable/period-slots/${id}`,
    data
  );

  return response.data;
};

export const deletePeriodSlot = async (
  id
) => {
  const response = await axiosClient.delete(
    `/timetable/period-slots/${id}`
  );

  return response.data;
};

export const seedDefaultSlots = async () => {
  const response = await axiosClient.post(
    "/timetable/period-slots/seed"
  );

  return response.data;
};

// ============================================================
// TEACHER LIST
// ============================================================

export const getTeacherList = async (
  params = {}
) => {
  const response = await axiosClient.get(
    "/staff",
    {
      params: {
        page: 1,
        limit: 100,
        role: "teacher",
        ...params,
      },
    }
  );

  return response.data;
};

// ============================================================
// GET ALL TIMETABLE
// ============================================================

export const getAllTimetable = async (
  params = {}
) => {
  const response = await axiosClient.get(
    "/timetable",
    {
      params,
    }
  );

  return response.data;
};

// ============================================================
// CLASS TIMETABLE
// ============================================================

export const getClassTimetable = async (
  params = {}
) => {
  const response = await axiosClient.get(
    "/timetable/class",
    {
      params,
    }
  );

  return response.data;
};

// ============================================================
// TEACHER TIMETABLE
// ============================================================

export const getTeacherTimetable = async (
  params = {}
) => {
  const response = await axiosClient.get(
    "/timetable/teacher",
    {
      params,
    }
  );

  return response.data;
};

// ============================================================
// CREATE
// ============================================================

export const createTimetableEntry =
  async (data) => {
    const response =
      await axiosClient.post(
        "/timetable",
        data
      );

    return response.data;
  };

// ============================================================
// UPDATE
// ============================================================

export const updateTimetableEntry =
  async (id, data) => {
    const response =
      await axiosClient.put(
        `/timetable/${id}`,
        data
      );

    return response.data;
  };

// ============================================================
// DELETE
// ============================================================

export const deleteTimetableEntry =
  async (id) => {
    const response =
      await axiosClient.delete(
        `/timetable/${id}`
      );

    return response.data;
  };