import mongoose from 'mongoose';

const snapshotSchema = new mongoose.Schema({
  eventName: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  collections: {
    Income: [{ type: mongoose.Schema.Types.Mixed }],
    Expense: [{ type: mongoose.Schema.Types.Mixed }],
    Event: [{ type: mongoose.Schema.Types.Mixed }]
  },
  stats: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  addedBy: {
    type: String,
    required: true
  }
}, { timestamps: true });

snapshotSchema.index({ eventName: 1, year: 1 }, { unique: true });

export default mongoose.model('Snapshot', snapshotSchema);
