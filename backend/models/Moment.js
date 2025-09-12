import mongoose from 'mongoose';

const mediaFileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['image', 'video'],
    required: true
  },
  order: {
    type: Number,
    default: 0
  },
  mediaPublicId: {
    type: String 
  }
}, { timestamps: true });

const momentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['youtube', 'drive', 'upload'],
    required: true
  },
  url: {
    type: String 
  },
  mediaFiles: [mediaFileSchema],
  order: {
    type: Number,
    default: 0
  },
  subfolderName: {
    type: String // Name of the subfolder in Google Drive
  },
  subfolderId: {
    type: String // Google Drive folder ID for this moment's media
  },
  createdBy: {
    type: String,
    required: true
  }
}, { timestamps: true });

export default mongoose.model('Moment', momentSchema);
