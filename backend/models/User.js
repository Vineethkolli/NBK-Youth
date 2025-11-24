import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
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
    sparse: true,
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
userSchema.pre('save', async function () {
  if (!this.registerId) {
    const counter = await Counter.findByIdAndUpdate(
      'registerId',
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.registerId = `R${counter.seq}`;
  }
});

// Hash password before saving
userSchema.pre('save', async function () {
  if (this.isModified('password') && this.password) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) {
    return false;
  }
  return await bcrypt.compare(candidatePassword, this.password);
};

// Extract current hash rounds (to change from 12 to 10)
userSchema.methods.getHashRounds = function () {
  const parts = this.password.split("$");
  return parts.length > 2 ? parseInt(parts[2], 10) : null;
};

export default mongoose.model('User', userSchema);
