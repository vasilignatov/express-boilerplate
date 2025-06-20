import { logSecurity } from '../services/logger.js';

/**
 * Security middleware for additional security measures
 * beyond helmet.js
 */
export const security = (req, res, next) => {
  // Add security headers not covered by helmet
  res.setHeader('X-Request-ID', req.requestId || generateRequestId());
  res.setHeader('X-Response-Time', Date.now());
  
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  next();
};

/**
 * IP whitelist middleware
 * @param {string[]} allowedIPs - Array of allowed IP addresses
 * @returns {Function} Express middleware
 */
export const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP)) {
      logSecurity('ip_blocked', {
        clientIP,
        allowedIPs,
        url: req.originalUrl,
        method: req.method
      }, `Blocked request from unauthorized IP: ${clientIP}`);
      
      return res.status(403).json({
        success: false,
        error: {
          code: 'IP_NOT_ALLOWED',
          message: 'Access denied from this IP address'
        },
        timestamp: new Date().toISOString()
      });
    }
    
    next();
  };
};

/**
 * Request size limiter middleware
 * @param {string} limit - Size limit (e.g., '10mb', '1kb')
 * @returns {Function} Express middleware
 */
export const requestSizeLimiter = (limit = '10mb') => {
  const sizeInBytes = parseSize(limit);
  
  return (req, res, next) => {
    const contentLength = parseInt(req.get('content-length') || '0');
    
    if (contentLength > sizeInBytes) {
      logSecurity('request_too_large', {
        contentLength,
        limit: sizeInBytes,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip
      }, `Request size ${contentLength} exceeds limit ${sizeInBytes}`);
      
      return res.status(413).json({
        success: false,
        error: {
          code: 'REQUEST_TOO_LARGE',
          message: `Request size exceeds limit of ${limit}`
        },
        timestamp: new Date().toISOString()
      });
    }
    
    next();
  };
};

/**
 * User agent validation middleware
 * Blocks requests from suspicious user agents
 */
export const userAgentValidator = (req, res, next) => {
  const userAgent = req.get('user-agent') || '';
  
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /scanner/i
  ];
  
  // Allow legitimate bots (Google, Bing, etc.)
  const legitimateBots = [
    /googlebot/i,
    /bingbot/i,
    /slurp/i,
    /duckduckbot/i,
    /baiduspider/i,
    /yandexbot/i,
    /facebookexternalhit/i,
    /twitterbot/i,
    /linkedinbot/i
  ];
  
  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));
  const isLegitimate = legitimateBots.some(pattern => pattern.test(userAgent));
  
  if (isSuspicious && !isLegitimate) {
    logSecurity('suspicious_user_agent', {
      userAgent,
      ip: req.ip,
      url: req.originalUrl,
      method: req.method
    }, `Blocked request with suspicious user agent: ${userAgent}`);
    
    return res.status(403).json({
      success: false,
      error: {
        code: 'SUSPICIOUS_USER_AGENT',
        message: 'Access denied'
      },
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

/**
 * Request method validator
 * Only allows specified HTTP methods
 * @param {string[]} allowedMethods - Array of allowed HTTP methods
 * @returns {Function} Express middleware
 */
export const methodValidator = (allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']) => {
  return (req, res, next) => {
    if (!allowedMethods.includes(req.method)) {
      logSecurity('invalid_method', {
        method: req.method,
        allowedMethods,
        url: req.originalUrl,
        ip: req.ip
      }, `Blocked request with invalid method: ${req.method}`);
      
      return res.status(405).json({
        success: false,
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: `Method ${req.method} is not allowed`
        },
        timestamp: new Date().toISOString()
      });
    }
    
    next();
  };
};

/**
 * Content type validator
 * Only allows specified content types for POST/PUT/PATCH requests
 * @param {string[]} allowedTypes - Array of allowed content types
 * @returns {Function} Express middleware
 */
export const contentTypeValidator = (allowedTypes = ['application/json', 'application/x-www-form-urlencoded', 'multipart/form-data']) => {
  return (req, res, next) => {
    const bodyMethods = ['POST', 'PUT', 'PATCH'];
    
    if (bodyMethods.includes(req.method)) {
      const contentType = req.get('content-type') || '';
      const baseContentType = contentType.split(';')[0].trim();
      
      if (!allowedTypes.includes(baseContentType)) {
        logSecurity('invalid_content_type', {
          contentType: baseContentType,
          allowedTypes,
          method: req.method,
          url: req.originalUrl,
          ip: req.ip
        }, `Blocked request with invalid content type: ${baseContentType}`);
        
        return res.status(415).json({
          success: false,
          error: {
            code: 'UNSUPPORTED_MEDIA_TYPE',
            message: `Content type ${baseContentType} is not supported`
          },
          timestamp: new Date().toISOString()
        });
      }
    }
    
    next();
  };
};

/**
 * Request frequency limiter per IP
 * More granular than express-rate-limit
 * @param {number} maxRequests - Maximum requests per window
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Function} Express middleware
 */
export const requestFrequencyLimiter = (maxRequests = 100, windowMs = 60000) => {
  const requests = new Map();
  
  // Clean up old entries periodically
  setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of requests.entries()) {
      if (now - data.windowStart > windowMs) {
        requests.delete(ip);
      }
    }
  }, windowMs);
  
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!requests.has(ip)) {
      requests.set(ip, {
        count: 1,
        windowStart: now
      });
      return next();
    }
    
    const data = requests.get(ip);
    
    // Reset window if expired
    if (now - data.windowStart > windowMs) {
      data.count = 1;
      data.windowStart = now;
      return next();
    }
    
    // Increment counter
    data.count++;
    
    if (data.count > maxRequests) {
      logSecurity('rate_limit_exceeded', {
        ip,
        count: data.count,
        maxRequests,
        windowMs,
        url: req.originalUrl,
        method: req.method
      }, `Rate limit exceeded for IP ${ip}: ${data.count}/${maxRequests} requests`);
      
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please try again later'
        },
        timestamp: new Date().toISOString()
      });
    }
    
    next();
  };
};

/**
 * Generate request ID
 * @returns {string} Unique request ID
 */
const generateRequestId = () => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Parse size string to bytes
 * @param {string} size - Size string (e.g., '10mb', '1kb')
 * @returns {number} Size in bytes
 */
const parseSize = (size) => {
  const units = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024
  };
  
  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*([a-z]+)?$/);
  
  if (!match) {
    throw new Error(`Invalid size format: ${size}`);
  }
  
  const value = parseFloat(match[1]);
  const unit = match[2] || 'b';
  
  if (!units[unit]) {
    throw new Error(`Unknown size unit: ${unit}`);
  }
  
  return Math.floor(value * units[unit]);
};

export default security; 