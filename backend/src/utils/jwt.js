// utils/jwt.js
const jwt = require('jsonwebtoken');
const { HttpError } = require('./httpError');

exports.generateToken = (user) => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    // Do not generate tokens with weak/missing secrets.
    throw new HttpError(500, 'Authentication is not configured', {
      code: 'AUTH_MISCONFIGURED',
      expose: false,
    });
  }
  return jwt.sign(
    {
      userId: user.id,
      tenantId: user.tenantId,
      identity: user.identity,
      staffId: user.staff ? user.staff.id : null,
      staffRole: user.staff ? user.staff.role : null,
      parentId: user.parentId || null,
    },
    secret,
    {
      algorithm: 'HS256',
      expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    }
  );
};
