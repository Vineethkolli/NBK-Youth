import Moment from '../models/Moment.js';
import { logActivity } from '../middleware/activityLogger.js';
import { drive, extractFileIdFromUrl, extractFolderIdFromUrl, createSubfolder, getFilesFromFolder } from '../utils/driveUtils.js';
import { google } from 'googleapis';

export const galleryController = {
  updateGalleryOrder: async (req, res) => {
    try {
      const { momentId } = req.params;
      const { mediaFiles } = req.body;

      const moment = await Moment.findById(momentId);
      if (!moment) return res.status(404).json({ message: 'Moment not found' });

      const originalData = moment.toObject();
      moment.mediaFiles = mediaFiles;
      await moment.save();

      await logActivity(
        req,
        'UPDATE',
        'Moment',
        moment._id.toString(),
        { before: originalData, after: moment.toObject() },
        `Gallery order updated for moment "${moment.title}" by ${req.user.name}`
      );

      const updatedMoment = await Moment.findById(momentId);
      res.json({ message: 'Gallery order updated successfully', moment: updatedMoment });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update gallery order' });
    }
  },

  startuploadMediaGallery: async (req, res) => {
    try {
      const { momentId } = req.params;
      const moment = await Moment.findById(momentId);
      if (!moment) return res.status(404).json({ message: 'Moment not found' });

      let targetFolderId = moment.subfolderId;
      if (!targetFolderId) {
        const subfolderName = `${moment.title}_${Date.now()}`;
        targetFolderId = await createSubfolder(process.env.GOOGLE_DRIVE_FOLDER_ID, subfolderName);
        moment.subfolderName = subfolderName;
        moment.subfolderId = targetFolderId;
        if (moment.type !== 'upload') moment.type = 'upload';
        await moment.save();
      }

      const jwt = new google.auth.JWT({
        email: JSON.parse(process.env.GOOGLE_DRIVE_CREDENTIALS).client_email,
        key: JSON.parse(process.env.GOOGLE_DRIVE_CREDENTIALS).private_key,
        scopes: ['https://www.googleapis.com/auth/drive'],
      });
      const token = await jwt.authorize();

      res.json({ subfolderId: targetFolderId, accessToken: token.access_token });
    } catch (err) {
      res.status(500).json({ message: 'Failed to start gallery upload', error: err.message });
    }
  },

  completeuploadMediaGallery: async (req, res) => {
    try {
      const { momentId } = req.params;
      const { mediaFiles } = req.body;
      const moment = await Moment.findById(momentId);
      if (!moment) return res.status(404).json({ message: 'Moment not found' });

      const before = moment.toObject();
      const maxOrder = moment.mediaFiles.length > 0 ? Math.max(...moment.mediaFiles.map(m => m.order || 0)) : -1;

      for (let i = 0; i < mediaFiles.length; i++) {
        const f = mediaFiles[i];
        moment.mediaFiles.push({
          name: f.name,
          url: f.url,
          type: f.type,
          order: maxOrder + i + 1,
          mediaPublicId: f.id || f.mediaPublicId,
        });
      }

      await moment.save();

      await logActivity(req, 'UPDATE', 'Moment', momentId, before, `${mediaFiles.length} new gallery files added to moment "${moment.title}" by ${req.user.name}`);
      const updated = await Moment.findById(momentId);
      res.json({ message: 'Gallery upload completed', moment: updated });
    } catch (err) {
      res.status(500).json({ message: 'Failed to complete gallery upload', error: err.message });
    }
  },

  addCopyToServiceDriveGallery: async (req, res) => {
    try {
      const { momentId } = req.params;
      const { url } = req.body;

      const moment = await Moment.findById(momentId);
      if (!moment) {
        return res.status(404).json({ message: 'Moment not found' });
      }

      if (moment.type !== 'upload') {
        return res.status(400).json({ message: 'Can only add media to upload type moments' });
      }

      const originalData = moment.toObject();
      const folderId = extractFolderIdFromUrl(url);
      const fileId = extractFileIdFromUrl(url);

      let filesToProcess = [];

      if (folderId) {
        filesToProcess = await getFilesFromFolder(folderId);
      } else if (fileId) {
        try {
          const fileResponse = await drive.files.get({
            fileId: fileId,
            fields: 'id, name, mimeType, webViewLink'
          });
          filesToProcess = [fileResponse.data];
        } catch (error) {
          return res.status(400).json({ message: 'Unable to access the file. Please check permissions.' });
        }
      } else {
        return res.status(400).json({ message: 'Invalid Google Drive URL' });
      }

      if (filesToProcess.length === 0) {
        return res.status(400).json({ message: 'No media files found' });
      }

      const maxOrder = moment.mediaFiles.length > 0
        ? Math.max(...moment.mediaFiles.map(m => m.order || 0))
        : -1;

      let targetFolderId = moment.subfolderId;
      if (!targetFolderId) {
        const subfolderName = `${moment.title}_${Date.now()}`;
        targetFolderId = await createSubfolder(process.env.GOOGLE_DRIVE_FOLDER_ID, subfolderName);
        moment.subfolderName = subfolderName;
        moment.subfolderId = targetFolderId;
      }

      for (let i = 0; i < filesToProcess.length; i++) {
        const file = filesToProcess[i];

        const copiedFile = await drive.files.copy({
          fileId: file.id,
          requestBody: { name: file.name, parents: [targetFolderId] },
        });

        await drive.permissions.create({
          fileId: copiedFile.data.id,
          requestBody: { role: 'reader', type: 'anyone' },
        });

        const directUrl = `https://drive.google.com/uc?export=view&id=${copiedFile.data.id}`;

        const newMediaFile = {
          name: file.name,
          url: directUrl,
          type: file.mimeType.startsWith('image/') ? 'image' : 'video',
          order: maxOrder + i + 1,
          mediaPublicId: copiedFile.data.id
        };

        moment.mediaFiles.push(newMediaFile);
      }

      await moment.save();

      await logActivity(
        req,
        'UPDATE',
        'Moment',
        moment._id.toString(),
        { before: originalData, after: moment.toObject() },
        `${filesToProcess.length} media files copied and added from Drive to moment "${moment.title}" by ${req.user.name}`
      );

      const updatedMoment = await Moment.findById(momentId);
      res.status(201).json(updatedMoment);
    } catch (error) {
      res.status(500).json({ message: 'Failed to copy and add Drive media to moment', error: error.message });
    }
  },

  deleteGalleryFile: async (req, res) => {
    try {
      const { momentId, mediaId } = req.params;

      const moment = await Moment.findById(momentId);
      if (!moment) {
        return res.status(404).json({ message: 'Moment not found' });
      }

      const mediaFile = moment.mediaFiles.id(mediaId);
      if (!mediaFile) {
        return res.status(404).json({ message: 'Gallery file not found' });
      }

      const originalData = moment.toObject();

      if (mediaFile.mediaPublicId) {
        try {
          await drive.files.update({
            fileId: mediaFile.mediaPublicId,
            requestBody: { trashed: true },
          });
        } catch (driveError) {
          console.error('Failed to move file to Google Drive trash:', driveError);
        }
      }

      moment.mediaFiles.pull(mediaId);
      await moment.save();

      await logActivity(
        req,
        'DELETE',
        'Moment',
        moment._id.toString(),
        { before: originalData, after: moment.toObject() },
        `Gallery file "${mediaFile.name}" deleted from moment "${moment.title}" by ${req.user.name}`
      );

      const updatedMoment = await Moment.findById(req.params.momentId);
      res.json({ message: 'Gallery file deleted successfully', moment: updatedMoment });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete gallery file', error: error.message });
    }
  },
};
