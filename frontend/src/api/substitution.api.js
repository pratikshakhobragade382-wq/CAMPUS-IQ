import axiosClient from "./axios";

export const getAvailableSubstitutes = async (timetableId, date) => {
  const response = await axiosClient.get(
    `/substitution/available/${timetableId}`,
    { params: { date } }
  );
  return response.data;
};

export const assignSubstitute = async (data) => {
  const response = await axiosClient.post("/substitution", data);
  return response.data;
};

export const cancelSubstitution = async (id) => {
  const response = await axiosClient.delete(`/substitution/${id}`);
  return response.data;
};

export const getMySubstitutions = async (params = {}) => {
  const response = await axiosClient.get("/substitution/mine", { params });
  return response.data;
};
