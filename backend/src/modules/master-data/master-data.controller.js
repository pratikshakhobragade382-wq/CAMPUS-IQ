const svc = require('./master-data.service');

const createMasterData = async (req, res) => {
  try { const data = await svc.createMasterData(req.body, req.user.tenantId); return res.status(201).json({ success: true, message: 'Master data created', data }); }
  catch (e) { return res.status(e.message.includes('already') ? 409 : 500).json({ success: false, error: e.message }); }
};
const getAllByCategory = async (req, res) => {
  try { const data = await svc.getAllByCategory(req.user.tenantId, req.query.category); return res.status(200).json({ success: true, data }); }
  catch (e) { return res.status(400).json({ success: false, error: e.message }); }
};
const getAllCategories = async (req, res) => {
  try { const data = await svc.getAllCategories(req.user.tenantId); return res.status(200).json({ success: true, data }); }
  catch (e) { return res.status(500).json({ success: false, error: e.message }); }
};
const getAllMasterData = async (req, res) => {
  try { const data = await svc.getAllMasterData(req.user.tenantId); return res.status(200).json({ success: true, data }); }
  catch (e) { return res.status(500).json({ success: false, error: e.message }); }
};
const updateMasterData = async (req, res) => {
  try { const data = await svc.updateMasterData(req.params.id, req.body, req.user.tenantId); return res.status(200).json({ success: true, message: 'Updated', data }); }
  catch (e) { return res.status(e.message.includes('not found') ? 404 : 500).json({ success: false, error: e.message }); }
};
const deleteMasterData = async (req, res) => {
  try { const result = await svc.deleteMasterData(req.params.id, req.user.tenantId); return res.status(200).json({ success: true, ...result }); }
  catch (e) { return res.status(e.message.includes('not found') ? 404 : 500).json({ success: false, error: e.message }); }
};
const bulkCreate = async (req, res) => {
  try {
    const { category, values } = req.body;
    if (!category || !Array.isArray(values) || !values.length) return res.status(400).json({ success: false, error: 'category and values array are required' });
    const data = await svc.bulkCreate(category, values, req.user.tenantId);
    return res.status(201).json({ success: true, message: 'Bulk created', data });
  } catch (e) { return res.status(500).json({ success: false, error: e.message }); }
};
const getValidCategories = (req, res) => res.status(200).json({ success: true, data: svc.getValidCategories() });

module.exports = { createMasterData, getAllByCategory, getAllCategories, getAllMasterData, updateMasterData, deleteMasterData, bulkCreate, getValidCategories };
