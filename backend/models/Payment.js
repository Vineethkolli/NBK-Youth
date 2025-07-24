import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    paymentId: {
      type: String,
      unique: true,
    },
    registerId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: String,
    phoneNumber: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Amount must be positive'],
    },
    belongsTo: {
      type: String,
      enum: ['villagers', 'youth'],
      default: 'youth',
    },
    screenshot: {
      type: String,
      required: true,
    },
    transactionStatus: {
      type: String,
      enum: ['pending', 'successful', 'failed'],
      default: 'pending',
    },
    verifyLog: {
      type: String,
      enum: ['verified', 'not verified', 'rejected'],
      default: 'not verified',
    },
    verifiedBy: String,
    verifiedAt: Date,
  },
  { timestamps: true }
);

// Generate paymentId as P0, P1, P2, ...
paymentSchema.pre('save', async function (next) {
  if (!this.paymentId) {
    const count = await mongoose.model('Payment').countDocuments();
    this.paymentId = `P${count}`;
  }
  next();
});

// Avoid overwriting the model
const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);

export default Payment;
