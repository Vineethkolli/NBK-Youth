import mongoose from 'mongoose';

const fileAssetSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  filename: { type: String, required: true, trim: true },
  url: { type: String, required: true },
  publicId: { type: String, required: true },
  resourceType: { type: String, default: 'auto' },
  kind: { type: String, enum: ['asset', 'dump'], required: true },
  passwordProtected: { type: Boolean, default: false },
  createdBy: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model('FileAsset', fileAssetSchema);
