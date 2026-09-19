const substitutionService = require("./substitution.service");
const { notifyTeacher } = require("../notification/teacherNotification");

/* ============================================================
   GET AVAILABLE SUBSTITUTES FOR A TIMETABLE ENTRY + DATE
============================================================ */
const getAvailableSubstitutes = async (req, res) => {
  try {
    const { timetableId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ success: false, error: "date is required" });
    }

    const data = await substitutionService.getAvailableSubstitutes(req.user.tenantId, timetableId, date);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    const message = error?.message || "Request failed";
    const status = message.includes("not found") ? 404 : 500;
    return res.status(status).json({ success: false, error: message });
  }
};

/* ============================================================
   ASSIGN SUBSTITUTE
============================================================ */
const assignSubstitute = async (req, res) => {
  try {
    const data = await substitutionService.assignSubstitute(req.user.tenantId, req.body, req.user.staffId || req.user.id);

    await notifyTeacher({
      tenantId: req.user.tenantId,
      staffId: data.substituteStaffId,
      title: "Substitute Class Assigned",
      message: `You have been assigned to cover ${data.timetable?.subject?.name || "a class"} for ${data.timetable?.class?.name || "a class"} on ${new Date(data.date).toDateString()}.`,
      type: "class",
      priority: "high",
    });

    await notifyTeacher({
      tenantId: req.user.tenantId,
      staffId: data.originalStaffId,
      title: "Substitute Arranged",
      message: `${data.substituteStaff?.name || "A teacher"} will cover your ${data.timetable?.subject?.name || "class"} on ${new Date(data.date).toDateString()}.`,
      type: "class",
      priority: "normal",
    });

    return res.status(201).json({ success: true, message: "Substitute assigned successfully", data });
  } catch (error) {
    const message = error?.message || "Request failed";
    let status = 500;
    if (message.includes("required")) status = 400;
    if (message.includes("not found")) status = 404;
    if (message.includes("already") || message.includes("not available")) status = 409;
    return res.status(status).json({ success: false, error: message });
  }
};

/* ============================================================
   CANCEL SUBSTITUTION
============================================================ */
const cancelSubstitution = async (req, res) => {
  try {
    const data = await substitutionService.cancelSubstitution(req.user.tenantId, req.params.id);

    await notifyTeacher({
      tenantId: req.user.tenantId,
      staffId: data.substituteStaffId,
      title: "Substitution Cancelled",
      message: `Your substitute assignment for ${data.timetable?.subject?.name || "a class"} on ${new Date(data.date).toDateString()} has been cancelled.`,
      type: "class",
      priority: "normal",
    });

    return res.status(200).json({ success: true, message: "Substitution cancelled", data });
  } catch (error) {
    const message = error?.message || "Request failed";
    const status = message === "Substitution not found" ? 404 : 500;
    return res.status(status).json({ success: false, error: message });
  }
};

/* ============================================================
   MY SUBSTITUTIONS
============================================================ */
const getMySubstitutions = async (req, res) => {
  try {
    const { date } = req.query;
    const staffId = req.query.staffId || req.user.staffId;

    if (!date) {
      return res.status(400).json({ success: false, error: "date is required" });
    }
    if (!staffId) {
      return res.status(400).json({ success: false, error: "staffId is required" });
    }

    const data = await substitutionService.getMySubstitutions(req.user.tenantId, staffId, date);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, error: error?.message || "Request failed" });
  }
};

module.exports = {
  getAvailableSubstitutes,
  assignSubstitute,
  cancelSubstitution,
  getMySubstitutions,
};
