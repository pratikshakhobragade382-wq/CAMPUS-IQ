const { Prisma } = require('@prisma/client');
const { ZodError } = require('zod');
const { HttpError } = require('../utils/httpError');

function isPrismaKnownRequestError(err) {
  return err instanceof Prisma.PrismaClientKnownRequestError;
}

function isJwtError(err) {
  return (
    err?.name === 'JsonWebTokenError' ||
    err?.name === 'TokenExpiredError' ||
    err?.name === 'NotBeforeError'
  );
}

function toSafeHttpError(err) {
  // Explicit, developer-created HTTP errors.
  if (err instanceof HttpError) return err;

  // Request validation errors (safe to expose per-field messages).
  if (err instanceof ZodError || err?.name === 'ZodError') {
    const details = err.issues?.map((issue) => ({
      path: issue.path?.join('.') || '',
      message: issue.message,
    }));

    const validationError = new HttpError(400, 'Validation failed', {
      code: 'VALIDATION_ERROR',
    });

    validationError.details = details;
    return validationError;
  }

  // Invalid JSON body.
  if (err instanceof SyntaxError && err?.type === 'entity.parse.failed') {
    return new HttpError(400, 'Invalid JSON payload', { code: 'INVALID_JSON' });
  }

  // JWT auth errors.
  if (isJwtError(err)) {
    return new HttpError(401, 'Unauthorized', { code: 'UNAUTHORIZED', expose: true });
  }

  // Prisma errors — map to safe messages.
  if (isPrismaKnownRequestError(err)) {
    // https://www.prisma.io/docs/orm/reference/error-reference
    switch (err.code) {
      case 'P2002':
        return new HttpError(409, 'Duplicate value for a unique field', {
          code: 'DUPLICATE',
          expose: true,
        });
      case 'P2025':
        return new HttpError(404, 'Resource not found', {
          code: 'NOT_FOUND',
          expose: true,
        });
      case 'P2003':
        return new HttpError(400, 'Invalid reference (foreign key)', {
          code: 'INVALID_REFERENCE',
          expose: true,
        });
      default:
        return new HttpError(500, 'Database error', { code: 'DB_ERROR', expose: false, cause: err });
    }
  }

  // Fallback.
  return new HttpError(500, 'Internal server error', { code: 'INTERNAL', expose: false, cause: err });
}

/**
 * Centralized error handler.
 * - Prevents leaking stack traces / internal messages
 * - Provides consistent, secure error responses
 */
module.exports = (err, req, res, _next) => {
  const safeError = toSafeHttpError(err);

  const statusCode = safeError.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  // Server-side logging (do NOT send stack traces to clients in production).
  // Include request id so clients can report it for debugging.
  const logPayload = {
    requestId: req.id,
    method: req.method,
    path: req.originalUrl,
    statusCode,
    name: err?.name,
    message: err?.message,
    code: err?.code,
  };

  if (!isProduction) {
    // In dev, print the original error for easier debugging.
    console.error('ERROR:', logPayload, err);
  } else {
    console.error('ERROR:', logPayload);
  }

  const response = {
    success: false,
    error: safeError.expose ? safeError.message : 'Something went wrong',
    code: safeError.code,
    requestId: req.id,
  };

  if (safeError.details) {
    response.details = safeError.details;
  }

  res.status(statusCode).json(response);
};
