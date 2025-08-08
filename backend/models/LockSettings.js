import mongoose from 'mongoose';

const lockSettingsSchema = new mongoose.Schema({
  isLocked: {
    type: Boolean,
    default: false
  },
  lockedBy: {
    type: String,
    required: true
  }
}, { timestamps: true });

export default mongoose.model('LockSettings', lockSettingsSchema);