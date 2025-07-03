import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationError } from '../utils/errors';
import { logger } from '../services/logger';

/**
 * Middleware to validate request data using Joi schema
 */
export const validateRequest = (schema: Joi.ObjectSchema, property: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false, // Show all validation errors
      stripUnknown: true, // Remove unknown fields
      allowUnknown: false // Don't allow unknown fields
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      logger.warn({
        path: req.path,
        method: req.method,
        validationErrors: errorDetails,
        ip: req.ip
      }, 'Request validation failed');

      const validationError = new ValidationError('Validation failed', errorDetails);
      return next(validationError);
    }

    // Replace request data with validated data (sanitized)
    req[property] = value;
    next();
  };
};

/**
 * Validate request body
 */
export const validateBody = (schema: Joi.ObjectSchema) => {
  return validateRequest(schema, 'body');
};

/**
 * Validate query parameters
 */
export const validateQuery = (schema: Joi.ObjectSchema) => {
  return validateRequest(schema, 'query');
};

/**
 * Validate route parameters
 */
export const validateParams = (schema: Joi.ObjectSchema) => {
  return validateRequest(schema, 'params');
};

/**
 * Common validation schemas
 */
export const commonSchemas = {
  // UUID validation for PostgreSQL
  objectId: Joi.string()
    .uuid()
    .messages({
      'string.uuid': 'Invalid ID format'
    }),

  // Email validation
  email: Joi.string()
    .email()
    .lowercase()
    .messages({
      'string.email': 'Please provide a valid email address'
    }),

  // Password validation
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    }),

  // Name validation (for first name, last name, etc.)
  name: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z\s'-]+$/)
    .messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name cannot exceed 50 characters',
      'string.pattern.base': 'Name can only contain letters, spaces, hyphens, and apostrophes'
    }),

  // Pagination
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be at least 1'
    }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100'
    }),

  // Sort order
  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
    .messages({
      'any.only': 'Sort order must be either "asc" or "desc"'
    }),

  // Date validation
  date: Joi.date()
    .iso()
    .messages({
      'date.format': 'Date must be in ISO format (YYYY-MM-DD)',
      'date.base': 'Please provide a valid date'
    }),

  // URL validation
  url: Joi.string()
    .uri()
    .messages({
      'string.uri': 'Please provide a valid URL'
    }),

  // Phone number validation (international format)
  phone: Joi.string()
    .pattern(/^\+[1-9]\d{1,14}$/)
    .messages({
      'string.pattern.base': 'Phone number must be in international format (+1234567890)'
    })
};

/**
 * Utility function to create pagination schema
 */
export const paginationSchema = Joi.object({
  page: commonSchemas.page,
  limit: commonSchemas.limit,
  sortBy: Joi.string()
    .optional()
    .messages({
      'string.base': 'Sort field must be a string'
    }),
  sortOrder: commonSchemas.sortOrder
});

/**
 * Utility function to create search schema
 */
export const searchSchema = Joi.object({
  q: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Search query must be at least 1 character long',
      'string.max': 'Search query cannot exceed 100 characters'
    }),
  ...paginationSchema.describe().keys
});

/**
 * Custom validation error formatter
 */
export const formatValidationError = (error: Joi.ValidationError) => {
  const details = error.details.map(detail => ({
    field: detail.path.join('.'),
    message: detail.message.replace(/"/g, ''),
    value: detail.context?.value,
    type: detail.type
  }));

  return {
    message: 'Validation failed',
    errors: details,
    _original: error._original
  };
}; 