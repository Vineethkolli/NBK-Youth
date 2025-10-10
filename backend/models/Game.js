import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['', 'eliminated', 'winner-1st', 'winner-2nd', 'winner-3rd'],
    default: ''
  },
  timeCompleted: {
    type: Number, 
    default: null
  },
  registerId: {            
    type: String,         
    required: true
  }
}, { timestamps: true });

const gameSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  timerRequired: {
    type: Boolean,
    default: false
  },
  players: [playerSchema],
  registerId: {           
    type: String,
    required: true
  }
}, { timestamps: true });

export default mongoose.model('Game', gameSchema);
