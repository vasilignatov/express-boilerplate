# Express JavaScript API Boilerplate

Production-ready Express.js API built with modern JavaScript (ES Modules), featuring enterprise-grade security, structured logging, error handling, and best practices.

## 🚀 Features

### Core Framework
- **Express.js** - Fast, unopinionated web framework
- **ES Modules** - Modern JavaScript module system
- **ES2020+ Features** - Latest JavaScript capabilities
- **Nodemon** - Hot reload for development

### Security & Performance
- **Helmet.js** - Security headers (XSS, CSRF, etc.)
- **CORS** - Configurable cross-origin resource sharing
- **Rate Limiting** - IP-based request limiting
- **Input Validation** - Joi schema validation
- **Compression** - gzip response compression
- **Request Size Limits** - Body parser protection

### Development Experience
- **Hot Reload** - Nodemon for development
- **Structured Logging** - Pino logger with pretty formatting
- **Error Handling** - Centralized error management
- **Health Checks** - Built-in service monitoring
- **ESLint & Prettier** - Code quality and formatting
- **Jest Testing** - Comprehensive testing setup

### Architecture
- **Modular Structure** - Clean separation of concerns
- **Service Layer** - Business logic abstraction  
- **Middleware Pipeline** - Request/response processing
- **Environment Config** - Validated environment variables
- **Clean Code** - JSDoc documentation

## 📁 Project Structure

```
src/
├── config/           # Configuration files
│   └── env.js       # Environment validation
├── controllers/      # Route handlers (thin layer)
│   └── healthController.js
├── middleware/       # Express middleware
│   ├── errorHandler.js    # Global error handling
│   ├── requestLogger.js   # Request/response logging
│   └── security.js        # Security middleware
├── routes/          # Route definitions
│   └── index.js     # Main router
├── services/        # Business logic
│   └── logger.js    # Logging service
├── utils/           # Helper functions
└── index.js         # Application entry point
```

## 🛠️ Installation

### Prerequisites
- Node.js >= 18.0.0
- npm >= 8.0.0

### Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Development**
   ```bash
   npm run dev
   ```

4. **Production**
   ```bash
   npm start
   ```

## ⚙️ Environment Variables

Create a `.env` file in the root directory:

```bash
# Application
NODE_ENV=development
PORT=3000
API_PREFIX=/api

# Logging
LOG_LEVEL=info

# Security
CORS_ORIGIN=http://localhost:3000
JWT_ACCESS_SECRET=your_super_secret_key_here_min_32_characters
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here_min_32_characters
BCRYPT_SALT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000      # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100      # Max requests per window
```

## 🚀 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm start` | Start production server |
| `npm test` | Run test suite |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Generate test coverage report |
| `npm run lint` | Check code with ESLint |
| `npm run lint:fix` | Fix ESLint issues |
| `npm run format` | Format code with Prettier |

## 🏗️ Architecture

### Request Flow
```
Client Request
    ↓
Security Middleware (CORS, Helmet, Rate Limiting)
    ↓
Request Logging
    ↓
Body Parsing & Validation
    ↓
Route Handler
    ↓
Controller (thin layer)
    ↓
Service (business logic)
    ↓
Response Formatting
    ↓
Error Handling (if needed)
    ↓
Client Response
```

### Error Handling
- **Global Error Middleware** - Catches all errors
- **Structured Error Responses** - Consistent error format
- **Error Classification** - Different error types
- **Security** - No internal details exposed
- **Logging** - All errors logged with context

### Response Format

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input provided"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🛡️ Security Features

### Built-in Security
- **Helmet.js** - Sets various HTTP headers
- **CORS** - Configurable origin restrictions
- **Rate Limiting** - Prevents abuse and DDoS
- **Input Validation** - Joi schema validation
- **XSS Protection** - Input sanitization
- **Size Limits** - Request body size limits

### Security Headers
- Content Security Policy (CSP)
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Strict-Transport-Security
- Referrer-Policy

### Best Practices
- No sensitive data in logs
- Environment variable validation
- Graceful error handling
- Process signal handling
- Structured logging

## 📊 Logging

### Log Levels
- `fatal` - Application crashes
- `error` - Error conditions
- `warn` - Warning conditions  
- `info` - Informational messages
- `debug` - Debug information
- `trace` - Very detailed debug info

### Log Format
```json
{
  "level": "info",
  "time": "2024-01-01T00:00:00.000Z",
  "msg": "Server started successfully",
  "port": 3000,
  "environment": "development"
}
```

## 🧪 Testing

### Test Structure
```
tests/
├── unit/            # Unit tests
├── integration/     # Integration tests
├── fixtures/        # Test data
└── helpers/         # Test utilities
```

### Running Tests
```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## 📮 API Testing with Postman

### Available Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Basic health check |
| GET | `/api/health` | API health check |
| GET | `/api/health/detailed` | Detailed system health |
| GET | `/api/health/ready` | Kubernetes readiness probe |
| GET | `/api/health/live` | Kubernetes liveness probe |
| GET | `/api/status` | API status information |
| GET | `/api/version` | Version and build info |

### Postman Collection Setup

#### 1. Base Configuration
- **Base URL**: `http://localhost:3000`
- **Environment Variable**: `{{baseUrl}}` = `http://localhost:3000`

#### 2. Test Examples

**Basic Health Check**
```
GET {{baseUrl}}/health
```

**API Status**
```
GET {{baseUrl}}/api/status
```

**Detailed Health Check**
```
GET {{baseUrl}}/api/health/detailed
```

## 🚀 Deployment

### Production Build
```bash
npm start
```

### Environment Setup
- Set `NODE_ENV=production`
- Configure proper CORS origins
- Set secure JWT secrets
- Configure logging level
- Set up process manager (PM2)

### Health Checks
The application includes multiple health check endpoints:

```bash
curl http://localhost:3000/health
curl http://localhost:3000/api/health/detailed
curl http://localhost:3000/api/health/ready
curl http://localhost:3000/api/health/live
```

## 🔧 JavaScript ES Modules

### Import/Export Syntax
```javascript
// Named exports
export const userService = { ... };
export { UserController };

// Default exports
export default class UserService { ... }

// Imports
import express from 'express';
import { logger } from './services/logger.js';
import { UserController } from './controllers/UserController.js';
```

### File Extensions
- All imports must include `.js` extension
- Uses `"type": "module"` in package.json
- Modern ES2020+ features supported

## 📦 Dependencies

### Core Dependencies
- **express** - Web framework
- **helmet** - Security middleware
- **cors** - CORS middleware
- **compression** - Response compression
- **express-rate-limit** - Rate limiting
- **joi** - Schema validation
- **pino** - High-performance logging
- **dotenv** - Environment variables

### Development Dependencies
- **nodemon** - Development server with hot reload
- **eslint** - Code linting
- **prettier** - Code formatting
- **jest** - Testing framework

## 🔄 Migration from TypeScript

If you're migrating from the TypeScript version:

1. **Remove TypeScript files**:
   - Delete `tsconfig.json`
   - Remove `@types/*` dependencies
   - Remove TypeScript-specific scripts

2. **Update imports**:
   - Add `.js` extensions to all imports
   - Remove type imports

3. **Update package.json**:
   - Add `"type": "module"`
   - Replace `ts-node-dev` with `nodemon`
   - Update scripts

4. **Convert files**:
   - Rename `.ts` files to `.js`
   - Remove type annotations
   - Keep JSDoc comments for documentation

## 🤝 Contributing

1. Follow the existing code style
2. Add tests for new features
3. Update documentation
4. Ensure all tests pass
5. Follow commit message conventions

## 📝 License

MIT License - see LICENSE file for details 