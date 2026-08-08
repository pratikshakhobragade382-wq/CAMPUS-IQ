const { z, safeText, idParam } = require('../../validation/schemas');

const createClassBody = z
  .object({
    name: safeText('Class name', { max: 80 }),
  })
  .strip();

const addSectionBody = z
  .object({
    name: safeText('Section name', { max: 20 }),
  })
  .strip();

const classIdParam = idParam('classId');

module.exports = {
  createClassBody,
  addSectionBody,
  classIdParam,
};
