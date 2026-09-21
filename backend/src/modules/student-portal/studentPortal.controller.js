const studentPortalService =
  require("./studentPortal.service");

const studentPerformanceService =
  require("./studentPerformance.service");

function handleError(
  res,
  error
) {
  const notFoundMessages = [
    "Student not found",
    "Assignment not found",
  ];

  const status =
    notFoundMessages.includes(
      error.message
    )
      ? 404
      : 500;

  return res.status(status).json({
    success: false,
    error:
      error.message,
  });
}

/* ============================================================
   PROFILE
============================================================ */

const getMyProfile = async (
  req,
  res
) => {
  try {
    const data =
      await studentPortalService.getMyProfile(
        req.user.studentId,
        req.user.tenantId
      );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return handleError(
      res,
      error
    );
  }
};

/* ============================================================
   ATTENDANCE
============================================================ */

const getMyAttendance = async (
  req,
  res
) => {
  try {
    const data =
      await studentPortalService.getMyAttendance(
        req.user.studentId,
        req.user.tenantId,
        req.query
      );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return handleError(
      res,
      error
    );
  }
};

/* ============================================================
   EXAMS
============================================================ */

const getMyExamMarks = async (
  req,
  res
) => {
  try {
    const data =
      await studentPortalService.getMyExamMarks(
        req.user.studentId,
        req.user.tenantId,
        req.query
      );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return handleError(
      res,
      error
    );
  }
};

/* ============================================================
   TIMETABLE
============================================================ */

const getMyTimetable = async (
  req,
  res
) => {
  try {
    const data =
      await studentPortalService.getMyTimetable(
        req.user.studentId,
        req.user.tenantId
      );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return handleError(
      res,
      error
    );
  }
};

/* ============================================================
   FEES
============================================================ */

const getMyFees = async (
  req,
  res
) => {
  try {
    const data =
      await studentPortalService.getMyFees(
        req.user.studentId,
        req.user.tenantId
      );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return handleError(
      res,
      error
    );
  }
};

/* ============================================================
   ASSIGNMENTS
============================================================ */

const getMyAssignments = async (
  req,
  res
) => {
  try {
    const data =
      await studentPortalService.getMyAssignments(
        req.user.studentId,
        req.user.tenantId
      );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return handleError(
      res,
      error
    );
  }
};

/* ============================================================
   SUBMIT ASSIGNMENT
============================================================ */

const submitAssignment = async (
  req,
  res
) => {
  try {
    const data =
      await studentPortalService.submitAssignment(
        req.user.studentId,
        req.user.tenantId,
        req.params.assignmentId,
        req.body
      );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return handleError(
      res,
      error
    );
  }
};

/* ============================================================
   CALENDAR
============================================================ */

const getMyCalendar = async (
  req,
  res
) => {
  try {
    const data =
      await studentPortalService.getMyCalendar(
        req.user.studentId,
        req.user.tenantId,
        req.query
      );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return handleError(
      res,
      error
    );
  }
};

/* ============================================================
   PERFORMANCE
============================================================ */

const getMyPerformance = async (
  req,
  res
) => {
  try {
    const data =
      await studentPerformanceService.getStudentPerformance(
        req.user.studentId,
        req.user.tenantId
      );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "STUDENT PERFORMANCE ERROR:",
      error
    );

    return handleError(
      res,
      error
    );
  }
};

/* ============================================================
   EXPORTS
============================================================ */

module.exports = {
  getMyProfile,
  getMyAttendance,
  getMyExamMarks,
  getMyTimetable,
  getMyFees,
  getMyAssignments,
  submitAssignment,
  getMyCalendar,
  getMyPerformance,
};