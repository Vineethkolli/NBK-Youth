import mongoose from 'mongoose';

const eventLabelSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
    trim: true
  },
  createdBy: {
    type: String,
    required: true
  }
}, { timestamps: true });

export default mongoose.model('EventLabel', eventLabelSchema);