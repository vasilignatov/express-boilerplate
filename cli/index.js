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
    console.log(chalk.blue.bold("\n🚀 Express Boilerplate Generator v3.0\n"));
    console.log(chalk.gray("Create a production-ready Express project in seconds!\n"));

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
        }
      },
      {
        type: "list",
        name: "language",
        message: "💻 Choose language:",
        choices: [
          { name: "TypeScript (recommended)", value: "typescript" },
          { name: "JavaScript", value: "javascript" }
        ],
        default: "typescript"
      },
      {
        type: "list",
        name: "database",
        message: "🗄️ Database:",
        choices: [
          { name: "MongoDB (mongoose)", value: "mongodb" },
          { name: "PostgreSQL (sequelize)", value: "postgresql" },
          { name: "None", value: "none" }
        ],
        default: "mongodb"
      },
      {
        type: "confirm",
        name: "auth",
        message: "🔐 Built-in JWT authentication?",
        default: true
      },
      {
        type: "confirm",
        name: "swagger",
        message: "📚 Swagger documentation (OpenAPI 3)?",
        default: true
      },
      {
        type: "confirm",
        name: "docker",
        message: "🐳 Docker configuration?",
        default: true
      },
      {
        type: "confirm",
        name: "logger",
        message: "📋 Logging library (pino)?",
        default: true
      }
    ]);

    console.log(chalk.yellow("\n📋 Configuration overview:"));
    console.log(chalk.cyan(`   Project: ${this.answers.projectName}`));
    console.log(chalk.cyan(`   Language: ${this.answers.language}`));
    console.log(chalk.cyan(`   Database: ${this.answers.database}`));
    console.log(chalk.cyan(`   JWT Auth: ${this.answers.auth ? "Yes" : "No"}`));
    console.log(chalk.cyan(`   Swagger: ${this.answers.swagger ? "Yes" : "No"}`));
    console.log(chalk.cyan(`   Docker: ${this.answers.docker ? "Yes" : "No"}`));
    console.log(chalk.cyan(`   Logger: ${this.answers.logger}\n`));

    const { confirm } = await inquirer.prompt([{
      type: "confirm",
      name: "confirm",
      message: "Continue with this configuration?",
      default: true
    }]);

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
        console.log(chalk.cyan("📚 Swagger documentation: http://localhost:3000/docs"));
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
    const baseTemplate = path.join(this.templatePath, `base-${this.answers.language}`);
    await fs.copy(baseTemplate, targetDir);
  }

  async generatePackageJson(targetDir) {
    // This will be implemented to generate dynamic package.json
    // based on selected features
  }

  async setupDatabase(targetDir) {
    // Copy database-specific files and configurations
  }

  async setupAuthentication(targetDir) {
    // Copy JWT authentication files
  }

  async setupSwagger(targetDir) {
    // Copy Swagger configuration
  }

  async setupDocker(targetDir) {
    // Copy Docker configuration
  }

  async generateEnvFile(targetDir) {
    // Generate .env file based on configuration
  }

  async generateReadme(targetDir) {
    // Generate README with instructions
  }
}

// Run the generator
const generator = new ExpressBoilerplateGenerator();
generator.run().catch(error => {
  console.error(chalk.red("Fatal error:"), error.message);
  process.exit(1);
});
