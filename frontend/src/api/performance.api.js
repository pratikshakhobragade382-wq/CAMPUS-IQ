import axiosClient from "./axios";

export const getParentPerformanceTracker =
  async (academicYearId) => {
    const response =
      await axiosClient.get(
        "/parent/performance",
        {
          params: {
            academicYearId,
          },
        }
      );

    return response.data;
  };