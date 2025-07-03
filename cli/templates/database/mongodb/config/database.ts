import mongoose from 'mongoose';
import { logger } from '../services/logger';

interface DatabaseConfig {
  uri: string;
  options: mongoose.ConnectOptions;
}

export class Database {
  private static instance: Database;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      logger.warn('Database is already connected');
      return;
    }

    try {
      const config = this.getConfig();
      
      // Set up connection event listeners
      this.setupEventListeners();

      // Connect to MongoDB
      await mongoose.connect(config.uri, config.options);
      
      this.isConnected = true;
      logger.info({
        database: this.getDatabaseName(config.uri),
        host: this.getHostFromUri(config.uri)
      }, 'MongoDB connected successfully');

    } catch (error) {
      logger.error({ error }, 'MongoDB connection failed');
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      logger.warn('Database is not connected');
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      logger.info('MongoDB disconnected successfully');
    } catch (error) {
      logger.error({ error }, 'Error disconnecting from MongoDB');
      throw error;
    }
  }

  public isConnectionReady(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  public getConnectionState(): string {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    return states[mongoose.connection.readyState] || 'unknown';
  }

  private getConfig(): DatabaseConfig {
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is required');
    }

    return {
      uri,
      options: {
        // Connection settings
        maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE || '10'),
        minPoolSize: parseInt(process.env.DB_MIN_POOL_SIZE || '1'),
        maxIdleTimeMS: parseInt(process.env.DB_MAX_IDLE_TIME_MS || '30000'),
        serverSelectionTimeoutMS: parseInt(process.env.DB_SERVER_SELECTION_TIMEOUT_MS || '5000'),
        socketTimeoutMS: parseInt(process.env.DB_SOCKET_TIMEOUT_MS || '45000'),
        connectTimeoutMS: parseInt(process.env.DB_CONNECT_TIMEOUT_MS || '10000'),

        // Reliability settings
        heartbeatFrequencyMS: parseInt(process.env.DB_HEARTBEAT_FREQUENCY_MS || '10000'),
        retryWrites: true,
        w: 'majority',

        // Application settings
        appName: process.env.APP_NAME || 'express-boilerplate',
        
        // Buffer settings
        bufferMaxEntries: 0, // Disable mongoose buffering
        bufferCommands: false, // Disable mongoose buffering
      }
    };
  }

  private setupEventListeners(): void {
    // Connection successful
    mongoose.connection.on('connected', () => {
      logger.info('Mongoose connected to MongoDB');
    });

    // Connection error
    mongoose.connection.on('error', (error) => {
      logger.error({ error }, 'Mongoose connection error');
      this.isConnected = false;
    });

    // Connection disconnected
    mongoose.connection.on('disconnected', () => {
      logger.warn('Mongoose disconnected from MongoDB');
      this.isConnected = false;
    });

    // Connection reconnected
    mongoose.connection.on('reconnected', () => {
      logger.info('Mongoose reconnected to MongoDB');
      this.isConnected = true;
    });

    // Connection lost
    mongoose.connection.on('close', () => {
      logger.warn('Mongoose connection closed');
      this.isConnected = false;
    });

    // MongoDB server selection error
    mongoose.connection.on('serverSelectionError', (error) => {
      logger.error({ error }, 'MongoDB server selection error');
      this.isConnected = false;
    });

    // Process termination handlers
    process.on('SIGINT', this.gracefulShutdown.bind(this));
    process.on('SIGTERM', this.gracefulShutdown.bind(this));
    process.on('SIGUSR2', this.gracefulShutdown.bind(this)); // For nodemon
  }

  private async gracefulShutdown(signal: string): Promise<void> {
    logger.info({ signal }, 'Received shutdown signal, closing MongoDB connection');
    
    try {
      await this.disconnect();
      logger.info('MongoDB connection closed through app termination');
      process.exit(0);
    } catch (error) {
      logger.error({ error }, 'Error during graceful shutdown');
      process.exit(1);
    }
  }

  private getDatabaseName(uri: string): string {
    try {
      const url = new URL(uri);
      return url.pathname.slice(1); // Remove leading slash
    } catch {
      return 'unknown';
    }
  }

  private getHostFromUri(uri: string): string {
    try {
      const url = new URL(uri);
      return url.host;
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
      state: string;
      host?: string;
      database?: string;
      uptime?: number;
      collections?: number;
    };
  }> {
    try {
      const isReady = this.isConnectionReady();
      const state = this.getConnectionState();

      if (!isReady) {
        return {
          status: 'unhealthy',
          details: { state }
        };
      }

      const config = this.getConfig();
      const adminDb = mongoose.connection.db.admin();
      const serverStatus = await adminDb.serverStatus();
      const collections = await mongoose.connection.db.listCollections().toArray();

      return {
        status: 'healthy',
        details: {
          state,
          host: this.getHostFromUri(config.uri),
          database: this.getDatabaseName(config.uri),
          uptime: serverStatus.uptime,
          collections: collections.length
        }
      };

    } catch (error) {
      logger.error({ error }, 'Database health check failed');
      return {
        status: 'unhealthy',
        details: {
          state: this.getConnectionState()
        }
      };
    }
  }
}

// Export singleton instance
export const database = Database.getInstance(); 