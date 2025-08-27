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
  EIID: {
    type: String,
    unique: true
  }
}, { timestamps: true });

// Auto-generate EIID (EI0, EI1, EI2, ...)
estimatedIncomeSchema.pre('save', async function (next) {
  if (!this.EIID) {
    const counter = await Counter.findByIdAndUpdate(
      'EIID',
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.EIID = `EI${counter.seq}`;
  }
  next();
});

export default mongoose.model('EstimatedIncome', estimatedIncomeSchema);
