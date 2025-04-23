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
  video: {
    type: String
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

// Ensure at least one field (title, message, image, or video) is provided
bannerSchema.pre('save', function(next) {
  if (!this.title && !this.message && !this.image && !this.video) {
    next(new Error('At least one of title, message, image, or video must be provided'));
  }
  next();
});

export default mongoose.model('Banner', bannerSchema);