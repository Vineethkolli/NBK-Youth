import mongoose from 'mongoose';

const songSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  }
  ,
  mediaPublicId: {
    type: String // Cloudinary public_id for song media
  }
}, { timestamps: true });

const vibeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  songs: [songSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

export default mongoose.model('VibeSong', vibeSchema);