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
  fileUrl: {
    type: String,
    required: true
  },
  filePublicId: {
    type: String
  },
  uploadedBy: {
    type: String,
    required: true
  }
}, { timestamps: true });

export default mongoose.model('EventRecord', eventRecordSchema);
