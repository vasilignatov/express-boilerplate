import mongoose, { Document, Schema } from 'mongoose';

export interface IRefreshToken extends Document {
  userId: mongoose.Types.ObjectId;
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

const refreshTokenSchema = new Schema<IRefreshToken>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  isRevoked: {
    type: Boolean,
    default: false,
    index: true
  },
  revokedAt: {
    type: Date
  },
  userAgent: {
    type: String,
    maxlength: 500
  },
  ipAddress: {
    type: String,
    maxlength: 45 // IPv6 max length
  },
  lastUsedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound indexes for better query performance
refreshTokenSchema.index({ userId: 1, isRevoked: 1 });
refreshTokenSchema.index({ userId: 1, expiresAt: 1 });
refreshTokenSchema.index({ token: 1, isRevoked: 1 });
refreshTokenSchema.index({ expiresAt: 1, isRevoked: 1 });

// TTL index to automatically delete expired tokens after 30 days
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

// Instance method to check if token is valid
refreshTokenSchema.methods.isValid = function(): boolean {
  return !this.isRevoked && this.expiresAt > new Date();
};

// Instance method to revoke token
refreshTokenSchema.methods.revoke = function(): Promise<IRefreshToken> {
  this.isRevoked = true;
  this.revokedAt = new Date();
  return this.save();
};

// Static method to find valid tokens for user
refreshTokenSchema.statics.findValidTokensForUser = function(userId: string) {
  return this.find({
    userId,
    isRevoked: false,
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 });
};

// Static method to revoke all tokens for user
refreshTokenSchema.statics.revokeAllForUser = function(userId: string) {
  return this.updateMany(
    { userId, isRevoked: false },
    { 
      isRevoked: true, 
      revokedAt: new Date() 
    }
  );
};

// Static method to cleanup expired and revoked tokens
refreshTokenSchema.statics.cleanup = function() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  return this.deleteMany({
    $or: [
      { expiresAt: { $lt: new Date() } },
      { isRevoked: true, revokedAt: { $lt: thirtyDaysAgo } }
    ]
  });
};

// Pre-save middleware to update lastUsedAt when token is accessed
refreshTokenSchema.pre('findOneAndUpdate', function() {
  this.set({ lastUsedAt: new Date() });
});

export const RefreshToken = mongoose.model<IRefreshToken>('RefreshToken', refreshTokenSchema); 