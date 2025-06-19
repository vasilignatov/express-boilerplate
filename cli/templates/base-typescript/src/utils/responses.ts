import { Response } from 'express';

/**
 * Standard API response interface
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  message?: string;
  timestamp: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Success response helper
 */
export const successResponse = <T>(
  res: Response,
  data: T,
  message: string = 'Success',
  statusCode: number = 200
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  };

  return res.status(statusCode).json(response);
};

/**
 * Created response helper (HTTP 201)
 */
export const createdResponse = <T>(
  res: Response,
  data: T,
  message: string = 'Resource created successfully'
): Response => {
  return successResponse(res, data, message, 201);
};

/**
 * No content response helper (HTTP 204)
 */
export const noContentResponse = (res: Response): Response => {
  return res.status(204).send();
};

/**
 * Error response helper
 */
export const errorResponse = (
  res: Response,
  code: string,
  message: string,
  statusCode: number = 500,
  details?: any
): Response => {
  const response: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details && { details })
    },
    timestamp: new Date().toISOString()
  };

  return res.status(statusCode).json(response);
};

/**
 * Bad request response helper (HTTP 400)
 */
export const badRequestResponse = (
  res: Response,
  message: string = 'Bad request',
  details?: any
): Response => {
  return errorResponse(res, 'BAD_REQUEST', message, 400, details);
};

/**
 * Unauthorized response helper (HTTP 401)
 */
export const unauthorizedResponse = (
  res: Response,
  message: string = 'Unauthorized'
): Response => {
  return errorResponse(res, 'UNAUTHORIZED', message, 401);
};

/**
 * Forbidden response helper (HTTP 403)
 */
export const forbiddenResponse = (
  res: Response,
  message: string = 'Forbidden'
): Response => {
  return errorResponse(res, 'FORBIDDEN', message, 403);
};

/**
 * Not found response helper (HTTP 404)
 */
export const notFoundResponse = (
  res: Response,
  message: string = 'Resource not found'
): Response => {
  return errorResponse(res, 'NOT_FOUND', message, 404);
};

/**
 * Conflict response helper (HTTP 409)
 */
export const conflictResponse = (
  res: Response,
  message: string = 'Resource conflict',
  details?: any
): Response => {
  return errorResponse(res, 'CONFLICT', message, 409, details);
};

/**
 * Validation error response helper (HTTP 422)
 */
export const validationErrorResponse = (
  res: Response,
  message: string = 'Validation failed',
  details?: any
): Response => {
  return errorResponse(res, 'VALIDATION_ERROR', message, 422, details);
};

/**
 * Too many requests response helper (HTTP 429)
 */
export const tooManyRequestsResponse = (
  res: Response,
  message: string = 'Too many requests'
): Response => {
  return errorResponse(res, 'TOO_MANY_REQUESTS', message, 429);
};

/**
 * Internal server error response helper (HTTP 500)
 */
export const internalServerErrorResponse = (
  res: Response,
  message: string = 'Internal server error'
): Response => {
  return errorResponse(res, 'INTERNAL_SERVER_ERROR', message, 500);
};

/**
 * Paginated response helper
 */
export const paginatedResponse = <T>(
  res: Response,
  data: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
  },
  message: string = 'Success'
): Response => {
  const totalPages = Math.ceil(pagination.total / pagination.limit);
  
  const response: ApiResponse<T[]> = {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages
    }
  };

  return res.status(200).json(response);
};

/**
 * Custom response helper with flexible structure
 */
export const customResponse = (
  res: Response,
  statusCode: number,
  payload: Partial<ApiResponse>
): Response => {
  const response: ApiResponse = {
    success: statusCode < 400,
    timestamp: new Date().toISOString(),
    ...payload
  };

  return res.status(statusCode).json(response);
};

/**
 * File download response helper
 */
export const fileResponse = (
  res: Response,
  filePath: string,
  filename?: string,
  contentType?: string
): Response => {
  if (filename) {
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  }
  
  if (contentType) {
    res.setHeader('Content-Type', contentType);
  }

  return res.sendFile(filePath);
};

/**
 * JSON file response helper
 */
export const jsonFileResponse = <T>(
  res: Response,
  data: T,
  filename: string = 'export.json'
): Response => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  
  return res.send(JSON.stringify(data, null, 2));
};

/**
 * Redirect response helper
 */
export const redirectResponse = (
  res: Response,
  url: string,
  permanent: boolean = false
): Response => {
  const statusCode = permanent ? 301 : 302;
  return res.redirect(statusCode, url);
}; 