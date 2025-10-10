import mongoose from 'mongoose';

const paymentDetailsSchema = new mongoose.Schema({
  upiNumber: {
    type: String,
    required: true
  },
  upiId: {
    type: String,
    required: true
  },
  accountHolder: {
    type: String,
    required: true
  },
  registerId: {   
    type: String,
    required: true
  }
}, { timestamps: true });

export default mongoose.model('PaymentDetails', paymentDetailsSchema);
