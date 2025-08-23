import mongoose from 'mongoose';

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
    EstimatedIncome: [{ type: mongoose.Schema.Types.Mixed }],
    EstimatedExpense: [{ type: mongoose.Schema.Types.Mixed }]
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
    const lastSnapshot = await mongoose.model('Snapshot').findOne({}).sort({ snapshotId: -1 });
    let nextId = 1;
    if (lastSnapshot && lastSnapshot.snapshotId && /^S\d+$/.test(lastSnapshot.snapshotId)) {
      nextId = parseInt(lastSnapshot.snapshotId.slice(1)) + 1;
    }
    this.snapshotId = `S${nextId}`;
  }
  next();
});

export default mongoose.model('Snapshot', snapshotSchema);