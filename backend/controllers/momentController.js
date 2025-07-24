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

export const momentController = {
  getAllMoments: async (req, res) => {
    try {
      const moments = await Moment.find()
        .sort({ isPinned: -1, createdAt: -1 });
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

      await logActivity(req, 'CREATE', 'Moment', moment._id.toString(), {
        before: null,
        after: moment.toObject()
      }, `YouTube moment "${title || 'Untitled'}" added by ${req.user.name}`);

      res.status(201).json(moment);
    } catch (error) {
      res.status(500).json({ message: 'Failed to add YouTube moment', error: error.message });
    }
  },

  uploadMediaMoment: async (req, res) => {
    try {
      const { title, file, isPinned } = req.body;
      // Convert base64 → buffer → stream
      const buffer = Buffer.from(file.split(',')[1], 'base64');
      const stream = Readable.from(buffer);
      const mimeType = file.match(/^data:(.*);base64/)[1];

      // Upload to Drive
      const driveRes = await drive.files.create({
        requestBody: {
          name: `${title || 'untitled'}-${Date.now()}`,
          mimeType,
          parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
        },
        media: { mimeType, body: stream },
      });

      // Make it public
      await drive.permissions.create({
        fileId: driveRes.data.id,
        requestBody: { role: 'reader', type: 'anyone' },
      });

      // Fetch webContentLink
      const { data: meta } = await drive.files.get({
        fileId: driveRes.data.id,
        fields: 'webContentLink',
      });

      const directUrl = `https://drive.google.com/uc?export=view&id=${driveRes.data.id}`;
      const moment = await Moment.create({
        title,
        type: 'media',
        url: directUrl,
        downloadUrl: meta.webContentLink,
        isPinned: !!isPinned,
        createdBy: req.user.registerId,
      });

      await logActivity(req, 'CREATE', 'Moment', moment._id.toString(), {
        before: null,
        after: moment.toObject()
      }, `Media moment "${title || 'Untitled'}" uploaded by ${req.user.name}`);

      res.status(201).json(moment);
    } catch (error) {
      res.status(500).json({ message: 'Failed to upload media moment', error: error.message });
    }
  },

  togglePin: async (req, res) => {
    try {
      const m = await Moment.findById(req.params.id);
      if (!m) {
        return res.status(404).json({ message: 'Moment not found' });
      }

      const before = m.toObject();
      m.isPinned = !m.isPinned;
      await m.save();

      await logActivity(req, 'UPDATE', 'Moment', m._id.toString(), {
        before,
        after: m.toObject()
      }, `Moment "${m.title || 'Untitled'}" ${m.isPinned ? 'pinned' : 'unpinned'} by ${req.user.name}`);

      res.json(m);
    } catch (error) {
      res.status(500).json({ message: 'Failed to toggle pin status', error: error.message });
    }
  },

  updateTitle: async (req, res) => {
    try {
      const { id } = req.params;
      const { title } = req.body;
      if (!title || typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({ message: 'Invalid title' });
      }

      const m = await Moment.findById(id);
      if (!m) {
        return res.status(404).json({ message: 'Moment not found' });
      }

      const before = m.toObject();
      m.title = title;
      await m.save();

      await logActivity(req, 'UPDATE', 'Moment', m._id.toString(), {
        before,
        after: m.toObject()
      }, `Moment title updated to "${title}" by ${req.user.name}`);

      res.json({ message: 'Title updated successfully', moment: m });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update title', error: error.message });
    }
  },

  deleteMoment: async (req, res) => {
    try {
      // Fetch original
      const m = await Moment.findById(req.params.id);
      if (!m) {
        return res.status(404).json({ message: 'Moment not found' });
      }

      const before = m.toObject();

      // Log deletion
      await logActivity(req, 'DELETE', 'Moment', m._id.toString(), {
        before,
        after: null
      }, `Moment "${m.title || 'Untitled'}" deleted by ${req.user.name}`);

      // Actually delete
      await m.remove();

      res.json({ message: 'Moment deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete moment', error: error.message });
    }
  },
};
