import Moment from '../models/Moment.js';
import { logActivity } from '../middleware/activityLogger.js';
import { 
  drive, 
  Readable,
  extractFileIdFromUrl, 
  extractFolderIdFromUrl, 
  getDirectViewUrl, 
  createSubfolder,
  getFilesFromFolder
} from '../utils/driveUtils.js'; 

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

      // Create subfolder for this moment
      const subfolderName = `${title}_${Date.now()}`;
      const subfolderId = await createSubfolder(process.env.GOOGLE_DRIVE_FOLDER_ID, subfolderName);

      const mediaFiles = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const mimeType = file.mimetype;
        const stream = Readable.from(file.buffer);
        
        const driveResponse = await drive.files.create({
          requestBody: {
            name: `${title || 'untitled'}-${Date.now()}-${i}`,
            mimeType,
            parents: [subfolderId],
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
        `Uploaded moment "${title}" with ${files.length} files added by ${req.user.name}`
      );

      res.status(201).json(moment);
    } catch (error) {
      res.status(500).json({ message: 'Failed to upload media moment', error: error.message });
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

      if (moment.subfolderId) {
        try {
          const response = await drive.files.list({
            q: `'${moment.subfolderId}' in parents`,
            fields: 'files(id)',
          });

          const deletePromises = response.data.files.map(file => 
            drive.files.delete({ fileId: file.id }).catch(error => {
              console.error(`Failed to delete file ${file.id}:`, error);
            })
          );
          
          await Promise.all(deletePromises);
          await drive.files.delete({ fileId: moment.subfolderId });
        } catch (driveError) {
          console.error('Failed to delete subfolder from Google Drive:', driveError);
        }
      }

      if (moment.type === 'media' && moment.url) {
        try {
          const fileId = extractFileIdFromUrl(moment.url);
          if (fileId) {
            await drive.files.delete({ fileId: fileId });
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
