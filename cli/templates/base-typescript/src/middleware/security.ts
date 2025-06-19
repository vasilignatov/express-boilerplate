import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { ValidationError } from '../utils/errors';
import { logger } from '../services/logger';

/**
 * General security middleware
 * Applies security measures to all requests
 */
export const security = (_req: Request, res: Response, next: NextFunction): void => {
  // Remove sensitive headers that might leak information
  res.removeHeader('X-Powered-By');
  
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self'; font-src 'self';"
  );

  next();
};

/**
 * Request size validation middleware
 */
export const validateRequestSize = (maxSize: string = '10mb') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = req.get('content-length');
    
    if (contentLength) {
      const sizeInBytes = parseInt(contentLength);
      const maxSizeInBytes = parseSize(maxSize);
      
      if (sizeInBytes > maxSizeInBytes) {
        logger.warn({
          ip: req.ip,
          contentLength: sizeInBytes,
          maxAllowed: maxSizeInBytes,
          url: req.url
        }, 'Request size exceeded limit');
        
        res.status(413).json({
          success: false,
          error: {
            code: 'PAYLOAD_TOO_LARGE',
            message: `Request size exceeds maximum allowed size of ${maxSize}`
          },
          timestamp: new Date().toISOString()
        });
        return;
      }
    }
    
    next();
  };
};

/**
 * IP whitelist middleware
 */
export const ipWhitelist = (allowedIPs: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientIP = req.ip || req.connection.remoteAddress || '';
    
    if (!allowedIPs.includes(clientIP)) {
      logger.warn({
        ip: clientIP,
        url: req.url,
        method: req.method
      }, 'Access denied - IP not in whitelist');
      
      res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'Access denied'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    next();
  };
};

/**
 * Input sanitization middleware
 * Sanitizes request body to prevent XSS attacks
 */
export const sanitizeInput = [
  // Sanitize common fields
  body('*').trim().escape(),
  
  // Custom sanitization for specific fields
  body('email').optional().isEmail().normalizeEmail(),
  body('url').optional().isURL(),
  
  // Validation result handler
  (req: Request, _res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      logger.warn({
        errors: errors.array(),
        ip: req.ip,
        url: req.url
      }, 'Input validation failed');
      
      throw new ValidationError('Invalid input data', errors.array());
    }
    
    next();
  }
];

/**
 * API version middleware
 * Ensures API version compatibility
 */
export const apiVersion = (supportedVersions: string[] = ['v1']) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const version = req.headers['api-version'] as string || 'v1';
    
    if (!supportedVersions.includes(version)) {
      logger.warn({
        requestedVersion: version,
        supportedVersions,
        ip: req.ip
      }, 'Unsupported API version requested');
      
      res.status(400).json({
        success: false,
        error: {
          code: 'UNSUPPORTED_API_VERSION',
          message: `API version '${version}' is not supported. Supported versions: ${supportedVersions.join(', ')}`
        },
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    // Add version to request for use in handlers
    (req as any).apiVersion = version;
    next();
  };
};

/**
 * Request timeout middleware
 */
export const requestTimeout = (timeoutMs: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        logger.error({
          ip: req.ip,
          url: req.url,
          method: req.method,
          timeout: timeoutMs
        }, 'Request timeout');
        
        res.status(408).json({
          success: false,
          error: {
            code: 'REQUEST_TIMEOUT',
            message: 'Request timeout'
          },
          timestamp: new Date().toISOString()
        });
      }
    }, timeoutMs);
    
    // Clear timeout when response is finished
    res.on('finish', () => {
      clearTimeout(timeout);
    });
    
    next();
  };
};

/**
 * Helper function to parse size strings (e.g., "10mb", "1gb")
 */
function parseSize(size: string): number {
  const units: { [key: string]: number } = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024
  };
  
  const match = size.match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)$/i);
  
  if (!match) {
    throw new Error(`Invalid size format: ${size}`);
  }
  
  const value = parseFloat(match[1]);
  const unit = match[2].toLowerCase();
  
  return value * units[unit];
} 