import Moment from '../models/Moment.js';
import { logActivity } from '../middleware/activityLogger.js';
import {drive, extractFileIdFromUrl, extractFolderIdFromUrl, getDirectViewUrl, createSubfolder, getFilesFromFolder } from '../utils/driveUtils.js';
import { google } from 'googleapis'; 

export const momentController = {
  getAllMoments: async (req, res) => {
    try {
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


  // Add Drive Moment (supports both single file and folder)
  addDriveMoment: async (req, res) => {
    try {
      const { title, url } = req.body;

      // Detect folder or file
      const folderId = extractFolderIdFromUrl(url);
      const fileId = extractFileIdFromUrl(url);

      if (!folderId && !fileId) {
        return res.status(400).json({ message: 'Invalid Google Drive URL' });
      }

      let mediaFiles = [];
      let folderRef = null;

      // 📂 If it's a folder, fetch all media files (metadata only)
      if (folderId) {
        const files = await getFilesFromFolder(folderId);
        if (!files.length) {
          return res.status(400).json({ message: 'No files found in the folder' });
        }

        mediaFiles = files.map((file, i) => ({
          name: file.name,
          url: `https://drive.google.com/uc?export=view&id=${file.id}`,
          type: file.mimeType.startsWith('image/') ? 'image' : 'video',
          order: i,
          mediaPublicId: file.id
        }));

        folderRef = folderId;
      }

      // 📄 If it's a single file, just add that
      else if (fileId) {
        const fileResponse = await drive.files.get({
          fileId: fileId,
          fields: 'id, name, mimeType, webViewLink'
        });
        const file = fileResponse.data;

        mediaFiles = [{
          name: file.name,
          url: `https://drive.google.com/uc?export=view&id=${file.id}`,
          type: file.mimeType.startsWith('image/') ? 'image' : 'video',
          order: 0,
          mediaPublicId: file.id
        }];
      }

      // Determine order for the new moment
      const maxOrder = await Moment.findOne().sort('-order');
      const order = maxOrder ? maxOrder.order + 1 : 0;

      const momentData = {
        title,
        type: 'drive',
        url, // keep original link (file or folder)
        mediaFiles,
        order,
        subfolderId: folderRef,
        createdBy: req.user.registerId,
      };

      const moment = await Moment.create(momentData);

      await logActivity(
        req,
        'CREATE',
        'Moment',
        moment._id.toString(),
        { before: null, after: moment.toObject() },
        folderRef
          ? `Drive folder moment "${title}" added by ${req.user.name}`
          : `Drive file moment "${title}" added by ${req.user.name}`
      );

      res.status(201).json(moment);
    } catch (error) {
      console.error('Error adding Drive moment:', error);
      res.status(500).json({ message: 'Failed to add Drive moment', error: error.message });
    }
  },

  
  // Sync (refresh) Drive Moment — only if it's folder-based
  syncDriveFolderMoment: async (req, res) => {
    try {
      const { id } = req.params;
      const moment = await Moment.findById(id);
      if (!moment) return res.status(404).json({ message: 'Moment not found' });

      // If not a Drive moment or not linked to a folder, skip
      if (moment.type !== 'drive') {
        return res.status(400).json({ message: 'This moment is not a Drive type' });
      }

      // Only sync if linked to a folder
      if (!moment.subfolderId) {
        return res.status(400).json({ message: 'This Drive moment is a single file, sync not applicable' });
      }

      const before = moment.toObject();

      // Fetch latest files from the folder
      const files = await getFilesFromFolder(moment.subfolderId);

      if (!files || files.length === 0) {
        return res.status(404).json({ message: 'No files found in the linked Drive folder' });
      }

      // Prepare updated media metadata
      const updatedMedia = files.map((file, i) => ({
        name: file.name,
        url: `https://drive.google.com/uc?export=view&id=${file.id}`,
        type: file.mimeType.startsWith('image/') ? 'image' : 'video',
        order: i,
        mediaPublicId: file.id
      }));

      // Update moment
      moment.mediaFiles = updatedMedia;
      await moment.save();

      await logActivity(
        req,
        'UPDATE',
        'Moment',
        moment._id.toString(),
        before,
        `Drive folder moment "${moment.title}" synced by ${req.user.name}`
      );

      res.json({ message: 'Drive folder synced successfully', moment });
    } catch (error) {
      console.error('Error syncing Drive moment:', error);
      res.status(500).json({ message: 'Failed to sync Drive moment', error: error.message });
    }
  },

  startuploadMediaMoment: async (req, res) => {
    try {
      const { title } = req.body;
      const maxOrder = await Moment.findOne().sort('-order');
      const order = maxOrder ? maxOrder.order + 1 : 0;

      const subfolderName = `${title}_${Date.now()}`;
      const subfolderId = await createSubfolder(process.env.GOOGLE_DRIVE_FOLDER_ID, subfolderName);

      const moment = await Moment.create({
        title,
        type: 'upload',
        mediaFiles: [],
        order,
        subfolderName,
        subfolderId,
        createdBy: req.user.registerId,
      });

      const jwt = new google.auth.JWT({
        email: JSON.parse(process.env.GOOGLE_DRIVE_CREDENTIALS).client_email,
        key: JSON.parse(process.env.GOOGLE_DRIVE_CREDENTIALS).private_key,
        scopes: ['https://www.googleapis.com/auth/drive'],
      });
      const token = await jwt.authorize();

      res.json({ momentId: moment._id, subfolderId, accessToken: token.access_token });
    } catch (err) {
      res.status(500).json({ message: 'Failed to start upload', error: err.message });
    }
  },

  completeuploadMediaMoment: async (req, res) => {
    try {
      const { momentId, mediaFiles } = req.body;
      const moment = await Moment.findById(momentId);
      if (!moment) return res.status(404).json({ message: 'Moment not found' });

      const before = moment.toObject();
      const maxOrder = moment.mediaFiles.length > 0 ? Math.max(...moment.mediaFiles.map(m => m.order || 0)) : -1;

      for (let i = 0; i < mediaFiles.length; i++) {
        const file = mediaFiles[i];
        moment.mediaFiles.push({
          name: file.name,
          url: file.url,
          type: file.type,
          order: maxOrder + i + 1,
          mediaPublicId: file.id || file.mediaPublicId,
        });
      }

      await moment.save();

      await logActivity(req, 'UPDATE', 'Moment', moment._id, before, `${mediaFiles.length} media files added to "${moment.title}" by ${req.user.name}`);
      const updated = await Moment.findById(momentId);
      res.json({ message: 'Upload completed', moment: updated });
    } catch (err) {
      res.status(500).json({ message: 'Failed to complete upload', error: err.message });
    }
  },

  addCopyToServiceDriveMoment: async (req, res) => {
    try {
      const { title, url } = req.body;

      const folderId = extractFolderIdFromUrl(url);
      const fileId = extractFileIdFromUrl(url);

      if (!folderId && !fileId) {
        return res.status(400).json({ message: 'Invalid Google Drive URL' });
      }

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
      }

      if (filesToProcess.length === 0) {
        return res.status(400).json({ message: 'No media files found' });
      }

      const maxOrder = await Moment.findOne().sort('-order');
      const order = maxOrder ? maxOrder.order + 1 : 0;

      const subfolderName = `${title}_${Date.now()}`;
      const subfolderId = await createSubfolder(process.env.GOOGLE_DRIVE_FOLDER_ID, subfolderName);

      const copyPromises = filesToProcess.map(async (file, i) => {
        const copiedFile = await drive.files.copy({
          fileId: file.id,
          requestBody: {
            name: file.name,
            parents: [subfolderId],
          },
        });

        await drive.permissions.create({
          fileId: copiedFile.data.id,
          requestBody: {
            role: 'reader',
            type: 'anyone',
          },
        });

        const directUrl = `https://drive.google.com/uc?export=view&id=${copiedFile.data.id}`;
        
        return {
          name: file.name,
          url: directUrl,
          type: file.mimeType.startsWith('image/') ? 'image' : 'video',
          order: i,
          mediaPublicId: copiedFile.data.id
        };
      });

      const mediaFiles = await Promise.all(copyPromises);

      const momentData = {
        title,
        type: 'upload',
        mediaFiles,
        order,
        subfolderName,
        subfolderId,
        createdBy: req.user.registerId,
      };

      const moment = await Moment.create(momentData);

      await logActivity(
        req,
        'CREATE',
        'Moment',
        moment._id.toString(),
        { before: null, after: moment.toObject() },
        `Drive moment "${title}" with ${filesToProcess.length} files copied and added by ${req.user.name}`
      );

      res.status(201).json(moment);
    } catch (error) {
      res.status(500).json({ message: 'Failed to copy and add drive moment', error: error.message });
    }
  },

  updateMomentOrder: async (req, res) => {
    try {
      const { moments } = req.body;
      const originalMoments = await Moment.find();
      const originalData = originalMoments.map(m => m.toObject());

      for (const moment of moments) {
        await Moment.findByIdAndUpdate(moment._id, { order: moment.order });
      }

      const updatedMoments = await Moment.find().sort({ order: -1, createdAt: -1 });

      await logActivity(
        req,
        'UPDATE',
        'Moment',
        'moment-order',
        { before: originalData, after: updatedMoments },
        `Moment order updated by ${req.user.name}`
      );

      res.json({ message: 'Moment order updated successfully', moments: updatedMoments });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update moment order' });
    }
  },

  updateMomentTitle: async (req, res) => {
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

      res.json({ message: 'Moment title updated successfully', moment });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update moment title', error: error.message });
    }
  },

  deleteMoment: async (req, res) => {
    try {
      const moment = await Moment.findById(req.params.id);
      if (!moment) {
        return res.status(404).json({ message: 'Moment not found' });
      }

      const originalData = moment.toObject();

      // If the moment has an associated subfolder, move the entire folder to trash
      if (moment.subfolderId) {
        try {
          // Move the subfolder and all its contents to trash
          await drive.files.update({
            fileId: moment.subfolderId,
            requestBody: { trashed: true }, // Move to trash instead of permanent delete
          });
        } catch (driveError) {
          console.error('Failed to move subfolder to Google Drive trash:', driveError);
        }
      }

      // If it's a single file moment (e.g., legacy 'media' type) not associated with a folder
      if (moment.type === 'media' && moment.url) {
        try {
          const fileId = extractFileIdFromUrl(moment.url);
          if (fileId) {
            await drive.files.update({
              fileId: fileId,
              requestBody: { trashed: true }, // Move to trash instead of permanent delete
            });
          }
        } catch (driveError) {
          console.error('Failed to move file from Google Drive to trash:', driveError);
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
