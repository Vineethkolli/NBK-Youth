import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Counter from './Counter.js';

const userSchema = new mongoose.Schema({
  registerId: {
    type: String,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    unique: true,
    sparse: true
  },
  phoneNumber: {
    type: String,
    unique: true,
    required: true
  },
  password: {
    type: String
  },
  googleId: {
    type: String,
    unique: true,
    sparse: undefined,
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'developer', 'financier'],
    default: 'user'
  },
  category: {
    type: String,
    enum: ['youth', 'general'],
    default: 'general'
  },
  profileImage: {
    type: String,
    default: null
  },
  profileImagePublicId: {
    type: String,
    default: null
  },
  language: {
    type: String,
    enum: ['en', 'te'],
    default: 'en'
  }
}, { timestamps: true });

// Generate registerId
userSchema.pre('save', async function (next) {
  if (!this.registerId) {
    const counter = await Counter.findByIdAndUpdate(
      'registerId',
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.registerId = `R${counter.seq}`;
  }
  next();
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (this.isModified('password') && this.password) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) {
    return false;
  }
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);
