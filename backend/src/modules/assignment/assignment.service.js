// src/modules/assignment/assignment.service.js

const prisma = require('../../prisma/prismaClient');
const { HttpError } = require('../../utils/httpError');
const {
  notifyTeacher,
} = require('../notification/teacherNotification');


/* ============================================================
   CREATE ASSIGNMENT
============================================================ */

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
      'Title, classId, subjectId, and dueDate are required',
      {
        code: 'VALIDATION_ERROR',
      }
    );
  }

  if (!tenantId) {
    throw new HttpError(
      400,
      'Tenant ID is missing',
      {
        code: 'TENANT_ID_MISSING',
      }
    );
  }

  if (!teacherId) {
    throw new HttpError(
      400,
      'Teacher ID is missing',
      {
        code: 'TEACHER_ID_MISSING',
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

        isActive:
          true,

        updatedAt:
          new Date(),
      },
    });


  /* ==========================================================
     NOTIFICATION — ASSIGNMENT CREATED
  ========================================================== */

  await notifyTeacher({
    tenantId,

    userId:
      createdById,

    staffId:
      teacherId,

    title:
      'Assignment Created',

    message:
      `Assignment "${assignment.title}" was created successfully.`,

    type:
      'activity',

    priority:
      'normal',
  });


  return assignment;
};


/* ============================================================
   GET TEACHER ASSIGNMENTS
============================================================ */

exports.getTeacherAssignments = async ({
  teacherId,
  tenantId,
  classId,
  subjectId,
}) => {
  const where = {
    tenantId,

    isActive:
      true,
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

  const assignments =
    await prisma.assignment.findMany({
      where,

      orderBy: {
        dueDate:
          'asc',
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

  return assignments;
};


/* ============================================================
   GET ASSIGNMENT BY ID
============================================================ */

exports.getAssignmentById = async ({
  id,
  tenantId,
}) => {
  const assignment =
    await prisma.assignment.findFirst({
      where: {
        id:
          Number(id),

        tenantId,
      },

      include: {
        AssignmentSubmission: {
          include: {
            Assignment:
              true,
          },
        },
      },
    });

  if (!assignment) {
    throw new HttpError(
      404,
      'Assignment not found',
      {
        code: 'NOT_FOUND',
      }
    );
  }

  return assignment;
};


/* ============================================================
   UPDATE ASSIGNMENT
============================================================ */

exports.updateAssignment = async ({
  id,
  tenantId,
  teacherId,
  createdById,
  ...data
}) => {
  const existing =
    await prisma.assignment.findFirst({
      where: {
        id:
          Number(id),

        tenantId,
      },
    });

  if (!existing) {
    throw new HttpError(
      404,
      'Assignment not found',
      {
        code: 'NOT_FOUND',
      }
    );
  }

  const updateData = {};


  if (data.title !== undefined) {
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
      new Date(
        data.dueDate
      );
  }

  if (
    data.maxMarks !==
    undefined
  ) {
    updateData.maxMarks =
      Number(
        data.maxMarks
      );
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
      Boolean(
        data.isActive
      );
  }

  updateData.updatedAt =
    new Date();


  const updated =
    await prisma.assignment.update({
      where: {
        id:
          Number(id),
      },

      data:
        updateData,
    });


  /* ==========================================================
     NOTIFICATION — ASSIGNMENT UPDATED
  ========================================================== */

  await notifyTeacher({
    tenantId,

    userId:
      createdById,

    staffId:
      teacherId,

    title:
      'Assignment Updated',

    message:
      `Assignment "${updated.title}" was updated successfully.`,

    type:
      'activity',

    priority:
      'normal',
  });


  return updated;
};


/* ============================================================
   DELETE ASSIGNMENT
============================================================ */

exports.deleteAssignment = async ({
  id,
  tenantId,
  createdById,
}) => {
  const existing =
    await prisma.assignment.findFirst({
      where: {
        id:
          Number(id),

        tenantId,
      },
    });

  if (!existing) {
    throw new HttpError(
      404,
      'Assignment not found',
      {
        code: 'NOT_FOUND',
      }
    );
  }


  await prisma.assignment.delete({
    where: {
      id:
        Number(id),
    },
  });


  /* ==========================================================
     NOTIFICATION — ASSIGNMENT DELETED
  ========================================================== */

  await notifyTeacher({
    tenantId,

    userId:
      createdById,

    staffId:
      existing.teacherId,

    title:
      'Assignment Deleted',

    message:
      `Assignment "${existing.title}" was deleted successfully.`,

    type:
      'activity',

    priority:
      'normal',
  });


  return {
    message:
      'Assignment deleted successfully',
  };
};


/* ============================================================
   GET SUBMISSIONS
============================================================ */

exports.getSubmissions = async ({
  assignmentId,
  tenantId,
}) => {
  const submissions =
    await prisma.assignmentSubmission.findMany({
      where: {
        assignmentId:
          Number(assignmentId),

        tenantId,
      },

      orderBy: {
        submittedAt:
          'desc',
      },
    });

  return submissions;
};


/* ============================================================
   GRADE SUBMISSION
============================================================ */

exports.gradeSubmission = async ({
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
      'Submission not found',
      {
        code: 'NOT_FOUND',
      }
    );
  }


  const updated =
    await prisma.assignmentSubmission.update({
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
          'graded',
      },
    });

  return updated;
};