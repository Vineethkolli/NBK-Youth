import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import Collection from '../models/Collection.js';
import { uploadToCloudinary } from '../config/cloudinary.js';

const router = express.Router();

// Get all collections
router.get('/', async (req, res) => {
  try {
    const collections = await Collection.find().sort({ createdAt: -1 });
    res.json(collections);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch collections' });
  }
});

// Create collection (privileged users only)
router.post('/', 
  auth, 
  checkRole(['developer', 'financier', 'admin']),
  async (req, res) => {
    try {
      const collection = await Collection.create({
        name: req.body.name,
        createdBy: req.user.id
      });
      res.status(201).json(collection);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create collection' });
    }
  }
);

// Create sub-collection
router.post('/:collectionId/subcollections',
  auth,
  checkRole(['developer', 'financier', 'admin']),
  async (req, res) => {
    try {
      const collection = await Collection.findById(req.params.collectionId);
      if (!collection) {
        return res.status(404).json({ message: 'Collection not found' });
      }

      collection.subCollections.push({ name: req.body.name });
      await collection.save();
      res.status(201).json(collection);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create sub-collection' });
    }
  }
);

// Upload song
router.post('/:collectionId/subcollections/:subCollectionId/songs',
  auth,
  async (req, res) => {
    try {
      const collection = await Collection.findById(req.params.collectionId);
      if (!collection) {
        return res.status(404).json({ message: 'Collection not found' });
      }

      const subCollection = collection.subCollections.id(req.params.subCollectionId);
      if (!subCollection) {
        return res.status(404).json({ message: 'Sub-collection not found' });
      }

      // Validate file format
      const fileData = req.body.file;
      const fileFormat = fileData.split(';')[0].split('/')[1];
      const allowedFormats = ['mp3', 'wav', 'aac', 'flac', 'mpeg'];
      
      if (!allowedFormats.includes(fileFormat.toLowerCase())) {
        return res.status(400).json({ 
          message: 'Invalid file format. Allowed formats: MP3, WAV, AAC, FLAC' 
        });
      }

      // Upload to Cloudinary with audio type
      const url = await uploadToCloudinary(fileData, 'audio');

      // Add song to sub-collection
      subCollection.songs.push({
        name: req.body.name,
        url
      });

      await collection.save();
      res.status(201).json(collection);
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ message: 'Failed to upload song' });
    }
  }
);

// Delete collection
router.delete('/:id',
  auth,
  checkRole(['developer', 'financier', 'admin']),
  async (req, res) => {
    try {
      await Collection.findByIdAndDelete(req.params.id);
      res.json({ message: 'Collection deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete collection' });
    }
  }
);

// Delete sub-collection
router.delete('/:collectionId/subcollections/:subCollectionId',
  auth,
  checkRole(['developer', 'financier', 'admin']),
  async (req, res) => {
    try {
      const collection = await Collection.findById(req.params.collectionId);
      if (!collection) {
        return res.status(404).json({ message: 'Collection not found' });
      }

      collection.subCollections.pull(req.params.subCollectionId);
      await collection.save();
      res.json({ message: 'Sub-collection deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete sub-collection' });
    }
  }
);

// Delete song
router.delete('/:collectionId/subcollections/:subCollectionId/songs/:songId',
  auth,
  checkRole(['developer', 'financier', 'admin']),
  async (req, res) => {
    try {
      const collection = await Collection.findById(req.params.collectionId);
      if (!collection) {
        return res.status(404).json({ message: 'Collection not found' });
      }

      const subCollection = collection.subCollections.id(req.params.subCollectionId);
      if (!subCollection) {
        return res.status(404).json({ message: 'Sub-collection not found' });
      }

      subCollection.songs.pull(req.params.songId);
      await collection.save();
      res.json({ message: 'Song deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete song' });
    }
  }
);

export default router;