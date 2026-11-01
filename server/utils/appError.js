/**
 * Custom error class for expected/operational errors (bad input, auth
 * failures, not-found, etc). Thrown from controllers, caught by the
 * asyncHandler wrapper, and formatted by errorHandler.js.
 *
 * Usage: throw new AppError('Invalid credentials', 401);
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;