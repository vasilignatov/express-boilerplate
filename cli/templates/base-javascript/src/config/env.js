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
  
  JWT_ACCESS_SECRET: Joi.string()
    .min(32)
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.required(),
      otherwise: Joi.default('development_access_secret_key_min_32_chars')
    }),
  
  JWT_REFRESH_SECRET: Joi.string()
    .min(32)
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.required(),
      otherwise: Joi.default('development_refresh_secret_key_min_32_chars')
    }),
  
  JWT_ACCESS_EXPIRES_IN: Joi.string()
    .default('15m'),
  
  JWT_REFRESH_EXPIRES_IN: Joi.string()
    .default('7d'),
  
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
  
  // Database (optional - will be added by database templates)
  MONGODB_URI: Joi.string()
    .uri()
    .optional(),
  
  DATABASE_URL: Joi.string()
    .uri()
    .optional(),
  
  // Redis (optional)
  REDIS_HOST: Joi.string()
    .optional(),
  
  REDIS_PORT: Joi.number()
    .port()
    .optional(),
  
  REDIS_PASSWORD: Joi.string()
    .optional()
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
      jwtAccessSecret: value.JWT_ACCESS_SECRET,
      jwtRefreshSecret: value.JWT_REFRESH_SECRET,
      jwtAccessExpiresIn: value.JWT_ACCESS_EXPIRES_IN,
      jwtRefreshExpiresIn: value.JWT_REFRESH_EXPIRES_IN,
      bcryptSaltRounds: value.BCRYPT_SALT_ROUNDS
    },
    rateLimit: {
      windowMs: value.RATE_LIMIT_WINDOW_MS,
      maxRequests: value.RATE_LIMIT_MAX_REQUESTS
    },
    database: {
      mongodbUri: value.MONGODB_URI,
      databaseUrl: value.DATABASE_URL
    },
    redis: {
      host: value.REDIS_HOST,
      port: value.REDIS_PORT,
      password: value.REDIS_PASSWORD
    }
  };
}; 