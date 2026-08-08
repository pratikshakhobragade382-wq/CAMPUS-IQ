const jwt = require('jsonwebtoken');
const { HttpError } = require('../utils/httpError');

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Never log tokens or decoded claims.
    // Leaked tokens in logs are equivalent to leaked passwords (account takeover risk).

    if (!authHeader) {
      throw new HttpError(401, 'Unauthorized', { code: 'UNAUTHORIZED' });
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
      // Avoid running with weak/missing secrets in production.
      // Do not expose configuration details to clients.
      throw new HttpError(500, 'Authentication is not configured', {
        code: 'AUTH_MISCONFIGURED',
        expose: false,
      });
    }

    const verifyOptions = {
      algorithms: ['HS256'],
    };

    // Optional hardening: if you set these env vars, we will enforce them.
    if (process.env.JWT_ISSUER) verifyOptions.issuer = process.env.JWT_ISSUER;
    if (process.env.JWT_AUDIENCE) verifyOptions.audience = process.env.JWT_AUDIENCE;

    const decoded = jwt.verify(token, secret, verifyOptions);

    // Attach user claims to request for tenant isolation and authorization.
    req.user = decoded;

    return next();
  } catch (error) {
    return next(error);
  }
};