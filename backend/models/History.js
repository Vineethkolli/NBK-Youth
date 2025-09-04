import mongoose from 'mongoose';

const historySchema = new mongoose.Schema({
  eventName: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  snapshotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Snapshot',
    required: true
  },
  selectedCollections: {
    type: [String],
    required: true
  },
  snapshotData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  createdBy: {
    type: String,
    required: true
  }
}, { timestamps: true });

// Compound unique index for eventName + year
historySchema.index({ eventName: 1, year: 1 }, { unique: true });

export default mongoose.model('History', historySchema);