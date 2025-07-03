import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application } from 'express';

// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Express API',
    version: '1.0.0',
    description: 'A production-ready Express.js API with TypeScript, authentication, and security features',
    contact: {
      name: 'API Support',
      email: 'support@example.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: process.env.NODE_ENV === 'production' 
        ? 'https://your-api-domain.com' 
        : `http://localhost:${process.env.PORT || 3000}`,
      description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      // Success Response Schema
      SuccessResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          data: {
            type: 'object',
            description: 'Response data'
          },
          message: {
            type: 'string',
            example: 'Operation successful'
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-01T00:00:00.000Z'
          }
        }
      },
      
      // Error Response Schema
      ErrorResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false
          },
          error: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                example: 'VALIDATION_ERROR'
              },
              message: {
                type: 'string',
                example: 'Invalid input provided'
              },
              details: {
                type: 'object',
                description: 'Additional error details'
              }
            }
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-01T00:00:00.000Z'
          }
        }
      },
      
      // Health Response Schema
      HealthResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          data: {
            type: 'object',
            properties: {
              status: {
                type: 'string',
                example: 'OK'
              },
              timestamp: {
                type: 'string',
                format: 'date-time'
              },
              uptime: {
                type: 'number',
                description: 'Server uptime in seconds'
              },
              environment: {
                type: 'string',
                example: 'development'
              }
            }
          },
          message: {
            type: 'string',
            example: 'Service is healthy'
          }
        }
      },
      
      // User Schema
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'User ID'
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com'
          },
          firstName: {
            type: 'string',
            example: 'John'
          },
          lastName: {
            type: 'string',
            example: 'Doe'
          },
          isActive: {
            type: 'boolean',
            example: true
          },
          createdAt: {
            type: 'string',
            format: 'date-time'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time'
          }
        }
      },
      
      // Auth Response Schema
      AuthResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          data: {
            type: 'object',
            properties: {
              user: {
                $ref: '#/components/schemas/User'
              },
              tokens: {
                type: 'object',
                properties: {
                  accessToken: {
                    type: 'string',
                    description: 'JWT access token'
                  },
                  refreshToken: {
                    type: 'string',
                    description: 'JWT refresh token'
                  },
                  expiresIn: {
                    type: 'number',
                    description: 'Token expiration time in seconds'
                  }
                }
              }
            }
          },
          message: {
            type: 'string',
            example: 'Authentication successful'
          }
        }
      },
      
      // Profile Response Schema
      ProfileResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          data: {
            type: 'object',
            properties: {
              user: {
                $ref: '#/components/schemas/User'
              }
            }
          },
          message: {
            type: 'string',
            example: 'Profile retrieved successfully'
          }
        }
      }
    },
    
    responses: {
      NotFound: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            },
            example: {
              success: false,
              error: {
                code: 'NOT_FOUND',
                message: 'Resource not found'
              },
              timestamp: '2024-01-01T00:00:00.000Z'
            }
          }
        }
      },
      
      Unauthorized: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            },
            example: {
              success: false,
              error: {
                code: 'UNAUTHORIZED',
                message: 'Authentication required'
              },
              timestamp: '2024-01-01T00:00:00.000Z'
            }
          }
        }
      },
      
      ValidationError: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            },
            example: {
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid input provided',
                details: {
                  field: 'email',
                  issue: 'Invalid email format'
                }
              },
              timestamp: '2024-01-01T00:00:00.000Z'
            }
          }
        }
      },
      
      RateLimitExceeded: {
        description: 'Rate limit exceeded',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            },
            example: {
              success: false,
              error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Too many requests from this IP, please try again later.'
              },
              timestamp: '2024-01-01T00:00:00.000Z'
            }
          }
        }
      }
    }
  },
  
  tags: [
    {
      name: 'Health',
      description: 'Health check endpoints'
    },
    {
      name: 'Authentication',
      description: 'User authentication endpoints'
    }
  ]
};

// Options for the swagger docs
const options = {
  definition: swaggerDefinition,
  // Path to the API files
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
    './dist/routes/*.js',
    './dist/controllers/*.js'
  ]
};

// Initialize swagger-jsdoc
const specs = swaggerJsdoc(options);

// Swagger UI options
const swaggerUiOptions = {
  explorer: true,
  swaggerOptions: {
    docExpansion: 'none',
    filter: true,
    showRequestDuration: true,
    tryItOutEnabled: true,
    displayOperationId: false,
    displayRequestDuration: true
  },
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #3b82f6; }
    .swagger-ui .scheme-container { background: #f8fafc; border: 1px solid #e2e8f0; }
  `
};

/**
 * Setup Swagger documentation for Express app
 * @param app Express application instance
 */
export const setupSwagger = (app: Application): void => {
  // Swagger JSON endpoint
  app.get('/docs/json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
  
  // Swagger UI
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerUiOptions));
  
  console.log(`📚 Swagger UI available at: http://localhost:${process.env.PORT || 3000}/docs`);
  console.log(`📄 Swagger JSON available at: http://localhost:${process.env.PORT || 3000}/docs/json`);
};

export { specs }; 