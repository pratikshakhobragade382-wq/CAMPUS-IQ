const prisma = require('../../prisma/prismaClient');

const VALID_CATEGORIES = [
  'BloodGroup','Religion','Country','SocialCategory','MaritalStatus',
  'MotherTongue','Nationality','Document','BoardingCategory','Qualification',
  'House','Medium','Board','Stream','FeeGroup','Occupation','Designation',
];

const createMasterData = async (data, tenantId) => {
  const { category, value } = data;
  const existing = await prisma.masterData.findFirst({ where: { category, value, tenantId } });
  if (existing) throw new Error(`${value} already exists in ${category}`);
  return prisma.masterData.create({ data: { category, value, isActive: true, tenantId } });
};

const getAllByCategory = async (tenantId, category) => {
  if (!category) throw new Error('category is required');
  return prisma.masterData.findMany({ where: { category, tenantId, isActive: true }, orderBy: { value: 'asc' } });
};

const getAllCategories = async (tenantId) => {
  const data = await prisma.masterData.findMany({ where: { tenantId, isActive: true }, select: { category: true }, distinct: ['category'], orderBy: { category: 'asc' } });
  return data.map((d) => d.category);
};

const getAllMasterData = async (tenantId) => {
  const data = await prisma.masterData.findMany({ where: { tenantId, isActive: true }, orderBy: [{ category: 'asc' }, { value: 'asc' }] });
  const grouped = {};
  data.forEach((item) => { if (!grouped[item.category]) grouped[item.category] = []; grouped[item.category].push(item); });
  return grouped;
};

const updateMasterData = async (id, data, tenantId) => {
  const existing = await prisma.masterData.findFirst({ where: { id: parseInt(id), tenantId } });
  if (!existing) throw new Error('Master data not found');
  return prisma.masterData.update({ where: { id: parseInt(id) }, data: { ...(data.value && { value: data.value }), ...(data.isActive !== undefined && { isActive: data.isActive }) } });
};

const deleteMasterData = async (id, tenantId) => {
  const existing = await prisma.masterData.findFirst({ where: { id: parseInt(id), tenantId } });
  if (!existing) throw new Error('Master data not found');
  await prisma.masterData.delete({ where: { id: parseInt(id) } });
  return { message: 'Master data deleted successfully' };
};

const bulkCreate = async (category, values, tenantId) => {
  const data = values.map((value) => ({ category, value, tenantId, isActive: true }));
  await prisma.masterData.createMany({ data, skipDuplicates: true });
  return getAllByCategory(tenantId, category);
};

module.exports = { createMasterData, getAllByCategory, getAllCategories, getAllMasterData, updateMasterData, deleteMasterData, bulkCreate, getValidCategories: () => VALID_CATEGORIES };
