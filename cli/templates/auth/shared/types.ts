// Shared types for auth module - works with both mongoose and sequelize

// User role type
export type UserRole = 'user' | 'admin';

// Common user interface (database agnostic)
export interface IUserBase {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// User creation input (for registration)
export interface IUserCreate {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
}

// User update input
export interface IUserUpdate {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  isActive?: boolean;
  isEmailVerified?: boolean;
  lastLoginAt?: Date;
}

// User public profile (no sensitive data)
export interface IUserPublic {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Refresh token interface
export interface IRefreshTokenBase {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  isRevoked: boolean;
  revokedAt?: Date;
  userAgent?: string;
  ipAddress?: string;
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Refresh token creation input
export interface IRefreshTokenCreate {
  userId: string;
  token: string;
  expiresAt: Date;
  userAgent?: string;
  ipAddress?: string;
}

// JWT payload interface
export interface IJWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// JWT token pair
export interface ITokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Login credentials
export interface ILoginCredentials {
  email: string;
  password: string;
}

// Registration data
export interface IRegistrationData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

// Password reset request
export interface IPasswordResetRequest {
  email: string;
}

// Password reset data
export interface IPasswordResetData {
  token: string;
  newPassword: string;
}

// Email verification data
export interface IEmailVerificationData {
  token: string;
}

// Auth service response types
export interface IAuthResponse {
  user: IUserPublic;
  tokens: ITokenPair;
}

export interface ILoginResponse extends IAuthResponse {}

export interface IRegisterResponse extends IAuthResponse {}

export interface IRefreshTokenResponse {
  tokens: ITokenPair;
}

// Database query options
export interface IQueryOptions {
  page?: number;
  limit?: number;
  sort?: string;
  select?: string[];
}

// User query filters
export interface IUserFilters {
  email?: string;
  role?: UserRole;
  isActive?: boolean;
  isEmailVerified?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
}

// Auth middleware request user
export interface IAuthUser {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;
}

// Express request with user
declare global {
  namespace Express {
    interface Request {
      user?: IAuthUser;
    }
  }
} 