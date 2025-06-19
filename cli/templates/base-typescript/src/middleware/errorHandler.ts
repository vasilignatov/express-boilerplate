import { Request, Response, NextFunction } from 'express';
import { logger } from '../services/logger';
import { AppError, ValidationError, AuthError } from '../utils/errors';

/**
 * Global error handling middleware
 * Must be the last middleware in the application
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let errorCode = 'INTERNAL_SERVER_ERROR';
  let message = 'Internal server error';
  let details: any = undefined;

  // Log the error with context
  logger.error({
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    request: {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('user-agent')
    },
    timestamp: new Date().toISOString()
  }, 'Error occurred in request processing');

  // Handle different types of errors
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    errorCode = error.code;
    message = error.message;
    details = error.details;
  } else if (error instanceof ValidationError) {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = error.message;
    details = error.details;
  } else if (error instanceof AuthError) {
    statusCode = error.statusCode;
    errorCode = error.code;
    message = error.message;
  } else if (error.name === 'ValidationError') {
    // Joi validation error
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = error.message;
  } else if (error.name === 'SyntaxError' && 'body' in error) {
    // JSON parsing error
    statusCode = 400;
    errorCode = 'INVALID_JSON';
    message = 'Invalid JSON in request body';
  } else if (error.name === 'CastError') {
    // Database casting error
    statusCode = 400;
    errorCode = 'INVALID_ID';
    message = 'Invalid ID format';
  } else if (error.name === 'MongoServerError' && (error as any).code === 11000) {
    // MongoDB duplicate key error
    statusCode = 409;
    errorCode = 'DUPLICATE_ENTRY';
    message = 'Resource already exists';
  }

  // Prepare error response
  const errorResponse = {
    success: false,
    error: {
      code: errorCode,
      message: message,
      ...(details && { details }),
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack
      })
    },
    timestamp: new Date().toISOString()
  };

  // Send error response
  res.status(statusCode).json(errorResponse);
};

/**
 * Handle 404 errors for API routes
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  const message = `Route ${req.originalUrl} not found`;
  
  logger.warn({
    request: {
      method: req.method,
      url: req.url,
      ip: req.ip
    },
    timestamp: new Date().toISOString()
  }, message);

  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: message
    },
    timestamp: new Date().toISOString()
  });
};

/**
 * Async error wrapper for route handlers
 * Automatically catches async errors and passes them to error handler
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}; 