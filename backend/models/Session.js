import mongoose from 'mongoose';

const deviceInfoSchema = new mongoose.Schema(
  {
    deviceType: { type: String, default: 'unknown' },
    deviceModel: { type: String, default: 'unknown' },
    os: { type: String, default: 'unknown' },
    osName: { type: String, default: 'unknown' },
    osVersion: { type: String, default: 'unknown' },
    browserName: { type: String, default: 'unknown' },
    browserVersion: { type: String, default: 'unknown' },
    accessMode: { type: String, default: 'website' }
  },
  { _id: false }
);

const locationSchema = new mongoose.Schema(
  {
    city: { type: String, default: 'unknown' },
    state: { type: String, default: 'unknown' },
    country: { type: String, default: 'unknown' }
  },
  { _id: false }
);

const sessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tokenHash: { type: String, required: true, index: true },
    deviceInfo: deviceInfoSchema,
    location: locationSchema,
    ipAddress: { type: String, default: 'unknown' },
    action: {
      type: String,
      enum: [
        'signin',
        'signup',
        'google-signin',
        'google-signup',
        'password-reset',
        'session-refresh'
      ],
      default: 'signin'
    },
    lastActive: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    isValid: { type: Boolean, default: true }
  },
  { timestamps: true }
);

sessionSchema.index({ userId: 1, updatedAt: -1 });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('Session', sessionSchema);
