import mongoose from 'mongoose';

const songSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  mediaPublicId: {
    type: String 
  },
  registerId: {           
    type: String,
    required: true
  }
}, { timestamps: true });

const vibeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  songs: [songSchema],
  registerId: {           
    type: String,
    required: true
  }
}, { timestamps: true });

export default mongoose.model('VibeSong', vibeSchema);
