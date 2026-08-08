const staffService = require('./staff.service');
const createStaff = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const staff = await staffService.createStaff(req.body, tenantId);
    return res.status(201).json({ success: true, message: 'Staff created successfully', data: staff });
  } catch (error) {
    const status = error.message.includes('already') ? 409 : 500;
    return res.status(status).json({ success: false, error: error.message });
  }
};
const getAllStaff = async (req, res) => {
  try {
    const result = await staffService.getAllStaff(req.user.tenantId, req.query);
    return res.status(200).json({ success: true, message: 'Staff fetched successfully', data: result });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
const getStaffById = async (req, res) => {
  try {
    const staff = await staffService.getStaffById(req.params.id, req.user.tenantId);
    return res.status(200).json({ success: true, message: 'Staff fetched successfully', data: staff });
  } catch (error) {
    return res.status(error.message === 'Staff not found' ? 404 : 500).json({ success: false, error: error.message });
  }
};
const updateStaff = async (req, res) => {
  try {
    const staff = await staffService.updateStaff(req.params.id, req.body, req.user.tenantId);
    return res.status(200).json({ success: true, message: 'Staff updated successfully', data: staff });
  } catch (error) {
    const status = error.message === 'Staff not found' ? 404 : error.message.includes('already') ? 409 : 500;
    return res.status(status).json({ success: false, error: error.message });
  }
};
const deleteStaff = async (req, res) => {
  try {
    const result = await staffService.deleteStaff(req.params.id, req.user.tenantId);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return res.status(error.message === 'Staff not found' ? 404 : 500).json({ success: false, error: error.message });
  }
};
const assignSubjects = async (req, res) => {
  try {
    const { subjectIds } = req.body;
    if (!Array.isArray(subjectIds) || subjectIds.length === 0)
      return res.status(400).json({ success: false, error: 'subjectIds must be a non-empty array' });
    const staff = await staffService.assignSubjects(req.params.id, subjectIds, req.user.tenantId);
    return res.status(200).json({ success: true, message: 'Subjects assigned successfully', data: staff });
  } catch (error) {
    return res.status(error.message === 'Staff not found' ? 404 : 500).json({ success: false, error: error.message });
  }
};
const removeSubject = async (req, res) => {
  try {
    const result = await staffService.removeSubject(req.params.id, req.params.subjectId, req.user.tenantId);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return res.status(404).json({ success: false, error: error.message });
  }
};
module.exports = { createStaff, getAllStaff, getStaffById, updateStaff, deleteStaff, assignSubjects, removeSubject };
