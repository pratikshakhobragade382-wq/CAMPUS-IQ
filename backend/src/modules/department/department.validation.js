const { z, safeText } = require('../../validation/schemas');

const createDepartmentBody = z
  .object({
    name: safeText('Department name', { max: 100 }),
  })
  .strip();

module.exports = {
  createDepartmentBody,
};
