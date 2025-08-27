import mongoose from 'mongoose';

const estimatedExpenseSchema = new mongoose.Schema({
  registerId: {
    type: String,
    required: true
  },
  purpose: {
    type: String,
    required: true
  },
  previousAmount: {
    type: Number,
    default: 0
  },
  presentAmount: {
    type: Number,
    default: 0
  },
  others: {
    type: String,
    default: ''
  },
  EEID: {
    type: String,
    unique: true
  }
}, { timestamps: true });

// Auto-generate EEID (EE0, EE1, EE2, ...)
estimatedExpenseSchema.pre('save', async function (next) {
  if (!this.EEID) {
    const lastExpense = await mongoose.model('EstimatedExpense')
      .findOne({})
      .sort({ createdAt: -1 });

    let nextId = 0;
    if (lastExpense?.EEID && /^EE\d+$/.test(lastExpense.EEID)) {
      nextId = parseInt(lastExpense.EEID.slice(2)) + 1;
    }
    this.EEID = `EE${nextId}`;
  }
  next();
});

export default mongoose.model('EstimatedExpense', estimatedExpenseSchema);
