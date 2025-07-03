import Joi from 'joi';
import { logger } from '../services/logger.js';

/**
 * Environment variable validation schema
 */
const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  
  PORT: Joi.number()
    .port()
    .default(3000),
  
  API_PREFIX: Joi.string()
    .default('/api'),
  
  LOG_LEVEL: Joi.string()
    .valid('fatal', 'error', 'warn', 'info', 'debug', 'trace')
    .default('info'),
  
  CORS_ORIGIN: Joi.string()
    .default('http://localhost:3000'),
  
  BCRYPT_SALT_ROUNDS: Joi.number()
    .integer()
    .min(10)
    .max(15)
    .default(12),
  
  RATE_LIMIT_WINDOW_MS: Joi.number()
    .integer()
    .min(1000)
    .default(900000), // 15 minutes
  
  RATE_LIMIT_MAX_REQUESTS: Joi.number()
    .integer()
    .min(1)
    .default(100),
  

}).unknown(true); // Allow other environment variables

/**
 * Validate environment variables
 * @throws {Error} If validation fails
 */
export const validateEnv = () => {
  const { error, value } = envSchema.validate(process.env, {
    allowUnknown: true,
    stripUnknown: false,
    abortEarly: false
  });

  if (error) {
    const errorMessage = error.details
      .map(detail => `${detail.path.join('.')}: ${detail.message}`)
      .join(', ');
    
    logger.fatal({
      error: errorMessage,
      details: error.details
    }, 'Environment validation failed');
    
    throw new Error(`Environment validation failed: ${errorMessage}`);
  }

  // Log successful validation
  logger.info({
    nodeEnv: value.NODE_ENV,
    port: value.PORT,
    logLevel: value.LOG_LEVEL,
    apiPrefix: value.API_PREFIX
  }, 'Environment variables validated successfully');

  return value;
};

/**
 * Get validated environment configuration
 * @returns {object} Validated environment configuration
 */
export const getConfig = () => {
  const { error, value } = envSchema.validate(process.env, {
    allowUnknown: true,
    stripUnknown: false
  });

  if (error) {
    throw new Error(`Configuration error: ${error.message}`);
  }

  return {
    app: {
      nodeEnv: value.NODE_ENV,
      port: value.PORT,
      apiPrefix: value.API_PREFIX,
      logLevel: value.LOG_LEVEL
    },
    security: {
      corsOrigin: value.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
      bcryptSaltRounds: value.BCRYPT_SALT_ROUNDS
    },
    rateLimit: {
      windowMs: value.RATE_LIMIT_WINDOW_MS,
      maxRequests: value.RATE_LIMIT_MAX_REQUESTS
    },

  };
}; 