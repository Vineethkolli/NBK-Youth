import Moment from '../models/Moment.js';
import { google } from 'googleapis';
import { Readable } from 'stream';

const drive = google.drive({
  version: 'v3',
  auth: new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_DRIVE_CREDENTIALS),
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  }),
});

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

      res.status(201).json(moment);
    } catch (error) {
      res.status(500).json({ message: 'Failed to add YouTube moment', error: error.message });
    }
  },

  uploadMediaMoment: async (req, res) => {
    try {
      const { title, file, isPinned } = req.body;

      // Convert base64 to buffer
      const buffer = Buffer.from(file.split(',')[1], 'base64');
      const stream = Readable.from(buffer);
      const mimeType = file.match(/^data:(.*);base64/)[1];

      // Upload to Google Drive
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

      moment.isPinned = !moment.isPinned;
      await moment.save();

      res.json(moment);
    } catch (error) {
      res.status(500).json({ message: 'Failed to toggle pin status', error: error.message });
    }
  },

  updateTitle: async (req, res) => {
    try {
      const { id } = req.params;
      const { title } = req.body;

      // Validate input
      if (!title || typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({ message: 'Invalid title' });
      }

      const moment = await Moment.findById(id);

      if (!moment) {
        return res.status(404).json({ message: 'Moment not found' });
      }

      moment.title = title;
      await moment.save();

      res.json({ message: 'Title updated successfully', moment });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update title', error: error.message });
    }
  },

  deleteMoment: async (req, res) => {
    try {
      const moment = await Moment.findByIdAndDelete(req.params.id);

      if (!moment) {
        return res.status(404).json({ message: 'Moment not found' });
      }

      res.json({ message: 'Moment deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete moment', error: error.message });
    }
  },
};
