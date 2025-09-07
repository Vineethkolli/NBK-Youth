// controllers/momentController.js
import Moment from '../models/Moment.js';
import { google } from 'googleapis';
import { Readable } from 'stream';
import { logActivity } from '../middleware/activityLogger.js';

const drive = google.drive({
  version: 'v3',
  auth: new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_DRIVE_CREDENTIALS),
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  }),
});

// Helper function to extract Google Drive file ID from URL
const extractFileIdFromUrl = (url) => {
  const directMatch = url.match(/[?&]id=([^&]+)/);
  if (directMatch) {
    return directMatch[1];
  }
  
  const fileMatch = url.match(/\/file\/d\/([^\/]+)/);
  if (fileMatch) {
    return fileMatch[1];
  }
  
  return null;
};

// Helper function to get direct view URL from Drive sharing URL
const getDirectViewUrl = (url) => {
  const fileId = extractFileIdFromUrl(url);
  if (!fileId) return url;
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
};

export const momentController = {
  getAllMoments: async (req, res) => {
    try {
      // Sort by order (descending) first so saved reorder shows.
      // Then fallback to createdAt descending to show newest first by default.
      const moments = await Moment.find().sort({ order: -1, createdAt: -1 });
      res.json(moments);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch moments', error: error.message });
    }
  },

  addYouTubeMoment: async (req, res) => {
    try {
      const { title, url } = req.body;
      const maxOrder = await Moment.findOne().sort('-order');
      const order = maxOrder ? maxOrder.order + 1 : 0;
      const momentData = {
        title,
        type: 'youtube',
        url,
        order,
        createdBy: req.user.registerId,
      };

      const moment = await Moment.create(momentData);

      await logActivity(
        req,
        'CREATE',
        'Moment',
        moment._id.toString(),
        { before: null, after: moment.toObject() },
        `YouTube moment "${title}" added by ${req.user.name}`
      );

      res.status(201).json(moment);
    } catch (error) {
      res.status(500).json({ message: 'Failed to add YouTube moment', error: error.message });
    }
  },

  addDriveMoment: async (req, res) => {
    try {
      const { title, url } = req.body;
      const maxOrder = await Moment.findOne().sort('-order');
      const order = maxOrder ? maxOrder.order + 1 : 0;
      const directUrl = getDirectViewUrl(url);
      const momentData = {
        title,
        type: 'drive',
        url: directUrl,
        order,
        createdBy: req.user.registerId,
      };

      const moment = await Moment.create(momentData);

      await logActivity(
        req,
        'CREATE',
        'Moment',
        moment._id.toString(),
        { before: null, after: moment.toObject() },
        `Drive moment "${title}" added by ${req.user.name}`
      );

      res.status(201).json(moment);
    } catch (error) {
      res.status(500).json({ message: 'Failed to add Drive moment', error: error.message });
    }
  },

  uploadMediaMoment: async (req, res) => {
    try {
      const { title } = req.body;
      const files = req.files; // Multiple files
      if (!files || files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
      }
      const maxOrder = await Moment.findOne().sort('-order');
      const order = maxOrder ? maxOrder.order + 1 : 0;
      const mediaFiles = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const mimeType = file.mimetype;
        const stream = Readable.from(file.buffer);
        const driveResponse = await drive.files.create({
          requestBody: {
            name: `${title || 'untitled'}-${Date.now()}-${i}`,
            mimeType,
            parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
          },
          media: {
            mimeType,
            body: stream,
          },
        });
        await drive.permissions.create({
          fileId: driveResponse.data.id,
          requestBody: {
            role: 'reader',
            type: 'anyone',
          },
        });
        const directUrl = `https://drive.google.com/uc?export=view&id=${driveResponse.data.id}`;
        mediaFiles.push({
          name: file.originalname,
          url: directUrl,
          type: file.mimetype.startsWith('image/') ? 'image' : 'video',
          order: i,
          mediaPublicId: driveResponse.data.id
        });
      }
      const momentData = {
        title,
        type: 'upload',
        mediaFiles,
        order,
        createdBy: req.user.registerId,
      };

      const moment = await Moment.create(momentData);

      await logActivity(
        req,
        'CREATE',
        'Moment',
        moment._id.toString(),
        { before: null, after: moment.toObject() },
        `Upload moment "${title}" with ${files.length} files added by ${req.user.name}`
      );

      res.status(201).json(moment);
    } catch (error) {
      res.status(500).json({ message: 'Failed to upload media moment', error: error.message });
    }
  },

  updateMomentOrder: async (req, res) => {
    try {
      const { moments } = req.body;

      const originalMoments = await Moment.find();
      const originalData = originalMoments.map(m => m.toObject());

      // Update order for each moment
      for (const moment of moments) {
        await Moment.findByIdAndUpdate(moment._id, { order: moment.order });
      }

      await logActivity(
        req,
        'UPDATE',
        'Moment',
        'moment-order',
        { before: originalData, after: moments },
        `Moment order updated by ${req.user.name}`
      );

      res.json({ message: 'Moment order updated successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update moment order' });
    }
  },

  updateMediaOrder: async (req, res) => {
    try {
      const { momentId } = req.params;
      const { mediaFiles } = req.body;

      const moment = await Moment.findById(momentId);
      if (!moment) {
        return res.status(404).json({ message: 'Moment not found' });
      }

      const originalData = moment.toObject();

      // Update media files order
      moment.mediaFiles = mediaFiles;
      await moment.save();

      await logActivity(
        req,
        'UPDATE',
        'Moment',
        moment._id.toString(),
        { before: originalData, after: moment.toObject() },
        `Media order updated for moment "${moment.title}" by ${req.user.name}`
      );

      res.json(moment);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update media order' });
    }
  },

  updateTitle: async (req, res) => {
    try {
      const { id } = req.params;
      const { title } = req.body;

      if (!title || typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({ message: 'Invalid title' });
      }

      const moment = await Moment.findById(id);

      if (!moment) {
        return res.status(404).json({ message: 'Moment not found' });
      }

      const originalData = moment.toObject();

      moment.title = title;
      await moment.save();

      await logActivity(
        req,
        'UPDATE',
        'Moment',
        moment._id.toString(),
        { before: originalData, after: moment.toObject() },
        `Moment title updated to "${title}" by ${req.user.name}`
      );

      res.json({ message: 'Title updated successfully', moment });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update title', error: error.message });
    }
  },

  deleteMediaFile: async (req, res) => {
    try {
      const { momentId, mediaId } = req.params;

      const moment = await Moment.findById(momentId);
      if (!moment) {
        return res.status(404).json({ message: 'Moment not found' });
      }

      const mediaFile = moment.mediaFiles.id(mediaId);
      if (!mediaFile) {
        return res.status(404).json({ message: 'Media file not found' });
      }

      const originalData = moment.toObject();

      // Delete from Google Drive if it has a public ID
      if (mediaFile.mediaPublicId) {
        try {
          await drive.files.delete({
            fileId: mediaFile.mediaPublicId
          });
        } catch (driveError) {
          console.error('Failed to delete file from Google Drive:', driveError);
        }
      }

      // Remove from database
      moment.mediaFiles.pull(mediaId);
      await moment.save();

      await logActivity(
        req,
        'DELETE',
        'Moment',
        moment._id.toString(),
        { before: originalData, after: moment.toObject() },
        `Media file "${mediaFile.name}" deleted from moment "${moment.title}" by ${req.user.name}`
      );

      res.json({ message: 'Media file deleted successfully', moment });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete media file', error: error.message });
    }
  },

  deleteMoment: async (req, res) => {
    try {
      const moment = await Moment.findById(req.params.id);
      if (!moment) {
        return res.status(404).json({ message: 'Moment not found' });
      }

      const originalData = moment.toObject();

      // Delete files from Google Drive for upload type moments
      if (moment.type === 'upload' && moment.mediaFiles) {
        for (const mediaFile of moment.mediaFiles) {
          if (mediaFile.mediaPublicId) {
            try {
              await drive.files.delete({
                fileId: mediaFile.mediaPublicId
              });
            } catch (driveError) {
              console.error('Failed to delete file from Google Drive:', driveError);
            }
          }
        }
      }

      // For single media moments (youtube/drive), delete if it's a Drive upload
      if (moment.type === 'media' && moment.url) {
        try {
          const fileId = extractFileIdFromUrl(moment.url);
          if (fileId) {
            await drive.files.delete({
              fileId: fileId
            });
          }
        } catch (driveError) {
          console.error('Failed to delete file from Google Drive:', driveError);
        }
      }

      await logActivity(
        req,
        'DELETE',
        'Moment',
        moment._id.toString(),
        { before: originalData, after: null },
        `Moment "${moment.title}" deleted by ${req.user.name}`
      );

      await Moment.findByIdAndDelete(req.params.id);

      res.json({ message: 'Moment deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete moment', error: error.message });
    }
  },
};
