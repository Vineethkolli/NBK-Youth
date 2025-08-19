import mongoose from 'mongoose';

const recordSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true
  },
  recordYear: {
    type: String,
    required: true
  },
  viewingFileUrl: {
    type: String,
    required: true
  },
  processingFileUrl: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['uploaded', 'processing', 'ready', 'error'],
    default: 'uploaded'
  },
  processedDate: {
    type: Date,
    default: null
  },
  errorMessage: {
    type: String,
    default: null
  }
}, { timestamps: true });

export default mongoose.model('Record', recordSchema);