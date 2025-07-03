import jwt from 'jsonwebtoken';
import { RefreshToken } from '../models/RefreshToken';
import { AppError } from '../utils/errors';
import { logger } from './logger';

interface TokenPayload {
  id: string;
  email: string;
}

interface Tokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export const authService = {
  /**
   * Generate access and refresh tokens for user
   */
  async generateTokens(payload: TokenPayload): Promise<Tokens> {
    try {
      const accessTokenSecret = process.env.JWT_ACCESS_SECRET;
      const refreshTokenSecret = process.env.JWT_REFRESH_SECRET;
      const accessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
      const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

      if (!accessTokenSecret || !refreshTokenSecret) {
        throw new AppError('JWT secrets not configured', 500);
      }

      // Generate access token
      const accessToken = jwt.sign(
        {
          userId: payload.id,
          email: payload.email,
          type: 'access'
        },
        accessTokenSecret,
        {
          expiresIn: accessExpiresIn,
          issuer: 'express-boilerplate',
          audience: 'api'
        }
      );

      // Generate refresh token
      const refreshToken = jwt.sign(
        {
          userId: payload.id,
          type: 'refresh'
        },
        refreshTokenSecret,
        {
          expiresIn: refreshExpiresIn,
          issuer: 'express-boilerplate',
          audience: 'api'
        }
      );

      return {
        accessToken,
        refreshToken,
        expiresIn: accessExpiresIn
      };

    } catch (error) {
      logger.error({ error, userId: payload.id }, 'Error generating tokens');
      throw new AppError('Token generation failed', 500);
    }
  },

  /**
   * Verify access token
   */
  verifyAccessToken(token: string): any {
    try {
      const secret = process.env.JWT_ACCESS_SECRET;
      if (!secret) {
        throw new AppError('JWT secret not configured', 500);
      }

      return jwt.verify(token, secret, {
        issuer: 'express-boilerplate',
        audience: 'api'
      });
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        throw new AppError('Invalid token', 401);
      }
      if (error.name === 'TokenExpiredError') {
        throw new AppError('Token expired', 401);
      }
      throw error;
    }
  },

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token: string): any {
    try {
      const secret = process.env.JWT_REFRESH_SECRET;
      if (!secret) {
        throw new AppError('JWT secret not configured', 500);
      }

      return jwt.verify(token, secret, {
        issuer: 'express-boilerplate',
        audience: 'api'
      });
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        throw new AppError('Invalid refresh token', 401);
      }
      if (error.name === 'TokenExpiredError') {
        throw new AppError('Refresh token expired', 401);
      }
      throw error;
    }
  },

  /**
   * Save refresh token to database
   */
  async saveRefreshToken(userId: string, token: string): Promise<void> {
    try {
      const decoded = this.verifyRefreshToken(token);
      const expiresAt = new Date(decoded.exp * 1000);

      await RefreshToken.create({
        userId,
        token,
        expiresAt
      });

      logger.debug({ userId }, 'Refresh token saved');
    } catch (error) {
      logger.error({ error, userId }, 'Error saving refresh token');
      throw new AppError('Failed to save refresh token', 500);
    }
  },

  /**
   * Find refresh token in database
   */
  async findRefreshToken(userId: string, token: string): Promise<any> {
    try {
      const refreshToken = await RefreshToken.findOne({
        userId,
        token,
        expiresAt: { $gt: new Date() },
        isRevoked: false
      });

      return refreshToken;
    } catch (error) {
      logger.error({ error, userId }, 'Error finding refresh token');
      return null;
    }
  },

  /**
   * Replace refresh token (for token rotation)
   */
  async replaceRefreshToken(userId: string, oldToken: string, newToken: string): Promise<void> {
    try {
      // Revoke old token
      await RefreshToken.updateOne(
        { userId, token: oldToken },
        { isRevoked: true, revokedAt: new Date() }
      );

      // Save new token
      await this.saveRefreshToken(userId, newToken);

      logger.debug({ userId }, 'Refresh token replaced');
    } catch (error) {
      logger.error({ error, userId }, 'Error replacing refresh token');
      throw new AppError('Failed to replace refresh token', 500);
    }
  },

  /**
   * Remove specific refresh token
   */
  async removeRefreshToken(userId: string, token: string): Promise<void> {
    try {
      await RefreshToken.updateOne(
        { userId, token },
        { isRevoked: true, revokedAt: new Date() }
      );

      logger.debug({ userId }, 'Refresh token revoked');
    } catch (error) {
      logger.error({ error, userId }, 'Error removing refresh token');
    }
  },

  /**
   * Remove all refresh tokens for user (logout from all devices)
   */
  async removeAllRefreshTokens(userId: string): Promise<void> {
    try {
      await RefreshToken.updateMany(
        { userId, isRevoked: false },
        { isRevoked: true, revokedAt: new Date() }
      );

      logger.info({ userId }, 'All refresh tokens revoked');
    } catch (error) {
      logger.error({ error, userId }, 'Error removing all refresh tokens');
    }
  },

  /**
   * Clean up expired tokens (should be run periodically)
   */
  async cleanupExpiredTokens(): Promise<void> {
    try {
      const result = await RefreshToken.deleteMany({
        $or: [
          { expiresAt: { $lt: new Date() } },
          { isRevoked: true, revokedAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } // 30 days old
        ]
      });

      logger.info({ deletedCount: result.deletedCount }, 'Expired refresh tokens cleaned up');
    } catch (error) {
      logger.error({ error }, 'Error cleaning up expired tokens');
    }
  },

  /**
   * Get active sessions for user
   */
  async getActiveSessions(userId: string): Promise<any[]> {
    try {
      const sessions = await RefreshToken.find({
        userId,
        expiresAt: { $gt: new Date() },
        isRevoked: false
      }).select('createdAt expiresAt lastUsedAt userAgent ipAddress').sort({ createdAt: -1 });

      return sessions;
    } catch (error) {
      logger.error({ error, userId }, 'Error getting active sessions');
      return [];
    }
  },

  /**
   * Revoke session by token ID
   */
  async revokeSession(userId: string, tokenId: string): Promise<void> {
    try {
      await RefreshToken.updateOne(
        { _id: tokenId, userId },
        { isRevoked: true, revokedAt: new Date() }
      );

      logger.info({ userId, tokenId }, 'Session revoked');
    } catch (error) {
      logger.error({ error, userId, tokenId }, 'Error revoking session');
      throw new AppError('Failed to revoke session', 500);
    }
  }
}; 