// src/modules/exam/exam.controller.js

const examService =
  require('./exam.service');

const {
  notifyTeachersForClass,
} =
  require('../notification/teacherNotification');


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
        'Exam Created',

      message:
        `A new exam "${data.name}" has been created for your class.`,

      type:
        'exam',

      priority:
        'normal',
    });


    return res.status(201).json({
      success: true,

      message:
        'Exam created successfully',

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
            'true',
        }
      );


    return res.status(200).json({
      success: true,

      message:
        'Exams fetched successfully',

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
          'true'
      );


    return res.status(200).json({
      success: true,

      message:
        'Exam details fetched successfully',

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
        'Exam Updated',

      message:
        `The exam "${data.name}" has been updated.`,

      type:
        'exam',

      priority:
        'normal',
    });


    return res.status(200).json({
      success: true,

      message:
        'Exam updated successfully',

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
        'Exam Removed',

      message:
        `The exam "${existing.exam.name}" has been removed or deactivated.`,

      type:
        'exam',

      priority:
        'normal',
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
        'Exam marks fetched successfully',

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
          'Student report card fetched successfully',

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