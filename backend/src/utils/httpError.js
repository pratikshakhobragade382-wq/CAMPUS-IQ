class HttpError extends Error {
  /**
   * @param {number} statusCode - HTTP status code to return.
   * @param {string} message - Safe, client-facing message.
   * @param {{ code?: string, expose?: boolean, cause?: unknown }} [options]
   */
  constructor(statusCode, message, options = {}) {
    super(message);

    this.name = 'HttpError';
    this.statusCode = statusCode;

    // If expose is false, the error handler will replace `message` with a generic one.
    this.expose = options.expose !== undefined ? options.expose : true;

    // Optional machine-readable code (helps clients without leaking internals).
    this.code = options.code;

    // Keep the original cause for server-side logs/debugging.
    this.cause = options.cause;
  }
}

module.exports = { HttpError };
