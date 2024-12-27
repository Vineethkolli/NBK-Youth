import mongoose from 'mongoose';

const momentSchema = new mongoose.Schema({
  title: {
    type: String
  },
  type: {
    type: String,
    enum: ['youtube', 'media'],
    required: true
  },
  url: {
    type: String,
    required: true
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: String,
    required: true
  }
}, { timestamps: true });

export default mongoose.model('Moment', momentSchema);