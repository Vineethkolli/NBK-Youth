import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true
  },
  response: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const chatHistorySchema = new mongoose.Schema({
  registerId: {
    type: String,
    required: true,
    unique: true
  },
  chats: [chatMessageSchema]
}, { timestamps: true });

export default mongoose.model('ChatHistory', chatHistorySchema);