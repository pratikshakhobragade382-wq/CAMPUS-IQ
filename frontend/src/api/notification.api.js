import axiosClient from "./axios";

// Get the latest notifications
export const getNotifications = async () => {
  const response = await axiosClient.get("/notifications");

  return response.data;
};

// Get the number of unread notifications
export const getUnreadNotificationCount = async () => {
  const response = await axiosClient.get("/notifications/unread-count");

  return response.data;
};

// Mark one notification as read
export const markNotificationAsRead = async (notificationId) => {
  const response = await axiosClient.put(
    `/notifications/${notificationId}/read`
  );

  return response.data;
};

// Mark ALL notifications as read
export const markAllNotificationsAsRead = async () => {
  const response = await axiosClient.put("/notifications/read-all");

  return response.data;
};

// Get all notifications from the past 15 days
export const getAllNotifications = async () => {
  const response = await axiosClient.get("/notifications/all");

  return response.data;
};

// Delete one notification
export const deleteNotification = async (notificationId) => {
  const response = await axiosClient.delete(
    `/notifications/${notificationId}`
  );

  return response.data;
};

// Delete ALL notifications
export const deleteAllNotifications = async () => {
  const response = await axiosClient.delete("/notifications");

  return response.data;
};