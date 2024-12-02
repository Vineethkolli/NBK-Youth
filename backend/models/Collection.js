import mongoose from 'mongoose';

const songSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  }
}, { timestamps: true });

const subCollectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  songs: [songSchema]
}, { timestamps: true });

const collectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  subCollections: [subCollectionSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

export default mongoose.model('Collection', collectionSchema);