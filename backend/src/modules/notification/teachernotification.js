// src/modules/notification/teacherNotification.js

const prisma = require('../../prisma/prismaClient');
const notificationService = require('./notification.service');


/* ============================================================
   GET USER ID FROM STAFF ID
============================================================ */

const getUserIdFromStaffId = async (
  tenantId,
  staffId
) => {
  if (!staffId) {
    return null;
  }

  const user = await prisma.user.findFirst({
    where: {
      tenantId,
      staffId: Number(staffId),
      isDeleted: false,
    },

    select: {
      id: true,
    },
  });

  return user ? user.id : null;
};


/* ============================================================
   SEND ONE TEACHER NOTIFICATION
============================================================ */

const notifyTeacher = async ({
  tenantId,
  userId,
  staffId,
  title,
  message,
  type = 'activity',
  priority = 'normal',
}) => {
  try {
    let targetUserId = userId
      ? Number(userId)
      : null;

    /*
     * If User ID is not available, find it using Staff ID.
     */
    if (!targetUserId && staffId) {
      targetUserId =
        await getUserIdFromStaffId(
          tenantId,
          staffId
        );
    }

    /*
     * No user account means there is nowhere
     * to display the notification.
     */
    if (!targetUserId) {
      console.warn(
        'Teacher notification skipped: User account not found.',
        {
          tenantId,
          staffId,
        }
      );

      return null;
    }

    const notification =
      await notificationService.createNotification({
        tenantId,

        title,

        message,

        type,

        priority,

        audience: 'individual',

        userId: targetUserId,

        createdById: targetUserId,
      });

    console.log(
      `Teacher notification created successfully for user ${targetUserId}`
    );

    return notification;
  } catch (error) {
    /*
     * Notification failure should never break
     * the main academic operation.
     */
    console.error(
      'Teacher notification failed:',
      error
    );

    return null;
  }
};


/* ============================================================
   SEND NOTIFICATION TO ALL TEACHERS OF A CLASS
============================================================ */

const notifyTeachersForClass = async ({
  tenantId,
  classId,
  title,
  message,
  type = 'exam',
  priority = 'normal',
}) => {
  try {
    if (!classId) {
      return [];
    }

    /*
     * Find all active timetable assignments
     * for this class.
     */
    const timetableEntries =
      await prisma.timetable.findMany({
        where: {
          tenantId,
          classId: Number(classId),
          isActive: true,
        },

        select: {
          staffId: true,
        },

        distinct: [
          'staffId',
        ],
      });

    if (
      timetableEntries.length === 0
    ) {
      console.warn(
        `No teachers found for class ${classId}.`
      );

      return [];
    }

    const staffIds =
      timetableEntries
        .map(
          (entry) =>
            entry.staffId
        )
        .filter(Boolean);

    if (staffIds.length === 0) {
      return [];
    }

    const users =
      await prisma.user.findMany({
        where: {
          tenantId,

          staffId: {
            in: staffIds,
          },

          isDeleted: false,
        },

        select: {
          id: true,
          staffId: true,
        },
      });

    const notifications = [];

    for (const user of users) {
      const notification =
        await notifyTeacher({
          tenantId,

          userId:
            user.id,

          staffId:
            user.staffId,

          title,

          message,

          type,

          priority,
        });

      if (notification) {
        notifications.push(
          notification
        );
      }
    }

    return notifications;
  } catch (error) {
    console.error(
      'Class teacher notification failed:',
      error
    );

    return [];
  }
};


module.exports = {
  notifyTeacher,
  notifyTeachersForClass,
};