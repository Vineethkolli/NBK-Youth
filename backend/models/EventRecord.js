import mongoose from 'mongoose';

const eventRecordSchema = new mongoose.Schema({
  eventName: {
    type: String,
    required: true
  },
  recordYear: {
    type: Number,
    required: true
  },
  fileUrlEnglish: {
    type: String
  },
  filePublicIdEnglish: {
    type: String
  },
  fileUrlTelugu: {
    type: String
  },
  filePublicIdTelugu: {
    type: String
  },
  uploadedBy: {
    type: String,
    required: true
  }
}, { timestamps: true });

// Compound index for unique event-year combinations (eventName + recordYear)
eventRecordSchema.index({ eventName: 1, recordYear: 1 }, { unique: true });

export default mongoose.model('EventRecord', eventRecordSchema);
