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

// Per-IP limit on all /auth routes. Kept high because a whole school
// (hundreds of students) often shares one public IP.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many authentication attempts. Please try again later.',
  },
});

// Per-account limit on login: counts only FAILED attempts for one login ID,
// so guessing one student's password is blocked without affecting classmates.
const loginAccountLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const body = req.body || {};
    const id = String(body.identifier || body.email || 'anon').trim().toLowerCase();
    return String(req.headers.host || 'host') + '|' + id;
  },
  message: {
    success: false,
    error: 'Too many failed login attempts for this account. Please try again in 15 minutes.',
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
  loginAccountLimiter,
};
