import mongoose from 'mongoose';
import crypto from 'crypto';

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  refreshTokenHash: {
    type: String,
    required: true,
    unique: true
  },
  deviceInfo: {
    type: String,
    default: 'Unknown Device'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  lastUsedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true
  }
});

// Index for automatic cleanup of expired sessions
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method to hash refresh token
sessionSchema.statics.hashToken = function(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Static method to create a session
sessionSchema.statics.createSession = async function(userId, refreshToken, deviceInfo) {
  const refreshTokenHash = this.hashToken(refreshToken);
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 12); // 12 months from now

  // Convert deviceInfo to string if it's an object
  let deviceInfoString = deviceInfo;
  if (typeof deviceInfo === 'object' && deviceInfo !== null) {
    // Create a readable string from device info object
    const browser = deviceInfo.browser?.name || 'Unknown Browser';
    const version = deviceInfo.browser?.version?.split('.')[0] || '';
    const os = deviceInfo.browser?.osName || deviceInfo.platform || 'Unknown OS';
    deviceInfoString = `${browser}${version ? ' ' + version : ''} on ${os}`;
  }

  return await this.create({
    userId,
    refreshTokenHash,
    deviceInfo: deviceInfoString || 'Unknown Device',
    expiresAt
  });
};

// Static method to find session by token
sessionSchema.statics.findByToken = async function(refreshToken) {
  const refreshTokenHash = this.hashToken(refreshToken);
  return await this.findOne({ refreshTokenHash });
};

// Instance method to update last used time and extend expiry (sliding window)
sessionSchema.methods.updateLastUsed = async function() {
  this.lastUsedAt = new Date();
  // Extend expiry by 12 months from now (sliding window)
  this.expiresAt = new Date();
  this.expiresAt.setMonth(this.expiresAt.getMonth() + 12);
  await this.save();
};

// Static method to cleanup expired sessions (can be called periodically)
sessionSchema.statics.cleanupExpired = async function() {
  const now = new Date();
  return await this.deleteMany({ expiresAt: { $lt: now } });
};

export default mongoose.model('Session', sessionSchema);
