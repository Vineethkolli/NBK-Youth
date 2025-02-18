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

// Generate incomeId as I0, I1, I2, ...
incomeSchema.pre('save', async function(next) {
  if (!this.incomeId) {
    // Get the count of existing incomes to generate a sequential ID
    const count = await mongoose.model('Income').countDocuments();
    this.incomeId = `I${count}`;
  }
  next();
});

export default mongoose.model('Income', incomeSchema);
