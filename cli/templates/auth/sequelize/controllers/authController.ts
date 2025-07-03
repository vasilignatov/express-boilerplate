import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authService } from '../services/authService';
import { User } from '../models/User';
import { AppError, ValidationError } from '../utils/errors';
import { successResponse, errorResponse } from '../utils/responses';
import { logger } from '../services/logger';

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, firstName, lastName } = req.body;

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        throw new ValidationError('User with this email already exists');
      }

      // Create user (password will be automatically hashed by model hook)
      const user = await User.create({
        email: email.toLowerCase(),
        password,
        firstName,
        lastName
      });

      // Generate tokens
      const tokens = await authService.generateTokens({
        id: user.id,
        email: user.email,
        role: user.role
      });

      // Save refresh token
      const userAgent = req.get('User-Agent');
      const ipAddress = req.ip;
      await authService.saveRefreshToken(user.id, tokens.refreshToken, userAgent, ipAddress);

      logger.info({
        userId: user.id,
        email: user.email,
        ip: req.ip
      }, 'User registered successfully');

      res.status(201).json(successResponse({
        user: user.toPublic(),
        tokens
      }, 'User registered successfully'));

    } catch (error) {
      next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      // Find user with password
      const user = await User.scope('withPassword').findByEmail(email);
      if (!user) {
        throw new ValidationError('Invalid email or password');
      }

      // Check if account is active
      if (!user.isAccountActive()) {
        throw new ValidationError('Account is not active or email not verified');
      }

      // Check password
      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        throw new ValidationError('Invalid email or password');
      }

      // Generate tokens
      const tokens = await authService.generateTokens({
        id: user.id,
        email: user.email,
        role: user.role
      });

      // Save refresh token
      const userAgent = req.get('User-Agent');
      const ipAddress = req.ip;
      await authService.saveRefreshToken(user.id, tokens.refreshToken, userAgent, ipAddress);

      // Update last login
      await user.update({ lastLoginAt: new Date() });

      logger.info({
        userId: user.id,
        email: user.email,
        ip: req.ip
      }, 'User logged in successfully');

      res.json(successResponse({
        user: user.toPublic(),
        tokens
      }, 'Login successful'));

    } catch (error) {
      next(error);
    }
  },

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new ValidationError('Refresh token is required');
      }

      // Verify refresh token
      const decoded = authService.verifyRefreshToken(refreshToken);
      
      // Check if refresh token exists in database
      const storedToken = await authService.findRefreshToken(decoded.userId, refreshToken);
      if (!storedToken) {
        throw new ValidationError('Invalid refresh token');
      }

      // Find user
      const user = await User.findByPk(decoded.userId);
      if (!user) {
        throw new ValidationError('User not found');
      }

      // Check if account is still active
      if (!user.isAccountActive()) {
        throw new ValidationError('Account is not active');
      }

      // Generate new tokens
      const tokens = await authService.generateTokens({
        id: user.id,
        email: user.email,
        role: user.role
      });

      // Replace old refresh token with new one
      const userAgent = req.get('User-Agent');
      const ipAddress = req.ip;
      await authService.replaceRefreshToken(user.id, refreshToken, tokens.refreshToken, userAgent, ipAddress);

      logger.info({
        userId: user.id,
        ip: req.ip
      }, 'Tokens refreshed successfully');

      res.json(successResponse({
        tokens
      }, 'Tokens refreshed successfully'));

    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        next(new ValidationError('Invalid or expired refresh token'));
      } else {
        next(error);
      }
    }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const userId = req.user?.id;

      if (refreshToken && userId) {
        // Remove refresh token from database
        await authService.removeRefreshToken(userId, refreshToken);
      }

      logger.info({
        userId,
        ip: req.ip
      }, 'User logged out successfully');

      res.json(successResponse(null, 'Logout successful'));

    } catch (error) {
      next(error);
    }
  },

  async logoutAll(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;

      if (userId) {
        // Remove all refresh tokens for user
        await authService.removeAllRefreshTokens(userId);
      }

      logger.info({
        userId,
        ip: req.ip
      }, 'User logged out from all devices');

      res.json(successResponse(null, 'Logged out from all devices successfully'));

    } catch (error) {
      next(error);
    }
  },

  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      
      const user = await User.findByPk(userId);
      if (!user) {
        throw new ValidationError('User not found');
      }

      res.json(successResponse({
        user: user.toPublic()
      }, 'Profile retrieved successfully'));

    } catch (error) {
      next(error);
    }
  },

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { firstName, lastName } = req.body;

      const user = await User.findByPk(userId);
      if (!user) {
        throw new ValidationError('User not found');
      }

      // Update fields
      const updateData: any = {};
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;

      if (Object.keys(updateData).length > 0) {
        await user.update(updateData);
      }

      logger.info({
        userId,
        ip: req.ip
      }, 'Profile updated successfully');

      res.json(successResponse({
        user: user.toPublic()
      }, 'Profile updated successfully'));

    } catch (error) {
      next(error);
    }
  },

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { currentPassword, newPassword } = req.body;

      const user = await User.scope('withPassword').findByPk(userId);
      if (!user) {
        throw new ValidationError('User not found');
      }

      // Verify current password
      const isValidPassword = await user.comparePassword(currentPassword);
      if (!isValidPassword) {
        throw new ValidationError('Current password is incorrect');
      }

      // Update password (will be automatically hashed by model hook)
      await user.update({ password: newPassword });

      // Remove all refresh tokens (force re-login)
      await authService.removeAllRefreshTokens(userId);

      logger.info({
        userId,
        ip: req.ip
      }, 'Password changed successfully');

      res.json(successResponse(null, 'Password changed successfully. Please login again.'));

    } catch (error) {
      next(error);
    }
  },

  async getActiveSessions(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new ValidationError('User not authenticated');
      }

      const sessions = await authService.getActiveSessions(userId);

      res.json(successResponse({
        sessions
      }, 'Active sessions retrieved successfully'));

    } catch (error) {
      next(error);
    }
  },

  async revokeSession(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { sessionId } = req.params;

      if (!userId) {
        throw new ValidationError('User not authenticated');
      }

      await authService.revokeSession(userId, sessionId);

      logger.info({
        userId,
        sessionId,
        ip: req.ip
      }, 'Session revoked successfully');

      res.json(successResponse(null, 'Session revoked successfully'));

    } catch (error) {
      next(error);
    }
  }
}; 