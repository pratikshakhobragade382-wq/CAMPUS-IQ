const { z, safeText, idParam } = require('../../validation/schemas');

const subjectCode = z
  .string({ required_error: 'Code is required' })
  .trim()
  .min(2, 'Code is required')
  .max(20, 'Code must be at most 20 characters')
  .regex(/^[A-Za-z0-9_-]+$/, 'Code must contain only letters, numbers, _ or -')
  .transform((value) => value.toUpperCase());

const createSubjectBody = z
  .object({
    name: safeText('Name', { max: 100 }),
    code: subjectCode,
  })
  .strip();

const updateSubjectBody = z
  .object({
    name: safeText('Name', { max: 100 }).optional(),
    code: subjectCode.optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.name && !value.code) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'At least one field (name or code) is required',
      });
    }
  })
  .strip();

const subjectIdParam = idParam('id');

module.exports = {
  createSubjectBody,
  updateSubjectBody,
  subjectIdParam,
};
