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
    type: String,
    required: true
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

export default mongoose.model('EventRecord', eventRecordSchema);
