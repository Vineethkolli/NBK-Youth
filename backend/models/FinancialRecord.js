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
  status: {
    type: String,
    enum: ["Conducted", "Not Conducted"], 
    default: "Conducted"
  },
  amountLeft: {
    type: Number,
    required: true,
    default: 0
  },
  maturityAmount: {
    type: Number,
    required: true,
    default: 0
  },

  // FD details
  fdStartDate: {
    type: Date
  },
  fdMaturityDate: {
    type: Date
  },
  fdAccount: {           
    type: String
  },

  remarks: {
    type: String,
    trim: true
  },

  createdBy: {
    type: String,
    required: true
  }
}, { timestamps: true });

// Compound index for unique event-year combinations
financialRecordSchema.index({ eventName: 1, year: 1 }, { unique: true });

export default mongoose.model('FinancialRecord', financialRecordSchema);
