const { z, safeText, idParam } = require('../../validation/schemas');

const createSectionBody = z
  .object({
    name: safeText('Section name', { max: 20 }),
    classId: z.coerce.number().int().positive(),
  })
  .strip();

const updateSectionBody = z
  .object({
    name: safeText('Section name', { max: 20 }).optional(),
    classId: z.coerce.number().int().positive().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.name === undefined && value.classId === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'At least one field (name or classId) is required',
      });
    }
  })
  .strip();

const sectionIdParam = idParam('id');

module.exports = {
  createSectionBody,
  updateSectionBody,
  sectionIdParam,
};
