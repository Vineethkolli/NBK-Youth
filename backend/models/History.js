import mongoose from 'mongoose';

const historySchema = new mongoose.Schema({
  snapshotName: {
    type: String,
    required: true,
    unique: true
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

export default mongoose.model('History', historySchema);