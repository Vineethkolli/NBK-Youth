import mongoose from 'mongoose';

const previousYearSchema = new mongoose.Schema({
  amount: {
    type: Number,
    default: 0
  },
  additionalAmount: {
    type: Number,
    default: 0
  },
  remarks: {
    type: String,
    default: ''
  },
    registerId: {   
    type: String,
    required: true
  }
}, { timestamps: true });

export default mongoose.model('PreviousYear', previousYearSchema);