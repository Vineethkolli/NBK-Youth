import mongoose from 'mongoose';
import Counter from './Counter.js';

const estimatedIncomeSchema = new mongoose.Schema({
  registerId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    unique: true
  },
  previousAmount: {
    type: Number,
    default: 0
  },
  presentAmount: {
    type: Number,
    default: 0
  },
  belongsTo: {
    type: String,
    enum: ['youth', 'villagers'],
    default: 'youth'
  },
  status: {
    type: String,
    enum: ['paid', 'not paid'],
    default: 'not paid'
  },
  others: {
    type: String,
    default: ''
  },
  estimatedIncomeId: {
    type: String,
    unique: true
  }
}, { timestamps: true });

estimatedIncomeSchema.pre('save', async function (next) {
  if (!this.estimatedIncomeId) {
    const counter = await Counter.findByIdAndUpdate(
      'estimatedIncomeId',
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.estimatedIncomeId = `EI${counter.seq}`;
  }
  next();
});

export default mongoose.model('EstimatedIncome', estimatedIncomeSchema);
