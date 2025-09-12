import Moment from '../models/Moment.js';
import { logActivity } from '../middleware/activityLogger.js';
import { 
  drive, 
  Readable,
  extractFileIdFromUrl, 
  extractFolderIdFromUrl, 
  createSubfolder,
  getFilesFromFolder
} from '../utils/driveUtils.js'; 

export const momentMediaController = {
  updateMediaOrder: async (req, res) => {
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
        `Media order updated for moment "${moment.title}" by ${req.user.name}`
      );

      const updatedMoment = await Moment.findById(momentId);
      res.json({ message: 'Media order updated successfully', moment: updatedMoment });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update media order' });
    }
  },

  addMediaToMoment: async (req, res) => {
    try {
      const { momentId } = req.params;
      const files = req.files;
      
      if (!files || files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
      }

      const moment = await Moment.findById(momentId);
      if (!moment) {
        return res.status(404).json({ message: 'Moment not found' });
      }

      if (moment.type !== 'upload') {
        return res.status(400).json({ message: 'Can only add media to upload type moments' });
      }

      const originalData = moment.toObject();

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

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const mimeType = file.mimetype;
        const stream = Readable.from(file.buffer);
        
        const driveResponse = await drive.files.create({
          requestBody: {
            name: `${moment.title || 'untitled'}-${Date.now()}-${i}`,
            mimeType,
            parents: [targetFolderId],
          },
          media: { mimeType, body: stream },
        });
        
        await drive.permissions.create({
          fileId: driveResponse.data.id,
          requestBody: { role: 'reader', type: 'anyone' },
        });
        
        const directUrl = `https://drive.google.com/uc?export=view&id=${driveResponse.data.id}`;
        
        const newMediaFile = {
          name: file.originalname,
          url: directUrl,
          type: file.mimetype.startsWith('image/') ? 'image' : 'video',
          order: maxOrder + i + 1,
          mediaPublicId: driveResponse.data.id
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
        `${files.length} media files added to moment "${moment.title}" by ${req.user.name}`
      );

      const updatedMoment = await Moment.findById(req.params.momentId);
      res.status(201).json(updatedMoment);
    } catch (error) {
      res.status(500).json({ message: 'Failed to add media to moment', error: error.message });
    }
  },

  addDriveMediaToMoment: async (req, res) => {
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
        `${filesToProcess.length} media files added from Drive to moment "${moment.title}" by ${req.user.name}`
      );

      const updatedMoment = await Moment.findById(momentId);
      res.status(201).json(updatedMoment);
    } catch (error) {
      res.status(500).json({ message: 'Failed to add Drive media to moment', error: error.message });
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

      if (mediaFile.mediaPublicId) {
        try {
          await drive.files.delete({
            fileId: mediaFile.mediaPublicId
          });
        } catch (driveError) {
          console.error('Failed to delete file from Google Drive:', driveError);
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
        `Media file "${mediaFile.name}" deleted from moment "${moment.title}" by ${req.user.name}`
      );

      const updatedMoment = await Moment.findById(req.params.momentId);
      res.json({ message: 'Media file deleted successfully', moment: updatedMoment });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete media file', error: error.message });
    }
  },
};
