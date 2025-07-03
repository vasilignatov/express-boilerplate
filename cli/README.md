# Express Boilerplate Generator

🚀 **Universal CLI generator for production-ready Express.js projects**

Create modern, scalable Express.js applications with TypeScript/JavaScript, databases, authentication, and more in seconds!

## ✨ Features

- **🔧 Language Choice**: TypeScript (recommended) or JavaScript
- **🗄️ Database Support**: MongoDB (mongoose) or PostgreSQL (sequelize)
- **🔐 JWT Authentication**: Complete auth system with refresh tokens
- **📚 API Documentation**: Swagger/OpenAPI 3.0 integration
- **🐳 Docker Ready**: Full containerization support
- **🛡️ Security**: Built-in security middleware and best practices
- **📝 Structured Logging**: Pino logger with request tracking
- **🔧 Error Handling**: Comprehensive error handling system
- **⚡ Performance**: Optimized for production workloads

## 🚀 Quick Start

```bash
# Create new project
npx create-boilerplate-express

# Or install globally
npm install -g create-boilerplate-express
create-boilerplate-express
```

## 🛠️ Interactive Setup

The CLI will guide you through:

1. **📁 Project Name**: Choose your project name
2. **💻 Language**: TypeScript or JavaScript
3. **🗄️ Database**: MongoDB, PostgreSQL, or none
4. **🔐 Authentication**: JWT auth system (if database selected)
5. **📚 Documentation**: Swagger/OpenAPI integration
6. **🐳 Docker**: Container configuration

## 📦 Generated Project Structure

```
your-project/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Route handlers
│   ├── middleware/      # Express middleware
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Helper functions
│   └── types/           # TypeScript definitions
├── .env.example         # Environment variables template
├── docker-compose.yml   # Docker configuration
├── README.md           # Project documentation
└── package.json        # Dependencies
```

## 🔧 Available Templates

### Base Templates
- **TypeScript**: Modern ES modules with full typing
- **JavaScript**: ES6+ with best practices

### Database Templates
- **MongoDB**: Mongoose ODM with schemas
- **PostgreSQL**: Sequelize ORM with migrations

### Authentication Templates
- **JWT System**: Login, register, refresh tokens
- **User Management**: Role-based access control
- **Security**: Password hashing, token validation

### Additional Features
- **Swagger**: Auto-generated API documentation
- **Docker**: Multi-stage builds, docker-compose
- **Security**: Helmet, rate limiting, CORS
- **Logging**: Structured logging with Pino

## 🌐 API Endpoints

### Health Check
- `GET /health` - Basic health check
- `GET /api/health/detailed` - Detailed system info

### Authentication (if enabled)
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `GET /api/auth/sessions` - Get active sessions
- `DELETE /api/auth/sessions/:id` - Revoke session

## 🔒 Security Features

- **Helmet**: Security headers
- **Rate Limiting**: DDoS protection
- **CORS**: Cross-origin resource sharing
- **Input Validation**: Joi schema validation
- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Access + refresh token system
- **Error Handling**: No sensitive data exposure

## 🐳 Docker Support

Generated projects include:
- `Dockerfile` - Multi-stage production build
- `docker-compose.yml` - Full development environment
- Health checks and proper signal handling

```bash
# Development
docker-compose up -d

# Production
docker build -t your-app .
docker run -p 3000:3000 your-app
```

## 📄 Environment Variables

The generator creates `.env.example` with all required variables:

```env
# Application
NODE_ENV=development
PORT=3000
API_PREFIX=/api

# Database (MongoDB)
MONGODB_URI=mongodb://localhost:27017/your-app

# Database (PostgreSQL)  
DATABASE_URL=postgresql://user:password@localhost:5432/your-app

# JWT Authentication
JWT_ACCESS_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Security
BCRYPT_SALT_ROUNDS=12
CORS_ORIGIN=http://localhost:3000
```

## 📝 Generated Scripts

```bash
npm run dev         # Development server with hot reload
npm start          # Production server
npm run build      # Build TypeScript (if using TS)
npm test           # Run tests
npm run lint       # ESLint
npm run lint:fix   # Fix linting issues
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Express.js team for the amazing framework
- All contributors who help improve this generator
- Open source community for inspiration and feedback

## 📞 Support

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/vasilignatov/express-boilerplate/issues)
- 💬 **Questions**: [GitHub Discussions](https://github.com/vasilignatov/express-boilerplate/discussions)
- 📖 **Documentation**: [Project Wiki](https://github.com/vasilignatov/express-boilerplate/wiki)

---

**Made with ❤️ by [Vasil Ignatov](https://github.com/vasilignatov)**

*Generate production-ready Express.js applications in seconds!* 