import mongoose from 'mongoose';

const previousYearSchema = new mongoose.Schema({
  amount: {
    type: Number,
    default: 0
  },
    registerId: {   
    type: String,
    required: true
  }
}, { timestamps: true });

export default mongoose.model('PreviousYear', previousYearSchema);