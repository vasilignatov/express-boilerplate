#!/usr/bin/env node

import inquirer from "inquirer";
import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import ora from "ora";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class ExpressBoilerplateGenerator {
  constructor() {
    this.templatePath = path.join(__dirname, "templates");
    this.answers = {};
  }

  async run() {
    console.log(chalk.blue.bold("\n🚀 Express Boilerplate Generator v2.0\n"));
    console.log(
      chalk.gray("Create a production-ready Express project in seconds!\n")
    );

    await this.promptUser();
    await this.generateProject();
  }

  async promptUser() {
    this.answers = await inquirer.prompt([
      {
        type: "input",
        name: "projectName",
        message: "📁 Project name:",
        default: "my-express-app",
        validate: (input) => {
          if (input.trim().length === 0) {
            return "Please enter a project name";
          }
          if (!/^[a-zA-Z0-9-_]+$/.test(input)) {
            return "The name can only contain letters, numbers, - and _";
          }
          return true;
        },
      },
      {
        type: "list",
        name: "language",
        message: "💻 Choose language:",
        choices: [
          { name: "TypeScript (recommended)", value: "typescript" },
          { name: "JavaScript", value: "javascript" },
        ],
        default: "typescript",
      },
      {
        type: "list",
        name: "database",
        message: "🗄️ Database:",
        choices: [
          { name: "MongoDB (mongoose)", value: "mongodb" },
          { name: "PostgreSQL (sequelize)", value: "postgresql" },
          { name: "None", value: "none" },
        ],
        default: "mongodb",
      },
      {
        type: "confirm",
        name: "auth",
        message: "🔐 Built-in JWT authentication?",
        default: true,
        when: (answers) => answers.database !== "none",
      },
      {
        type: "confirm",
        name: "swagger",
        message: "📚 Swagger documentation (OpenAPI 3)?",
        default: true,
      },
      {
        type: "confirm",
        name: "docker",
        message: "🐳 Docker configuration?",
        default: true,
      },
    ]);

    console.log(chalk.yellow("\n📋 Configuration overview:"));
    console.log(chalk.cyan(`   Project: ${this.answers.projectName}`));
    console.log(chalk.cyan(`   Language: ${this.answers.language}`));
    console.log(chalk.cyan(`   Database: ${this.answers.database}`));
    console.log(chalk.cyan(`   JWT Auth: ${this.answers.auth ? "Yes" : "No"}`));
    console.log(
      chalk.cyan(`   Swagger: ${this.answers.swagger ? "Yes" : "No"}`)
    );
    console.log(chalk.cyan(`   Docker: ${this.answers.docker ? "Yes" : "No"}`));
    console.log(chalk.cyan(`   Logger: Pino (always enabled)`));
    this.answers.logger = true;

    // Auth is false if no database is selected
    if (this.answers.database === "none") {
      this.answers.auth = false;
    }
    const { confirm } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirm",
        message: "Continue with this configuration?",
        default: true,
      },
    ]);

    if (!confirm) {
      console.log(chalk.red("Generation cancelled."));
      process.exit(0);
    }
  }

  async generateProject() {
    const { projectName } = this.answers;
    const targetDir = path.resolve(process.cwd(), projectName);

    // Check if directory exists
    if (await fs.pathExists(targetDir)) {
      console.log(chalk.red(`\n❌ Directory '${projectName}' already exists!`));
      process.exit(1);
    }

    const spinner = ora("Generating project...").start();

    try {
      // Create project directory
      await fs.ensureDir(targetDir);

      // Copy base template
      await this.copyBaseTemplate(targetDir);

      // Generate dynamic env validation file
      await this.generateEnvValidationFile(targetDir);

      // Generate package.json
      await this.generatePackageJson(targetDir);

      // Add database configuration
      await this.setupDatabase(targetDir);

      // Add authentication
      if (this.answers.auth) {
        await this.setupAuthentication(targetDir);
      }

      // Add Swagger
      if (this.answers.swagger) {
        await this.setupSwagger(targetDir);
      }

      // Add Docker
      if (this.answers.docker) {
        await this.setupDocker(targetDir);
      }

      // Generate .env file
      await this.generateEnvFile(targetDir);

      // Generate README
      await this.generateReadme(targetDir);

      spinner.succeed(chalk.green("Project created successfully!"));

      console.log(chalk.green.bold("\n✅ Done! Next steps:\n"));
      console.log(chalk.white(`   cd ${projectName}`));
      console.log(chalk.white(`   npm install`));
      console.log(chalk.white(`   npm run dev\n`));

      if (this.answers.swagger) {
        console.log(
          chalk.cyan("📚 Swagger documentation: http://localhost:3000/docs")
        );
      }
      if (this.answers.docker) {
        console.log(chalk.blue("🐳 Docker: docker-compose up -d"));
      }
      console.log();
    } catch (error) {
      spinner.fail("Error generating project");
      console.error(chalk.red(error.message));
      // Cleanup on error
      await fs.remove(targetDir).catch(() => {});
      process.exit(1);
    }
  }

  async copyBaseTemplate(targetDir) {
    const baseTemplate = path.join(
      this.templatePath,
      `base-${this.answers.language}`
    );
    await fs.copy(baseTemplate, targetDir);
  }

  async generatePackageJson(targetDir) {
    const packageJsonPath = path.join(targetDir, "package.json");
    const packageJson = await fs.readJson(packageJsonPath);

    // Update project name
    packageJson.name = this.answers.projectName;

    // Add database dependencies
    if (this.answers.database === "mongodb") {
      packageJson.dependencies.mongoose = "^8.0.0";
    } else if (this.answers.database === "postgresql") {
      packageJson.dependencies.sequelize = "^6.35.0";
      packageJson.dependencies.pg = "^8.11.0";
      packageJson.devDependencies["@types/pg"] = "^8.10.0";
    }

    // Add auth dependencies
    if (this.answers.auth) {
      packageJson.dependencies.jsonwebtoken = "^9.0.0";
      packageJson.dependencies.bcryptjs = "^2.4.3";
      if (this.answers.language === "typescript") {
        packageJson.devDependencies["@types/jsonwebtoken"] = "^9.0.0";
        packageJson.devDependencies["@types/bcryptjs"] = "^2.4.0";
      }
    }

    // Add swagger dependencies
    if (this.answers.swagger) {
      packageJson.dependencies["swagger-ui-express"] = "^5.0.0";
      packageJson.dependencies["swagger-jsdoc"] = "^6.2.0";
      if (this.answers.language === "typescript") {
        packageJson.devDependencies["@types/swagger-ui-express"] = "^4.1.0";
        packageJson.devDependencies["@types/swagger-jsdoc"] = "^6.0.0";
      }
    }

    await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
  }

  async setupDatabase(targetDir) {
    if (this.answers.database === "none") return;

    const dbTemplatePath = path.join(
      this.templatePath,
      "database",
      this.answers.database
    );
    const srcPath = path.join(targetDir, "src");

    // Copy database-specific files
    await fs.copy(dbTemplatePath, srcPath, {
      overwrite: true,
      filter: (src) => !src.includes("node_modules"),
    });
  }

  async setupAuthentication(targetDir) {
    const authTemplatePath = path.join(this.templatePath, "auth");
    const srcPath = path.join(targetDir, "src");

    // Copy shared auth types and interfaces
    const sharedAuthPath = path.join(authTemplatePath, "shared");
    await fs.copy(sharedAuthPath, srcPath, {
      overwrite: true,
      filter: (src) => !src.includes("node_modules"),
    });

    // Copy database-specific auth module
    let dbSpecificAuthPath;
    if (this.answers.database === "mongodb") {
      dbSpecificAuthPath = path.join(authTemplatePath, "mongoose");
    } else if (this.answers.database === "postgresql") {
      dbSpecificAuthPath = path.join(authTemplatePath, "sequelize");
    }

    if (dbSpecificAuthPath) {
      await fs.copy(dbSpecificAuthPath, srcPath, {
        overwrite: true,
        filter: (src) => !src.includes("node_modules"),
      });
    }
  }

  async setupSwagger(targetDir) {
    const swaggerTemplatePath = path.join(this.templatePath, "swagger");
    const srcPath = path.join(targetDir, "src");

    // Copy swagger configuration
    await fs.copy(swaggerTemplatePath, srcPath, {
      overwrite: true,
      filter: (src) => !src.includes("node_modules"),
    });
  }

  async setupDocker(targetDir) {
    const dockerTemplatePath = path.join(this.templatePath, "docker");

    // Copy Docker files to project root
    await fs.copy(dockerTemplatePath, targetDir, {
      overwrite: true,
      filter: (src) => !src.includes("node_modules"),
    });
  }

  async generateEnvFile(targetDir) {
    const envContent = this.generateEnvContent();
    await fs.writeFile(path.join(targetDir, ".env.example"), envContent);
  }

  generateEnvContent() {
    let envContent = `# Application
NODE_ENV=development
PORT=3000
API_PREFIX=/api

# Logging
LOG_LEVEL=info

# Security
CORS_ORIGIN=http://localhost:3000
BCRYPT_SALT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

`;

    if (this.answers.auth) {
      envContent += `# JWT Authentication
JWT_ACCESS_SECRET=your_super_secret_access_key_here_change_in_production
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here_change_in_production
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

`;
    }

    if (this.answers.database === "mongodb") {
      envContent += `# MongoDB
MONGODB_URI=mongodb://localhost:27017/${this.answers.projectName}
MONGODB_TEST_URI=mongodb://localhost:27017/${this.answers.projectName}_test

`;
    } else if (this.answers.database === "postgresql") {
      envContent += `# PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/${this.answers.projectName}
DATABASE_TEST_URL=postgresql://user:password@localhost:5432/${this.answers.projectName}_test

`;
    }

    return envContent;
  }

  async generateReadme(targetDir) {
    const readmeContent = this.generateReadmeContent();
    await fs.writeFile(path.join(targetDir, "README.md"), readmeContent);
  }

  generateReadmeContent() {
    const features = [];
    if (this.answers.database !== "none")
      features.push(`${this.answers.database.toUpperCase()} database`);
    if (this.answers.auth) features.push("JWT Authentication");
    if (this.answers.swagger) features.push("Swagger/OpenAPI Documentation");
    if (this.answers.docker) features.push("Docker Support");
    features.push(
      "Security Middleware",
      "Structured Logging",
      "Error Handling"
    );

    return `# ${this.answers.projectName}

Production-ready Express.js application generated with **Express Boilerplate Generator**.

## 🚀 Features

${features.map((f) => `- ✅ ${f}`).join("\n")}

## 🛠️ Installation

\`\`\`bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env file with your configuration
# vim .env

# Start development server
npm run dev
\`\`\`

## 📋 Available Scripts

- \`npm run dev\` - Start development server with hot reload
- \`npm start\` - Start production server
- \`npm run build\` - Build TypeScript (if using TS)
- \`npm test\` - Run tests
- \`npm run test:watch\` - Run tests in watch mode
- \`npm run lint\` - Run ESLint
- \`npm run lint:fix\` - Fix ESLint issues

## 🏗️ Project Structure

\`\`\`
src/
├── controllers/     # Route handlers
├── services/        # Business logic
├── middleware/      # Express middleware
├── models/          # Database models${
      this.answers.database !== "none" ? "" : " (if using database)"
    }
├── routes/          # Route definitions
├── utils/           # Helper functions
├── config/          # Configuration files
${
  this.answers.language === "typescript"
    ? "└── types/          # TypeScript definitions"
    : ""
}
\`\`\`

## 🔧 Environment Variables

Copy \`.env.example\` to \`.env\` and configure:

${this.generateEnvDocumentation()}

## 🌐 API Endpoints

### Health Check
- \`GET /health\` - Basic health check
- \`GET /api/health/detailed\` - Detailed health information

${
  this.answers.auth
    ? `### Authentication
- \`POST /api/auth/login\` - User login
- \`POST /api/auth/register\` - User registration
- \`POST /api/auth/refresh\` - Refresh access token
- \`POST /api/auth/logout\` - User logout

`
    : ""
}${
      this.answers.swagger
        ? `## 📚 API Documentation

Swagger UI is available at: \`http://localhost:3000/docs\`

`
        : ""
    }${
      this.answers.docker
        ? `## 🐳 Docker

\`\`\`bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
\`\`\`

`
        : ""
    }## 🔒 Security Features

- **Helmet.js** - Security headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - Prevent abuse
- **Input Validation** - Joi/Zod validation
- **XSS Protection** - Input sanitization
${
  this.answers.auth
    ? "- **JWT Authentication** - Secure token-based auth\n- **Password Hashing** - bcrypt with salt"
    : ""
}

## 📊 Logging

Structured logging with Pino:
- Production: JSON format
- Development: Pretty format
- Log levels: error, warn, info, debug

## 🚀 Deployment

### Environment Setup
1. Set \`NODE_ENV=production\`
2. Configure database connection
3. Set secure JWT secrets
4. Configure CORS origins

### PM2 (Process Manager)
\`\`\`bash
npm install -g pm2
pm2 start ecosystem.config.js
\`\`\`

### Docker
Use the included Dockerfile and docker-compose.yml for containerized deployment.

## 🧪 Testing

\`\`\`bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- auth.test.js
\`\`\`

## 📝 License

MIT License - see LICENSE file for details.

---

Generated with ❤️ by **Express Boilerplate Generator v2.0**
`;
  }

  generateEnvDocumentation() {
    let docs = `- \`NODE_ENV\` - Environment (development/production)
- \`PORT\` - Server port (default: 3000)
- \`API_PREFIX\` - API prefix (default: /api)
- \`LOG_LEVEL\` - Logging level (error/warn/info/debug)
- \`CORS_ORIGIN\` - Allowed CORS origins
- \`RATE_LIMIT_WINDOW_MS\` - Rate limit window
- \`RATE_LIMIT_MAX_REQUESTS\` - Max requests per window`;

    if (this.answers.auth) {
      docs += `
- \`JWT_ACCESS_SECRET\` - JWT access token secret
- \`JWT_REFRESH_SECRET\` - JWT refresh token secret
- \`JWT_ACCESS_EXPIRES_IN\` - Access token expiration
- \`JWT_REFRESH_EXPIRES_IN\` - Refresh token expiration
- \`BCRYPT_SALT_ROUNDS\` - Password hashing rounds`;
    }

    if (this.answers.database === "mongodb") {
      docs += `
- \`MONGODB_URI\` - MongoDB connection string
- \`MONGODB_TEST_URI\` - MongoDB test database`;
    } else if (this.answers.database === "postgresql") {
      docs += `
- \`DATABASE_URL\` - PostgreSQL connection string
- \`DATABASE_TEST_URL\` - PostgreSQL test database`;
    }

    return docs;
  }

  async generateEnvValidationFile(targetDir) {
    const fileExtension = this.answers.language === "typescript" ? "ts" : "js";
    const envFilePath = path.join(
      targetDir,
      "src",
      "config",
      `env.${fileExtension}`
    );

    const envFileContent = this.generateEnvValidationContent();
    await fs.writeFile(envFilePath, envFileContent);
  }

  generateEnvValidationContent() {
    const isTypeScript = this.answers.language === "typescript";
    const importExt = isTypeScript ? "" : ".js";

    let content = `${isTypeScript ? "" : ""}import Joi from 'joi';
import { logger } from '../services/logger${importExt}';

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
  
  RATE_LIMIT_WINDOW_MS: Joi.number()
    .integer()
    .min(1000)
    .default(900000), // 15 minutes
  
  RATE_LIMIT_MAX_REQUESTS: Joi.number()
    .integer()
    .min(1)
    .default(100),
  
  BCRYPT_SALT_ROUNDS: Joi.number()
    .integer()
    .min(10)
    .max(15)
    .default(12)`;

    // Add JWT validation if auth is enabled
    if (this.answers.auth) {
      content += `,
  
  JWT_ACCESS_SECRET: Joi.string()
    .min(32)
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.required(),
      otherwise: Joi.string().default('development_access_secret_key_min_32_chars')
    }),
  
  JWT_REFRESH_SECRET: Joi.string()
    .min(32)
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.required(),
      otherwise: Joi.string().default('development_refresh_secret_key_min_32_chars')
    }),
  
  JWT_ACCESS_EXPIRES_IN: Joi.string()
    .default('15m'),
  
  JWT_REFRESH_EXPIRES_IN: Joi.string()
    .default('7d')`;
    }

    // Add database validation if database is enabled
    if (this.answers.database === "mongodb") {
      content += `,
  
  MONGODB_URI: Joi.string()
    .uri()
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
  
  MONGODB_TEST_URI: Joi.string()
    .uri()
    .optional()`;
    } else if (this.answers.database === "postgresql") {
      content += `,
  
  DATABASE_URL: Joi.string()
    .uri()
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
  
  DATABASE_TEST_URL: Joi.string()
    .uri()
    .optional()`;
    }

    content += `
}).unknown(true); // Allow other environment variables

`;

    // Add TypeScript interface if needed
    if (isTypeScript) {
      content += `/**
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
  BCRYPT_SALT_ROUNDS: number;`;

      if (this.answers.auth) {
        content += `
  JWT_ACCESS_SECRET?: string;
  JWT_REFRESH_SECRET?: string;
  JWT_ACCESS_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;`;
      }

      if (this.answers.database === "mongodb") {
        content += `
  MONGODB_URI?: string;
  MONGODB_TEST_URI?: string;`;
      } else if (this.answers.database === "postgresql") {
        content += `
  DATABASE_URL?: string;
  DATABASE_TEST_URL?: string;`;
      }

      content += `
}

`;
    }

    // Add validation function
    content += `/**
 * Validate environment variables
 * ${
   isTypeScript
     ? "@throws {Error} If validation fails"
     : "@throws {Error} If validation fails"
 }
 */
export const validateEnv = ()${isTypeScript ? ": EnvConfig" : ""} => {
  const { error, value } = envSchema.validate(process.env, {
    allowUnknown: true,
    stripUnknown: false,
    abortEarly: false
  });

  if (error) {
    const errorMessage = error.details
      .map(detail => \`\${detail.path.join('.')}: \${detail.message}\`)
      .join(', ');
    
    logger.fatal({
      error: errorMessage,
      details: error.details
    }, 'Environment validation failed');
    
    throw new Error(\`Environment validation failed: \${errorMessage}\`);
  }

  // Log basic configuration
  logger.info({
    nodeEnv: value.NODE_ENV,
    port: value.PORT,
    logLevel: value.LOG_LEVEL,
    apiPrefix: value.API_PREFIX
  }, 'Environment variables validated successfully');

  return value${isTypeScript ? " as EnvConfig" : ""};
};

/**
 * Check if we're in development mode
 */
export const isDevelopment = ()${isTypeScript ? ": boolean" : ""} => {
  return process.env.NODE_ENV === 'development';
};

/**
 * Check if we're in production mode
 */
export const isProduction = ()${isTypeScript ? ": boolean" : ""} => {
  return process.env.NODE_ENV === 'production';
};

/**
 * Check if we're in test mode
 */
export const isTest = ()${isTypeScript ? ": boolean" : ""} => {
  return process.env.NODE_ENV === 'test';
};

/**
 * Get configuration for specific feature
 */
export const getConfig = () => {
  const env = validateEnv();
  
  return {
    app: {
      name: 'Express ${isTypeScript ? "TypeScript" : "JavaScript"} Boilerplate',
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
    }`;

    if (this.answers.auth) {
      content += `,
    
    auth: {
      accessSecret: env.JWT_ACCESS_SECRET,
      refreshSecret: env.JWT_REFRESH_SECRET,
      accessTokenExpiry: env.JWT_ACCESS_EXPIRES_IN,
      refreshTokenExpiry: env.JWT_REFRESH_EXPIRES_IN
    }`;
    }

    if (this.answers.database === "mongodb") {
      content += `,
    
    database: {
      mongodbUri: env.MONGODB_URI,
      mongodbTestUri: env.MONGODB_TEST_URI
    }`;
    } else if (this.answers.database === "postgresql") {
      content += `,
    
    database: {
      databaseUrl: env.DATABASE_URL,
      databaseTestUrl: env.DATABASE_TEST_URL
    }`;
    }

    content += `
  };
}; 
`;

    return content;
  }
}

// Run the generator
const generator = new ExpressBoilerplateGenerator();
generator.run().catch((error) => {
  console.error(chalk.red("Fatal error:"), error.message);
  process.exit(1);
});
