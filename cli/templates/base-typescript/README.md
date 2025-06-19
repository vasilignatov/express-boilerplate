# Express TypeScript API Boilerplate

Production-ready Express.js API built with TypeScript, featuring enterprise-grade security, structured logging, error handling, and best practices.

## 🚀 Features

### Core Framework
- **Express.js** - Fast, unopinionated web framework
- **TypeScript** - Static type checking with strict configuration
- **ES2020 Target** - Modern JavaScript features
- **Path Aliases** - Clean imports with `@/` prefixes

### Security & Performance
- **Helmet.js** - Security headers (XSS, CSRF, etc.)
- **CORS** - Configurable cross-origin resource sharing
- **Rate Limiting** - IP-based request limiting
- **Input Validation** - Joi schema validation
- **Compression** - gzip response compression
- **Request Size Limits** - Body parser protection

### Development Experience
- **Hot Reload** - ts-node-dev for development
- **Structured Logging** - Pino logger with pretty formatting
- **Error Handling** - Centralized error management
- **Health Checks** - Built-in service monitoring
- **ESLint & Prettier** - Code quality and formatting
- **Jest Testing** - Comprehensive testing setup

### Architecture
- **Modular Structure** - Clean separation of concerns
- **Service Layer** - Business logic abstraction  
- **Middleware Pipeline** - Request/response processing
- **Type Safety** - Full TypeScript coverage
- **Environment Config** - Validated environment variables

## 📁 Project Structure

```
src/
├── config/           # Configuration files
│   └── env.ts       # Environment validation
├── controllers/      # Route handlers (thin layer)
│   └── healthController.ts
├── middleware/       # Express middleware
│   ├── errorHandler.ts    # Global error handling
│   ├── requestLogger.ts   # Request/response logging
│   └── security.ts        # Security middleware
├── routes/          # Route definitions
│   └── index.ts     # Main router
├── services/        # Business logic
│   └── logger.ts    # Logging service
├── types/           # TypeScript definitions
├── utils/           # Helper functions
└── index.ts         # Application entry point
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
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Development**
   ```bash
   npm run dev
   ```

4. **Production build**
   ```bash
   npm run build
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
JWT_SECRET=your_super_secret_key_here
BCRYPT_SALT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000      # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100      # Max requests per window
```

## 🚀 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
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

The base TypeScript template includes several built-in endpoints for testing:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Basic health check |
| GET | `/api/health` | API health check |
| GET | `/api/health/detailed` | Detailed system health |
| GET | `/api/status` | API status information |
| GET | `/api/version` | Version and build info |

### Postman Collection Setup

#### 1. Base Configuration
- **Base URL**: `http://localhost:3000`
- **Environment Variable**: `{{baseUrl}}` = `http://localhost:3000`

#### 2. Test Scenarios

**Basic Health Check**
```
GET {{baseUrl}}/health
```
Expected Response:
```json
{
  "success": true,
  "data": {
    "status": "OK",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "uptime": 123.456,
    "environment": "development"
  },
  "message": "Service is healthy"
}
```

**API Health Check**
```
GET {{baseUrl}}/api/health
```

**Detailed Health Check**
```
GET {{baseUrl}}/api/health/detailed
```
Expected Response:
```json
{
  "success": true,
  "data": {
    "status": "OK",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "uptime": 123.456,
    "environment": "development",
    "version": "1.0.0",
    "system": {
      "platform": "win32",
      "architecture": "x64",
      "nodeVersion": "v18.17.0",
      "pid": 12345
    },
    "memory": {
      "rss": "45 MB",
      "heapTotal": "20 MB",
      "heapUsed": "15 MB",
      "external": "2 MB"
    },
    "cpu": {
      "user": 123456,
      "system": 78910
    }
  },
  "message": "Service is ok"
}
```

**API Status**
```
GET {{baseUrl}}/api/status
```
Expected Response:
```json
{
  "success": true,
  "data": {
    "api": "Express TypeScript Boilerplate",
    "version": "1.0.0",
    "environment": "development",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "uptime": 123.456
  },
  "message": "API is running"
}
```

**Version Information**
```
GET {{baseUrl}}/api/version
```
Expected Response:
```json
{
  "success": true,
  "data": {
    "version": "1.0.0",
    "buildDate": "2024-01-01T00:00:00.000Z",
    "nodeVersion": "v18.17.0",
    "platform": "win32",
    "architecture": "x64"
  },
  "message": "Version information"
}
```

#### 3. Testing Rate Limiting

**Rate Limit Test**
```
GET {{baseUrl}}/api/health
```
- Send 100+ requests rapidly
- Expected: 429 status after limit exceeded
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests from this IP, please try again later."
  }
}
```

#### 4. Testing Error Handling

**404 Not Found**
```
GET {{baseUrl}}/api/nonexistent
```
Expected Response:
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Route /api/nonexistent not found"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### 5. Security Headers Testing

Check that security headers are present in all responses:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 0`
- `Strict-Transport-Security`
- `Content-Security-Policy`

### Postman Pre-request Scripts

**Environment Setup Script:**
```javascript
// Set base URL if not already set
if (!pm.environment.get("baseUrl")) {
    pm.environment.set("baseUrl", "http://localhost:3000");
}

// Set timestamp for requests
pm.environment.set("timestamp", new Date().toISOString());
```

**Authentication Setup (for future auth endpoints):**
```javascript
// If you add JWT authentication later
const token = pm.environment.get("accessToken");
if (token) {
    pm.request.headers.add({
        key: "Authorization",
        value: `Bearer ${token}`
    });
}
```

### Postman Tests Scripts

**Basic Response Validation:**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has success field", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('success');
    pm.expect(jsonData.success).to.be.true;
});

pm.test("Response has timestamp", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('timestamp');
});

pm.test("Response time is less than 200ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(200);
});
```

**Security Headers Test:**
```javascript
pm.test("Security headers are present", function () {
    pm.expect(pm.response.headers.get("X-Content-Type-Options")).to.eql("nosniff");
    pm.expect(pm.response.headers.get("X-Frame-Options")).to.exist;
    pm.expect(pm.response.headers.get("X-XSS-Protection")).to.exist;
});
```

**Health Check Specific Test:**
```javascript
pm.test("Health check returns OK status", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.data.status).to.eql("OK");
    pm.expect(jsonData.data.uptime).to.be.a('number');
    pm.expect(jsonData.data.environment).to.exist;
});
```

### Performance Testing

**Load Testing with Postman Runner:**
1. Create a collection with health check requests
2. Use Collection Runner
3. Set iterations: 100-1000
4. Set delay: 10ms
5. Monitor response times and success rates

### Monitoring Dashboard

Create a Postman Monitor to:
- Run health checks every 5 minutes
- Alert on failures or slow responses
- Track API availability over time
- Monitor response time trends

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Setup
- Set `NODE_ENV=production`
- Configure proper CORS origins
- Set secure JWT secrets
- Configure logging level
- Set up process manager (PM2)

### Health Checks
The application includes a health check endpoint at `/health`:

```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "success": true,
  "data": {
    "status": "OK",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "uptime": 123.456,
    "environment": "production"
  },
  "message": "Service is healthy"
}
```

## 🔧 TypeScript Configuration

### Strict Mode
- `strict: true` - All strict checks enabled
- `noUnusedLocals: true` - No unused variables
- `noUnusedParameters: true` - No unused parameters
- `noImplicitReturns: true` - All paths return values
- `exactOptionalPropertyTypes: true` - Exact optional types

### Path Aliases
```typescript
import { logger } from '@/services/logger';
import { healthController } from '@/controllers/healthController';
import { validateEnv } from '@/config/env';
```

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
- **typescript** - TypeScript compiler
- **ts-node-dev** - Development server
- **eslint** - Code linting
- **prettier** - Code formatting
- **jest** - Testing framework
- **@types/** - TypeScript definitions

## 🤝 Contributing

1. Follow the existing code style
2. Add tests for new features
3. Update documentation
4. Ensure all tests pass
5. Follow commit message conventions

## 📝 License

MIT License - see LICENSE file for details 