/**
 * Base application error class
 * All custom errors should extend this class
 */
export class AppError extends Error {
  constructor(
    message,
    statusCode = 500,
    code = 'INTERNAL_ERROR',
    details = null,
    isOperational = true
  ) {
    super(message);
    
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error class
 * Used for input validation failures
 */
export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

/**
 * Authentication error class
 * Used for authentication failures
 */
export class AuthError extends AppError {
  constructor(
    message, 
    statusCode = 401, 
    code = 'AUTH_ERROR'
  ) {
    super(message, statusCode, code);
  }
}

/**
 * Authorization error class
 * Used for authorization failures
 */
export class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

/**
 * Not found error class
 * Used when resources are not found
 */
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

/**
 * Conflict error class
 * Used for resource conflicts (e.g., duplicate entries)
 */
export class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
  }
}

/**
 * Rate limit error class
 * Used when rate limits are exceeded
 */
export class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

/**
 * Database error class
 * Used for database-related errors
 */
export class DatabaseError extends AppError {
  constructor(message = 'Database operation failed') {
    super(message, 500, 'DATABASE_ERROR');
  }
}

/**
 * External service error class
 * Used for external API/service failures
 */
export class ExternalServiceError extends AppError {
  constructor(
    message = 'External service error',
    serviceName = null
  ) {
    super(
      message, 
      502, 
      'EXTERNAL_SERVICE_ERROR',
      serviceName ? { service: serviceName } : undefined
    );
  }
}

/**
 * Helper function to create standardized error responses
 */
export const createErrorResponse = (
  error,
  includeStack = false
) => {
  if (error instanceof AppError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error.details && { details: error.details }),
        ...(includeStack && { stack: error.stack })
      },
      timestamp: new Date().toISOString()
    };
  }

  return {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      ...(includeStack && { stack: error.stack })
    },
    timestamp: new Date().toISOString()
  };
};

/**
 * Helper function to check if error is operational
 */
export const isOperationalError = (error) => {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}; 