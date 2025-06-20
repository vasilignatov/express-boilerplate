import { asyncHandler } from '../middleware/errorHandler.js';
import { logger } from '../services/logger.js';
import os from 'os';

/**
 * Health Controller
 * Provides health check endpoints for monitoring and load balancers
 */
class HealthController {
  /**
   * Basic health check
   * GET /health
   */
  getHealth = asyncHandler(async (req, res) => {
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
  getDetailedHealth = asyncHandler(async (req, res) => {
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
        pid: process.pid,
        hostname: os.hostname(),
        totalMemory: `${Math.round(os.totalmem() / 1024 / 1024)} MB`,
        freeMemory: `${Math.round(os.freemem() / 1024 / 1024)} MB`,
        cpus: os.cpus().length
      },
      memory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)} MB`,
        arrayBuffers: `${Math.round(memoryUsage.arrayBuffers / 1024 / 1024)} MB`
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      loadAverage: process.platform !== 'win32' ? os.loadavg() : 'Not available on Windows'
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

    // Check free memory
    const freeMemoryPercent = (os.freemem() / os.totalmem()) * 100;
    if (freeMemoryPercent < 10) {
      healthData.status = 'WARNING';
      logger.warn({
        freeMemoryPercent,
        freeMemory: os.freemem(),
        totalMemory: os.totalmem()
      }, 'Low system memory detected');
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
  getReadiness = asyncHandler(async (req, res) => {
    // Check if application is ready to serve traffic
    const isReady = await this.checkReadiness();
    
    if (isReady) {
      res.status(200).json({
        success: true,
        data: {
          status: 'READY',
          timestamp: new Date().toISOString(),
          checks: {
            database: 'OK', // Will be implemented when database is added
            cache: 'OK',     // Will be implemented when cache is added
            external: 'OK'   // Will be implemented for external dependencies
          }
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
  getLiveness = asyncHandler(async (req, res) => {
    // Check if application is alive
    const isAlive = await this.checkLiveness();
    
    if (isAlive) {
      res.status(200).json({
        success: true,
        data: {
          status: 'ALIVE',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage(),
          pid: process.pid
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
  async checkReadiness() {
    try {
      // Add your readiness checks here:
      // - Database connectivity
      // - External service dependencies
      // - Cache connectivity
      // - File system access
      
      // Basic checks
      const memoryCheck = this.checkMemory();
      const uptimeCheck = process.uptime() > 5; // At least 5 seconds uptime
      
      return memoryCheck && uptimeCheck;
    } catch (error) {
      logger.error({ error }, 'Readiness check failed');
      return false;
    }
  }

  /**
   * Check if application is alive
   * Override this method to add custom liveness checks
   */
  async checkLiveness() {
    try {
      // Add your liveness checks here:
      // - Basic functionality test
      // - Memory leaks detection
      // - Deadlock detection
      
      // Basic checks
      const memoryCheck = this.checkMemory();
      const processCheck = process.pid > 0;
      
      return memoryCheck && processCheck;
    } catch (error) {
      logger.error({ error }, 'Liveness check failed');
      return false;
    }
  }

  /**
   * Check memory usage
   * @returns {boolean} True if memory usage is acceptable
   */
  checkMemory() {
    const memoryUsage = process.memoryUsage();
    const heapUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
    
    // Consider unhealthy if heap usage is over 95%
    return heapUsagePercent < 95;
  }

  /**
   * Get application metrics
   * GET /health/metrics (optional endpoint for monitoring)
   */
  getMetrics = asyncHandler(async (req, res) => {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    const metrics = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external,
        arrayBuffers: memoryUsage.arrayBuffers
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      system: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        pid: process.pid,
        ppid: process.ppid,
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        loadAverage: process.platform !== 'win32' ? os.loadavg() : null
      },
      process: {
        argv: process.argv,
        execPath: process.execPath,
        cwd: process.cwd(),
        env: {
          NODE_ENV: process.env.NODE_ENV,
          PORT: process.env.PORT
        }
      }
    };

    res.status(200).json({
      success: true,
      data: metrics,
      message: 'Application metrics'
    });
  });
}

export const healthController = new HealthController(); 