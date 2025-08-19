import mongoose from 'mongoose';

const chatHistorySchema = new mongoose.Schema({
  registerId: {
    type: String,
    required: true
  },
  conversations: [{
    date: {
      type: Date,
      default: Date.now
    },
    userMessage: {
      type: String,
      required: true
    },
    viniResponse: {
      type: String,
      required: true
    },
    responseTime: {
      type: Number, // milliseconds
      default: 0
    },
    dataSource: {
      type: String,
      enum: ['app_data', 'historical_records', 'mixed', 'general'],
      default: 'general'
    }
  }]
}, { timestamps: true });

export default mongoose.model('ChatHistory', chatHistorySchema);