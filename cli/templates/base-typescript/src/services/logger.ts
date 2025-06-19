import pino from 'pino';
import { Request, Response } from 'express';
/**
 * Pino logger configuration following production-ready standards
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  
  // Production logging configuration
  ...(process.env.NODE_ENV === 'production' ? {
    formatters: {
      level: (label) => {
        return { level: label };
      },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: {
      paths: ['password', 'authorization', 'cookie', 'token'],
      censor: '[REDACTED]'
    }
  } : {
    // Development logging with pretty printing
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
        ignore: 'pid,hostname'
      }
    }
  }),

  // Base configuration
  base: {
    env: process.env.NODE_ENV || 'development',
    revision: process.env.GIT_COMMIT || 'unknown'
  }
});

/**
 * Create a child logger with additional context
 * @param context - Additional context to include in all log messages
 * @returns Child logger instance
 */
export const createChildLogger = (context: Record<string, any>) => {
  return logger.child(context);
};

/**
 * Log request details
 * @param req - Express request object
 * @param res - Express response object
 * @param responseTime - Response time in milliseconds
 */
export const logRequest = (req: any, res: any, responseTime: number) => {
  const logLevel = res.statusCode >= 400 ? 'error' : 'info';
  
  logger[logLevel]({
    req: {
      method: req.method,
      url: req.url,
      headers: {
        'user-agent': req.get('user-agent'),
        'accept': req.get('accept'),
        'content-type': req.get('content-type')
      },
      ip: req.ip,
      userAgent: req.get('user-agent')
    },
    res: {
      statusCode: res.statusCode,
      contentLength: res.get('content-length')
    },
    responseTime,
    timestamp: new Date().toISOString()
  }, `${req.method} ${req.url} ${res.statusCode} - ${responseTime}ms`);
};

/**
 * Log application errors with context
 * @param error - Error object
 * @param context - Additional context
 */
export const logError = (error: Error, context: Record<string, any> = {}) => {
  logger.error({
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    ...context,
    timestamp: new Date().toISOString()
  }, 'Application error occurred');
};

/**
 * Log application startup
 * @param config - Application configuration
 */
export const logStartup = (config: Record<string, any>) => {
  logger.info({
    ...config,
    timestamp: new Date().toISOString()
  }, 'Application started successfully');
};

/**
 * Log application shutdown
 */
export const logShutdown = () => {
  logger.info({
    timestamp: new Date().toISOString()
  }, 'Application shutting down');
}; 