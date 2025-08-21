import mongoose from 'mongoose';

const financialRecordSchema = new mongoose.Schema({
  eventName: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  amountLeft: {
    type: Number,
    required: true,
    default: 0
  },
  maturityAmount: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: String,
    required: true
  }
}, { timestamps: true });

// Compound index for unique event-year combinations
financialRecordSchema.index({ eventName: 1, year: 1 }, { unique: true });

export default mongoose.model('FinancialRecord', financialRecordSchema);