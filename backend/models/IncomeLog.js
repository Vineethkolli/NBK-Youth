import mongoose from 'mongoose';

const incomeLogSchema = new mongoose.Schema({
  incomeId: {
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

export default mongoose.model('IncomeLog', incomeLogSchema);