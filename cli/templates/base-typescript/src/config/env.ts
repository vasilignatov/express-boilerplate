import Joi from 'joi';
import { logger } from '../services/logger';

/**
 * Environment variable validation schema
 * Validates and provides defaults for environment variables
 */
const envSchema = Joi.object({
  // Application
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  
  PORT: Joi.number()
    .port()
    .default(3000),
  
  API_PREFIX: Joi.string()
    .default('/api'),
  
  // Logging
  LOG_LEVEL: Joi.string()
    .valid('fatal', 'error', 'warn', 'info', 'debug', 'trace')
    .default('info'),
  
  // Security
  CORS_ORIGIN: Joi.string()
    .default('http://localhost:3000'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: Joi.number()
    .positive()
    .default(900000), // 15 minutes
  
  RATE_LIMIT_MAX_REQUESTS: Joi.number()
    .positive()
    .default(100),
  
  // Optional fields that will be validated if present
  JWT_ACCESS_SECRET: Joi.string()
    .min(32)
    .optional(),
  
  JWT_REFRESH_SECRET: Joi.string()
    .min(32)
    .optional(),
  
  BCRYPT_SALT_ROUNDS: Joi.number()
    .integer()
    .min(10)
    .max(15)
    .default(12),
  
  MONGODB_URI: Joi.string()
    .uri()
    .optional(),
  
  DATABASE_URL: Joi.string()
    .uri()
    .optional(),
  
  REDIS_URL: Joi.string()
    .uri()
    .optional()
}).unknown(true); // Allow additional environment variables

/**
 * Validated environment variables
 */
export interface EnvConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  API_PREFIX: string;
  LOG_LEVEL: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
  CORS_ORIGIN: string;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  JWT_ACCESS_SECRET?: string;
  JWT_REFRESH_SECRET?: string;
  BCRYPT_SALT_ROUNDS: number;
  MONGODB_URI?: string;
  DATABASE_URL?: string;
  REDIS_URL?: string;
}

/**
 * Validate environment variables
 * Throws an error if validation fails
 */
export const validateEnv = (): EnvConfig => {
  const { error, value } = envSchema.validate(process.env, {
    abortEarly: false,
    stripUnknown: false
  });

  if (error) {
    const errorMessages = error.details.map(detail => detail.message).join(', ');
    logger.fatal({
      error: errorMessages,
      details: error.details
    }, 'Environment validation failed');
    
    throw new Error(`Environment validation failed: ${errorMessages}`);
  }

  // Log validated configuration (without secrets)
  const safeConfig = {
    NODE_ENV: value.NODE_ENV,
    PORT: value.PORT,
    API_PREFIX: value.API_PREFIX,
    LOG_LEVEL: value.LOG_LEVEL,
    CORS_ORIGIN: value.CORS_ORIGIN,
    RATE_LIMIT_WINDOW_MS: value.RATE_LIMIT_WINDOW_MS,
    RATE_LIMIT_MAX_REQUESTS: value.RATE_LIMIT_MAX_REQUESTS,
    BCRYPT_SALT_ROUNDS: value.BCRYPT_SALT_ROUNDS,
    // Mask sensitive values
    JWT_ACCESS_SECRET: value.JWT_ACCESS_SECRET ? '[SET]' : '[NOT SET]',
    JWT_REFRESH_SECRET: value.JWT_REFRESH_SECRET ? '[SET]' : '[NOT SET]',
    MONGODB_URI: value.MONGODB_URI ? '[SET]' : '[NOT SET]',
    DATABASE_URL: value.DATABASE_URL ? '[SET]' : '[NOT SET]',
    REDIS_URL: value.REDIS_URL ? '[SET]' : '[NOT SET]'
  };

  logger.info({
    config: safeConfig
  }, 'Environment variables validated successfully');

  return value as EnvConfig;
};

/**
 * Check if we're in development mode
 */
export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === 'development';
};

/**
 * Check if we're in production mode
 */
export const isProduction = (): boolean => {
  return process.env.NODE_ENV === 'production';
};

/**
 * Check if we're in test mode
 */
export const isTest = (): boolean => {
  return process.env.NODE_ENV === 'test';
};

/**
 * Get configuration for specific feature
 */
export const getConfig = () => {
  const env = validateEnv();
  
  return {
    app: {
      name: 'Express TypeScript Boilerplate',
      version: '1.0.0',
      environment: env.NODE_ENV,
      port: env.PORT,
      apiPrefix: env.API_PREFIX
    },
    
    logging: {
      level: env.LOG_LEVEL
    },
    
    security: {
      corsOrigin: env.CORS_ORIGIN.split(',').map(origin => origin.trim()),
      rateLimiting: {
        windowMs: env.RATE_LIMIT_WINDOW_MS,
        maxRequests: env.RATE_LIMIT_MAX_REQUESTS
      },
      bcryptSaltRounds: env.BCRYPT_SALT_ROUNDS
    },
    
    auth: {
      accessSecret: env.JWT_ACCESS_SECRET,
      refreshSecret: env.JWT_REFRESH_SECRET,
      accessTokenExpiry: '15m',
      refreshTokenExpiry: '7d'
    },
    
    database: {
      mongodbUri: env.MONGODB_URI,
      postgresUrl: env.DATABASE_URL,
      redisUrl: env.REDIS_URL
    }
  };
}; 