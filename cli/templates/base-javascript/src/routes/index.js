import { Router } from 'express';
import { healthController } from '../controllers/healthController.js';

const router = Router();

/**
 * API Routes
 * All routes are prefixed with the API_PREFIX from environment variables
 */

// Health check routes
router.get('/health', healthController.getHealth);
router.get('/health/detailed', healthController.getDetailedHealth);
router.get('/health/ready', healthController.getReadiness);
router.get('/health/live', healthController.getLiveness);

// Status route
router.get('/status', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      api: 'Express JavaScript Boilerplate',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    },
    message: 'API is running'
  });
});

// Version route
router.get('/version', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      version: '1.0.0',
      buildDate: new Date().toISOString(),
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch
    },
    message: 'Version information'
  });
});

// Example protected route (will be useful when auth is added)
router.get('/protected', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      message: 'This is a protected route',
      user: req.user || null,
      timestamp: new Date().toISOString()
    },
    message: 'Protected route accessed successfully'
  });
});

export { router as routes }; 