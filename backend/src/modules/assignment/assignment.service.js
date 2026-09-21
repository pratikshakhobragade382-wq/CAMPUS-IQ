// src/modules/assignment/assignment.service.js

const prisma = require("../../prisma/prismaClient");
const {
  HttpError,
} = require("../../utils/httpError");

const {
  notifyTeacher,
} = require("../notification/teacherNotification");

const notificationService =
  require("../notification/notification.service");

// ============================================================
// CREATE ASSIGNMENT
// ============================================================

exports.createAssignment = async ({
  title,
  description,
  classId,
  sectionId,
  subjectId,
  teacherId,
  dueDate,
  maxMarks = 100,
  attachmentUrl,
  tenantId,
  createdById,
}) => {
  if (
    !title ||
    !classId ||
    !subjectId ||
    !dueDate
  ) {
    throw new HttpError(
      400,
      "Title, classId, subjectId, and dueDate are required",
      {
        code: "VALIDATION_ERROR",
      }
    );
  }

  if (!tenantId) {
    throw new HttpError(
      400,
      "Tenant ID is missing",
      {
        code: "TENANT_ID_MISSING",
      }
    );
  }

  if (!teacherId) {
    throw new HttpError(
      400,
      "Teacher ID is missing",
      {
        code: "TEACHER_ID_MISSING",
      }
    );
  }

  const assignment =
    await prisma.assignment.create({
      data: {
        tenantId,

        title:
          title.trim(),

        description:
          description || null,

        classId:
          Number(classId),

        sectionId:
          sectionId
            ? Number(sectionId)
            : null,

        subjectId:
          Number(subjectId),

        teacherId:
          Number(teacherId),

        dueDate:
          new Date(dueDate),

        maxMarks:
          maxMarks
            ? Number(maxMarks)
            : 100,

        attachmentUrl:
          attachmentUrl || null,

        isActive: true,

        updatedAt:
          new Date(),
      },
    });

  // ==========================================================
  // TEACHER NOTIFICATION
  // ==========================================================

  try {
    await notifyTeacher({
      tenantId,

      userId:
        createdById,

      staffId:
        teacherId,

      title:
        "Assignment Created",

      message:
        `Assignment "${assignment.title}" was created successfully.`,

      type:
        "activity",

      priority:
        "normal",
    });
  } catch (error) {
    console.error(
      "Teacher assignment notification failed:",
      error
    );
  }

  // ==========================================================
  // STUDENT NOTIFICATION
  // ==========================================================

  try {
    await notificationService.createNotification({
      tenantId,

      title:
        "New Assignment",

      message:
        `A new assignment "${assignment.title}" has been created. Due date: ${new Date(
          assignment.dueDate
        ).toLocaleDateString("en-IN")}.`,

      type:
        "assignment",

      priority:
        "normal",

      audience:
        "student",

      classId:
        assignment.classId,

      sectionId:
        assignment.sectionId,

      createdById:
        createdById,
    });
  } catch (error) {
    console.error(
      "Student assignment notification failed:",
      error
    );
  }

  return assignment;
};

// ============================================================
// GET TEACHER ASSIGNMENTS
// ============================================================

exports.getTeacherAssignments =
  async ({
    teacherId,
    tenantId,
    classId,
    subjectId,
  }) => {
    const where = {
      tenantId,
      isActive: true,
    };

    if (teacherId) {
      where.teacherId =
        Number(teacherId);
    }

    if (classId) {
      where.classId =
        Number(classId);
    }

    if (subjectId) {
      where.subjectId =
        Number(subjectId);
    }

    return prisma.assignment.findMany({
      where,

      orderBy: {
        dueDate: "asc",
      },

      include: {
        AssignmentSubmission: {
          select: {
            id: true,
            status: true,
            grade: true,
            studentId: true,
          },
        },
      },
    });
  };

// ============================================================
// GET ASSIGNMENT BY ID
// ============================================================

exports.getAssignmentById =
  async ({
    id,
    tenantId,
  }) => {
    const assignment =
      await prisma.assignment.findFirst({
        where: {
          id: Number(id),
          tenantId,
        },

        include: {
          AssignmentSubmission: {
            include: {
              Assignment: true,
            },
          },
        },
      });

    if (!assignment) {
      throw new HttpError(
        404,
        "Assignment not found",
        {
          code: "NOT_FOUND",
        }
      );
    }

    return assignment;
  };

// ============================================================
// UPDATE ASSIGNMENT
// ============================================================

exports.updateAssignment =
  async ({
    id,
    tenantId,
    teacherId,
    createdById,
    ...data
  }) => {
    const existing =
      await prisma.assignment.findFirst({
        where: {
          id: Number(id),
          tenantId,
        },
      });

    if (!existing) {
      throw new HttpError(
        404,
        "Assignment not found",
        {
          code: "NOT_FOUND",
        }
      );
    }

    const updateData = {};

    if (
      data.title !==
      undefined
    ) {
      updateData.title =
        data.title;
    }

    if (
      data.description !==
      undefined
    ) {
      updateData.description =
        data.description;
    }

    if (
      data.dueDate !==
      undefined
    ) {
      updateData.dueDate =
        new Date(data.dueDate);
    }

    if (
      data.maxMarks !==
      undefined
    ) {
      updateData.maxMarks =
        Number(data.maxMarks);
    }

    if (
      data.attachmentUrl !==
      undefined
    ) {
      updateData.attachmentUrl =
        data.attachmentUrl;
    }

    if (
      data.isActive !==
      undefined
    ) {
      updateData.isActive =
        Boolean(data.isActive);
    }

    updateData.updatedAt =
      new Date();

    const updated =
      await prisma.assignment.update({
        where: {
          id: Number(id),
        },

        data: updateData,
      });

    // ========================================================
    // TEACHER NOTIFICATION
    // ========================================================

    try {
      await notifyTeacher({
        tenantId,

        userId:
          createdById,

        staffId:
          teacherId,

        title:
          "Assignment Updated",

        message:
          `Assignment "${updated.title}" was updated successfully.`,

        type:
          "activity",

        priority:
          "normal",
      });
    } catch (error) {
      console.error(
        "Teacher assignment update notification failed:",
        error
      );
    }

    // ========================================================
    // STUDENT NOTIFICATION
    // ========================================================

    try {
      await notificationService.createNotification({
        tenantId,

        title:
          "Assignment Updated",

        message:
          `Assignment "${updated.title}" has been updated.`,

        type:
          "assignment",

        priority:
          "normal",

        audience:
          "student",

        classId:
          existing.classId,

        sectionId:
          existing.sectionId,

        createdById:
          createdById,
      });
    } catch (error) {
      console.error(
        "Student assignment update notification failed:",
        error
      );
    }

    return updated;
  };

// ============================================================
// DELETE ASSIGNMENT
// ============================================================

exports.deleteAssignment =
  async ({
    id,
    tenantId,
    createdById,
  }) => {
    const existing =
      await prisma.assignment.findFirst({
        where: {
          id: Number(id),
          tenantId,
        },
      });

    if (!existing) {
      throw new HttpError(
        404,
        "Assignment not found",
        {
          code: "NOT_FOUND",
        }
      );
    }

    await prisma.assignment.delete({
      where: {
        id: Number(id),
      },
    });

    // ========================================================
    // TEACHER NOTIFICATION
    // ========================================================

    try {
      await notifyTeacher({
        tenantId,

        userId:
          createdById,

        staffId:
          existing.teacherId,

        title:
          "Assignment Deleted",

        message:
          `Assignment "${existing.title}" was deleted successfully.`,

        type:
          "activity",

        priority:
          "normal",
      });
    } catch (error) {
      console.error(
        "Teacher assignment deletion notification failed:",
        error
      );
    }

    // ========================================================
    // STUDENT NOTIFICATION
    // ========================================================

    try {
      await notificationService.createNotification({
        tenantId,

        title:
          "Assignment Removed",

        message:
          `Assignment "${existing.title}" has been removed by the teacher.`,

        type:
          "assignment",

        priority:
          "high",

        audience:
          "student",

        classId:
          existing.classId,

        sectionId:
          existing.sectionId,

        createdById:
          createdById,
      });
    } catch (error) {
      console.error(
        "Student assignment deletion notification failed:",
        error
      );
    }

    return {
      message:
        "Assignment deleted successfully",
    };
  };

// ============================================================
// GET SUBMISSIONS
// ============================================================

exports.getSubmissions =
  async ({
    assignmentId,
    tenantId,
  }) => {
    return prisma.assignmentSubmission.findMany({
      where: {
        assignmentId:
          Number(assignmentId),

        tenantId,
      },

      orderBy: {
        submittedAt:
          "desc",
      },
    });
  };

// ============================================================
// GRADE SUBMISSION
// ============================================================

exports.gradeSubmission =
  async ({
    submissionId,
    grade,
    feedback,
    gradedById,
    tenantId,
  }) => {
    const submission =
      await prisma.assignmentSubmission.findFirst({
        where: {
          id:
            Number(submissionId),

          tenantId,
        },
      });

    if (!submission) {
      throw new HttpError(
        404,
        "Submission not found",
        {
          code: "NOT_FOUND",
        }
      );
    }

    return prisma.assignmentSubmission.update({
      where: {
        id:
          Number(submissionId),
      },

      data: {
        grade:
          grade !== undefined
            ? Number(grade)
            : submission.grade,

        feedback:
          feedback !== undefined
            ? feedback
            : submission.feedback,

        gradedById:
          gradedById
            ? Number(gradedById)
            : null,

        gradedAt:
          new Date(),

        status:
          "graded",
      },
    });
  };