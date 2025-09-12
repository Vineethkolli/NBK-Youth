import Moment from '../models/Moment.js';
import { google } from 'googleapis';
import { Readable } from 'stream';
import { logActivity } from '../middleware/activityLogger.js';

const drive = google.drive({
  version: 'v3',
  auth: new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_DRIVE_CREDENTIALS),
    scopes: ['https://www.googleapis.com/auth/drive'],
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

// Helper function to extract folder ID from URL
const extractFolderIdFromUrl = (url) => {
  const folderMatch = url.match(/\/folders\/([^/?]+)/);
  if (folderMatch) {
    return folderMatch[1];
  }
  return null;
};

// Helper function to get direct view URL from Drive sharing URL
const getDirectViewUrl = (url) => {
  const fileId = extractFileIdFromUrl(url);
  if (!fileId) return url;
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
};

// Helper function to create subfolder
const createSubfolder = async (parentFolderId, subfolderName) => {
  try {
    const response = await drive.files.create({
      requestBody: {
        name: subfolderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentFolderId],
      },
    });
    return response.data.id;
  } catch (error) {
    console.error('Error creating subfolder:', error);
    throw error;
  }
};

// Helper function to delete folder and all its contents
const deleteFolderRecursively = async (folderId) => {
  try {
    // Get all files in the folder
    const response = await drive.files.list({
      q: `'${folderId}' in parents`,
      fields: 'files(id, mimeType)',
    });

    // Delete all files in the folder
    for (const file of response.data.files) {
      if (file.mimeType === 'application/vnd.google-apps.folder') {
        // Recursively delete subfolders
        await deleteFolderRecursively(file.id);
      }
      await drive.files.delete({ fileId: file.id });
    }

    // Delete the folder itself
    await drive.files.delete({ fileId: folderId });
  } catch (error) {
    console.error('Error deleting folder:', error);
    throw error;
  }
};

// Helper function to get all files from a folder
const getFilesFromFolder = async (folderId) => {
  try {
    const response = await drive.files.list({
      q: `'${folderId}' in parents and (mimeType contains 'image/' or mimeType contains 'video/')`,
      fields: 'files(id, name, mimeType, webViewLink)',
    });
    return response.data.files;
  } catch (error) {
    console.error('Error getting files from folder:', error);
    throw error;
  }
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

  addDriveFolder: async (req, res) => {
    try {
      const { title, url } = req.body;
      
      // Extract folder ID from URL
      const folderId = extractFolderIdFromUrl(url);
      if (!folderId) {
        return res.status(400).json({ message: 'Invalid Google Drive folder URL' });
      }

      // Get all media files from the folder
      const files = await getFilesFromFolder(folderId);
      if (files.length === 0) {
        return res.status(400).json({ message: 'No media files found in the folder' });
      }

      const maxOrder = await Moment.findOne().sort('-order');
      const order = maxOrder ? maxOrder.order + 1 : 0;

      // Create subfolder for this moment
      const subfolderName = `${title}_${Date.now()}`;
      const subfolderId = await createSubfolder(process.env.GOOGLE_DRIVE_FOLDER_ID, subfolderName);

      // Copy files to our subfolder and create media files array
      const mediaFiles = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Copy file to our subfolder
        const copiedFile = await drive.files.copy({
          fileId: file.id,
          requestBody: {
            name: file.name,
            parents: [subfolderId],
          },
        });

        // Set permissions for the copied file
        await drive.permissions.create({
          fileId: copiedFile.data.id,
          requestBody: {
            role: 'reader',
            type: 'anyone',
          },
        });

        const directUrl = `https://drive.google.com/uc?export=view&id=${copiedFile.data.id}`;
        
        mediaFiles.push({
          name: file.name,
          url: directUrl,
          type: file.mimeType.startsWith('image/') ? 'image' : 'video',
          order: i,
          mediaPublicId: copiedFile.data.id
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
        `Drive folder moment "${title}" with ${files.length} files added by ${req.user.name}`
      );

      res.status(201).json(moment);
    } catch (error) {
      res.status(500).json({ message: 'Failed to add Drive folder moment', error: error.message });
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

      // Bulk update orders
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

  updateMediaOrder: async (req, res) => {
    try {
      const { momentId } = req.params;
      const { mediaFiles } = req.body;

      const moment = await Moment.findById(momentId);
      if (!moment) return res.status(404).json({ message: 'Moment not found' });

      const originalData = moment.toObject();

      // Replace with reordered media array
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

      // Return the updated moment with populated data
      const updatedMoment = await Moment.findById(momentId);
      res.json({ message: 'Media order updated successfully', moment: updatedMoment });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update media order' });
    }
  },

  addMediaToMoment: async (req, res) => {
    try {
      const { momentId } = req.params;
      const files = req.files; // Multiple files
      
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
      const newMediaFiles = [];

      // Get the highest current order
      const maxOrder = moment.mediaFiles.length > 0 
        ? Math.max(...moment.mediaFiles.map(m => m.order || 0))
        : 0;

      // Use existing subfolder or create new one
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
        
        const newMediaFile = {
          name: file.originalname,
          url: directUrl,
          type: file.mimetype.startsWith('image/') ? 'image' : 'video',
          order: maxOrder + i + 1,
          mediaPublicId: driveResponse.data.id
        };
        
        moment.mediaFiles.push(newMediaFile);
        newMediaFiles.push(newMediaFile);
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

      // Return the updated moment with all media files
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

      // Check if it's a folder or file URL
      const folderId = extractFolderIdFromUrl(url);
      const fileId = extractFileIdFromUrl(url);

      let filesToProcess = [];

      if (folderId) {
        // It's a folder URL - get all files from folder
        filesToProcess = await getFilesFromFolder(folderId);
      } else if (fileId) {
        // It's a single file URL - get file details
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

      // Get the highest current order
      const maxOrder = moment.mediaFiles.length > 0 
        ? Math.max(...moment.mediaFiles.map(m => m.order || 0))
        : 0;

      // Use existing subfolder or create new one
      let targetFolderId = moment.subfolderId;
      if (!targetFolderId) {
        const subfolderName = `${moment.title}_${Date.now()}`;
        targetFolderId = await createSubfolder(process.env.GOOGLE_DRIVE_FOLDER_ID, subfolderName);
        moment.subfolderName = subfolderName;
        moment.subfolderId = targetFolderId;
      }

      const newMediaFiles = [];
      for (let i = 0; i < filesToProcess.length; i++) {
        const file = filesToProcess[i];
        
        // Copy file to our subfolder
        const copiedFile = await drive.files.copy({
          fileId: file.id,
          requestBody: {
            name: file.name,
            parents: [targetFolderId],
          },
        });

        // Set permissions for the copied file
        await drive.permissions.create({
          fileId: copiedFile.data.id,
          requestBody: {
            role: 'reader',
            type: 'anyone',
          },
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
        newMediaFiles.push(newMediaFile);
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

      // Return the updated moment with all media files
      const updatedMoment = await Moment.findById(momentId);
      res.status(201).json(updatedMoment);
    } catch (error) {
      res.status(500).json({ message: 'Failed to add Drive media to moment', error: error.message });
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

      // Return the updated moment with remaining media files
      const updatedMoment = await Moment.findById(req.params.momentId);
      res.json({ message: 'Media file deleted successfully', moment: updatedMoment });
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

      // Delete all media files in parallel first, then delete the subfolder
      if (moment.subfolderId) {
        try {
          // Get all files in the subfolder
          const response = await drive.files.list({
            q: `'${moment.subfolderId}' in parents`,
            fields: 'files(id, mimeType)',
          });

          // Delete all files in parallel
          const deletePromises = response.data.files.map(file => 
            drive.files.delete({ fileId: file.id }).catch(error => {
              console.error(`Failed to delete file ${file.id}:`, error);
            })
          );

          // Wait for all file deletions to complete
          await Promise.all(deletePromises);

          // Now delete the empty folder
          await drive.files.delete({ fileId: moment.subfolderId });
        } catch (driveError) {
          console.error('Failed to delete subfolder from Google Drive:', driveError);
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

  addDriveMediaMoment: async (req, res) => {
    try {
      const { title, url } = req.body;
      
      // Extract folder ID or file ID from URL
      const folderId = extractFolderIdFromUrl(url);
      const fileId = extractFileIdFromUrl(url);

      if (!folderId && !fileId) {
        return res.status(400).json({ message: 'Invalid Google Drive URL' });
      }

      let filesToProcess = [];

      if (folderId) {
        // It's a folder URL - get all files from folder
        filesToProcess = await getFilesFromFolder(folderId);
      } else if (fileId) {
        // It's a single file URL - get file details
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

      // Create subfolder for this moment
      const subfolderName = `${title}_${Date.now()}`;
      const subfolderId = await createSubfolder(process.env.GOOGLE_DRIVE_FOLDER_ID, subfolderName);

      // Copy files to our subfolder in parallel and create media files array
      const copyPromises = filesToProcess.map(async (file, i) => {
        // Copy file to our subfolder
        const copiedFile = await drive.files.copy({
          fileId: file.id,
          requestBody: {
            name: file.name,
            parents: [subfolderId],
          },
        });

        // Set permissions for the copied file
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

      // Wait for all copy operations to complete
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
        `Drive media moment "${title}" with ${filesToProcess.length} files added by ${req.user.name}`
      );

      res.status(201).json(moment);
    } catch (error) {
      res.status(500).json({ message: 'Failed to add Drive media moment', error: error.message });
    }
  },
};