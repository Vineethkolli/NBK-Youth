import mongoose from 'mongoose';

const slideSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true
  },
  mediaPublicId: {
    type: String // Cloudinary public_id for slide media
  },
  type: {
    type: String,
    enum: ['image', 'video'],
    required: true
  },
  order: {
    type: Number,
    required: true
  },
  createdBy: {
    type: String,
    required: true
  }
}, { timestamps: true });

export default mongoose.model('Slide', slideSchema);