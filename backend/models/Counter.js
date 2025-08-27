import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // e.g. 'registerId', 'EIID', 'EEID', etc.
  seq: { type: Number, default: 0 }
});

export default mongoose.models.Counter || mongoose.model('Counter', counterSchema);