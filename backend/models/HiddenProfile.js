import mongoose from 'mongoose';

const hiddenProfileSchema = new mongoose.Schema({
  profileId: {
    type: String,
    required: true,
    unique: true
  },
  profileType: {
    type: String,
    enum: ['Income', 'Expense'],
    default: 'Income',
    required: true
  },
  hiddenBy: {
    type: String,
    required: true
  }
}, { timestamps: true });

export default mongoose.model('HiddenProfile', hiddenProfileSchema);