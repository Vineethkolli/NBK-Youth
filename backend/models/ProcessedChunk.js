import mongoose from 'mongoose';

const processedChunkSchema = new mongoose.Schema({
  eventName: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  chunkText: {
    type: String,
    required: true
  },
  embedding: {
    type: [Number],
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
    snapshotId: String,
    selectedCollections: [String]
  },
  status: {
    type: String,
    enum: ['processing', 'ready'],
    default: 'processing'
  },
  createdBy: {
    type: String,
    required: true
  }
}, { timestamps: true });

// Index for vector similarity search
processedChunkSchema.index({ embedding: 1 });
processedChunkSchema.index({ eventName: 1, year: 1 });

export default mongoose.model('ProcessedChunk', processedChunkSchema);