// src/modules/assignment/assignment.controller.js

const service = require('./assignment.service');


/* ============================================================
   CREATE ASSIGNMENT
============================================================ */

exports.createAssignment = async (
  req,
  res,
  next
) => {
  try {
    const teacherId =
      req.user.staffId ||
      req.user.userId;

    const assignment =
      await service.createAssignment({
        ...req.body,

        teacherId,

        tenantId:
          req.user.tenantId,

        createdById:
          req.user.userId,
      });

    return res.status(201).json({
      success: true,

      message:
        'Assignment created successfully',

      data: assignment,
    });
  } catch (error) {
    next(error);
  }
};


/* ============================================================
   GET ASSIGNMENTS
============================================================ */

exports.getAssignments = async (
  req,
  res,
  next
) => {
  try {
    const teacherId =
      req.query.teacherId ||
      (
        req.user.identity === 'staff' ||
        req.user.identity === 'teacher'
          ? req.user.staffId
          : undefined
      );

    const assignments =
      await service.getTeacherAssignments({
        teacherId,

        tenantId:
          req.user.tenantId,

        classId:
          req.query.classId,

        subjectId:
          req.query.subjectId,
      });

    return res.status(200).json({
      success: true,

      data: assignments,
    });
  } catch (error) {
    next(error);
  }
};


/* ============================================================
   GET ASSIGNMENT
============================================================ */

exports.getAssignmentById = async (
  req,
  res,
  next
) => {
  try {
    const assignment =
      await service.getAssignmentById({
        id: req.params.id,

        tenantId:
          req.user.tenantId,
      });

    return res.status(200).json({
      success: true,

      data: assignment,
    });
  } catch (error) {
    next(error);
  }
};


/* ============================================================
   UPDATE ASSIGNMENT
============================================================ */

exports.updateAssignment = async (
  req,
  res,
  next
) => {
  try {
    const updated =
      await service.updateAssignment({
        id: req.params.id,

        tenantId:
          req.user.tenantId,

        teacherId:
          req.user.staffId,

        createdById:
          req.user.userId,

        ...req.body,
      });

    return res.status(200).json({
      success: true,

      message:
        'Assignment updated successfully',

      data: updated,
    });
  } catch (error) {
    next(error);
  }
};


/* ============================================================
   DELETE ASSIGNMENT
============================================================ */

exports.deleteAssignment = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await service.deleteAssignment({
        id: req.params.id,

        tenantId:
          req.user.tenantId,

        createdById:
          req.user.userId,
      });

    return res.status(200).json({
      success: true,

      message:
        result.message,
    });
  } catch (error) {
    next(error);
  }
};


/* ============================================================
   GET SUBMISSIONS
============================================================ */

exports.getSubmissions = async (
  req,
  res,
  next
) => {
  try {
    const submissions =
      await service.getSubmissions({
        assignmentId:
          req.params.id,

        tenantId:
          req.user.tenantId,
      });

    return res.status(200).json({
      success: true,

      data: submissions,
    });
  } catch (error) {
    next(error);
  }
};


/* ============================================================
   GRADE SUBMISSION
============================================================ */

exports.gradeSubmission = async (
  req,
  res,
  next
) => {
  try {
    const graded =
      await service.gradeSubmission({
        submissionId:
          req.params.submissionId,

        grade:
          req.body.grade,

        feedback:
          req.body.feedback,

        gradedById:
          req.user.staffId ||
          req.user.userId,

        tenantId:
          req.user.tenantId,
      });

    return res.status(200).json({
      success: true,

      message:
        'Submission graded successfully',

      data: graded,
    });
  } catch (error) {
    next(error);
  }
};