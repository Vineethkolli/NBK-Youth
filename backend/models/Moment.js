// models/Moment.js
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
    type: String // Cloudinary/Drive public_id for media
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
    type: String // For youtube and drive types
  },
  mediaFiles: [mediaFileSchema], // For upload type
  order: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: String,
    required: true
  }
}, { timestamps: true });

export default mongoose.model('Moment', momentSchema);
