import { createRequestLogger } from '../services/logger.js';

/**
 * Request logging middleware
 * Logs incoming requests and outgoing responses
 */
export const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const requestLogger = createRequestLogger(req, res);
  
  // Add request logger to request object for use in other middleware/routes
  req.logger = requestLogger;
  req.startTime = startTime;

  // Generate request ID if not present
  if (!req.headers['x-request-id'] && !req.headers['x-correlation-id']) {
    req.requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    res.setHeader('X-Request-ID', req.requestId);
  } else {
    req.requestId = req.headers['x-request-id'] || req.headers['x-correlation-id'];
  }

  // Log incoming request
  requestLogger.info({
    type: 'request',
    method: req.method,
    url: req.originalUrl,
    headers: filterSensitiveHeaders(req.headers),
    query: req.query,
    body: filterSensitiveBody(req.body),
    ip: req.ip,
    userAgent: req.get('user-agent'),
    contentLength: req.get('content-length'),
    contentType: req.get('content-type')
  }, `Incoming ${req.method} ${req.originalUrl}`);

  // Capture response data
  const originalSend = res.send;
  let responseBody;
  
  res.send = function(data) {
    responseBody = data;
    return originalSend.call(this, data);
  };

  // Log response when request finishes
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const contentLength = res.get('content-length');
    
    const logData = {
      type: 'response',
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration,
      contentLength,
      ip: req.ip,
      userAgent: req.get('user-agent')
    };

    // Add response body for errors or in development
    if (res.statusCode >= 400 || process.env.NODE_ENV === 'development') {
      logData.responseBody = filterSensitiveBody(responseBody);
    }

    // Determine log level based on status code
    if (res.statusCode >= 500) {
      requestLogger.error(logData, `${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    } else if (res.statusCode >= 400) {
      requestLogger.warn(logData, `${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    } else {
      requestLogger.info(logData, `${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    }
  });

  // Log response errors
  res.on('error', (error) => {
    const duration = Date.now() - startTime;
    
    requestLogger.error({
      type: 'response_error',
      method: req.method,
      url: req.originalUrl,
      error: {
        message: error.message,
        stack: error.stack
      },
      duration,
      ip: req.ip
    }, `Response error for ${req.method} ${req.originalUrl}`);
  });

  next();
};

/**
 * Filter sensitive headers from logging
 * @param {object} headers - Request headers
 * @returns {object} Filtered headers
 */
const filterSensitiveHeaders = (headers) => {
  const sensitiveHeaders = [
    'authorization',
    'cookie',
    'x-api-key',
    'x-auth-token',
    'x-access-token'
  ];

  const filtered = { ...headers };
  
  sensitiveHeaders.forEach(header => {
    if (filtered[header]) {
      filtered[header] = '[REDACTED]';
    }
  });

  return filtered;
};

/**
 * Filter sensitive data from request/response body
 * @param {any} body - Request or response body
 * @returns {any} Filtered body
 */
const filterSensitiveBody = (body) => {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'apiKey',
    'accessToken',
    'refreshToken',
    'creditCard',
    'ssn',
    'socialSecurityNumber'
  ];

  const filtered = Array.isArray(body) ? [...body] : { ...body };

  const filterObject = (obj) => {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const result = Array.isArray(obj) ? [...obj] : { ...obj };

    Object.keys(result).forEach(key => {
      const lowerKey = key.toLowerCase();
      
      if (sensitiveFields.some(field => lowerKey.includes(field))) {
        result[key] = '[REDACTED]';
      } else if (typeof result[key] === 'object' && result[key] !== null) {
        result[key] = filterObject(result[key]);
      }
    });

    return result;
  };

  return filterObject(filtered);
};

/**
 * Skip logging for certain routes (health checks, static files, etc.)
 * @param {string} path - Request path
 * @returns {boolean} Whether to skip logging
 */
const shouldSkipLogging = (path) => {
  const skipPatterns = [
    '/health',
    '/favicon.ico',
    '/robots.txt',
    '/static/',
    '/assets/',
    '/public/'
  ];

  return skipPatterns.some(pattern => path.startsWith(pattern));
};

/**
 * Conditional request logger that skips certain routes
 */
export const conditionalRequestLogger = (req, res, next) => {
  if (shouldSkipLogging(req.path)) {
    return next();
  }
  
  return requestLogger(req, res, next);
};

/**
 * Performance monitoring middleware
 * Logs slow requests
 */
export const performanceLogger = (threshold = 1000) => {
  return (req, res, next) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      
      if (duration > threshold) {
        req.logger?.warn({
          type: 'slow_request',
          method: req.method,
          url: req.originalUrl,
          duration,
          threshold,
          statusCode: res.statusCode
        }, `Slow request detected: ${req.method} ${req.originalUrl} took ${duration}ms`);
      }
    });
    
    next();
  };
};

export default requestLogger; 