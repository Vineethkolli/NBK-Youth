import mongoose from 'mongoose';

const eventRecordSchema = new mongoose.Schema({
  recordId: {
    type: String,
    unique: true
  },
  eventName: {
    type: String,
    required: true
  },
  recordYear: {
    type: Number,
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  filePublicId: {
    type: String, // Cloudinary public_id (used to delete/replace)
  },
  uploadedBy: {
    type: String,
    required: true
  }
}, { timestamps: true });

// Generate recordId as ER1, ER2, ER3, ...
eventRecordSchema.pre('save', async function(next) {
  if (!this.recordId) {
    const lastRecord = await mongoose.model('EventRecord').findOne({}).sort({ createdAt: -1 });
    let nextId = 1;
    if (lastRecord && lastRecord.recordId && /^ER\d+$/.test(lastRecord.recordId)) {
      nextId = parseInt(lastRecord.recordId.slice(2)) + 1;
    } else {
      const all = await mongoose.model('EventRecord').find({ recordId: { $regex: /^ER\d+$/ } }).sort({ recordId: -1 }).limit(1);
      if (all && all[0] && all[0].recordId) {
        nextId = parseInt(all[0].recordId.slice(2)) + 1;
      }
    }
    this.recordId = `ER${nextId}`;
  }
  next();
});

export default mongoose.model('EventRecord', eventRecordSchema);
