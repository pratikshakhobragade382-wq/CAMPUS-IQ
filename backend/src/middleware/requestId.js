const crypto = require('crypto');

/**
 * Adds a per-request id for safer debugging.
 * - Returned to clients as `X-Request-Id`
 * - Logged with errors to correlate client issues without exposing stack traces.
 */
module.exports = (req, res, next) => {
  const requestId = crypto.randomUUID();
  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
};
