const feeService = require('./fee.service');

const createFeeCategory = async (req, res, next) => {
  try {
    const data = await feeService.createFeeCategory(req.body, req.user.tenantId, req.user);
    return res.status(201).json({ success: true, message: 'Fee category created', data });
  } catch (error) {
    return next(error);
  }
};

const getAllFeeCategories = async (req, res, next) => {
  try {
    const data = await feeService.getAllFeeCategories(req.user.tenantId);
    return res.status(200).json({ success: true, message: 'Fee categories fetched', data });
  } catch (error) {
    return next(error);
  }
};

const updateFeeCategory = async (req, res, next) => {
  try {
    const data = await feeService.updateFeeCategory(req.params.id, req.body, req.user.tenantId, req.user);
    return res.status(200).json({ success: true, message: 'Fee category updated', data });
  } catch (error) {
    return next(error);
  }
};

const deleteFeeCategory = async (req, res, next) => {
  try {
    const result = await feeService.deleteFeeCategory(req.params.id, req.user.tenantId, req.user);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return next(error);
  }
};

const createFeeStructure = async (req, res, next) => {
  try {
    const data = await feeService.createFeeStructure(req.body, req.user.tenantId, req.user);
    return res.status(201).json({ success: true, message: 'Fee structure created', data });
  } catch (error) {
    return next(error);
  }
};

const getFeeStructures = async (req, res, next) => {
  try {
    const { academicYearId, classId, feeCategoryId } = req.query;
    const data = await feeService.getFeeStructures(req.user.tenantId, { academicYearId, classId, feeCategoryId });
    return res.status(200).json({ success: true, message: 'Fee structures fetched', data });
  } catch (error) {
    return next(error);
  }
};

const updateFeeStructure = async (req, res, next) => {
  try {
    const data = await feeService.updateFeeStructure(req.params.id, req.body, req.user.tenantId, req.user);
    return res.status(200).json({ success: true, message: 'Fee structure updated', data });
  } catch (error) {
    return next(error);
  }
};

const collectFee = async (req, res, next) => {
  try {
    const data = await feeService.collectFee(req.body, req.user.tenantId, req.user);
    return res.status(201).json({ success: true, message: 'Fee collected', data });
  } catch (error) {
    return next(error);
  }
};

const getStudentFeeStatus = async (req, res, next) => {
  try {
    const { academicYearId } = req.query;
    const data = await feeService.getStudentFeeStatus(req.user.tenantId, req.params.studentId, academicYearId);
    return res.status(200).json({ success: true, message: 'Fee status fetched', data });
  } catch (error) {
    return next(error);
  }
};

const getStudentPaymentHistory = async (req, res, next) => {
  try {
    const data = await feeService.getStudentPaymentHistory(req.user.tenantId, req.params.studentId);
    return res.status(200).json({ success: true, message: 'Payment history fetched', data });
  } catch (error) {
    return next(error);
  }
};

const getCollectionsByDateRange = async (req, res, next) => {
  try {
    const { fromDate, toDate } = req.query;
    const data = await feeService.getCollectionsByDateRange(req.user.tenantId, fromDate, toDate);
    return res.status(200).json({ success: true, message: 'Collections fetched', data });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createFeeCategory, getAllFeeCategories, updateFeeCategory, deleteFeeCategory,
  createFeeStructure, getFeeStructures, updateFeeStructure,
  collectFee, getStudentFeeStatus, getStudentPaymentHistory, getCollectionsByDateRange,
};
