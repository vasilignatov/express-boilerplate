import { DataTypes, Model, Sequelize, Optional } from 'sequelize';
import bcrypt from 'bcryptjs';
import validator from 'validator';
import { IUserBase, IUserCreate, UserRole } from '../../shared/types';

// User creation attributes (optional fields)
export interface UserCreationAttributes 
  extends Optional<IUserBase, 'id' | 'role' | 'isActive' | 'isEmailVerified' | 'createdAt' | 'updatedAt'> {}

// User model class extending Sequelize Model
export class User extends Model<IUserBase, UserCreationAttributes> implements IUserBase {
  public id!: string;
  public email!: string;
  public password!: string;
  public firstName!: string;
  public lastName!: string;
  public role!: UserRole;
  public isActive!: boolean;
  public isEmailVerified!: boolean;
  public emailVerificationToken?: string;
  public emailVerificationExpires?: Date;
  public passwordResetToken?: string;
  public passwordResetExpires?: Date;
  public lastLoginAt?: Date;
  public createdAt!: Date;
  public updatedAt!: Date;

  // Virtual property for full name
  public get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  // Instance method to check if user is admin
  public isAdmin(): boolean {
    return this.role === 'admin';
  }

  // Instance method to check if account is active
  public isAccountActive(): boolean {
    return this.isActive && this.isEmailVerified;
  }

  // Instance method to compare password
  public async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  }

  // Instance method to convert to public profile
  public toPublic() {
    return {
      id: this.id,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      fullName: this.fullName,
      role: this.role,
      isActive: this.isActive,
      isEmailVerified: this.isEmailVerified,
      lastLoginAt: this.lastLoginAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Static method to find active users
  public static async findActiveUsers() {
    return this.findAll({
      where: {
        isActive: true,
        isEmailVerified: true
      },
      order: [['createdAt', 'DESC']]
    });
  }

  // Static method to find by email (case insensitive)
  public static async findByEmail(email: string) {
    return this.findOne({
      where: {
        email: email.toLowerCase()
      }
    });
  }

  // Static method to find by email with password
  public static async findByEmailWithPassword(email: string) {
    return this.scope('withPassword').findOne({
      where: {
        email: email.toLowerCase()
      }
    });
  }

  // Static method to find by password reset token
  public static async findByPasswordResetToken(token: string) {
    return this.findOne({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          [DataTypes.Sequelize.Op.gt]: new Date()
        }
      }
    });
  }

  // Static method to find by email verification token
  public static async findByEmailVerificationToken(token: string) {
    return this.findOne({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: {
          [DataTypes.Sequelize.Op.gt]: new Date()
        }
      }
    });
  }
}

// Factory function to initialize the User model
export function initializeUserModel(sequelize: Sequelize): typeof User {
  User.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: {
          msg: 'Please provide a valid email address'
        },
        notEmpty: {
          msg: 'Email is required'
        }
      },
      set(value: string) {
        this.setDataValue('email', value.toLowerCase().trim());
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: {
          args: [8, 255],
          msg: 'Password must be at least 8 characters long'
        },
        notEmpty: {
          msg: 'Password is required'
        },
        isComplex(value: string) {
          const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
          if (!passwordRegex.test(value)) {
            throw new Error('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
          }
        }
      }
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: {
          args: [2, 50],
          msg: 'First name must be between 2 and 50 characters long'
        },
        notEmpty: {
          msg: 'First name is required'
        }
      },
      set(value: string) {
        this.setDataValue('firstName', value.trim());
      }
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: {
          args: [2, 50],
          msg: 'Last name must be between 2 and 50 characters long'
        },
        notEmpty: {
          msg: 'Last name is required'
        }
      },
      set(value: string) {
        this.setDataValue('lastName', value.trim());
      }
    },
    role: {
      type: DataTypes.ENUM('user', 'admin'),
      defaultValue: 'user',
      validate: {
        isIn: {
          args: [['user', 'admin']],
          msg: 'Role must be either user or admin'
        }
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isEmailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    emailVerificationToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    emailVerificationExpires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    passwordResetToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    passwordResetExpires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true
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
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    paranoid: true, // Soft deletes
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['email']
      },
      {
        fields: ['role']
      },
      {
        fields: ['isActive']
      },
      {
        fields: ['isEmailVerified']
      },
      {
        fields: ['createdAt']
      },
      {
        fields: ['isActive', 'isEmailVerified']
      },
      {
        fields: ['passwordResetToken']
      },
      {
        fields: ['emailVerificationToken']
      }
    ],
    defaultScope: {
      attributes: {
        exclude: ['password', 'emailVerificationToken', 'passwordResetToken', 'emailVerificationExpires', 'passwordResetExpires']
      }
    },
    scopes: {
      withPassword: {
        attributes: {
          include: ['password']
        }
      },
      withTokens: {
        attributes: {
          include: ['emailVerificationToken', 'passwordResetToken', 'emailVerificationExpires', 'passwordResetExpires']
        }
      },
      admin: {
        where: {
          role: 'admin'
        }
      },
      active: {
        where: {
          isActive: true,
          isEmailVerified: true
        }
      }
    },
    hooks: {
      beforeCreate: async (user: User) => {
        if (user.password) {
          const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');
          user.password = await bcrypt.hash(user.password, saltRounds);
        }
      },
      beforeUpdate: async (user: User) => {
        if (user.changed('password') && user.password) {
          const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');
          user.password = await bcrypt.hash(user.password, saltRounds);
        }
      },
      beforeBulkUpdate: async (options: any) => {
        if (options.fields.includes('password') && options.attributes.password) {
          const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');
          options.attributes.password = await bcrypt.hash(options.attributes.password, saltRounds);
        }
      }
    }
  });

  return User;
} 