const timetableService =
  require("./timetable.service");

const {
  notifyTeacher,
} =
  require("../notification/teacherNotification");

const prisma =
  require("../../prisma/prismaClient");


/* ============================================================
   PERIOD SLOTS
============================================================ */

const createPeriodSlot = async (
  req,
  res
) => {
  try {
    const data =
      await timetableService.createPeriodSlot(
        req.body,
        req.user.tenantId
      );

    return res.status(201).json({
      success: true,

      message:
        "Time slot created successfully",

      data,
    });
  } catch (error) {
    const message =
      error?.message ||
      "Request failed";

    const status =
      message.includes("already")
        ? 409
        : 500;

    return res.status(status).json({
      success: false,
      error: message,
    });
  }
};


const getAllPeriodSlots = async (
  req,
  res
) => {
  try {
    const data =
      await timetableService.getAllPeriodSlots(
        req.user.tenantId
      );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,

      error:
        error?.message ||
        "Failed to fetch time slots",
    });
  }
};


const updatePeriodSlot = async (
  req,
  res
) => {
  try {
    const data =
      await timetableService.updatePeriodSlot(
        req.params.id,
        req.body,
        req.user.tenantId
      );

    return res.status(200).json({
      success: true,

      message:
        "Time slot updated successfully",

      data,
    });
  } catch (error) {
    const message =
      error?.message ||
      "Request failed";

    const status =
      message ===
      "Period slot not found"
        ? 404
        : message.includes("already")
        ? 409
        : 500;

    return res.status(status).json({
      success: false,
      error: message,
    });
  }
};


const deletePeriodSlot = async (
  req,
  res
) => {
  try {
    const result =
      await timetableService.deletePeriodSlot(
        req.params.id,
        req.user.tenantId
      );

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    const message =
      error?.message ||
      "Request failed";

    const status =
      message ===
      "Period slot not found"
        ? 404
        : message.includes("already used")
        ? 409
        : 500;

    return res.status(status).json({
      success: false,
      error: message,
    });
  }
};


const seedDefaultSlots = async (
  req,
  res
) => {
  try {
    const data =
      await timetableService.seedDefaultSlots(
        req.user.tenantId
      );

    return res.status(201).json({
      success: true,

      message:
        "Default time slots created",

      data,
    });
  } catch (error) {
    const message =
      error?.message ||
      "Request failed";

    return res.status(409).json({
      success: false,
      error: message,
    });
  }
};


/* ============================================================
   CREATE TIMETABLE
============================================================ */

const createTimetableEntry = async (
  req,
  res
) => {
  try {
    const data =
      await timetableService.createTimetableEntry(
        req.body,
        req.user.tenantId
      );


    /* ========================================================
       NOTIFY ASSIGNED TEACHER
    ======================================================== */

    await notifyTeacher({
      tenantId:
        req.user.tenantId,

      staffId:
        data.staff?.id ||
        data.staffId,

      title:
        "Timetable Created",

      message:
        `A new timetable entry has been created for ${data.subject?.name || "your subject"} in ${data.class?.name || "your class"}.`,

      type:
        "class",

      priority:
        "normal",
    });


    return res.status(201).json({
      success: true,

      message:
        "Timetable created successfully",

      data,
    });
  } catch (error) {
    const message =
      error?.message ||
      "Request failed";

    let status =
      500;

    if (
      message.includes("already") ||
      message.includes("already assigned") ||
      message.includes("already has")
    ) {
      status = 409;
    }

    if (
      message.includes("not found")
    ) {
      status = 404;
    }

    if (
      message.includes("required")
    ) {
      status = 400;
    }

    return res.status(status).json({
      success: false,
      error: message,
    });
  }
};


/* ============================================================
   CLASS TIMETABLE
============================================================ */

const getClassTimetable = async (
  req,
  res
) => {
  try {
    const {
      classId,
      sectionId,
      academicYearId,
      className,
      sectionName,
      academicYearName,
    } = req.query;

    if (
      !classId &&
      !className
    ) {
      return res.status(400).json({
        success: false,

        error:
          "Class is required",
      });
    }

    const data =
      await timetableService.getClassTimetable(
        req.user.tenantId,

        classId,

        sectionId,

        academicYearId,

        className,

        sectionName,

        academicYearName
      );

    return res.status(200).json({
      success: true,

      message:
        "Class timetable fetched",

      data,
    });
  } catch (error) {
    const message =
      error?.message ||
      "Request failed";

    return res.status(500).json({
      success: false,
      error: message,
    });
  }
};


/* ============================================================
   TEACHER TIMETABLE
============================================================ */

const getTeacherTimetable = async (
  req,
  res
) => {
  try {
    const {
      academicYearId,
      academicYearName,
      teacherName,
    } = req.query;

    let {
      staffId,
    } = req.query;

    const isPrivileged = [
      "admin",
      "management",
      "principal",
    ].includes(
      req.user.identity
    );


    /*
     * Normal teacher:
     * only their own timetable.
     */

    if (!isPrivileged) {
      if (!req.user.staffId) {
        return res.status(403).json({
          success: false,

          error:
            "This account is not linked to a staff record",
        });
      }

      if (
        staffId &&
        Number(staffId) !==
          Number(req.user.staffId)
      ) {
        return res.status(403).json({
          success: false,

          error:
            "You may only view your own timetable",
        });
      }

      staffId =
        req.user.staffId;
    }


    if (
      !staffId &&
      !teacherName
    ) {
      return res.status(400).json({
        success: false,

        error:
          "Teacher is required",
      });
    }


    const data =
      await timetableService.getTeacherTimetable(
        req.user.tenantId,

        staffId,

        academicYearId,

        academicYearName,

        teacherName
      );


    return res.status(200).json({
      success: true,

      message:
        "Teacher timetable fetched",

      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,

      error:
        error?.message ||
        "Failed to fetch teacher timetable",
    });
  }
};


/* ============================================================
   UPDATE TIMETABLE
============================================================ */

const updateTimetableEntry = async (
  req,
  res
) => {
  try {
    const data =
      await timetableService.updateTimetableEntry(
        req.params.id,
        req.body,
        req.user.tenantId
      );


    /* ========================================================
       NOTIFY ASSIGNED TEACHER
    ======================================================== */

    await notifyTeacher({
      tenantId:
        req.user.tenantId,

      staffId:
        data.staff?.id ||
        data.staffId,

      title:
        "Timetable Updated",

      message:
        `Your timetable has been updated for ${data.subject?.name || "your subject"} in ${data.class?.name || "your class"}.`,

      type:
        "class",

      priority:
        "normal",
    });


    return res.status(200).json({
      success: true,

      message:
        "Timetable updated successfully",

      data,
    });
  } catch (error) {
    const message =
      error?.message ||
      "Request failed";

    const status =
      message ===
      "Timetable entry not found"
        ? 404
        : 500;

    return res.status(status).json({
      success: false,
      error: message,
    });
  }
};


/* ============================================================
   DELETE TIMETABLE
============================================================ */

const deleteTimetableEntry = async (
  req,
  res
) => {
  try {
    /*
     * Get the existing entry BEFORE deleting it,
     * so we still know which teacher should be notified.
     */

    const existing =
      await prisma.timetable.findFirst({
        where: {
          id:
            Number(req.params.id),

          tenantId:
            req.user.tenantId,
        },

        include: {
          class: true,

          subject: true,

          staff: {
            select: {
              id: true,
              name: true,
            },
          },

          section: true,
        },
      });


    if (!existing) {
      return res.status(404).json({
        success: false,

        error:
          "Timetable entry not found",
      });
    }


    const result =
      await timetableService.deleteTimetableEntry(
        req.params.id,
        req.user.tenantId
      );


    /* ========================================================
       NOTIFY TEACHER
    ======================================================== */

    await notifyTeacher({
      tenantId:
        req.user.tenantId,

      staffId:
        existing.staffId,

      title:
        "Timetable Removed",

      message:
        `A timetable entry for ${existing.subject?.name || "your subject"} in ${existing.class?.name || "your class"} has been removed.`,

      type:
        "class",

      priority:
        "normal",
    });


    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    const message =
      error?.message ||
      "Request failed";

    const status =
      message ===
      "Timetable entry not found"
        ? 404
        : 500;

    return res.status(status).json({
      success: false,
      error: message,
    });
  }
};


/* ============================================================
   EXPORT
============================================================ */

module.exports = {
  createPeriodSlot,

  getAllPeriodSlots,

  updatePeriodSlot,

  deletePeriodSlot,

  seedDefaultSlots,

  createTimetableEntry,

  getClassTimetable,

  getTeacherTimetable,

  updateTimetableEntry,

  deleteTimetableEntry,
};