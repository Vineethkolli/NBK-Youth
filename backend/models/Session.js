import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    lastActive: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    deviceInfo: {
      device: { type: String, default: 'unknown' },
      os: { type: String, default: 'unknown' },
      browser: { type: String, default: 'unknown' },
      accessMode: { type: String, default: 'unknown' },
    },
    location: {
      state: { type: String, default: 'unknown' },
      country: { type: String, default: 'unknown' },
    },
    ipAddress: {
      type: String,
      default: null,
    },
    isValid: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('Session', sessionSchema);
