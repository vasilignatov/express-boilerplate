import { Sequelize } from 'sequelize';
import { logger } from '../services/logger';

interface DatabaseConfig {
  url: string;
  options: any;
}

export class Database {
  private static instance: Database;
  private sequelize: Sequelize | null = null;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected && this.sequelize) {
      logger.warn('Database is already connected');
      return;
    }

    try {
      const config = this.getConfig();
      
      // Create Sequelize instance
      this.sequelize = new Sequelize(config.url, config.options);

      // Test connection
      await this.sequelize.authenticate();
      
      this.isConnected = true;
      logger.info({
        database: this.getDatabaseName(config.url),
        host: this.getHostFromUrl(config.url)
      }, 'PostgreSQL connected successfully');

      // Setup event listeners
      this.setupEventListeners();

    } catch (error) {
      logger.error({ error }, 'PostgreSQL connection failed');
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected || !this.sequelize) {
      logger.warn('Database is not connected');
      return;
    }

    try {
      await this.sequelize.close();
      this.sequelize = null;
      this.isConnected = false;
      logger.info('PostgreSQL disconnected successfully');
    } catch (error) {
      logger.error({ error }, 'Error disconnecting from PostgreSQL');
      throw error;
    }
  }

  public getSequelize(): Sequelize | null {
    return this.sequelize;
  }

  public isConnectionReady(): boolean {
    return this.isConnected && this.sequelize !== null;
  }

  public async syncDatabase(force: boolean = false): Promise<void> {
    if (!this.sequelize) {
      throw new Error('Database not connected');
    }

    try {
      await this.sequelize.sync({ force });
      logger.info({ force }, 'Database synchronized successfully');
    } catch (error) {
      logger.error({ error }, 'Database synchronization failed');
      throw error;
    }
  }

  private getConfig(): DatabaseConfig {
    const url = process.env.DATABASE_URL;
    
    if (!url) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    return {
      url,
      options: {
        // Connection pool settings
        pool: {
          max: parseInt(process.env.DB_POOL_MAX || '10'),
          min: parseInt(process.env.DB_POOL_MIN || '1'),
          acquire: parseInt(process.env.DB_POOL_ACQUIRE || '60000'),
          idle: parseInt(process.env.DB_POOL_IDLE || '10000')
        },

        // Logging
        logging: process.env.NODE_ENV === 'development' 
          ? (sql: string) => logger.debug({ sql }, 'SQL Query')
          : false,

        // Retry settings
        retry: {
          max: parseInt(process.env.DB_RETRY_MAX || '3')
        },

        // Timezone
        timezone: process.env.DB_TIMEZONE || '+00:00',

        // SSL settings for production
        dialectOptions: process.env.NODE_ENV === 'production' ? {
          ssl: {
            require: true,
            rejectUnauthorized: false
          }
        } : {},

        // Performance settings
        benchmark: process.env.NODE_ENV === 'development',
        
        // Define associations
        define: {
          timestamps: true,
          underscored: true,
          paranoid: true, // Soft deletes
          freezeTableName: true
        }
      }
    };
  }

  private setupEventListeners(): void {
    if (!this.sequelize) return;

    // Connection events
    this.sequelize.addHook('beforeConnect', () => {
      logger.debug('Attempting to connect to PostgreSQL');
    });

    this.sequelize.addHook('afterConnect', () => {
      logger.debug('Connected to PostgreSQL');
    });

    this.sequelize.addHook('beforeDisconnect', () => {
      logger.debug('Disconnecting from PostgreSQL');
    });

    this.sequelize.addHook('afterDisconnect', () => {
      logger.debug('Disconnected from PostgreSQL');
      this.isConnected = false;
    });

    // Process termination handlers
    process.on('SIGINT', this.gracefulShutdown.bind(this));
    process.on('SIGTERM', this.gracefulShutdown.bind(this));
    process.on('SIGUSR2', this.gracefulShutdown.bind(this)); // For nodemon
  }

  private async gracefulShutdown(signal: string): Promise<void> {
    logger.info({ signal }, 'Received shutdown signal, closing PostgreSQL connection');
    
    try {
      await this.disconnect();
      logger.info('PostgreSQL connection closed through app termination');
      process.exit(0);
    } catch (error) {
      logger.error({ error }, 'Error during graceful shutdown');
      process.exit(1);
    }
  }

  private getDatabaseName(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.slice(1); // Remove leading slash
    } catch {
      return 'unknown';
    }
  }

  private getHostFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.host;
    } catch {
      return 'unknown';
    }
  }

  /**
   * Health check for the database connection
   */
  public async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    details: {
      connected: boolean;
      host?: string;
      database?: string;
      version?: string;
      uptime?: number;
    };
  }> {
    try {
      if (!this.isConnectionReady() || !this.sequelize) {
        return {
          status: 'unhealthy',
          details: {
            connected: false
          }
        };
      }

      // Test connection with a simple query
      const startTime = Date.now();
      const result = await this.sequelize.query('SELECT version(), current_database(), extract(epoch from current_timestamp - pg_postmaster_start_time()) as uptime;');
      const responseTime = Date.now() - startTime;

      const config = this.getConfig();
      const [rows] = result as any[];
      const row = rows[0];

      return {
        status: 'healthy',
        details: {
          connected: true,
          host: this.getHostFromUrl(config.url),
          database: this.getDatabaseName(config.url),
          version: row.version,
          uptime: parseFloat(row.uptime)
        }
      };

    } catch (error) {
      logger.error({ error }, 'Database health check failed');
      return {
        status: 'unhealthy',
        details: {
          connected: false
        }
      };
    }
  }

  /**
   * Execute raw SQL query
   */
  public async query(sql: string, options?: any): Promise<any> {
    if (!this.sequelize) {
      throw new Error('Database not connected');
    }

    try {
      return await this.sequelize.query(sql, options);
    } catch (error) {
      logger.error({ error, sql }, 'SQL query failed');
      throw error;
    }
  }

  /**
   * Start a database transaction
   */
  public async transaction(): Promise<any> {
    if (!this.sequelize) {
      throw new Error('Database not connected');
    }

    return await this.sequelize.transaction();
  }
}

// Export singleton instance
export const database = Database.getInstance(); 