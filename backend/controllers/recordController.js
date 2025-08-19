import Record from '../models/Record.js';
import ProcessedData from '../models/ProcessedData.js';
import { google } from 'googleapis';
import { Readable } from 'stream';
import { processFile } from '../services/fileProcessingService.js';

const drive = google.drive({
  version: 'v3',
  auth: new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_DRIVE_CREDENTIALS),
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  }),
});

export const recordController = {
  // Get all records
  getAllRecords: async (req, res) => {
    try {
      const records = await Record.find().sort({ createdAt: -1 });
      res.json(records);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch records' });
    }
  },

  // Create new record
  createRecord: async (req, res) => {
    try {
      const { fileName, recordYear } = req.body;
      
      if (!req.files || !req.files.viewingFile || !req.files.processingFile) {
        return res.status(400).json({ message: 'Both viewing and processing files are required' });
      }

      // Upload viewing file (PDF)
      const viewingFileUrl = await uploadFileToDrive(
        req.files.viewingFile[0],
        `${fileName}_viewing_${recordYear}`
      );

      // Upload processing file (Excel)
      const processingFileUrl = await uploadFileToDrive(
        req.files.processingFile[0],
        `${fileName}_processing_${recordYear}`
      );

      const record = await Record.create({
        fileName,
        recordYear,
        viewingFileUrl,
        processingFileUrl,
        uploadedBy: req.user.registerId,
        status: 'uploaded'
      });

      res.status(201).json(record);
    } catch (error) {
      console.error('Create record error:', error);
      res.status(500).json({ message: 'Failed to create record' });
    }
  },

  // Update record
  updateRecord: async (req, res) => {
    try {
      const { fileName, recordYear } = req.body;
      const record = await Record.findById(req.params.id);
      
      if (!record) {
        return res.status(404).json({ message: 'Record not found' });
      }

      record.fileName = fileName || record.fileName;
      record.recordYear = recordYear || record.recordYear;
      await record.save();

      res.json(record);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update record' });
    }
  },

  // Delete record
  deleteRecord: async (req, res) => {
    try {
      const record = await Record.findById(req.params.id);
      if (!record) {
        return res.status(404).json({ message: 'Record not found' });
      }

      // Delete files from Google Drive
      try {
        const viewingFileId = extractFileIdFromUrl(record.viewingFileUrl);
        const processingFileId = extractFileIdFromUrl(record.processingFileUrl);
        
        if (viewingFileId) {
          await drive.files.delete({ fileId: viewingFileId });
        }
        if (processingFileId) {
          await drive.files.delete({ fileId: processingFileId });
        }
      } catch (driveError) {
        console.warn('Failed to delete files from Google Drive:', driveError);
      }

      // Delete processed data if exists
      await ProcessedData.deleteMany({ recordId: record._id });

      // Delete record from database
      await Record.findByIdAndDelete(req.params.id);

      res.json({ message: 'Record deleted successfully' });
    } catch (error) {
      console.error('Delete record error:', error);
      res.status(500).json({ message: 'Failed to delete record' });
    }
  },

  // Process file
  processRecord: async (req, res) => {
    try {
      const record = await Record.findById(req.params.id);
      if (!record) {
        return res.status(404).json({ message: 'Record not found' });
      }

      // Start processing in background
      processFile(record._id).catch(error => {
        console.error('Background processing error:', error);
      });

      res.json({ message: 'File processing started' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to start processing' });
    }
  },

  // Reprocess file
  reprocessRecord: async (req, res) => {
    try {
      const record = await Record.findById(req.params.id);
      if (!record) {
        return res.status(404).json({ message: 'Record not found' });
      }

      // Delete existing processed data
      await ProcessedData.deleteMany({ recordId: record._id });

      // Reset status
      record.status = 'uploaded';
      record.processedDate = null;
      record.errorMessage = null;
      await record.save();

      // Start reprocessing
      processFile(record._id).catch(error => {
        console.error('Background reprocessing error:', error);
      });

      res.json({ message: 'File reprocessing started' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to start reprocessing' });
    }
  }
};

const uploadFileToDrive = async (file, fileName) => {
  const stream = Readable.from(file.buffer);
  
  const driveResponse = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [process.env.GOOGLE_DRIVE_RECORDS_FOLDER_ID],
    },
    media: {
      mimeType: file.mimetype,
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

  return `https://drive.google.com/uc?export=view&id=${driveResponse.data.id}`;
};

const extractFileIdFromUrl = (url) => {
  const match = url.match(/[?&]id=([^&]+)/);
  return match ? match[1] : null;
};
