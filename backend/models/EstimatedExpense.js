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
  estimatedExpenseId: {
    type: String,
    unique: true
  }
}, { timestamps: true });

estimatedExpenseSchema.pre('save', async function (next) {
  if (!this.estimatedExpenseId) {
    const counter = await Counter.findByIdAndUpdate(
      'estimatedExpenseId',
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.estimatedExpenseId = `EE${counter.seq}`;
  }
  next();
});

export default mongoose.model('EstimatedExpense', estimatedExpenseSchema);
