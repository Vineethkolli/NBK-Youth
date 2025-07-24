import mongoose from 'mongoose';

const subExpenseSchema = new mongoose.Schema({
  subPurpose: {
    type: String,
    required: true
  },
  subAmount: {
    type: Number,
    required: true,
    min: [0, 'Sub amount must be a positive number']
  },
  billImage: {
    type: String  // URL of the bill image
  }
});

const expenseSchema = new mongoose.Schema({
  expenseId: {
    type: String,
    unique: true
  },
  registerId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Amount must be a positive number']
  },
  amountReturned: {
    type: Number,
    default: 0,
    min: [0, 'Returned amount must be a positive number']
  },
  paymentMode: {
    type: String,
    enum: ['cash', 'online'],
    required: true
  },
  purpose: {
    type: String,
    required: true
  },
  subExpenses: [subExpenseSchema],
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

// Generate expenseId as E0, E1, E2, ...
expenseSchema.pre('save', async function(next) {
  if (!this.expenseId) {
    const count = await mongoose.model('Expense').countDocuments();
    this.expenseId = `E${count}`;
  }
  next();
});

export default mongoose.model('Expense', expenseSchema);