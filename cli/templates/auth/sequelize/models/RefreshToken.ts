import { DataTypes, Model, Sequelize, Optional } from 'sequelize';
import { IRefreshTokenBase, IRefreshTokenCreate } from '../../shared/types';

// RefreshToken creation attributes (optional fields)
export interface RefreshTokenCreationAttributes 
  extends Optional<IRefreshTokenBase, 'id' | 'isRevoked' | 'lastUsedAt' | 'createdAt' | 'updatedAt'> {}

// RefreshToken model class extending Sequelize Model
export class RefreshToken extends Model<IRefreshTokenBase, RefreshTokenCreationAttributes> implements IRefreshTokenBase {
  public id!: string;
  public userId!: string;
  public token!: string;
  public expiresAt!: Date;
  public isRevoked!: boolean;
  public revokedAt?: Date;
  public userAgent?: string;
  public ipAddress?: string;
  public lastUsedAt?: Date;
  public createdAt!: Date;
  public updatedAt!: Date;

  // Instance method to check if token is valid
  public isValid(): boolean {
    return !this.isRevoked && this.expiresAt > new Date();
  }

  // Instance method to revoke token
  public async revoke(): Promise<RefreshToken> {
    this.isRevoked = true;
    this.revokedAt = new Date();
    return this.save();
  }

  // Instance method to update last used timestamp
  public async updateLastUsed(): Promise<RefreshToken> {
    this.lastUsedAt = new Date();
    return this.save();
  }

  // Static method to find valid tokens for user
  public static async findValidTokensForUser(userId: string) {
    return this.findAll({
      where: {
        userId,
        isRevoked: false,
        expiresAt: {
          [DataTypes.Sequelize.Op.gt]: new Date()
        }
      },
      order: [['createdAt', 'DESC']]
    });
  }

  // Static method to revoke all tokens for user
  public static async revokeAllForUser(userId: string): Promise<number> {
    const [affectedCount] = await this.update(
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
    return affectedCount;
  }

  // Static method to find by token
  public static async findByToken(token: string) {
    return this.findOne({
      where: {
        token,
        isRevoked: false,
        expiresAt: {
          [DataTypes.Sequelize.Op.gt]: new Date()
        }
      }
    });
  }

  // Static method to cleanup expired and revoked tokens
  public static async cleanup(): Promise<number> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const deletedCount = await this.destroy({
      where: {
        [DataTypes.Sequelize.Op.or]: [
          { expiresAt: { [DataTypes.Sequelize.Op.lt]: new Date() } },
          { 
            isRevoked: true, 
            revokedAt: { [DataTypes.Sequelize.Op.lt]: thirtyDaysAgo } 
          }
        ]
      }
    });
    
    return deletedCount;
  }

  // Static method to delete expired tokens only
  public static async deleteExpiredTokens(): Promise<number> {
    const deletedCount = await this.destroy({
      where: {
        expiresAt: {
          [DataTypes.Sequelize.Op.lt]: new Date()
        }
      }
    });
    
    return deletedCount;
  }

  // Static method to delete old revoked tokens
  public static async deleteRevokedTokens(olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    
    const deletedCount = await this.destroy({
      where: {
        isRevoked: true,
        revokedAt: {
          [DataTypes.Sequelize.Op.lt]: cutoffDate
        }
      }
    });
    
    return deletedCount;
  }

  // Static method to count active tokens for user
  public static async countActiveTokensForUser(userId: string): Promise<number> {
    return this.count({
      where: {
        userId,
        isRevoked: false,
        expiresAt: {
          [DataTypes.Sequelize.Op.gt]: new Date()
        }
      }
    });
  }
}

// Factory function to initialize the RefreshToken model
export function initializeRefreshTokenModel(sequelize: Sequelize): typeof RefreshToken {
  RefreshToken.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: {
          msg: 'Token is required'
        }
      }
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: {
          msg: 'Expiration date must be a valid date'
        },
        isAfter: {
          args: new Date().toISOString(),
          msg: 'Expiration date must be in the future'
        }
      }
    },
    isRevoked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    revokedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    userAgent: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    ipAddress: {
      type: DataTypes.STRING(45), // IPv6 max length
      allowNull: true,
      validate: {
        isIP: {
          msg: 'Invalid IP address format'
        }
      }
    },
    lastUsedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'RefreshToken',
    tableName: 'refresh_tokens',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['token']
      },
      {
        fields: ['userId']
      },
      {
        fields: ['expiresAt']
      },
      {
        fields: ['isRevoked']
      },
      {
        fields: ['userId', 'isRevoked']
      },
      {
        fields: ['userId', 'expiresAt']
      },
      {
        fields: ['token', 'isRevoked']
      },
      {
        fields: ['expiresAt', 'isRevoked']
      },
      {
        fields: ['revokedAt']
      }
    ],
    hooks: {
      beforeUpdate: (refreshToken: RefreshToken) => {
        // Automatically set revokedAt when isRevoked is set to true
        if (refreshToken.changed('isRevoked') && refreshToken.isRevoked && !refreshToken.revokedAt) {
          refreshToken.revokedAt = new Date();
        }
      }
    },
    scopes: {
      valid: {
        where: {
          isRevoked: false,
          expiresAt: {
            [DataTypes.Sequelize.Op.gt]: new Date()
          }
        }
      },
      expired: {
        where: {
          expiresAt: {
            [DataTypes.Sequelize.Op.lt]: new Date()
          }
        }
      },
      revoked: {
        where: {
          isRevoked: true
        }
      },
      active: {
        where: {
          isRevoked: false,
          expiresAt: {
            [DataTypes.Sequelize.Op.gt]: new Date()
          }
        }
      }
    }
  });

  return RefreshToken;
}

// Set up associations (this will be called after both models are initialized)
export function setupRefreshTokenAssociations(User: any, RefreshToken: typeof RefreshToken) {
  // RefreshToken belongs to User
  RefreshToken.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  });

  // User has many RefreshTokens
  User.hasMany(RefreshToken, {
    foreignKey: 'userId',
    as: 'refreshTokens',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  });
} 