const svc = require('./custom-fields.service');

const createCustomField = async (req, res) => {
  try { const data = await svc.createCustomField(req.body, req.user.tenantId); return res.status(201).json({ success: true, message: 'Custom field created', data }); }
  catch (e) { return res.status(e.message.includes('already') ? 409 : 500).json({ success: false, error: e.message }); }
};
const getFieldsByForm = async (req, res) => {
  try { const data = await svc.getFieldsByForm(req.user.tenantId, req.query.formName); return res.status(200).json({ success: true, data }); }
  catch (e) { return res.status(400).json({ success: false, error: e.message }); }
};
const getAllForms = async (req, res) => {
  try { const data = await svc.getAllForms(req.user.tenantId); return res.status(200).json({ success: true, data }); }
  catch (e) { return res.status(500).json({ success: false, error: e.message }); }
};
const updateCustomField = async (req, res) => {
  try { const data = await svc.updateCustomField(req.params.id, req.body, req.user.tenantId); return res.status(200).json({ success: true, message: 'Updated', data }); }
  catch (e) { return res.status(e.message.includes('not found') ? 404 : 500).json({ success: false, error: e.message }); }
};
const deleteCustomField = async (req, res) => {
  try { const result = await svc.deleteCustomField(req.params.id, req.user.tenantId); return res.status(200).json({ success: true, ...result }); }
  catch (e) { return res.status(e.message.includes('not found') ? 404 : 500).json({ success: false, error: e.message }); }
};
const addOption = async (req, res) => {
  try { const data = await svc.addOption(req.params.id, req.body, req.user.tenantId); return res.status(201).json({ success: true, message: 'Option added', data }); }
  catch (e) { return res.status(e.message.includes('not found') ? 404 : e.message.includes('already') ? 409 : 400).json({ success: false, error: e.message }); }
};
const bulkAddOptions = async (req, res) => {
  try {
    const { options } = req.body;
    if (!Array.isArray(options) || !options.length) return res.status(400).json({ success: false, error: 'options array is required' });
    const data = await svc.bulkAddOptions(req.params.id, options, req.user.tenantId);
    return res.status(201).json({ success: true, message: 'Options added', data });
  } catch (e) { return res.status(e.message.includes('not found') ? 404 : 400).json({ success: false, error: e.message }); }
};
const updateOption = async (req, res) => {
  try { const data = await svc.updateOption(req.params.optionId, req.body, req.user.tenantId); return res.status(200).json({ success: true, message: 'Option updated', data }); }
  catch (e) { return res.status(e.message.includes('not found') ? 404 : 500).json({ success: false, error: e.message }); }
};
const deleteOption = async (req, res) => {
  try { const result = await svc.deleteOption(req.params.optionId, req.user.tenantId); return res.status(200).json({ success: true, ...result }); }
  catch (e) { return res.status(e.message.includes('not found') ? 404 : 500).json({ success: false, error: e.message }); }
};
const saveFieldValues = async (req, res) => {
  try {
    const { studentId, values } = req.body;
    if (!studentId || !Array.isArray(values) || !values.length) return res.status(400).json({ success: false, error: 'studentId and values array are required' });
    const data = await svc.saveFieldValues(studentId, values, req.user.tenantId);
    return res.status(200).json({ success: true, message: 'Values saved', data });
  } catch (e) { return res.status(e.message === 'Student not found' ? 404 : 500).json({ success: false, error: e.message }); }
};
const getFieldValues = async (req, res) => {
  try { const data = await svc.getFieldValues(req.params.studentId, req.user.tenantId); return res.status(200).json({ success: true, data }); }
  catch (e) { return res.status(500).json({ success: false, error: e.message }); }
};

module.exports = { createCustomField, getFieldsByForm, getAllForms, updateCustomField, deleteCustomField, addOption, bulkAddOptions, updateOption, deleteOption, saveFieldValues, getFieldValues };
