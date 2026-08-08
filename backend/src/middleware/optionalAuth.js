const jwt = require('jsonwebtoken');
const { HttpError } = require('../utils/httpError');

/**
 * Like authMiddleware, but does NOT require a token.
 * - No Authorization header -> req.user stays undefined, continue.
 * - Malformed/invalid token -> reject (401). A bad token is never silently
 *   ignored, since that could mask a spoofing attempt.
 * - Valid token             -> req.user is populated, same as authMiddleware.
 *
 * Used on /auth/register, which behaves differently for an already-logged-in
 * privileged caller vs an anonymous/key-only caller.
 */
module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return next();
    }

    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!match) {
      throw new HttpError(401, 'Unauthorized', { code: 'UNAUTHORIZED' });
    }

    const token = match[1].trim();
    if (!token) {
      throw new HttpError(401, 'Unauthorized', { code: 'UNAUTHORIZED' });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 32) {
      throw new HttpError(500, 'Authentication is not configured', {
        code: 'AUTH_MISCONFIGURED',
        expose: false,
      });
    }

    const verifyOptions = { algorithms: ['HS256'] };
    if (process.env.JWT_ISSUER) verifyOptions.issuer = process.env.JWT_ISSUER;
    if (process.env.JWT_AUDIENCE) verifyOptions.audience = process.env.JWT_AUDIENCE;

    req.user = jwt.verify(token, secret, verifyOptions);
    return next();
  } catch (error) {
    return next(error);
  }
};
