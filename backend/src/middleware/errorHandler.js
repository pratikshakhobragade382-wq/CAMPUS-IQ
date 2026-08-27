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
  // =====================================================
  // EXPLICIT HTTP ERRORS
  // =====================================================

  // Errors intentionally created by our application.
  if (err instanceof HttpError) return err;

  // =====================================================
  // ZOD VALIDATION ERRORS
  // =====================================================

  // Request validation errors.
  if (err instanceof ZodError || err?.name === 'ZodError') {
    const details = err.issues?.map((issue) => ({
      path: issue.path?.join('.') || '',
      message: issue.message,
    }));

    const validationError = new HttpError(400, 'Validation failed', {
      code: 'VALIDATION_ERROR',
      expose: true,
    });

    validationError.details = details;

    return validationError;
  }

  // =====================================================
  // INVALID JSON
  // =====================================================

  if (err instanceof SyntaxError && err?.type === 'entity.parse.failed') {
    return new HttpError(400, 'Invalid JSON payload', {
      code: 'INVALID_JSON',
      expose: true,
    });
  }

  // =====================================================
  // MULTER UPLOAD ERRORS
  // =====================================================

  // Handles Multer errors such as:
  // - File too large
  // - Too many files
  // - Unexpected file
  // - Other Multer upload errors
  if (err?.name === 'MulterError') {
    return new HttpError(400, err.message, {
      code: err.code || 'UPLOAD_ERROR',
      expose: true,
    });
  }

  // =====================================================
  // INVALID IMAGE FILE TYPE
  // =====================================================

  // This matches the custom validation message from
  // ai.routes.js fileFilter.
  if (
    err?.message ===
    'Invalid file type. Only JPG, JPEG, PNG, WEBP and GIF images are allowed.'
  ) {
    return new HttpError(400, err.message, {
      code: 'INVALID_FILE_TYPE',
      expose: true,
    });
  }

  // =====================================================
  // JWT AUTH ERRORS
  // =====================================================

  if (isJwtError(err)) {
    return new HttpError(401, 'Unauthorized', {
      code: 'UNAUTHORIZED',
      expose: true,
    });
  }

  // =====================================================
  // PRISMA ERRORS
  // =====================================================

  if (isPrismaKnownRequestError(err)) {
    // Prisma error reference:
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
        return new HttpError(500, 'Database error', {
          code: 'DB_ERROR',
          expose: false,
          cause: err,
        });
    }
  }

  // =====================================================
  // FALLBACK
  // =====================================================

  return new HttpError(500, 'Internal server error', {
    code: 'INTERNAL',
    expose: false,
    cause: err,
  });
}

/**
 * Centralized error handler.
 *
 * Responsibilities:
 * - Prevent leaking internal errors
 * - Return consistent API responses
 * - Handle validation errors
 * - Handle authentication errors
 * - Handle Prisma errors
 * - Handle Multer upload errors
 * - Log useful information on the server
 */
module.exports = (err, req, res, _next) => {
  const safeError = toSafeHttpError(err);

  const statusCode = safeError.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  // =====================================================
  // SERVER-SIDE LOGGING
  // =====================================================

  // Include request ID so errors can be traced during debugging.
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
    // Development:
    // Show the original error in the backend console.
    console.error('ERROR:', logPayload, err);
  } else {
    // Production:
    // Do not expose stack traces.
    console.error('ERROR:', logPayload);
  }

  // =====================================================
  // API ERROR RESPONSE
  // =====================================================

  const response = {
    success: false,
    error: safeError.expose
      ? safeError.message
      : 'Something went wrong',
    code: safeError.code,
    requestId: req.id,
  };

  // Include validation details when available.
  if (safeError.details) {
    response.details = safeError.details;
  }

  res.status(statusCode).json(response);
};