import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['', 'eliminated', 'winner-1st', 'winner-2nd', 'winner-3rd'],
    default: ''
  },
  timeCompleted: {
    type: Number, // Store time in milliseconds
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

const gameSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  timerRequired: {
    type: Boolean,
    default: false
  },
  players: [playerSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

export default mongoose.model('Game', gameSchema);