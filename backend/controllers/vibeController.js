import Collection from '../models/Vibe.js';
import cloudinary from '../config/cloudinary.js';
import { logActivity } from '../middleware/activityLogger.js';

const extractPublicId = (url) => {
  const parts = url.split('/');
  const filename = parts[parts.length - 1];
  return `Vibe/${filename.split('.')[0]}`;
};

const VibeController = {

  getAllCollections: async (req, res) => {
    try {
      const collections = await Collection.find().sort({ createdAt: -1 });
      res.json(collections);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch collections' });
    }
  },


  createCollection: async (req, res) => {
  try {
    const name = req.body.name.trim();
    const existing = await Collection.findOne({
      name: { $regex: `^${name}$`, $options: 'i' } // case-insensitive match
    });

    if (existing) {
      return res.status(400).json({ message: 'Collection name already exists' });
    }

    const collection = await Collection.create({
      name,
      createdBy: req.user.id
    });

    await logActivity(
      req,
      'CREATE',
      'Vibe',
      collection._id.toString(),
      { before: null, after: collection.toObject() },
      `Collection "${collection.name}" created by ${req.user.name}`
    );

    res.status(201).json(collection);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create collection' });
  }
},


  updateCollection: async (req, res) => {
  try {
    const name = req.body.name.trim();

    // Check if another collection already has this name (case-insensitive)
    const existing = await Collection.findOne({
      _id: { $ne: req.params.id }, 
      name: { $regex: `^${name}$`, $options: 'i' }
    });

    if (existing) {
      return res.status(400).json({ message: 'Collection name already exists' });
    }

    const originalCollection = await Collection.findById(req.params.id);
    if (!originalCollection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    const originalData = originalCollection.toObject();

    const collection = await Collection.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true }
    );

    await logActivity(
      req,
      'UPDATE',
      'Vibe',
      collection._id.toString(),
      { before: originalData, after: collection.toObject() },
      `Collection "${collection.name}" updated by ${req.user.name}`
    );

    res.json(collection);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update collection' });
  }
},


  deleteCollection: async (req, res) => {
    try {
      const collection = await Collection.findById(req.params.id);
      if (!collection) {
        return res.status(404).json({ message: 'Collection not found' });
      }

      const originalData = collection.toObject();

      // Delete all songs from Cloudinary
      for (const song of collection.songs) {
        const publicId = extractPublicId(song.url);
        await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
      }

      await logActivity(
        req,
        'DELETE',
        'Vibe',
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


  uploadSong: async (req, res) => {
    try {
      const collection = await Collection.findById(req.params.collectionId);
      if (!collection) {
        return res.status(404).json({ message: 'Collection not found' });
      }
      const { name, url, mediaPublicId } = req.body;
      if (!url || !mediaPublicId) {
        return res.status(400).json({ message: 'Missing uploaded song details' });
      }

      collection.songs.push({
        name,
        url,
        mediaPublicId
      });

      await collection.save();
      res.status(201).json(collection);
      
      await logActivity(
        req,
        'CREATE',
        'Vibe',
        collection._id.toString(),
        { before: null, after: { songName: req.body.name } },
        `Song "${req.body.name}" uploaded to collection "${collection.name}" by ${req.user.name}`
      );

    } catch (error) {
      res.status(500).json({ message: 'Failed to upload song' });
    }
  },

  uploadMultipleSongs: async (req, res) => {
    try {
      const collection = await Collection.findById(req.params.collectionId);
      if (!collection) {
        return res.status(404).json({ message: 'Collection not found' });
      }

      const { songs } = req.body;
      if (!songs || !Array.isArray(songs) || songs.length === 0) {
        return res.status(400).json({ message: 'Songs array is required and must not be empty' });
      }

      if (songs.length > 10) {
        return res.status(400).json({ message: 'Maximum 10 songs can be uploaded at once' });
      }

      // Validate each song
      for (const song of songs) {
        if (!song.name || !song.url || !song.mediaPublicId) {
          return res.status(400).json({ message: 'Each song must have name, url, and mediaPublicId' });
        }
      }

      // Add all songs to collection
      collection.songs.push(...songs);
      await collection.save();

      // Log activity for bulk upload
      const songNames = songs.map(song => song.name).join(', ');
      await logActivity(
        req,
        'CREATE',
        'Vibe',
        collection._id.toString(),
        { before: null, after: { songCount: songs.length, songNames } },
        `${songs.length} songs uploaded to collection "${collection.name}" by ${req.user.name}: ${songNames}`
      );

      res.status(201).json(collection);
    } catch (error) {
      res.status(500).json({ message: 'Failed to upload songs' });
    }
  },


  updateSong: async (req, res) => {
    try {
      const collection = await Collection.findById(req.params.collectionId);
      if (!collection) {
        return res.status(404).json({ message: 'Collection not found' });
      }

      const song = collection.songs.id(req.params.songId);
      if (!song) {
        return res.status(404).json({ message: 'Song not found' });
      }

      // If a new url is provided, delete the old one and set new
      if (req.body.url && req.body.mediaPublicId) {
        // Delete old file from Cloudinary
        const oldPublicId = extractPublicId(song.url);
        await cloudinary.uploader.destroy(oldPublicId, { resource_type: 'video' });
        song.url = req.body.url;
        song.mediaPublicId = req.body.mediaPublicId;
      }

      song.name = req.body.name;
      await collection.save();
      res.json(collection);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update song' });
    }
  },


  deleteSong: async (req, res) => {
    try {
      const collection = await Collection.findById(req.params.collectionId);
      if (!collection) {
        return res.status(404).json({ message: 'Collection not found' });
      }

      const song = collection.songs.id(req.params.songId);
      if (!song) {
        return res.status(404).json({ message: 'Song not found' });
      }

      const originalSongData = { ...song.toObject() };

      // Delete from Cloudinary
      const publicId = extractPublicId(song.url);
      await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });

      await logActivity(
        req,
        'DELETE',
        'Vibe',
        collection._id.toString(),
        { before: originalSongData, after: null },
        `Song "${song.name}" deleted from collection "${collection.name}" by ${req.user.name}`
      );

      // Remove from database
      collection.songs.pull(req.params.songId);
      await collection.save();
      res.json({ message: 'Song deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete song' });
    }
  }
};

export default VibeController;