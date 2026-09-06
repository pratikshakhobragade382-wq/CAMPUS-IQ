const parentService = require("./parent.service");

function handleError(res, error) {
  const status = error.message === "Student not found" ? 404 : 500;
  return res.status(status).json({ success: false, error: error.message });
}

const getMyChildren = async (req, res) => {
  try {
    const children = await parentService.getMyChildren(
      req.user.userId,
      req.user.tenantId
    );
    return res.status(200).json({ success: true, data: children });
  } catch (error) {
    return handleError(res, error);
  }
};

const getChildProfile = async (req, res) => {
  try {
    const student = await parentService.getChildProfile(
      req.user.userId,
      req.user.tenantId,
      req.params.studentId
    );
    return res.status(200).json({ success: true, data: student });
  } catch (error) {
    return handleError(res, error);
  }
};

const getChildAttendance = async (req, res) => {
  try {
    const data = await parentService.getChildAttendance(
      req.user.userId,
      req.user.tenantId,
      req.params.studentId,
      req.query
    );
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return handleError(res, error);
  }
};

const getChildExamMarks = async (req, res) => {
  try {
    const data = await parentService.getChildExamMarks(
      req.user.userId,
      req.user.tenantId,
      req.params.studentId,
      req.query
    );
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return handleError(res, error);
  }
};

const getChildTimetable = async (req, res) => {
  try {
    const data = await parentService.getChildTimetable(
      req.user.userId,
      req.user.tenantId,
      req.params.studentId
    );
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return handleError(res, error);
  }
};

const getChildFees = async (req, res) => {
  try {
    const data = await parentService.getChildFees(
      req.user.userId,
      req.user.tenantId,
      req.params.studentId
    );
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return handleError(res, error);
  }
};

const getChildAssignments = async (req, res) => {
  try {
    const data = await parentService.getChildAssignments(
      req.user.userId,
      req.user.tenantId,
      req.params.studentId
    );
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports = {
  getMyChildren,
  getChildProfile,
  getChildAttendance,
  getChildExamMarks,
  getChildTimetable,
  getChildFees,
  getChildAssignments,
};
