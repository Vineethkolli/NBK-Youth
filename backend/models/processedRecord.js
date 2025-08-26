import mongoose from 'mongoose';

const processedRecordSchema = new mongoose.Schema({
  snapshotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Snapshot',
    required: true
  },
  eventName: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  selectedCollections: {
    type: [String],
    required: true
  },
  chunksCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['uploaded', 'processing', 'ready', 'error'],
    default: 'uploaded'
  },
  createdBy: {
    type: String,
    required: true
  }
}, { timestamps: true });

// Compound unique index for eventName + year
processedRecordSchema.index({ eventName: 1, year: 1 }, { unique: true });

export default mongoose.model('ProcessedRecord', processedRecordSchema);