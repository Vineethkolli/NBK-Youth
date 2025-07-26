
import mongoose from 'mongoose';

const committeeSchema = new mongoose.Schema({
  registerId:  { type: String, required: true, unique: true },
  order:       { type: Number, required: true },
  addedBy:     { type: String, required: true },
}, { timestamps: true });

export default mongoose.model('Committee', committeeSchema);
