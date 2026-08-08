const prisma = require('../../prisma/prismaClient');

const getFieldWithOptions = async (id, tenantId) =>
  prisma.customField.findFirst({ where: { id: parseInt(id), tenantId }, include: { options: { where: { isActive: true }, orderBy: { priority: 'asc' } } } });

const createCustomField = async (data, tenantId) => {
  const { formName, name, displayName, control, dataType, priority, maxLength, options } = data;
  const existing = await prisma.customField.findFirst({ where: { formName, name, tenantId } });
  if (existing) throw new Error('Field already exists in this form');
  const field = await prisma.customField.create({ data: { formName, name, displayName, control, dataType: dataType || 'text', priority: priority || 1, maxLength, isActive: true, tenantId } });
  if (control === 'DropDown' && Array.isArray(options) && options.length) {
    await prisma.customFieldOption.createMany({ data: options.map((opt, i) => ({ customFieldId: field.id, label: opt.label, value: opt.value, priority: opt.priority || i + 1, isActive: true, tenantId })) });
  }
  return getFieldWithOptions(field.id, tenantId);
};

const getFieldsByForm = async (tenantId, formName) => {
  if (!formName) throw new Error('formName is required');
  return prisma.customField.findMany({ where: { formName, tenantId, isActive: true }, orderBy: { priority: 'asc' }, include: { options: { where: { isActive: true }, orderBy: { priority: 'asc' } } } });
};

const getAllForms = async (tenantId) => {
  const data = await prisma.customField.findMany({ where: { tenantId, isActive: true }, select: { formName: true }, distinct: ['formName'] });
  return data.map((d) => d.formName);
};

const updateCustomField = async (id, data, tenantId) => {
  const existing = await prisma.customField.findFirst({ where: { id: parseInt(id), tenantId } });
  if (!existing) throw new Error('Custom field not found');
  await prisma.customField.update({ where: { id: parseInt(id) }, data: { ...(data.displayName && { displayName: data.displayName }), ...(data.control && { control: data.control }), ...(data.dataType && { dataType: data.dataType }), ...(data.priority !== undefined && { priority: data.priority }), ...(data.maxLength !== undefined && { maxLength: data.maxLength }), ...(data.isActive !== undefined && { isActive: data.isActive }) } });
  return getFieldWithOptions(id, tenantId);
};

const deleteCustomField = async (id, tenantId) => {
  const existing = await prisma.customField.findFirst({ where: { id: parseInt(id), tenantId } });
  if (!existing) throw new Error('Custom field not found');
  await prisma.customField.delete({ where: { id: parseInt(id) } });
  return { message: 'Custom field deleted successfully' };
};

const addOption = async (fieldId, data, tenantId) => {
  const field = await prisma.customField.findFirst({ where: { id: parseInt(fieldId), tenantId } });
  if (!field) throw new Error('Custom field not found');
  if (field.control !== 'DropDown') throw new Error('Options can only be added to DropDown fields');
  const existing = await prisma.customFieldOption.findFirst({ where: { customFieldId: parseInt(fieldId), value: data.value } });
  if (existing) throw new Error('Option value already exists');
  return prisma.customFieldOption.create({ data: { customFieldId: parseInt(fieldId), label: data.label, value: data.value, priority: data.priority || 1, isActive: true, tenantId } });
};

const bulkAddOptions = async (fieldId, options, tenantId) => {
  const field = await prisma.customField.findFirst({ where: { id: parseInt(fieldId), tenantId } });
  if (!field) throw new Error('Custom field not found');
  if (field.control !== 'DropDown') throw new Error('Options can only be added to DropDown fields');
  await prisma.customFieldOption.createMany({ data: options.map((opt, i) => ({ customFieldId: parseInt(fieldId), label: opt.label, value: opt.value, priority: opt.priority || i + 1, isActive: true, tenantId })), skipDuplicates: true });
  return getFieldWithOptions(fieldId, tenantId);
};

const updateOption = async (optionId, data, tenantId) => {
  const existing = await prisma.customFieldOption.findFirst({ where: { id: parseInt(optionId), tenantId } });
  if (!existing) throw new Error('Option not found');
  return prisma.customFieldOption.update({ where: { id: parseInt(optionId) }, data: { ...(data.label && { label: data.label }), ...(data.value && { value: data.value }), ...(data.priority !== undefined && { priority: data.priority }), ...(data.isActive !== undefined && { isActive: data.isActive }) } });
};

const deleteOption = async (optionId, tenantId) => {
  const existing = await prisma.customFieldOption.findFirst({ where: { id: parseInt(optionId), tenantId } });
  if (!existing) throw new Error('Option not found');
  await prisma.customFieldOption.delete({ where: { id: parseInt(optionId) } });
  return { message: 'Option deleted successfully' };
};

const saveFieldValues = async (studentId, values, tenantId) => {
  const student = await prisma.student.findFirst({ where: { id: parseInt(studentId), tenantId, isDeleted: false } });
  if (!student) throw new Error('Student not found');

  // Verify all customFieldIds belong to this tenant
  const fieldIds = values.map((v) => parseInt(v.customFieldId));
  const validFields = await prisma.customField.findMany({
    where: { id: { in: fieldIds }, tenantId },
    select: { id: true },
  });
  if (validFields.length !== fieldIds.length) {
    throw new Error('One or more custom fields are invalid or do not belong to this tenant');
  }

  for (const { customFieldId, value } of values) {
    await prisma.customFieldValue.upsert({ where: { customFieldId_studentId: { customFieldId: parseInt(customFieldId), studentId: parseInt(studentId) } }, update: { value, updatedAt: new Date() }, create: { customFieldId: parseInt(customFieldId), studentId: parseInt(studentId), value, tenantId } });
  }
  return getFieldValues(studentId, tenantId);
};

const getFieldValues = async (studentId, tenantId) =>
  prisma.customFieldValue.findMany({ where: { studentId: parseInt(studentId), tenantId }, include: { customField: { include: { options: { where: { isActive: true }, orderBy: { priority: 'asc' } } } } } });

module.exports = { createCustomField, getFieldsByForm, getAllForms, updateCustomField, deleteCustomField, addOption, bulkAddOptions, updateOption, deleteOption, saveFieldValues, getFieldValues };
