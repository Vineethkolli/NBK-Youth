import mongoose from 'mongoose';

const authLogSchema = new mongoose.Schema({
  registerId: { type: String, required: true },
  name: { type: String, required: true },
  action: { type: String, enum: ['signin', 'signup', 'signup-google','signin-google'], required: true },

  deviceInfo: {
    accessMode: String,
    deviceType: String,
    deviceModel: String,
    platform: String,
    browser: {
      name: String,
      version: String,
      osName: String,
      osVersion: String
    }
  }
}, { timestamps: true });

authLogSchema.index({ registerId: 1, createdAt: -1 });
authLogSchema.index({ createdAt: -1 });
authLogSchema.index({ action: 1, createdAt: -1 });

export default mongoose.model('AuthLog', authLogSchema);
