const timetableService = require('./timetable.service');

const createPeriodSlot = async (req, res) => {
  try {
    const data = await timetableService.createPeriodSlot(req.body, req.user.tenantId);
    return res.status(201).json({ success: true, message: 'Period slot created', data });
  } catch (error) {
    const status = error.message.includes('already') ? 409 : 500;
    return res.status(status).json({ success: false, error: error.message });
  }
};

const getAllPeriodSlots = async (req, res) => {
  try {
    const data = await timetableService.getAllPeriodSlots(req.user.tenantId);
    return res.status(200).json({ success: true, message: 'Period slots fetched', data });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const updatePeriodSlot = async (req, res) => {
  try {
    const data = await timetableService.updatePeriodSlot(req.params.id, req.body, req.user.tenantId);
    return res.status(200).json({ success: true, message: 'Period slot updated', data });
  } catch (error) {
    const status = error.message === 'Period slot not found' ? 404 : 500;
    return res.status(status).json({ success: false, error: error.message });
  }
};

const deletePeriodSlot = async (req, res) => {
  try {
    const result = await timetableService.deletePeriodSlot(req.params.id, req.user.tenantId);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    const status = error.message === 'Period slot not found' ? 404 : 500;
    return res.status(status).json({ success: false, error: error.message });
  }
};

const seedDefaultSlots = async (req, res) => {
  try {
    const data = await timetableService.seedDefaultSlots(req.user.tenantId);
    return res.status(201).json({ success: true, message: 'Default period slots seeded', data });
  } catch (error) {
    const status = error.message.includes('already') ? 409 : 500;
    return res.status(status).json({ success: false, error: error.message });
  }
};

const createTimetableEntry = async (req, res) => {
  try {
    const data = await timetableService.createTimetableEntry(req.body, req.user.tenantId);
    return res.status(201).json({ success: true, message: 'Timetable entry created', data });
  } catch (error) {
    const status = error.message.includes('already') || error.message.includes('already assigned') || error.message.includes('already has') ? 409 : error.message.includes('not found') ? 404 : 500;
    return res.status(status).json({ success: false, error: error.message });
  }
};

const getClassTimetable = async (req, res) => {
  try {
    const { classId, sectionId, academicYearId } = req.query;
    if (!classId) return res.status(400).json({ success: false, error: 'classId is required' });
    const data = await timetableService.getClassTimetable(req.user.tenantId, classId, sectionId, academicYearId);
    return res.status(200).json({ success: true, message: 'Class timetable fetched', data });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const getTeacherTimetable = async (req, res) => {
  try {
    const { staffId, academicYearId } = req.query;
    if (!staffId) return res.status(400).json({ success: false, error: 'staffId is required' });
    const data = await timetableService.getTeacherTimetable(req.user.tenantId, staffId, academicYearId);
    return res.status(200).json({ success: true, message: 'Teacher timetable fetched', data });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const updateTimetableEntry = async (req, res) => {
  try {
    const data = await timetableService.updateTimetableEntry(req.params.id, req.body, req.user.tenantId);
    return res.status(200).json({ success: true, message: 'Timetable entry updated', data });
  } catch (error) {
    const status = error.message === 'Timetable entry not found' ? 404 : 500;
    return res.status(status).json({ success: false, error: error.message });
  }
};

const deleteTimetableEntry = async (req, res) => {
  try {
    const result = await timetableService.deleteTimetableEntry(req.params.id, req.user.tenantId);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    const status = error.message === 'Timetable entry not found' ? 404 : 500;
    return res.status(status).json({ success: false, error: error.message });
  }
};

module.exports = {
  createPeriodSlot, getAllPeriodSlots, updatePeriodSlot, deletePeriodSlot, seedDefaultSlots,
  createTimetableEntry, getClassTimetable, getTeacherTimetable, updateTimetableEntry, deleteTimetableEntry,
};
