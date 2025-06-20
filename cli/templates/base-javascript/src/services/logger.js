import pino from 'pino';

/**
 * Logger configuration based on environment
 */
const createLogger = () => {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const logLevel = process.env.LOG_LEVEL || 'info';

  const baseConfig = {
    level: logLevel,
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => {
        return { level: label };
      },
      bindings: (bindings) => {
        return {
          pid: bindings.pid,
          hostname: bindings.hostname,
          name: bindings.name
        };
      }
    },
    serializers: {
      req: pino.stdSerializers.req,
      res: pino.stdSerializers.res,
      err: pino.stdSerializers.err,
      error: pino.stdSerializers.err
    }
  };

  // Development configuration with pretty printing
  if (isDevelopment) {
    return pino({
      ...baseConfig,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'yyyy-mm-dd HH:MM:ss',
          ignore: 'pid,hostname',
          messageFormat: '{msg}',
          errorLikeObjectKeys: ['err', 'error']
        }
      }
    });
  }

  // Production configuration - structured JSON logging
  return pino(baseConfig);
};

/**
 * Application logger instance
 */
export const logger = createLogger();

/**
 * Create child logger with additional context
 * @param {object} context - Additional context to include in all log messages
 * @returns {object} Child logger instance
 */
export const createChildLogger = (context) => {
  return logger.child(context);
};

/**
 * Request logger for Express middleware
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {object} Request-specific logger
 */
export const createRequestLogger = (req, res) => {
  const requestId = req.headers['x-request-id'] || 
                   req.headers['x-correlation-id'] || 
                   generateRequestId();

  return logger.child({
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.get('user-agent'),
    ip: req.ip || req.connection.remoteAddress
  });
};

/**
 * Generate unique request ID
 * @returns {string} Unique request identifier
 */
const generateRequestId = () => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Log application startup information
 */
export const logStartup = (config) => {
  logger.info({
    port: config.port,
    environment: config.nodeEnv,
    apiPrefix: config.apiPrefix,
    logLevel: config.logLevel,
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    pid: process.pid
  }, 'Application starting up');
};

/**
 * Log application shutdown information
 */
export const logShutdown = (signal) => {
  logger.info({
    signal,
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage()
  }, 'Application shutting down');
};

/**
 * Log error with context
 * @param {Error} error - Error object
 * @param {object} context - Additional context
 * @param {string} message - Error message
 */
export const logError = (error, context = {}, message = 'An error occurred') => {
  logger.error({
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    },
    ...context
  }, message);
};

/**
 * Log performance metrics
 * @param {string} operation - Operation name
 * @param {number} duration - Duration in milliseconds
 * @param {object} context - Additional context
 */
export const logPerformance = (operation, duration, context = {}) => {
  logger.info({
    operation,
    duration,
    ...context
  }, `Performance: ${operation} completed in ${duration}ms`);
};

/**
 * Log security events
 * @param {string} event - Security event type
 * @param {object} context - Event context
 * @param {string} message - Event message
 */
export const logSecurity = (event, context = {}, message) => {
  logger.warn({
    securityEvent: event,
    ...context
  }, message || `Security event: ${event}`);
};

/**
 * Log business events
 * @param {string} event - Business event type
 * @param {object} context - Event context
 * @param {string} message - Event message
 */
export const logBusiness = (event, context = {}, message) => {
  logger.info({
    businessEvent: event,
    ...context
  }, message || `Business event: ${event}`);
};

export default logger; 