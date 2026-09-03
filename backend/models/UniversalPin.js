import mongoose from 'mongoose';

const universalPinSchema = new mongoose.Schema({
  key: { type: String, default: 'default', unique: true },
  pinHash: { type: String, required: true },
  updatedBy: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model('UniversalPin', universalPinSchema);
