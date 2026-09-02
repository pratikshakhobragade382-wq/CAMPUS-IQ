const studentService = require("./student.service");

// =====================================================
// CREATE STUDENT
// =====================================================

const createStudent = async (req, res) => {
  try {
    const student =
      await studentService.createStudent(
        req.body,
        req.user.tenantId
      );

    return res.status(201).json({
      success: true,
      message: "Student created successfully",
      data: student,
    });
  } catch (error) {
    const status =
      error.message &&
      error.message.includes("already")
        ? 409
        : 500;

    return res.status(status).json({
      success: false,
      error: error.message,
    });
  }
};

// =====================================================
// GET ALL STUDENTS
// =====================================================

const getAllStudents = async (req, res) => {
  try {
    const result =
      await studentService.getAllStudents(
        req.user.tenantId,
        req.query,
        req.user
      );

    return res.status(200).json({
      success: true,
      message: "Students fetched successfully",
      data: result,
    });
  } catch (error) {
    console.error(
      "GET ALL STUDENTS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// =====================================================
// GET STUDENT BY ID
// =====================================================

const getStudentById = async (req, res) => {
  try {
    const student =
      await studentService.getStudentById(
        req.params.id,
        req.user.tenantId,
        req.user
      );

    return res.status(200).json({
      success: true,
      message: "Student fetched successfully",
      data: student,
    });
  } catch (error) {
    return res
      .status(
        error.message === "Student not found"
          ? 404
          : 500
      )
      .json({
        success: false,
        error: error.message,
      });
  }
};

// =====================================================
// UPDATE STUDENT
// =====================================================

const updateStudent = async (req, res) => {
  try {
    const student =
      await studentService.updateStudent(
        req.params.id,
        req.body,
        req.user.tenantId
      );

    return res.status(200).json({
      success: true,
      message: "Student updated successfully",
      data: student,
    });
  } catch (error) {
    const status =
      error.message === "Student not found"
        ? 404
        : 500;

    return res.status(status).json({
      success: false,
      error: error.message,
    });
  }
};

// =====================================================
// DELETE STUDENT
// =====================================================

const deleteStudent = async (req, res) => {
  try {
    const result =
      await studentService.deleteStudent(
        req.params.id,
        req.user.tenantId
      );

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res
      .status(
        error.message === "Student not found"
          ? 404
          : 500
      )
      .json({
        success: false,
        error: error.message,
      });
  }
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  createStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
};