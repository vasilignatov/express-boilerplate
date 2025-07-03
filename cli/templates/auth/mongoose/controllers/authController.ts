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
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        throw new ValidationError('User with this email already exists');
      }

      // Hash password
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user
      const user = new User({
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName
      });

      await user.save();

      // Generate tokens
      const tokens = await authService.generateTokens({
        id: user._id,
        email: user.email
      });

      // Save refresh token
      await authService.saveRefreshToken(user._id, tokens.refreshToken);

      logger.info({
        userId: user._id,
        email: user.email,
        ip: req.ip
      }, 'User registered successfully');

      res.status(201).json(successResponse({
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        },
        tokens
      }, 'User registered successfully'));

    } catch (error) {
      next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
      if (!user) {
        throw new ValidationError('Invalid email or password');
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        throw new ValidationError('Invalid email or password');
      }

      // Generate tokens
      const tokens = await authService.generateTokens({
        id: user._id,
        email: user.email
      });

      // Save refresh token
      await authService.saveRefreshToken(user._id, tokens.refreshToken);

      // Update last login
      user.lastLoginAt = new Date();
      await user.save();

      logger.info({
        userId: user._id,
        email: user.email,
        ip: req.ip
      }, 'User logged in successfully');

      res.json(successResponse({
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          lastLoginAt: user.lastLoginAt
        },
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
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;
      
      // Check if refresh token exists in database
      const storedToken = await authService.findRefreshToken(decoded.userId, refreshToken);
      if (!storedToken) {
        throw new ValidationError('Invalid refresh token');
      }

      // Find user
      const user = await User.findById(decoded.userId);
      if (!user) {
        throw new ValidationError('User not found');
      }

      // Generate new tokens
      const tokens = await authService.generateTokens({
        id: user._id,
        email: user.email
      });

      // Replace old refresh token with new one
      await authService.replaceRefreshToken(user._id, refreshToken, tokens.refreshToken);

      logger.info({
        userId: user._id,
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
      
      const user = await User.findById(userId);
      if (!user) {
        throw new ValidationError('User not found');
      }

      res.json(successResponse({
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt
        }
      }, 'Profile retrieved successfully'));

    } catch (error) {
      next(error);
    }
  },

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { firstName, lastName } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        throw new ValidationError('User not found');
      }

      // Update fields
      if (firstName !== undefined) user.firstName = firstName;
      if (lastName !== undefined) user.lastName = lastName;

      await user.save();

      logger.info({
        userId,
        ip: req.ip
      }, 'Profile updated successfully');

      res.json(successResponse({
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        }
      }, 'Profile updated successfully'));

    } catch (error) {
      next(error);
    }
  },

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { currentPassword, newPassword } = req.body;

      const user = await User.findById(userId).select('+password');
      if (!user) {
        throw new ValidationError('User not found');
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        throw new ValidationError('Current password is incorrect');
      }

      // Hash new password
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      user.password = hashedPassword;
      await user.save();

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
  }
}; 