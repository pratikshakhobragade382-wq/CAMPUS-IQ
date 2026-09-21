const prisma =
  require("../../prisma/prismaClient");

const notificationService =
  require("./notification.service");

// ============================================================
// SEND NOTIFICATION TO STUDENTS OF A CLASS
// ============================================================
//
// This is used for:
// - Exam timetable
// - Exam timetable update
// - Other class-specific academic notifications
//
// ============================================================

const notifyStudentsForClass =
  async ({
    tenantId,
    classId,
    sectionId = null,
    title,
    message,
    type = "exam_timetable",
    priority = "high",
    createdById = null,
  }) => {
    try {
      if (!tenantId || !classId) {
        return [];
      }

      const numericClassId =
        Number(classId);

      const numericSectionId =
        sectionId
          ? Number(sectionId)
          : null;

      if (
        !Number.isInteger(
          numericClassId
        )
      ) {
        return [];
      }

      // ======================================================
      // VALIDATE CLASS
      // ======================================================

      const classRecord =
        await prisma.class.findFirst({
          where: {
            id: numericClassId,
            tenantId,
            isDeleted: false,
          },

          select: {
            id: true,
            name: true,
          },
        });

      if (!classRecord) {
        console.warn(
          `Student notification skipped. Class ${numericClassId} not found.`
        );

        return [];
      }

      // ======================================================
      // VALIDATE SECTION
      // ======================================================

      if (numericSectionId) {
        const section =
          await prisma.section.findFirst({
            where: {
              id: numericSectionId,
              classId: numericClassId,
              tenantId,
              isDeleted: false,
            },

            select: {
              id: true,
            },
          });

        if (!section) {
          console.warn(
            `Student notification skipped. Section ${numericSectionId} does not belong to class ${numericClassId}.`
          );

          return [];
        }
      }

      // ======================================================
      // CREATE ONE CLASS-TARGETED NOTIFICATION
      // ======================================================
      //
      // We DO NOT create one database row for every student.
      //
      // Instead:
      //
      // audience = student
      // classId = selected class
      // sectionId = selected section
      //
      // notification.service.js handles visibility.
      //
      // ======================================================

      const notification =
        await notificationService.createNotification({
          tenantId,

          title,

          message,

          type,

          priority,

          audience: "student",

          classId:
            numericClassId,

          sectionId:
            numericSectionId,

          createdById:
            createdById
              ? Number(createdById)
              : null,
        });

      console.log(
        `Student notification created for class ${numericClassId}`
      );

      return [notification];
    } catch (error) {
      // Notification must NEVER break
      // the exam operation.

      console.error(
        "Student class notification failed:",
        error
      );

      return [];
    }
  };

// ============================================================
// EXPORT
// ============================================================

module.exports = {
  notifyStudentsForClass,
};