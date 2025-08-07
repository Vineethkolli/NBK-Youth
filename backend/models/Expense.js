import mongoose from 'mongoose';

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
    type: String  // URL of the bill image
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

// Generate expenseId as E0, E1, E2, ...
// Always assign expenseId as E{max+1}, never reuse deleted IDs
expenseSchema.pre('save', async function(next) {
  if (!this.expenseId) {
    // Find the highest expenseId number
    const lastExpense = await mongoose.model('Expense').findOne({}).sort({ expenseId: -1 });
    let nextId = 0;
    if (lastExpense && lastExpense.expenseId && /^E\d+$/.test(lastExpense.expenseId)) {
      nextId = parseInt(lastExpense.expenseId.slice(1)) + 1;
    }
    this.expenseId = `E${nextId}`;
  }
  next();
});

export default mongoose.model('Expense', expenseSchema);