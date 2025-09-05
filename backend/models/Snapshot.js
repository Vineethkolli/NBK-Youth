import mongoose from 'mongoose';
import Counter from './Counter.js';

const snapshotSchema = new mongoose.Schema({
  snapshotId: {
    type: String,
    unique: true
  },
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

// Compound unique index for eventName + year
snapshotSchema.index({ eventName: 1, year: 1 }, { unique: true });

// Generate snapshotId as S1, S2, S3, ...
snapshotSchema.pre('save', async function(next) {
  if (!this.snapshotId) {
    const counter = await Counter.findByIdAndUpdate(
      'snapshotId',
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.snapshotId = `S${counter.seq}`;
  }
  next();
});

export default mongoose.model('Snapshot', snapshotSchema);