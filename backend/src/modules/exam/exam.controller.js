// src/modules/exam/exam.controller.js
const examService = require('./exam.service');

const createExam = async (req, res, next) => {
  try {
    const data = await examService.createExam(req.body, req.user.tenantId, req.user);
    return res.status(201).json({ success: true, message: 'Exam created successfully', data });
  } catch (error) {
    return next(error);
  }
};

const getAllExams = async (req, res, next) => {
  try {
    const { academicYearId, classId, examType, includeInactive } = req.query;
    const data = await examService.getAllExams(req.user.tenantId, {
      academicYearId,
      classId,
      examType,
      includeInactive: includeInactive === 'true'
    });
    return res.status(200).json({ success: true, message: 'Exams fetched successfully', data });
  } catch (error) {
    return next(error);
  }
};

const getExamById = async (req, res, next) => {
  try {
    const data = await examService.getExamById(req.params.id, req.user.tenantId, req.query.includeInactive === 'true');
    return res.status(200).json({ success: true, message: 'Exam details fetched successfully', data });
  } catch (error) {
    return next(error);
  }
};

const updateExam = async (req, res, next) => {
  try {
    const data = await examService.updateExam(req.params.id, req.body, req.user.tenantId, req.user);
    return res.status(200).json({ success: true, message: 'Exam updated successfully', data });
  } catch (error) {
    return next(error);
  }
};

const deleteExam = async (req, res, next) => {
  try {
    const result = await examService.deleteExam(req.params.id, req.user.tenantId, req.user);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return next(error);
  }
};

const bulkEnterMarks = async (req, res, next) => {
  try {
    const data = await examService.bulkEnterMarks(req.params.examId, req.body, req.user.tenantId, req.user);
    return res.status(200).json({ success: true, message: data.message, data });
  } catch (error) {
    return next(error);
  }
};

const getExamMarks = async (req, res, next) => {
  try {
    const { subjectId } = req.query;
    const data = await examService.getExamMarks(req.params.examId, req.user.tenantId, subjectId, req.user);
    return res.status(200).json({ success: true, message: 'Exam marks fetched successfully', data });
  } catch (error) {
    return next(error);
  }
};

const getStudentReportCard = async (req, res, next) => {
  try {
    const { academicYearId } = req.query;
    const data = await examService.getStudentReportCard(req.user.tenantId, req.params.studentId, academicYearId, req.user);
    return res.status(200).json({ success: true, message: 'Student report card fetched successfully', data });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createExam,
  getAllExams,
  getExamById,
  updateExam,
  deleteExam,
  bulkEnterMarks,
  getExamMarks,
  getStudentReportCard
};
