const { HttpError } = require('../utils/httpError');

/**
 * Optional protection for open registration.
 *
 * If you set `REGISTRATION_KEY` in production, clients must send:
 *   X-Registration-Key: <REGISTRATION_KEY>
 *
 * This prevents drive-by account creation and reduces the risk of self-signup privilege abuse.
 */
module.exports = (req, _res, next) => {
  const requiredKey = process.env.REGISTRATION_KEY;
  if (!requiredKey) return next();

  const providedKey = req.headers['x-registration-key'];
  if (!providedKey || providedKey !== requiredKey) {
    return next(new HttpError(403, 'Forbidden', { code: 'FORBIDDEN' }));
  }

  return next();
};
