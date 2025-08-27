import mongoose from 'mongoose';
import Counter from './Counter.js';

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
    screenshotPublicId: {
      type: String // Cloudinary public_id for payment screenshot
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
// Always assign paymentId as P{max+1}, never reuse deleted IDs
paymentSchema.pre('save', async function (next) {
  if (!this.paymentId) {
    const counter = await Counter.findByIdAndUpdate(
      'paymentId',
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.paymentId = `P${counter.seq}`;
  }
  next();
});


export default mongoose.model('Payment', paymentSchema);