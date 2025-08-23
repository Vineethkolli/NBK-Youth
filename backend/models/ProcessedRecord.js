import mongoose from 'mongoose';

const processedRecordSchema = new mongoose.Schema({
  snapshotId: {
    type: String,
    required: true,
    ref: 'Snapshot'
  },
  eventName: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  selectedCollections: [{
    type: String,
    enum: ['Income', 'Expense', 'EstimatedIncome', 'EstimatedExpense', 'Stats']
  }],
  chunksCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['uploaded', 'processing', 'ready', 'error'],
    default: 'uploaded'
  },
  addedBy: {
    type: String,
    required: true
  }
}, { timestamps: true });

export default mongoose.model('ProcessedRecord', processedRecordSchema);