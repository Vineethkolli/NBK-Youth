import mongoose from 'mongoose';
import Counter from './Counter.js';

const eventRecordSchema = new mongoose.Schema({
  recordId: {
    type: String,
    unique: true
  },
  eventName: {
    type: String,
    required: true
  },
  recordYear: {
    type: Number,
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  filePublicId: {
    type: String, 
  },
  uploadedBy: {
    type: String,
    required: true
  }
}, { timestamps: true });

// Generate recordId as ER1, ER2, ER3, ...
eventRecordSchema.pre('save', async function(next) {
  if (!this.recordId) {
    const counter = await Counter.findByIdAndUpdate(
      'recordId',
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.recordId = `ER${counter.seq}`;
  }
  next();
});

export default mongoose.model('EventRecord', eventRecordSchema);
