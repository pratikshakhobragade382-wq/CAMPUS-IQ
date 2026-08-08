const rateLimit = require('express-rate-limit');

// Default in-memory store is OK for single-instance dev.
// For production behind multiple instances, use a shared store (e.g., Redis) to be effective.

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests. Please try again later.',
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many authentication attempts. Please try again later.',
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
};
