import mongoose from 'mongoose';

const timelineRecordSchema = new mongoose.Schema({
  eventName: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Conducted', 'Not Conducted'],
    default: 'Conducted'
  },
  amountCollected: {
    type: Number,
    required: true,
    default: 0
  },
  amountSpent: {
    type: Number,
    required: true,
    default: 0
  },
  previousAmount: {
    type: Number,
    required: true
  },
  additionalAmount: {
    type: Number,
    required: true,
    default: 0
  },
  remarks: {
    type: String,
    trim: true
  },
  responsible: {
    type: String,
    trim: true
  },
  createdBy: {
    type: String,
    required: true
  }
}, { timestamps: true });

timelineRecordSchema.index({ eventName: 1, year: 1 }, { unique: true });

export default mongoose.model('TimelineRecord', timelineRecordSchema);
