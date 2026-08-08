const { z } = require('zod');
const validator = require('validator');

/**
 * Common Zod schemas used across routes.
 *
 * Security notes:
 * - We intentionally validate length and allowed characters to reduce stored XSS risk.
 * - For fields that should be plain text (names/codes), we reject "<" and ">" to prevent HTML injection.
 */

const SAFE_TEXT_NO_HTML_RE = /^[^<>]*$/;

function safeText(fieldName, { min = 1, max = 100 } = {}) {
  return z
    .string({ required_error: `${fieldName} is required` })
    .trim()
    .min(min, `${fieldName} is required`)
    .max(max, `${fieldName} must be at most ${max} characters`)
    .regex(SAFE_TEXT_NO_HTML_RE, `${fieldName} must not contain HTML tags`);
}

const idParam = (fieldName = 'id') =>
  z.object({
    [fieldName]: z.coerce.number().int().positive(),
  });

const email = z
  .string({ required_error: 'Email is required' })
  .trim()
  .max(254)
  .transform((value) => {
    // normalizeEmail may return null for invalid emails; keep the original value in that case.
    return validator.normalizeEmail(value, {
      all_lowercase: true,
      gmail_remove_dots: false,
      gmail_remove_subaddress: false,
      outlookdotcom_remove_subaddress: false,
      yahoo_remove_subaddress: false,
      icloud_remove_subaddress: false,
    }) || value.toLowerCase();
  })
  .refine((value) => validator.isEmail(value), 'Invalid email address');

const password = z
  .string({ required_error: 'Password is required' })
  // bcrypt truncates at 72 bytes; enforce a max to avoid silent truncation.
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters');

module.exports = {
  z,
  safeText,
  idParam,
  email,
  password,
};
