import mongoose from 'mongoose';

const incomeSchema = new mongoose.Schema({
  incomeId: {
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
    unique: true, 
  },
  email: {
    type: String,
    validate: {
      validator: (v) =>
        !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 
      message: 'Invalid email format',
    },
  },
  phoneNumber: {
    type: String,
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Amount must be a positive number'],
  },
  status: {
    type: String,
    enum: ['paid', 'not paid'],
    default: 'not paid',
  },
  paidDate: {
    type: Date,
    default: null,
  },
  paymentMode: {
    type: String,
    enum: ['cash', 'online', 'web app'],
    required: true,
  },
  belongsTo: {
    type: String,
    enum: ['villagers', 'youth'],
    required: true,
  },
  verifyLog: {
    type: String,
    enum: ['verified', 'not verified', 'rejected'],
    default: 'not verified',
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
  },
  deletedBy: {
    type: String,
  },
}, { timestamps: true });

incomeSchema.pre('save', async function (next) {
  if (!this.incomeId) {
    const lastIncome = await mongoose.model('Income')
      .findOne({})
      .sort({ createdAt: -1 }); // safer than string sort

    let nextId = 0;
    if (lastIncome?.incomeId && /^I\d+$/.test(lastIncome.incomeId)) {
      nextId = parseInt(lastIncome.incomeId.slice(1)) + 1;
    }
    this.incomeId = `I${nextId}`;
  }
  next();
});

export default mongoose.model('Income', incomeSchema);
