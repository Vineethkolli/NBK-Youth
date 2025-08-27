import mongoose from 'mongoose';
import Counter from './Counter.js';

const estimatedExpenseSchema = new mongoose.Schema({
  registerId: {
    type: String,
    required: true
  },
  purpose: {
    type: String,
    required: true
  },
  previousAmount: {
    type: Number,
    default: 0
  },
  presentAmount: {
    type: Number,
    default: 0
  },
  others: {
    type: String,
    default: ''
  },
  EEID: {
    type: String,
    unique: true
  }
}, { timestamps: true });

// Auto-generate EEID (EE0, EE1, EE2, ...)
estimatedExpenseSchema.pre('save', async function (next) {
  if (!this.EEID) {
    const counter = await Counter.findByIdAndUpdate(
      'EEID',
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.EEID = `EE${counter.seq}`;
  }
  next();
});

export default mongoose.model('EstimatedExpense', estimatedExpenseSchema);
