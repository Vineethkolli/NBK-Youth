import mongoose from 'mongoose';

const paymentLogSchema = new mongoose.Schema({
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
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
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('PaymentLog', paymentLogSchema);
