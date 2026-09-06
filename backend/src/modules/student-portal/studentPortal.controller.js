const studentPortalService = require("./studentPortal.service");

function handleError(res, error) {
  const status = error.message === "Student not found" || error.message === "Assignment not found" ? 404 : 500;
  return res.status(status).json({ success: false, error: error.message });
}

const getMyProfile = async (req, res) => {
  try {
    const data = await studentPortalService.getMyProfile(
      req.user.studentId,
      req.user.tenantId
    );
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return handleError(res, error);
  }
};

const getMyAttendance = async (req, res) => {
  try {
    const data = await studentPortalService.getMyAttendance(
      req.user.studentId,
      req.user.tenantId,
      req.query
    );
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return handleError(res, error);
  }
};

const getMyExamMarks = async (req, res) => {
  try {
    const data = await studentPortalService.getMyExamMarks(
      req.user.studentId,
      req.user.tenantId,
      req.query
    );
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return handleError(res, error);
  }
};

const getMyTimetable = async (req, res) => {
  try {
    const data = await studentPortalService.getMyTimetable(
      req.user.studentId,
      req.user.tenantId
    );
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return handleError(res, error);
  }
};

const getMyFees = async (req, res) => {
  try {
    const data = await studentPortalService.getMyFees(
      req.user.studentId,
      req.user.tenantId
    );
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return handleError(res, error);
  }
};

const getMyAssignments = async (req, res) => {
  try {
    const data = await studentPortalService.getMyAssignments(
      req.user.studentId,
      req.user.tenantId
    );
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return handleError(res, error);
  }
};

const submitAssignment = async (req, res) => {
  try {
    const data = await studentPortalService.submitAssignment(
      req.user.studentId,
      req.user.tenantId,
      req.params.assignmentId,
      req.body
    );
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return handleError(res, error);
  }
};

const getMyCalendar = async (req, res) => {
  try {
    const data = await studentPortalService.getMyCalendar(
      req.user.studentId,
      req.user.tenantId,
      req.query
    );
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports = {
  getMyProfile,
  getMyAttendance,
  getMyExamMarks,
  getMyTimetable,
  getMyFees,
  getMyAssignments,
  submitAssignment,
  getMyCalendar,
};
