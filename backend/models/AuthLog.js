import mongoose from 'mongoose';

const authLogSchema = new mongoose.Schema({
  registerId: { type: String, required: true },
  name: { type: String, required: true },
  action: { type: String, enum: ['signin', 'signup'], required: true },
  deviceInfo: {
    accessMode: {
      type: String,
    },
    deviceType: String,
    deviceModel: String,
    platform: String,
    browser: {
      name: String,
      version: String,
      osName: String,
      osVersion: String
    }
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('AuthLog', authLogSchema);
