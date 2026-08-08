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

const loginBody = z
  .object({
    email,
    password: z.string().min(1, 'Password is required').max(72),
    tenantId: z.coerce.number().int().positive().optional(), // for local dev
  })
  .strip();

module.exports = { registerBody, loginBody };
