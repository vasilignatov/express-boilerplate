/**
 * Base application error class
 * All custom errors should extend this class
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: any;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: any,
    isOperational: boolean = true
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
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

/**
 * Authentication error class
 * Used for authentication failures
 */
export class AuthError extends AppError {
  constructor(
    message: string, 
    statusCode: number = 401, 
    code: string = 'AUTH_ERROR'
  ) {
    super(message, statusCode, code);
  }
}

/**
 * Authorization error class
 * Used for authorization failures
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

/**
 * Not found error class
 * Used when resources are not found
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

/**
 * Conflict error class
 * Used for resource conflicts (e.g., duplicate entries)
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
  }
}

/**
 * Rate limit error class
 * Used when rate limits are exceeded
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

/**
 * Database error class
 * Used for database-related errors
 */
export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed') {
    super(message, 500, 'DATABASE_ERROR');
  }
}

/**
 * External service error class
 * Used for external API/service failures
 */
export class ExternalServiceError extends AppError {
  constructor(
    message: string = 'External service error',
    serviceName?: string
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
  error: AppError | Error,
  includeStack: boolean = false
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
export const isOperationalError = (error: Error): boolean => {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}; 