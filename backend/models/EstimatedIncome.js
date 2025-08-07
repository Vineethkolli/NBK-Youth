import mongoose from 'mongoose';

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
    required: true,
    unique: true
  }
}, { timestamps: true });

export default mongoose.model('EstimatedIncome', estimatedIncomeSchema);