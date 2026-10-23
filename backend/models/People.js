import mongoose from 'mongoose';
import Counter from './Counter.js';

const peopleSchema = new mongoose.Schema({
  pid: { type: String, unique: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  category: { type: String, enum: ['Youth', 'Villager'], required: true },
  street: {
    type: String,
    enum: [
      'Panchayat Street', 'Bodrai Bazar', 'Valeti Bazar', 'Jagrlamudi Bazar',
      'Shivalayam Street', 'Center', 'Patimeedha', 'Malluchama Bazar', 'Others'
    ],
    required: true
  },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
}, { timestamps: true });

peopleSchema.pre('save', async function () {
  if (!this.pid) {
    const counter = await Counter.findByIdAndUpdate(
      'peopleId',
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.pid = `P${counter.seq}`;
  }
});

export default mongoose.model('People', peopleSchema);
