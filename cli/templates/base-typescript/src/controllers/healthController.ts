import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../services/logger';

/**
 * Health Controller
 * Provides health check endpoints for monitoring and load balancers
 */
class HealthController {
  /**
   * Basic health check
   * GET /health
   */
  public getHealth = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const healthData = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    };

    logger.debug({
      health: healthData,
      ip: req.ip
    }, 'Health check requested');

    res.status(200).json({
      success: true,
      data: healthData,
      message: 'Service is healthy'
    });
  });

  /**
   * Detailed health check with system information
   * GET /health/detailed
   */
  public getDetailedHealth = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    const healthData = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      system: {
        platform: process.platform,
        architecture: process.arch,
        nodeVersion: process.version,
        pid: process.pid
      },
      memory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)} MB`
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      loadAverage: process.platform !== 'win32' ? require('os').loadavg() : 'Not available on Windows'
    };

    // Check if system is healthy based on memory usage
    const heapUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
    if (heapUsagePercent > 90) {
      healthData.status = 'WARNING';
      logger.warn({
        heapUsagePercent,
        memoryUsage
      }, 'High memory usage detected');
    }

    logger.debug({
      health: healthData,
      ip: req.ip
    }, 'Detailed health check requested');

    res.status(200).json({
      success: true,
      data: healthData,
      message: `Service is ${healthData.status.toLowerCase()}`
    });
  });

  /**
   * Readiness probe for Kubernetes
   * GET /health/ready
   */
  public getReadiness = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    // Check if application is ready to serve traffic
    // Add your readiness checks here (database connections, external services, etc.)
    
    const isReady = await this.checkReadiness();
    
    if (isReady) {
      res.status(200).json({
        success: true,
        data: {
          status: 'READY',
          timestamp: new Date().toISOString()
        },
        message: 'Service is ready'
      });
    } else {
      res.status(503).json({
        success: false,
        error: {
          code: 'SERVICE_NOT_READY',
          message: 'Service is not ready'
        },
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * Liveness probe for Kubernetes
   * GET /health/live
   */
  public getLiveness = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // Check if application is alive
    // Add your liveness checks here
    
    const isAlive = await this.checkLiveness();
    
    if (isAlive) {
      res.status(200).json({
        success: true,
        data: {
          status: 'ALIVE',
          timestamp: new Date().toISOString(),
          uptime: process.uptime()
        },
        message: 'Service is alive'
      });
    } else {
      res.status(503).json({
        success: false,
        error: {
          code: 'SERVICE_NOT_ALIVE',
          message: 'Service is not alive'
        },
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * Check if application is ready to serve traffic
   * Override this method to add custom readiness checks
   */
  private async checkReadiness(): Promise<boolean> {
    try {
      // Add your readiness checks here:
      // - Database connectivity
      // - External service dependencies
      // - Cache connectivity
      // - File system access
      
      // For now, return true if the process is running
      return true;
    } catch (error) {
      logger.error({ error }, 'Readiness check failed');
      return false;
    }
  }

  /**
   * Check if application is alive
   * Override this method to add custom liveness checks
   */
  private async checkLiveness(): Promise<boolean> {
    try {
      // Add your liveness checks here:
      // - Basic functionality test
      // - Memory leaks detection
      // - Deadlock detection
      
      // For now, return true if the process is running
      return true;
    } catch (error) {
      logger.error({ error }, 'Liveness check failed');
      return false;
    }
  }
}

export const healthController = new HealthController(); 