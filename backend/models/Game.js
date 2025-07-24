import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    validate: {
      validator: function (value) {
        const game = this.ownerDocument(); 
        return !game.players.some(player => player.name === value && player._id.toString() !== this._id.toString());
      },
      message: 'Player name must be unique within the game.'
    }
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
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

export default mongoose.model('Game', gameSchema);