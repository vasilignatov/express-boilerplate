/**
 * Success response helper
 */
export const successResponse = (
  res,
  data,
  message = 'Success',
  statusCode = 200
) => {
  const response = {
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
export const createdResponse = (
  res,
  data,
  message = 'Resource created successfully'
) => {
  return successResponse(res, data, message, 201);
};

/**
 * No content response helper (HTTP 204)
 */
export const noContentResponse = (res) => {
  return res.status(204).send();
};

/**
 * Error response helper
 */
export const errorResponse = (
  res,
  code,
  message,
  statusCode = 500,
  details = null
) => {
  const response = {
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
  res,
  message = 'Bad request',
  details = null
) => {
  return errorResponse(res, 'BAD_REQUEST', message, 400, details);
};

/**
 * Unauthorized response helper (HTTP 401)
 */
export const unauthorizedResponse = (
  res,
  message = 'Unauthorized'
) => {
  return errorResponse(res, 'UNAUTHORIZED', message, 401);
};

/**
 * Forbidden response helper (HTTP 403)
 */
export const forbiddenResponse = (
  res,
  message = 'Forbidden'
) => {
  return errorResponse(res, 'FORBIDDEN', message, 403);
};

/**
 * Not found response helper (HTTP 404)
 */
export const notFoundResponse = (
  res,
  message = 'Resource not found'
) => {
  return errorResponse(res, 'NOT_FOUND', message, 404);
};

/**
 * Conflict response helper (HTTP 409)
 */
export const conflictResponse = (
  res,
  message = 'Resource conflict',
  details = null
) => {
  return errorResponse(res, 'CONFLICT', message, 409, details);
};

/**
 * Validation error response helper (HTTP 422)
 */
export const validationErrorResponse = (
  res,
  message = 'Validation failed',
  details = null
) => {
  return errorResponse(res, 'VALIDATION_ERROR', message, 422, details);
};

/**
 * Too many requests response helper (HTTP 429)
 */
export const tooManyRequestsResponse = (
  res,
  message = 'Too many requests'
) => {
  return errorResponse(res, 'TOO_MANY_REQUESTS', message, 429);
};

/**
 * Internal server error response helper (HTTP 500)
 */
export const internalServerErrorResponse = (
  res,
  message = 'Internal server error'
) => {
  return errorResponse(res, 'INTERNAL_SERVER_ERROR', message, 500);
};

/**
 * Paginated response helper
 */
export const paginatedResponse = (
  res,
  data,
  pagination,
  message = 'Success'
) => {
  const totalPages = Math.ceil(pagination.total / pagination.limit);
  
  const response = {
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
  res,
  statusCode,
  payload
) => {
  const response = {
    timestamp: new Date().toISOString(),
    ...payload
  };

  return res.status(statusCode).json(response);
};

/**
 * File response helper
 */
export const fileResponse = (
  res,
  filePath,
  filename = null,
  contentType = null
) => {
  if (filename) {
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  }
  
  if (contentType) {
    res.setHeader('Content-Type', contentType);
  }

  return res.sendFile(filePath);
};

/**
 * JSON file download response helper
 */
export const jsonFileResponse = (
  res,
  data,
  filename = 'export.json'
) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  
  return res.send(JSON.stringify(data, null, 2));
};

/**
 * Redirect response helper
 */
export const redirectResponse = (
  res,
  url,
  permanent = false
) => {
  const statusCode = permanent ? 301 : 302;
  return res.redirect(statusCode, url);
}; 