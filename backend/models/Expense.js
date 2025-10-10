import mongoose from 'mongoose';
import Counter from './Counter.js';

const expenseSchema = new mongoose.Schema({
  expenseId: {
    type: String,
    unique: true
  },
  registerId: {
    type: String,
    required: true
  },
  purpose: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Amount must be a positive number']
  },
  paymentMode: {
    type: String,
    enum: ['cash', 'online'],
    required: true
  },
  name: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
  },
  billImage: {
    type: String  
  },
  billImagePublicId: {
    type: String 
  },
  verifyLog: {
    type: String,
    enum: ['verified', 'pending', 'not verified', 'rejected'],
    default: 'pending'
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedBy: {
    type: String
  },
  deletedAt: {
    type: Date
  }
}, { timestamps: true });

// Auto-generate expenseId as E1, E2, ...
expenseSchema.pre('save', async function (next) {
  if (!this.expenseId) {
    const counter = await Counter.findByIdAndUpdate(
      'expenseId',
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.expenseId = `E${counter.seq}`;
  }
  next();
});

export default mongoose.model('Expense', expenseSchema);