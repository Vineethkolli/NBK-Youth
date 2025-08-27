import mongoose from 'mongoose';

const estimatedIncomeSchema = new mongoose.Schema({
  registerId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    unique: true
  },
  previousAmount: {
    type: Number,
    default: 0
  },
  presentAmount: {
    type: Number,
    default: 0
  },
  belongsTo: {
    type: String,
    enum: ['youth', 'villagers'],
    default: 'youth'
  },
  status: {
    type: String,
    enum: ['paid', 'not paid'],
    default: 'not paid'
  },
  others: {
    type: String,
    default: ''
  },
  EIID: {
    type: String,
    unique: true
  }
}, { timestamps: true });

// Auto-generate EIID (EI0, EI1, EI2, ...)
estimatedIncomeSchema.pre('save', async function (next) {
  if (!this.EIID) {
    const lastIncome = await mongoose.model('EstimatedIncome')
      .findOne({})
      .sort({ createdAt: -1 });

    let nextId = 0;
    if (lastIncome?.EIID && /^EI\d+$/.test(lastIncome.EIID)) {
      nextId = parseInt(lastIncome.EIID.slice(2)) + 1;
    }
    this.EIID = `EI${nextId}`;
  }
  next();
});

export default mongoose.model('EstimatedIncome', estimatedIncomeSchema);
