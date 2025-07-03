import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import { User } from '../models/User';
import { RefreshToken } from '../models/RefreshToken';
import { AppError } from '../utils/errors';
import { logger } from '../services/logger';
import { 
  ITokenPair, 
  IJWTPayload, 
  IUserPublic,
  IRefreshTokenBase 
} from '../../shared/types';

interface TokenPayload {
  id: string;
  email: string;
  role: string;
}

export const authService = {
  /**
   * Generate access and refresh tokens for user
   */
  async generateTokens(payload: TokenPayload): Promise<ITokenPair> {
    try {
      const accessTokenSecret = process.env.JWT_ACCESS_SECRET;
      const refreshTokenSecret = process.env.JWT_REFRESH_SECRET;
      const accessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
      const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

      if (!accessTokenSecret || !refreshTokenSecret) {
        throw new AppError('JWT secrets not configured', 500);
      }

      // Calculate expiration time in seconds
      const expiresIn = this.parseExpirationTime(accessExpiresIn);

      // Generate access token
      const accessToken = jwt.sign(
        {
          userId: payload.id,
          email: payload.email,
          role: payload.role,
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
      const refreshTokenValue = jwt.sign(
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
        refreshToken: refreshTokenValue,
        expiresIn
      };

    } catch (error) {
      logger.error({ error, userId: payload.id }, 'Error generating tokens');
      throw new AppError('Token generation failed', 500);
    }
  },

  /**
   * Parse expiration time string to seconds
   */
  parseExpirationTime(expiresIn: string): number {
    const timeUnit = expiresIn.slice(-1);
    const timeValue = parseInt(expiresIn.slice(0, -1));
    
    switch (timeUnit) {
      case 's': return timeValue;
      case 'm': return timeValue * 60;
      case 'h': return timeValue * 60 * 60;
      case 'd': return timeValue * 24 * 60 * 60;
      default: return 900; // 15 minutes default
    }
  },

  /**
   * Verify access token
   */
  verifyAccessToken(token: string): IJWTPayload | null {
    try {
      const secret = process.env.JWT_ACCESS_SECRET;
      if (!secret) {
        throw new AppError('JWT secret not configured', 500);
      }

      const decoded = jwt.verify(token, secret, {
        issuer: 'express-boilerplate',
        audience: 'api'
      }) as any;

      return {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        iat: decoded.iat,
        exp: decoded.exp
      };
    } catch (error: any) {
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
    } catch (error: any) {
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
  async saveRefreshToken(userId: string, token: string, userAgent?: string, ipAddress?: string): Promise<void> {
    try {
      const decoded = this.verifyRefreshToken(token);
      const expiresAt = new Date(decoded.exp * 1000);

      await RefreshToken.create({
        userId,
        token,
        expiresAt,
        userAgent,
        ipAddress
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
  async findRefreshToken(userId: string, token: string): Promise<RefreshToken | null> {
    try {
      const refreshToken = await RefreshToken.findOne({
        where: {
          userId,
          token,
          expiresAt: { [Op.gt]: new Date() },
          isRevoked: false
        }
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
  async replaceRefreshToken(userId: string, oldToken: string, newToken: string, userAgent?: string, ipAddress?: string): Promise<void> {
    try {
      // Revoke old token
      await RefreshToken.update(
        { 
          isRevoked: true, 
          revokedAt: new Date() 
        },
        { 
          where: { 
            userId, 
            token: oldToken 
          }
        }
      );

      // Save new token
      await this.saveRefreshToken(userId, newToken, userAgent, ipAddress);

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
      await RefreshToken.update(
        { 
          isRevoked: true, 
          revokedAt: new Date() 
        },
        { 
          where: { 
            userId, 
            token 
          }
        }
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
      await RefreshToken.update(
        { 
          isRevoked: true, 
          revokedAt: new Date() 
        },
        { 
          where: { 
            userId, 
            isRevoked: false 
          }
        }
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
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const deletedCount = await RefreshToken.destroy({
        where: {
          [Op.or]: [
            { expiresAt: { [Op.lt]: new Date() } },
            { 
              isRevoked: true, 
              revokedAt: { [Op.lt]: thirtyDaysAgo } 
            }
          ]
        }
      });

      logger.info({ deletedCount }, 'Expired refresh tokens cleaned up');
    } catch (error) {
      logger.error({ error }, 'Error cleaning up expired tokens');
    }
  },

  /**
   * Get active sessions for user
   */
  async getActiveSessions(userId: string): Promise<IRefreshTokenBase[]> {
    try {
      const sessions = await RefreshToken.findAll({
        where: {
          userId,
          expiresAt: { [Op.gt]: new Date() },
          isRevoked: false
        },
        attributes: ['id', 'createdAt', 'expiresAt', 'lastUsedAt', 'userAgent', 'ipAddress'],
        order: [['createdAt', 'DESC']]
      });

      return sessions.map(session => session.toJSON());
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
      const [affectedRows] = await RefreshToken.update(
        { 
          isRevoked: true, 
          revokedAt: new Date() 
        },
        { 
          where: { 
            id: tokenId, 
            userId 
          }
        }
      );

      if (affectedRows === 0) {
        throw new AppError('Session not found or already revoked', 404);
      }

      logger.info({ userId, tokenId }, 'Session revoked');
    } catch (error) {
      logger.error({ error, userId, tokenId }, 'Error revoking session');
      throw new AppError('Failed to revoke session', 500);
    }
  },

  /**
   * Count active tokens for user
   */
  async countActiveTokens(userId: string): Promise<number> {
    try {
      return await RefreshToken.count({
        where: {
          userId,
          expiresAt: { [Op.gt]: new Date() },
          isRevoked: false
        }
      });
    } catch (error) {
      logger.error({ error, userId }, 'Error counting active tokens');
      return 0;
    }
  },

  /**
   * Find user by refresh token
   */
  async findUserByRefreshToken(token: string): Promise<User | null> {
    try {
      const refreshToken = await RefreshToken.findOne({
        where: {
          token,
          expiresAt: { [Op.gt]: new Date() },
          isRevoked: false
        },
        include: [{
          model: User,
          as: 'user'
        }]
      });

      return refreshToken?.user || null;
    } catch (error) {
      logger.error({ error }, 'Error finding user by refresh token');
      return null;
    }
  }
}; 