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
  
  BCRYPT_SALT_ROUNDS: Joi.number()
    .integer()
    .min(10)
    .max(15)
    .default(12)
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
  BCRYPT_SALT_ROUNDS: number;
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

  // Log basic configuration
  logger.info({
    nodeEnv: value.NODE_ENV,
    port: value.PORT,
    logLevel: value.LOG_LEVEL,
    apiPrefix: value.API_PREFIX
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
    }
  };
}; 