import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true
  },
  message: {
    type: String,
    trim: true
  },
  image: {
    type: String
  },
  imagePublicId: {
    type: String // Cloudinary public_id for image
  },
  video: {
    type: String
  },
  videoPublicId: {
    type: String // Cloudinary public_id for video
  },
  status: {
    type: String,
    enum: ['enabled', 'disabled'],
    default: 'disabled'
  },
  periodicity: {
    type: Number,
    default: 1,
    min: 1
  },
  duration: {
    type: Number, // Duration in seconds
    default: 0
  },
  createdBy: {
    type: String,
    required: true
  }
}, { timestamps: true });

export default mongoose.model('Banner', bannerSchema);