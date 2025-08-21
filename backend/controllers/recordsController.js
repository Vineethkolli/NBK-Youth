import FinancialRecord from '../models/FinancialRecord.js';
import EventRecord from '../models/EventRecord.js';
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

export const recordsController = {
  // Financial Timeline Methods
  getAllFinancialRecords: async (req, res) => {
    try {
      const records = await FinancialRecord.find().sort({ year: -1 });
      res.json(records);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch financial records' });
    }
  },

  getFinancialRecordsByEvent: async (req, res) => {
    try {
      const { eventName } = req.params;
      const records = await FinancialRecord.find({ eventName }).sort({ year: -1 });
      res.json(records);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch financial records by event' });
    }
  },

  createFinancialRecord: async (req, res) => {
    try {
      const { eventName, year, amountLeft, maturityAmount } = req.body;

      // Check if record already exists for this event-year combination
      const existingRecord = await FinancialRecord.findOne({ eventName, year });
      if (existingRecord) {
        return res.status(400).json({ message: 'Financial record already exists for this event and year' });
      }

      const record = await FinancialRecord.create({
        eventName,
        year,
        amountLeft: amountLeft || 0,
        maturityAmount: maturityAmount || 0,
        createdBy: req.user.registerId
      });

      // Log financial record creation
      await logActivity(
        req,
        'CREATE',
        'FinancialRecord',
        `${eventName}-${year}`,
        { before: null, after: record.toObject() },
        `Financial record for ${eventName} ${year} created by ${req.user.name}`
      );

      res.status(201).json(record);
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({ message: 'Financial record already exists for this event and year' });
      }
      res.status(500).json({ message: 'Failed to create financial record' });
    }
  },

  updateFinancialRecord: async (req, res) => {
    try {
      const originalRecord = await FinancialRecord.findById(req.params.id);
      if (!originalRecord) {
        return res.status(404).json({ message: 'Financial record not found' });
      }

      const originalData = originalRecord.toObject();

      const record = await FinancialRecord.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );

      // Log financial record update
      await logActivity(
        req,
        'UPDATE',
        'FinancialRecord',
        `${record.eventName}-${record.year}`,
        { before: originalData, after: record.toObject() },
        `Financial record for ${record.eventName} ${record.year} updated by ${req.user.name}`
      );

      res.json(record);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update financial record' });
    }
  },

  deleteFinancialRecord: async (req, res) => {
    try {
      const record = await FinancialRecord.findById(req.params.id);
      if (!record) {
        return res.status(404).json({ message: 'Financial record not found' });
      }

      const originalData = record.toObject();

      // Log financial record deletion
      await logActivity(
        req,
        'DELETE',
        'FinancialRecord',
        `${record.eventName}-${record.year}`,
        { before: originalData, after: null },
        `Financial record for ${record.eventName} ${record.year} deleted by ${req.user.name}`
      );

      await FinancialRecord.findByIdAndDelete(req.params.id);
      res.json({ message: 'Financial record deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete financial record' });
    }
  },

  getUniqueEventNames: async (req, res) => {
    try {
      const eventNames = await FinancialRecord.distinct('eventName');
      res.json(eventNames);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch event names' });
    }
  },

  // Event Records Methods
  getAllEventRecords: async (req, res) => {
    try {
      const records = await EventRecord.find().sort({ createdAt: -1 });
      res.json(records);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch event records' });
    }
  },

  createEventRecord: async (req, res) => {
    try {
      const { eventName, recordYear } = req.body;

      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      // Validate file type
      if (req.file.mimetype !== 'application/pdf') {
        return res.status(400).json({ message: 'Only PDF files are allowed' });
      }

      const stream = Readable.from(req.file.buffer);

      // Upload to Google Drive
      const driveResponse = await drive.files.create({
        requestBody: {
          name: `${eventName}_${recordYear}_${Date.now()}.pdf`,
          mimeType: 'application/pdf',
          parents: [process.env.GOOGLE_DRIVE_RECORDS_FOLDER_ID],
        },
        media: {
          mimeType: 'application/pdf',
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

      const record = await EventRecord.create({
        eventName,
        recordYear,
        fileUrl: directUrl,
        fileName: req.file.originalname,
        uploadedBy: req.user.registerId
      });

      // Log event record creation
      await logActivity(
        req,
        'CREATE',
        'EventRecord',
        record.recordId,
        { before: null, after: record.toObject() },
        `Event record ${record.recordId} for ${eventName} ${recordYear} uploaded by ${req.user.name}`
      );

      res.status(201).json(record);
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ message: 'Failed to upload event record' });
    }
  },

  updateEventRecord: async (req, res) => {
  try {
    const originalRecord = await EventRecord.findById(req.params.id);
    if (!originalRecord) {
      return res.status(404).json({ message: 'Event record not found' });
    }

    const originalData = originalRecord.toObject();
    let updatedFields = { ...req.body };

    // --- If a new file is uploaded ---
    if (req.file) {
      if (req.file.mimetype !== 'application/pdf') {
        return res.status(400).json({ message: 'Only PDF files are allowed' });
      }

      // Delete old file from Google Drive
      const oldFileId = extractFileIdFromUrl(originalRecord.fileUrl);
      if (oldFileId) {
        try {
          await drive.files.delete({ fileId: oldFileId });
        } catch (err) {
          console.error("Failed to delete old file:", err);
        }
      }

      // Upload new file
      const stream = Readable.from(req.file.buffer);
      const driveResponse = await drive.files.create({
        requestBody: {
          name: `${req.body.eventName || originalRecord.eventName}_${req.body.recordYear || originalRecord.recordYear}_${Date.now()}.pdf`,
          mimeType: 'application/pdf',
          parents: [process.env.GOOGLE_DRIVE_RECORDS_FOLDER_ID],
        },
        media: {
          mimeType: 'application/pdf',
          body: stream,
        },
      });

      await drive.permissions.create({
        fileId: driveResponse.data.id,
        requestBody: { role: 'reader', type: 'anyone' },
      });

      const directUrl = `https://drive.google.com/uc?export=view&id=${driveResponse.data.id}`;
      updatedFields.fileUrl = directUrl;
      updatedFields.fileName = req.file.originalname;
    }

    // Update DB record
    const record = await EventRecord.findByIdAndUpdate(
      req.params.id,
      updatedFields,
      { new: true }
    );

    // Log activity
    await logActivity(
      req,
      'UPDATE',
      'EventRecord',
      record.recordId,
      { before: originalData, after: record.toObject() },
      `Event record ${record.recordId} updated by ${req.user.name}`
    );

    res.json(record);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update event record' });
  }
},

  deleteEventRecord: async (req, res) => {
    try {
      const record = await EventRecord.findById(req.params.id);
      if (!record) {
        return res.status(404).json({ message: 'Event record not found' });
      }

      const originalData = record.toObject();

      // Delete file from Google Drive
      try {
        const fileId = extractFileIdFromUrl(record.fileUrl);
        if (fileId) {
          await drive.files.delete({ fileId });
          console.log(`Deleted file ${fileId} from Google Drive`);
        }
      } catch (driveError) {
        console.error('Failed to delete file from Google Drive:', driveError);
      }

      // Log event record deletion
      await logActivity(
        req,
        'DELETE',
        'EventRecord',
        record.recordId,
        { before: originalData, after: null },
        `Event record ${record.recordId} for ${record.eventName} ${record.recordYear} deleted by ${req.user.name}`
      );

      await EventRecord.findByIdAndDelete(req.params.id);
      res.json({ message: 'Event record deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete event record' });
    }
  },

  getUniqueEventRecordNames: async (req, res) => {
    try {
      const eventNames = await EventRecord.distinct('eventName');
      res.json(eventNames);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch event record names' });
    }
  }
};