import {
  IUserBase,
  IUserCreate,
  IUserUpdate,
  IUserPublic,
  IUserFilters,
  IRefreshTokenBase,
  IRefreshTokenCreate,
  IQueryOptions,
  UserRole
} from './types';

// User repository interface - defines contract for both mongoose and sequelize
export interface IUserRepository {
  // Basic CRUD operations
  create(userData: IUserCreate): Promise<IUserBase>;
  findById(id: string): Promise<IUserBase | null>;
  findByEmail(email: string): Promise<IUserBase | null>;
  findByEmailWithPassword(email: string): Promise<IUserBase | null>;
  update(id: string, userData: IUserUpdate): Promise<IUserBase | null>;
  delete(id: string): Promise<boolean>;
  
  // Query operations
  findMany(filters?: IUserFilters, options?: IQueryOptions): Promise<IUserBase[]>;
  findActiveUsers(options?: IQueryOptions): Promise<IUserBase[]>;
  count(filters?: IUserFilters): Promise<number>;
  
  // Authentication specific operations
  comparePassword(user: IUserBase, candidatePassword: string): Promise<boolean>;
  updatePassword(id: string, newPassword: string): Promise<boolean>;
  updateLastLogin(id: string): Promise<boolean>;
  
  // Email verification operations
  setEmailVerificationToken(id: string, token: string, expiresAt: Date): Promise<boolean>;
  verifyEmail(token: string): Promise<IUserBase | null>;
  clearEmailVerificationToken(id: string): Promise<boolean>;
  
  // Password reset operations
  setPasswordResetToken(id: string, token: string, expiresAt: Date): Promise<boolean>;
  findByPasswordResetToken(token: string): Promise<IUserBase | null>;
  clearPasswordResetToken(id: string): Promise<boolean>;
  
  // Utility methods
  isAdmin(user: IUserBase): boolean;
  isAccountActive(user: IUserBase): boolean;
  toPublic(user: IUserBase): IUserPublic;
}

// Refresh token repository interface
export interface IRefreshTokenRepository {
  // Basic CRUD operations
  create(tokenData: IRefreshTokenCreate): Promise<IRefreshTokenBase>;
  findByToken(token: string): Promise<IRefreshTokenBase | null>;
  findById(id: string): Promise<IRefreshTokenBase | null>;
  delete(id: string): Promise<boolean>;
  deleteByToken(token: string): Promise<boolean>;
  
  // User-specific operations
  findValidTokensForUser(userId: string): Promise<IRefreshTokenBase[]>;
  revokeAllForUser(userId: string): Promise<number>;
  revokeToken(id: string): Promise<boolean>;
  
  // Token validation
  isTokenValid(token: IRefreshTokenBase): boolean;
  updateLastUsed(id: string): Promise<boolean>;
  
  // Cleanup operations
  cleanup(): Promise<number>;
  deleteExpiredTokens(): Promise<number>;
  deleteRevokedTokens(olderThanDays?: number): Promise<number>;
}

// Auth service interface - defines the main auth operations
export interface IAuthService {
  // Authentication operations
  register(userData: IUserCreate): Promise<{ user: IUserPublic; tokens: { accessToken: string; refreshToken: string; expiresIn: number } }>;
  login(email: string, password: string): Promise<{ user: IUserPublic; tokens: { accessToken: string; refreshToken: string; expiresIn: number } }>;
  refreshToken(refreshToken: string): Promise<{ tokens: { accessToken: string; refreshToken: string; expiresIn: number } }>;
  logout(refreshToken: string): Promise<boolean>;
  logoutAll(userId: string): Promise<boolean>;
  
  // Token operations
  generateTokens(user: IUserBase): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }>;
  verifyAccessToken(token: string): Promise<{ userId: string; email: string; role: UserRole } | null>;
  
  // Password operations
  changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean>;
  requestPasswordReset(email: string): Promise<boolean>;
  resetPassword(token: string, newPassword: string): Promise<boolean>;
  
  // Email verification
  requestEmailVerification(userId: string): Promise<boolean>;
  verifyEmail(token: string): Promise<boolean>;
  
  // User management
  getUserById(id: string): Promise<IUserPublic | null>;
  getUserByEmail(email: string): Promise<IUserPublic | null>;
  updateUser(id: string, userData: IUserUpdate): Promise<IUserPublic | null>;
  deactivateUser(id: string): Promise<boolean>;
  
  // Admin operations
  getAllUsers(filters?: IUserFilters, options?: IQueryOptions): Promise<IUserPublic[]>;
  getUsersCount(filters?: IUserFilters): Promise<number>;
  deleteUser(id: string): Promise<boolean>;
}

// Database connection interface - for both mongoose and sequelize
export interface IDatabaseConnection {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  healthCheck(): Promise<{ status: string; details: any }>;
}

// Auth middleware interface
export interface IAuthMiddleware {
  authenticate(req: any, res: any, next: any): Promise<void>;
  authorize(roles: UserRole[]): (req: any, res: any, next: any) => Promise<void>;
  optionalAuth(req: any, res: any, next: any): Promise<void>;
}

// JWT service interface
export interface IJWTService {
  generateAccessToken(payload: { userId: string; email: string; role: UserRole }): string;
  generateRefreshToken(): string;
  verifyAccessToken(token: string): { userId: string; email: string; role: UserRole } | null;
  getTokenExpiration(): number;
}

// Email service interface (for notifications)
export interface IEmailService {
  sendVerificationEmail(email: string, token: string): Promise<boolean>;
  sendPasswordResetEmail(email: string, token: string): Promise<boolean>;
  sendWelcomeEmail(email: string, firstName: string): Promise<boolean>;
}

// Validation service interface
export interface IValidationService {
  validateEmail(email: string): boolean;
  validatePassword(password: string): boolean;
  validateUserData(userData: IUserCreate): { isValid: boolean; errors: string[] };
  validateUserUpdate(userData: IUserUpdate): { isValid: boolean; errors: string[] };
}

// Cache service interface (for JWT blacklisting, etc.)
export interface ICacheService {
  set(key: string, value: any, ttl?: number): Promise<boolean>;
  get(key: string): Promise<any>;
  delete(key: string): Promise<boolean>;
  exists(key: string): Promise<boolean>;
}

// Logging interface
export interface ILogger {
  info(message: string, meta?: any): void;
  error(message: string, error?: Error, meta?: any): void;
  warn(message: string, meta?: any): void;
  debug(message: string, meta?: any): void;
} 