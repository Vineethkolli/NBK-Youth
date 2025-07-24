import Collection from '../models/Collection.js';
import cloudinary from '../config/cloudinary.js';
import { uploadToCloudinary } from '../config/cloudinary.js';
import { logActivity } from '../middleware/activityLogger.js';

const extractPublicId = (url) => {
  const parts = url.split('/');
  const filename = parts[parts.length - 1];
  return `Vibe/${filename.split('.')[0]}`;
};

const CollectionController = {
  // Get all collections
  getAllCollections: async (req, res) => {
    try {
      const collections = await Collection.find().sort({ createdAt: -1 });
      res.json(collections);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch collections' });
    }
  },

  // Create collection
  createCollection: async (req, res) => {
    try {
      const collection = await Collection.create({
        name: req.body.name,
        createdBy: req.user.id
      });

      // Log collection creation
      await logActivity(
        req,
        'CREATE',
        'Collection',
        collection._id.toString(),
        { before: null, after: collection.toObject() },
        `Collection "${collection.name}" created by ${req.user.name}`
      );

      res.status(201).json(collection);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create collection' });
    }
  },

  // Update collection
  updateCollection: async (req, res) => {
    try {
      const originalCollection = await Collection.findById(req.params.id);
      if (!originalCollection) {
        return res.status(404).json({ message: 'Collection not found' });
      }

      const originalData = originalCollection.toObject();

      const collection = await Collection.findByIdAndUpdate(
        req.params.id,
        { name: req.body.name },
        { new: true }
      );
      if (!collection) {
        return res.status(404).json({ message: 'Collection not found' });
      }

      // Log collection update
      await logActivity(
        req,
        'UPDATE',
        'Collection',
        collection._id.toString(),
        { before: originalData, after: collection.toObject() },
        `Collection "${collection.name}" updated by ${req.user.name}`
      );

      res.json(collection);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update collection' });
    }
  },

  // Delete collection
  deleteCollection: async (req, res) => {
    try {
      const collection = await Collection.findById(req.params.id);
      if (!collection) {
        return res.status(404).json({ message: 'Collection not found' });
      }

      const originalData = collection.toObject();

      // Delete all songs from Cloudinary
      for (const subCollection of collection.subCollections) {
        for (const song of subCollection.songs) {
          const publicId = extractPublicId(song.url);
          await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
        }
      }

      // Log collection deletion
      await logActivity(
        req,
        'DELETE',
        'Collection',
        collection._id.toString(),
        { before: originalData, after: null },
        `Collection "${collection.name}" deleted by ${req.user.name}`
      );

      await Collection.findByIdAndDelete(req.params.id);
      res.json({ message: 'Collection deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete collection' });
    }
  },

  // Create sub-collection
  createSubCollection: async (req, res) => {
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
  },

  // Update sub-collection
  updateSubCollection: async (req, res) => {
    try {
      const collection = await Collection.findById(req.params.collectionId);
      if (!collection) {
        return res.status(404).json({ message: 'Collection not found' });
      }

      const subCollection = collection.subCollections.id(req.params.subCollectionId);
      if (!subCollection) {
        return res.status(404).json({ message: 'Sub-collection not found' });
      }

      subCollection.name = req.body.name;
      await collection.save();
      res.json(collection);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update sub-collection' });
    }
  },

  // Delete sub-collection
  deleteSubCollection: async (req, res) => {
    try {
      const collection = await Collection.findById(req.params.collectionId);
      if (!collection) {
        return res.status(404).json({ message: 'Collection not found' });
      }

      const subCollection = collection.subCollections.id(req.params.subCollectionId);
      if (!subCollection) {
        return res.status(404).json({ message: 'Sub-collection not found' });
      }

      // Delete all songs in the sub-collection from Cloudinary
      for (const song of subCollection.songs) {
        const publicId = extractPublicId(song.url);
        await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
      }

      collection.subCollections.pull(req.params.subCollectionId);
      await collection.save();
      res.json({ message: 'Sub-collection deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete sub-collection' });
    }
  },

  // Upload song
  uploadSong: async (req, res) => {
    try {
      const collection = await Collection.findById(req.params.collectionId);
      if (!collection) {
        return res.status(404).json({ message: 'Collection not found' });
      }

      const subCollection = collection.subCollections.id(req.params.subCollectionId);
      if (!subCollection) {
        return res.status(404).json({ message: 'Sub-collection not found' });
      }

      const url = await uploadToCloudinary(req.body.file, 'Vibe');

      subCollection.songs.push({
        name: req.body.name,
        url
      });

      await collection.save();
      res.status(201).json(collection);
      // Log song upload
      await logActivity(
        req,
        'CREATE',
        'Collection',
        collection._id.toString(),
        { before: null, after: { songName: req.body.name, subCollection: subCollection.name } },
        `Song "${req.body.name}" uploaded to "${subCollection.name}" in collection "${collection.name}" by ${req.user.name}`
      );

    } catch (error) {
      res.status(500).json({ message: 'Failed to upload song' });
    }
  },

  // Update song
  updateSong: async (req, res) => {
    try {
      const collection = await Collection.findById(req.params.collectionId);
      if (!collection) {
        return res.status(404).json({ message: 'Collection not found' });
      }

      const subCollection = collection.subCollections.id(req.params.subCollectionId);
      if (!subCollection) {
        return res.status(404).json({ message: 'Sub-collection not found' });
      }

      const song = subCollection.songs.id(req.params.songId);
      if (!song) {
        return res.status(404).json({ message: 'Song not found' });
      }

      // If a new file is provided, delete the old one and upload the new one
      if (req.body.file) {
        // Delete old file from Cloudinary
        const oldPublicId = extractPublicId(song.url);
        await cloudinary.uploader.destroy(oldPublicId, { resource_type: 'video' });

        // Upload new file
        const newUrl = await uploadToCloudinary(req.body.file, 'Vibe');
        song.url = newUrl;
      }

      song.name = req.body.name;
      await collection.save();
      res.json(collection);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update song' });
    }
  },

  // Delete song
  deleteSong: async (req, res) => {
    try {
      const collection = await Collection.findById(req.params.collectionId);
      if (!collection) {
        return res.status(404).json({ message: 'Collection not found' });
      }

      const subCollection = collection.subCollections.id(req.params.subCollectionId);
      if (!subCollection) {
        return res.status(404).json({ message: 'Sub-collection not found' });
      }

      const song = subCollection.songs.id(req.params.songId);
      if (!song) {
        return res.status(404).json({ message: 'Song not found' });
      }

      const originalSongData = { ...song.toObject() };

      // Delete from Cloudinary
      const publicId = extractPublicId(song.url);
      await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });

      // Log song deletion
      await logActivity(
        req,
        'DELETE',
        'Collection',
        collection._id.toString(),
        { before: originalSongData, after: null },
        `Song "${song.name}" deleted from "${subCollection.name}" in collection "${collection.name}" by ${req.user.name}`
      );

      // Remove from database
      subCollection.songs.pull(req.params.songId);
      await collection.save();
      res.json({ message: 'Song deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete song' });
    }
  }
};

export default CollectionController;