import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  dateTime: {
    type: Date,
    required: true
  },
  registerId: {
    type: String,
    required: true
  }
}, { timestamps: true });

export default mongoose.model('Event', eventSchema);