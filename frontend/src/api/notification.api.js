import axiosClient from "./axios";

// =====================================================
// GET NOTIFICATIONS
// =====================================================

export const getNotifications =
  async () => {
    const response =
      await axiosClient.get(
        "/notifications"
      );

    return response.data;
  };

// =====================================================
// GET ALL NOTIFICATIONS
// =====================================================

export const getAllNotifications =
  async () => {
    const response =
      await axiosClient.get(
        "/notifications/all"
      );

    return response.data;
  };

// =====================================================
// GET UNREAD COUNT
// =====================================================

export const getUnreadNotificationCount =
  async () => {
    const response =
      await axiosClient.get(
        "/notifications/unread-count"
      );

    return response.data;
  };

// =====================================================
// CREATE NOTIFICATION
// =====================================================

export const createNotification =
  async ({
    title,

    message,

    type = "general",

    priority = "normal",

    audience,

    userId = null,

    classId = null,

    sectionId = null,

    expiresAt = null,
  }) => {
    const response =
      await axiosClient.post(
        "/notifications",
        {
          title,

          message,

          type,

          priority,

          audience,

          userId,

          classId,

          sectionId,

          expiresAt,
        }
      );

    return response.data;
  };

// =====================================================
// MARK ONE AS READ
// =====================================================

export const markNotificationAsRead =
  async (
    notificationId
  ) => {
    const response =
      await axiosClient.put(
        `/notifications/${notificationId}/read`
      );

    return response.data;
  };

// =====================================================
// MARK ALL AS READ
// =====================================================

export const markAllNotificationsAsRead =
  async () => {
    const response =
      await axiosClient.put(
        "/notifications/read-all"
      );

    return response.data;
  };

// =====================================================
// DELETE ONE
// =====================================================

export const deleteNotification =
  async (
    notificationId
  ) => {
    const response =
      await axiosClient.delete(
        `/notifications/${notificationId}`
      );

    return response.data;
  };

// =====================================================
// DELETE ALL
// =====================================================

export const deleteAllNotifications =
  async () => {
    const response =
      await axiosClient.delete(
        "/notifications"
      );

    return response.data;
  };