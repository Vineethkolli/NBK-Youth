import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  tokenHash: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  deviceInfo: {
    deviceType: {
      type: String,
      enum: ['mobile', 'tablet', 'desktop', 'unknown'],
      default: 'unknown'
    },
    deviceModel: {
      type: String,
      default: 'unknown'
    },
    os: {
      type: String,
      default: 'unknown'
    },
    browserName: {
      type: String,
      default: 'unknown'
    },
    accessMode: {
      type: String,
      enum: ['pwa', 'standalone', 'twa', 'website', 'addtohomescreen', 'unknown'],
      default: 'website'
    }
  },
  location: {
    city: {
      type: String,
      default: null
    },
    state: {
      type: String,
      default: null
    },
    country: {
      type: String,
      default: null
    }
  },
  action: {
    type: String,
    enum: ['signin', 'signup', 'google-signin', 'google-signup'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  isValid: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: false
});

sessionSchema.index({ userId: 1, isValid: 1, expiresAt: 1 });

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('Session', sessionSchema);
