const { ZodError } = require('zod');

/**
 * Validates and sanitizes request parts using Zod.
 *
 * Why this matters:
 * - Prevents malicious/unexpected inputs from reaching business logic
 * - Avoids type confusion (e.g., "1" vs 1)
 * - Reduces injection risk by enforcing strict, known-good shapes
 */
module.exports = function validateRequest(schemas = {}) {
  const { body, params, query } = schemas;

  return (req, _res, next) => {
    if (body) {
      const parsed = body.safeParse(req.body);
      if (!parsed.success) return next(parsed.error);
      req.body = parsed.data;
    }

    if (params) {
      const parsed = params.safeParse(req.params);
      if (!parsed.success) return next(parsed.error);
      req.params = parsed.data;
    }

    if (query) {
      const parsed = query.safeParse(req.query);
      if (!parsed.success) return next(parsed.error);
      req.query = parsed.data;
    }

    return next();
  };
};

module.exports.ZodError = ZodError;
