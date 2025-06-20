import { logger } from '../services/logger.js';

/**
 * Custom Error Classes
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT_ERROR');
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
    this.name = 'RateLimitError';
  }
}

/**
 * Async handler wrapper to catch async errors
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Express middleware function
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Handle Joi validation errors
 * @param {Error} error - Joi validation error
 * @returns {ValidationError} Formatted validation error
 */
const handleValidationError = (error) => {
  const details = error.details?.map(detail => ({
    field: detail.path.join('.'),
    message: detail.message,
    value: detail.context?.value
  }));

  return new ValidationError('Validation failed', details);
};

/**
 * Handle MongoDB/Mongoose errors
 * @param {Error} error - Database error
 * @returns {AppError} Formatted database error
 */
const handleDatabaseError = (error) => {
  // MongoDB duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return new ConflictError(`${field} already exists`);
  }

  // MongoDB validation error
  if (error.name === 'ValidationError') {
    const details = Object.values(error.errors).map(err => ({
      field: err.path,
      message: err.message,
      value: err.value
    }));
    return new ValidationError('Database validation failed', details);
  }

  // MongoDB cast error
  if (error.name === 'CastError') {
    return new ValidationError(`Invalid ${error.path}: ${error.value}`);
  }

  return new AppError('Database error', 500, 'DATABASE_ERROR');
};

/**
 * Handle JWT errors
 * @param {Error} error - JWT error
 * @returns {AuthenticationError} Formatted JWT error
 */
const handleJWTError = (error) => {
  if (error.name === 'JsonWebTokenError') {
    return new AuthenticationError('Invalid token');
  }
  if (error.name === 'TokenExpiredError') {
    return new AuthenticationError('Token expired');
  }
  return new AuthenticationError('Token error');
};

/**
 * Format error response
 * @param {Error} error - Error object
 * @param {object} req - Express request object
 * @returns {object} Formatted error response
 */
const formatErrorResponse = (error, req) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const response = {
    success: false,
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: error.message || 'Internal server error'
    },
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  };

  // Add error details in development or for operational errors
  if (error.details && (isDevelopment || error.isOperational)) {
    response.error.details = error.details;
  }

  // Add stack trace in development
  if (isDevelopment && error.stack) {
    response.error.stack = error.stack;
  }

  // Add request ID if available
  if (req.requestId) {
    response.requestId = req.requestId;
  }

  return response;
};

/**
 * Global error handler middleware
 * @param {Error} error - Error object
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {Function} next - Express next function
 */
export const errorHandler = (error, req, res, next) => {
  let processedError = error;

  // Handle specific error types
  if (error.name === 'ValidationError' && error.isJoi) {
    processedError = handleValidationError(error);
  } else if (error.code === 11000 || error.name === 'ValidationError' || error.name === 'CastError') {
    processedError = handleDatabaseError(error);
  } else if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    processedError = handleJWTError(error);
  } else if (!error.isOperational) {
    // Convert unknown errors to AppError
    processedError = new AppError(
      process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      500,
      'INTERNAL_ERROR'
    );
  }

  // Log error
  const logContext = {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      headers: req.headers,
      body: req.body,
      params: req.params,
      query: req.query,
      ip: req.ip
    },
    user: req.user ? { id: req.user.id, email: req.user.email } : null
  };

  if (processedError.statusCode >= 500) {
    logger.error(logContext, 'Internal server error');
  } else {
    logger.warn(logContext, 'Client error');
  }

  // Send error response
  const statusCode = processedError.statusCode || 500;
  const errorResponse = formatErrorResponse(processedError, req);

  res.status(statusCode).json(errorResponse);
};

/**
 * Handle 404 errors
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {Function} next - Express next function
 */
export const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
};

export default errorHandler; 