const { z } = require('../../validation/schemas');

const createAcademicYearBody = z
  .object({
    startDate: z.coerce.date({
      required_error: 'Start date is required',
      invalid_type_error: 'Invalid start date',
    }),

    endDate: z.coerce.date({
      required_error: 'End date is required',
      invalid_type_error: 'Invalid end date',
    }),

    isActive: z.boolean().default(false),
  })
  .superRefine((value, ctx) => {
    if (value.endDate <= value.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End date must be after start date',
        path: ['endDate'],
      });
    }
  })
  .strip();

module.exports = {
  createAcademicYearBody,
};