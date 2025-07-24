import mongoose from 'mongoose';

const expenseLogSchema = new mongoose.Schema({
  expenseId: {
    type: String,
    required: true
  },
  registerId: {
    type: String,
    required: true
  },
  originalData: {
    type: Object,
    required: true
  },
  updatedData: {
    type: Object,
    required: true
  }
}, { timestamps: true });

export default mongoose.model('ExpenseLog', expenseLogSchema);