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
  // Handle direct view URLs: https://drive.google.com/uc?export=view&id=FILE_ID
  const directMatch = url.match(/[?&]id=([^&]+)/);
  if (directMatch) {
    return directMatch[1];
  }
  
  // Handle other Google Drive URL formats
  const fileMatch = url.match(/\/file\/d\/([^\/]+)/);
  if (fileMatch) {
    return fileMatch[1];
  }
  
  return null;
};

export const momentController = {
  getAllMoments: async (req, res) => {
    try {
      // Sort by pinned status first, then by creation date
      const moments = await Moment.find().sort({ isPinned: -1, createdAt: -1 });
      res.json(moments);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch moments', error: error.message });
    }
  },

  addYouTubeMoment: async (req, res) => {
    try {
      const { title, url, isPinned } = req.body;

      const moment = await Moment.create({
        title,
        type: 'youtube',
        url,
        isPinned: !!isPinned,
        createdBy: req.user.registerId,
      });

      // Log YouTube moment creation
      await logActivity(
        req,
        'CREATE',
        'Moment',
        moment._id.toString(),
        { before: null, after: moment.toObject() },
        `YouTube moment "${title || 'Untitled'}" added by ${req.user.name}`
      );

      res.status(201).json(moment);
    } catch (error) {
      res.status(500).json({ message: 'Failed to add YouTube moment', error: error.message });
    }
  },

  uploadMediaMoment: async (req, res) => {
    try {
      const { title, isPinned } = req.body;

      // Use multer: req.file (field name 'file')
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const mimeType = req.file.mimetype;
      // Always use in-memory buffer for streaming upload
      if (!req.file.buffer) {
        return res.status(400).json({ message: 'Invalid file upload: no buffer' });
      }
      const stream = Readable.from(req.file.buffer);

      // Upload to Google Drive (chunked streaming)
      const driveResponse = await drive.files.create({
        requestBody: {
          name: `${title || 'untitled'}-${Date.now()}`,
          mimeType,
          parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
        },
        media: {
          mimeType,
          body: stream,
        },
      });

      // Make file publicly accessible
      await drive.permissions.create({
        fileId: driveResponse.data.id,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });

      // Get file metadata
      const fileData = await drive.files.get({
        fileId: driveResponse.data.id,
        fields: 'webContentLink,id',
      });

      // Create a direct view URL
      const directUrl = `https://drive.google.com/uc?export=view&id=${driveResponse.data.id}`;

      const moment = await Moment.create({
        title,
        type: 'media',
        url: directUrl,
        downloadUrl: fileData.data.webContentLink,
        isPinned: !!isPinned,
        createdBy: req.user.registerId,
      });

      // Log media moment creation
      await logActivity(
        req,
        'CREATE',
        'Moment',
        moment._id.toString(),
        { before: null, after: moment.toObject() },
        `Media moment "${title || 'Untitled'}" uploaded by ${req.user.name}`
      );

      res.status(201).json(moment);
    } catch (error) {
      res.status(500).json({ message: 'Failed to upload media moment', error: error.message });
    }
  },

  togglePin: async (req, res) => {
    try {
      const moment = await Moment.findById(req.params.id);

      if (!moment) {
        return res.status(404).json({ message: 'Moment not found' });
      }

      const originalData = moment.toObject();

      moment.isPinned = !moment.isPinned;
      await moment.save();

      // Log pin toggle
      await logActivity(
        req,
        'UPDATE',
        'Moment',
        moment._id.toString(),
        { before: originalData, after: moment.toObject() },
        `Moment "${moment.title || 'Untitled'}" ${moment.isPinned ? 'pinned' : 'unpinned'} by ${req.user.name}`
      );

      res.json(moment);
    } catch (error) {
      res.status(500).json({ message: 'Failed to toggle pin status', error: error.message });
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

      // Log title update
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

  deleteMoment: async (req, res) => {
    try {
      const moment = await Moment.findById(req.params.id);
      if (!moment) {
        return res.status(404).json({ message: 'Moment not found' });
      }

      const originalData = moment.toObject();

      // If it's a media moment (uploaded to Google Drive), delete from Drive
      if (moment.type === 'media' && moment.url) {
        try {
          const fileId = extractFileIdFromUrl(moment.url);
          if (fileId) {
            await drive.files.delete({
              fileId: fileId
            });
            console.log(`Deleted file ${fileId} from Google Drive`);
          }
        } catch (driveError) {
          console.error('Failed to delete file from Google Drive:', driveError);
          // Continue with database deletion even if Drive deletion fails
        }
      }

      // Log moment deletion
      await logActivity(
        req,
        'DELETE',
        'Moment',
        moment._id.toString(),
        { before: originalData, after: null },
        `Moment "${moment.title || 'Untitled'}" deleted by ${req.user.name}`
      );

      await Moment.findByIdAndDelete(req.params.id);

      res.json({ message: 'Moment deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete moment', error: error.message });
    }
  },
};
