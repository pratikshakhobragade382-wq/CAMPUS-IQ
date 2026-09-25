// src/modules/exam/exam.controller.js

const examService =
  require("./exam.service");

const prisma =
  require("../../prisma/prismaClient");

const {
  notifyTeachersForClass,
} =
  require("../notification/teachernotification");

const {
  createNotification,
} =
  require("../notification/notification.service");

// ============================================================
// HELPER
// NOTIFY STUDENTS WHEN MARKS ARE ADDED
// ============================================================

const notifyStudentsForMarks = async ({
  examId,
  subjectId,
  records,
  tenantId,
}) => {
  try {
    if (
      !Array.isArray(records) ||
      records.length === 0
    ) {
      return;
    }

    const studentIds = [
      ...new Set(
        records
          .map((record) =>
            parseInt(
              record.studentId,
              10
            )
          )
          .filter(
            (id) =>
              !Number.isNaN(id)
          )
      ),
    ];

    if (studentIds.length === 0) {
      return;
    }

    // ----------------------------------------------------------
    // Get exam
    // ----------------------------------------------------------

    const exam =
      await prisma.exam.findFirst({
        where: {
          id: parseInt(
            examId,
            10
          ),

          tenantId,
        },

        select: {
          id: true,
          name: true,
          examType: true,
          classId: true,
        },
      });

    if (!exam) {
      console.error(
        "MARK NOTIFICATION: Exam not found"
      );

      return;
    }

    // ----------------------------------------------------------
    // Get subject
    // ----------------------------------------------------------

    const subject =
      await prisma.subject.findFirst({
        where: {
          id: parseInt(
            subjectId,
            10
          ),

          tenantId,

          isDeleted: false,
        },

        select: {
          id: true,
          name: true,
          code: true,
        },
      });

    if (!subject) {
      console.error(
        "MARK NOTIFICATION: Subject not found"
      );

      return;
    }

    // ----------------------------------------------------------
    // Get student users
    //
    // Student login users are connected through:
    //
    // User.studentId -> Student.id
    // ----------------------------------------------------------

    const studentUsers =
      await prisma.user.findMany({
        where: {
          tenantId,

          identity: "student",

          isDeleted: false,

          studentId: {
            in: studentIds,
          },
        },

        select: {
          id: true,
          studentId: true,
          name: true,
          email: true,
        },
      });

    if (
      studentUsers.length === 0
    ) {
      console.log(
        "MARK NOTIFICATION: No student login users found"
      );

      return;
    }

    // ----------------------------------------------------------
    // Create one notification per student
    // ----------------------------------------------------------

    const notifications =
      studentUsers.map(
        (studentUser) => {
          const studentRecord =
            records.find(
              (record) =>
                parseInt(
                  record.studentId,
                  10
                ) ===
                studentUser.studentId
            );

          let marksText =
            "Your marks have been added.";

          if (
            studentRecord
          ) {
            if (
              studentRecord.isAbsent
            ) {
              marksText =
                "You were marked absent for this subject.";
            } else if (
              studentRecord.marksObtained !==
                undefined &&
              studentRecord.marksObtained !==
                null
            ) {
              marksText =
                `You received ${studentRecord.marksObtained} marks.`;
            }
          }

          return createNotification({
            tenantId,

            title:
              "Marks Added",

            message:
              `Your marks for ${subject.name} in ${exam.name} have been added. ${marksText} Open Exams & Results to view the details.`,

            type:
              "marks",

            priority:
              "normal",

            // --------------------------------------------------
            // IMPORTANT
            //
            // Individual notification means ONLY this
            // particular student can see it.
            // --------------------------------------------------

            audience:
              "individual",

            userId:
              studentUser.id,

            createdById:
              null,
          });
        }
      );

    await Promise.all(
      notifications
    );

    console.log(
      `MARK NOTIFICATION: Created ${studentUsers.length} notification(s)`
    );
  } catch (error) {
    // ----------------------------------------------------------
    // Notification failure must NOT break marks entry.
    // Marks have already been saved successfully.
    // ----------------------------------------------------------

    console.error(
      "MARK NOTIFICATION ERROR:",
      error
    );
  }
};


/* ============================================================
   CREATE EXAM
============================================================ */

const createExam = async (
  req,
  res,
  next
) => {
  try {
    const data =
      await examService.createExam(
        req.body,

        req.user.tenantId,

        req.user
      );

    /* ========================================================
       NOTIFY TEACHERS TEACHING THIS CLASS
    ======================================================== */

    await notifyTeachersForClass({
      tenantId:
        req.user.tenantId,

      classId:
        data.classId,

      title:
        "Exam Created",

      message:
        `A new exam "${data.name}" has been created for your class.`,

      type:
        "exam",

      priority:
        "normal",
    });

    return res.status(201).json({
      success: true,

      message:
        "Exam created successfully",

      data,
    });
  } catch (error) {
    return next(error);
  }
};


/* ============================================================
   GET ALL EXAMS
============================================================ */

const getAllExams = async (
  req,
  res,
  next
) => {
  try {
    const {
      academicYearId,
      classId,
      examType,
      includeInactive,
    } = req.query;

    const data =
      await examService.getAllExams(
        req.user.tenantId,

        {
          academicYearId,

          classId,

          examType,

          includeInactive:
            includeInactive ===
            "true",
        }
      );

    return res.status(200).json({
      success: true,

      message:
        "Exams fetched successfully",

      data,
    });
  } catch (error) {
    return next(error);
  }
};


/* ============================================================
   GET EXAM BY ID
============================================================ */

const getExamById = async (
  req,
  res,
  next
) => {
  try {
    const data =
      await examService.getExamById(
        req.params.id,

        req.user.tenantId,

        req.query.includeInactive ===
          "true"
      );

    return res.status(200).json({
      success: true,

      message:
        "Exam details fetched successfully",

      data,
    });
  } catch (error) {
    return next(error);
  }
};


/* ============================================================
   UPDATE EXAM
============================================================ */

const updateExam = async (
  req,
  res,
  next
) => {
  try {
    const data =
      await examService.updateExam(
        req.params.id,

        req.body,

        req.user.tenantId,

        req.user
      );

    /* ========================================================
       NOTIFY TEACHERS
    ======================================================== */

    await notifyTeachersForClass({
      tenantId:
        req.user.tenantId,

      classId:
        data.classId,

      title:
        "Exam Updated",

      message:
        `The exam "${data.name}" has been updated.`,

      type:
        "exam",

      priority:
        "normal",
    });

    return res.status(200).json({
      success: true,

      message:
        "Exam updated successfully",

      data,
    });
  } catch (error) {
    return next(error);
  }
};


/* ============================================================
   DELETE EXAM
============================================================ */

const deleteExam = async (
  req,
  res,
  next
) => {
  try {
    /*
     * Get the exam first so we know its class.
     */

    const existing =
      await examService.getExamById(
        req.params.id,

        req.user.tenantId,

        true
      );

    const result =
      await examService.deleteExam(
        req.params.id,

        req.user.tenantId,

        req.user
      );

    /*
     * If the exam was actually removed/deactivated,
     * notify the teachers of that class.
     */

    await notifyTeachersForClass({
      tenantId:
        req.user.tenantId,

      classId:
        existing.exam.classId,

      title:
        "Exam Removed",

      message:
        `The exam "${existing.exam.name}" has been removed or deactivated.`,

      type:
        "exam",

      priority:
        "normal",
    });

    return res.status(200).json({
      success: true,

      ...result,
    });
  } catch (error) {
    return next(error);
  }
};


/* ============================================================
   BULK ENTER MARKS
============================================================ */

const bulkEnterMarks = async (
  req,
  res,
  next
) => {
  try {
    const data =
      await examService.bulkEnterMarks(
        req.params.examId,

        req.body,

        req.user.tenantId,

        req.user
      );

    // ========================================================
    // NEW:
    // Notify every affected student after marks are saved.
    //
    // Notification failure will NOT affect the marks.
    // ========================================================

    await notifyStudentsForMarks({
      examId:
        req.params.examId,

      subjectId:
        req.body.subjectId,

      records:
        req.body.records,

      tenantId:
        req.user.tenantId,
    });

    return res.status(200).json({
      success: true,

      message:
        data.message,

      data,
    });
  } catch (error) {
    return next(error);
  }
};


/* ============================================================
   GET EXAM MARKS
============================================================ */

const getExamMarks = async (
  req,
  res,
  next
) => {
  try {
    const {
      subjectId,
    } = req.query;

    const data =
      await examService.getExamMarks(
        req.params.examId,

        req.user.tenantId,

        subjectId,

        req.user
      );

    return res.status(200).json({
      success: true,

      message:
        "Exam marks fetched successfully",

      data,
    });
  } catch (error) {
    return next(error);
  }
};


/* ============================================================
   GET STUDENT REPORT CARD
============================================================ */

const getStudentReportCard =
  async (
    req,
    res,
    next
  ) => {
    try {
      const {
        academicYearId,
      } = req.query;

      const data =
        await examService.getStudentReportCard(
          req.user.tenantId,

          req.params.studentId,

          academicYearId,

          req.user
        );

      return res.status(200).json({
        success: true,

        message:
          "Student report card fetched successfully",

        data,
      });
    } catch (error) {
      return next(error);
    }
  };


/* ============================================================
   EXPORT
============================================================ */

module.exports = {
  createExam,

  getAllExams,

  getExamById,

  updateExam,

  deleteExam,

  bulkEnterMarks,

  getExamMarks,

  getStudentReportCard,
};