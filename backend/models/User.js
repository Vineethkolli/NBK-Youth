import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});

const Counter = mongoose.model('Counter', counterSchema);

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
    sparse: true,
    unique: true
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
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
    type: String, // Cloudinary public_id for profile image
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
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);