import mongoose from 'mongoose';

const estimatedExpenseSchema = new mongoose.Schema({
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
    required: true,
    unique: true
  }
}, { timestamps: true });

export default mongoose.model('EstimatedExpense', estimatedExpenseSchema);