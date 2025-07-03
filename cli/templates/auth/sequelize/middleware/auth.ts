import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { User } from '../models/User';
import { AppError } from '../utils/errors';
import { logger } from '../services/logger';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

/**
 * Authentication middleware - Verifies JWT access token
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Access token is required', 401);
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      throw new AppError('Access token is required', 401);
    }

    // Verify token
    const decoded = authService.verifyAccessToken(token);
    
    // Check if user exists and is active
    const user = await User.findByPk(decoded.userId);
    
    if (!user) {
      throw new AppError('User not found', 401);
    }

    if (!user.isAccountActive()) {
      throw new AppError('Account is deactivated', 401);
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    logger.debug({
      userId: user.id,
      email: user.email,
      path: req.path,
      method: req.method
    }, 'User authenticated successfully');

    next();

  } catch (error) {
    logger.warn({
      error: error.message,
      path: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    }, 'Authentication failed');

    if (error instanceof AppError) {
      return next(error);
    }

    next(new AppError('Invalid or expired token', 401));
  }
};

/**
 * Optional authentication middleware - Doesn't fail if no token provided
 */
export const optionalAuthenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without authentication
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return next(); // Continue without authentication
    }

    // Verify token
    const decoded = authService.verifyAccessToken(token);
    
    // Check if user exists and is active
    const user = await User.findByPk(decoded.userId);
    
    if (user && user.isAccountActive()) {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role
      };
    }

    next();

  } catch (error) {
    // Silently continue without authentication on token errors
    next();
  }
};

/**
 * Authorization middleware - Checks if user has required role
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (!roles.includes(req.user.role)) {
      logger.warn({
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
        path: req.path,
        method: req.method
      }, 'Authorization failed - insufficient permissions');

      return next(new AppError('Insufficient permissions', 403));
    }

    logger.debug({
      userId: req.user.id,
      userRole: req.user.role,
      path: req.path,
      method: req.method
    }, 'User authorized successfully');

    next();
  };
};

/**
 * Admin authorization middleware
 */
export const requireAdmin = authorize('admin');

/**
 * User authorization middleware - Allows users to access their own resources
 */
export const requireOwnership = (userIdParam: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    const resourceUserId = req.params[userIdParam];
    const currentUserId = req.user.id;

    // Allow if user is admin or accessing their own resource
    if (req.user.role === 'admin' || resourceUserId === currentUserId) {
      return next();
    }

    logger.warn({
      userId: currentUserId,
      resourceUserId,
      path: req.path,
      method: req.method
    }, 'Authorization failed - not resource owner');

    return next(new AppError('Access denied', 403));
  };
};

/**
 * Rate limiting per user
 */
export const userRateLimit = (maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) => {
  const userRequests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(); // Skip if not authenticated
    }

    const userId = req.user.id;
    const now = Date.now();
    const userRecord = userRequests.get(userId);

    if (!userRecord || now > userRecord.resetTime) {
      // Reset or create new record
      userRequests.set(userId, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }

    if (userRecord.count >= maxRequests) {
      logger.warn({
        userId,
        requestCount: userRecord.count,
        maxRequests,
        path: req.path,
        method: req.method
      }, 'User rate limit exceeded');

      return next(new AppError('Too many requests', 429));
    }

    userRecord.count++;
    next();
  };
};

/**
 * Check if user's email is verified
 */
export const requireEmailVerification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return next(new AppError('User not found', 401));
    }

    if (!user.isEmailVerified) {
      return next(new AppError('Email verification required', 403));
    }

    next();

  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to validate token without database lookup (for performance)
 */
export const fastAuthenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Access token is required', 401);
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      throw new AppError('Access token is required', 401);
    }

    // Verify token (no database lookup)
    const decoded = authService.verifyAccessToken(token);
    
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role || 'user'
    };

    next();

  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    next(new AppError('Invalid or expired token', 401));
  }
}; 