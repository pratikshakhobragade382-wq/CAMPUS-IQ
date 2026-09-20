const { z, safeText, email } = require('../../validation/schemas');

const identity = z.preprocess(
  (value) => (typeof value === 'string' ? value.toLowerCase().trim() : value),
  z.enum(['admin', 'staff', 'student', 'parent', 'principal', 'management'])
);

const registerBody = z
  .object({
    name: safeText('Name', { max: 100 }),
    email,
    password: z.string().min(8, 'Password must be at least 8 characters').max(72),
    tenantId: z.coerce.number().int().positive(),
    identity,
  })
  .strip();

const loginId = z.string().trim().min(1, 'Email or student ID is required').max(254);

const loginBody = z
  .object({
    identifier: loginId.optional(), // email OR student admission number
    email: loginId.optional(), // kept so existing clients don't break
    password: z.string().min(1, 'Password is required').max(72),
    tenantId: z.coerce.number().int().positive().optional(), // for local dev
  })
  .strip()
  .refine((d) => d.identifier || d.email, {
    message: 'Email or student ID is required',
    path: ['identifier'],
  });

const changePasswordBody = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required').max(72),
    newPassword: z.string().min(8, 'New password must be at least 8 characters').max(72),
  })
  .strip()
  .refine((d) => d.currentPassword !== d.newPassword, {
    message: 'New password must be different from the current password',
    path: ['newPassword'],
  });

module.exports = { registerBody, loginBody, changePasswordBody };
