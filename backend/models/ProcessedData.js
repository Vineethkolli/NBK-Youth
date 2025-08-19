import mongoose from 'mongoose';

const processedDataSchema = new mongoose.Schema({
  recordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Record',
    required: true
  },
  recordYear: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  chunks: [{
    text: {
      type: String,
      required: true
    },
    embedding: {
      type: [Number],
      required: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  }],
  structuredData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  totalIncome: {
    type: Number,
    default: 0
  },
  totalExpense: {
    type: Number,
    default: 0
  },
  entryCount: {
    type: Number,
    default: 0
  },
  extractedFields: {
    type: [String],
    default: []
  }
}, { timestamps: true });

// Create vector search index for embeddings
processedDataSchema.index({ 'chunks.embedding': '2dsphere' });

export default mongoose.model('ProcessedData', processedDataSchema);