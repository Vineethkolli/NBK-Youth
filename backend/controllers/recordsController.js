import FinancialRecord from '../models/FinancialRecord.js';
import EventRecord from '../models/EventRecord.js';
import { Readable } from 'stream';
import { logActivity } from '../middleware/activityLogger.js';
import cloudinary, { uploadToCloudinary } from '../config/cloudinary.js';

export const recordsController = {
  // Financial Timeline Methods (unchanged)
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

  // Event Records Methods (Cloudinary-based)
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

      // Only allow PDFs
      if (req.file.mimetype !== 'application/pdf') {
        return res.status(400).json({ message: 'Only PDF files are allowed' });
      }

      // Upload to Cloudinary (folder: EventRecords, resource_type: raw)
      const uploadResult = await uploadToCloudinary(req.file.buffer, 'EventRecords', 'raw', true);

      const record = await EventRecord.create({
        eventName,
        recordYear,
        fileUrl: uploadResult.secure_url,
        filePublicId: uploadResult.public_id,
        uploadedBy: req.user.registerId
      });

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

      // If a new file is uploaded, delete old Cloudinary file (if exists) and upload new one
      if (req.file) {
        if (req.file.mimetype !== 'application/pdf') {
          return res.status(400).json({ message: 'Only PDF files are allowed' });
        }

        // Delete old Cloudinary file if present
        if (originalRecord.filePublicId) {
          try {
            await cloudinary.uploader.destroy(originalRecord.filePublicId, { resource_type: 'raw' });
          } catch (err) {
            console.error('Failed to delete old Cloudinary file:', err);
          }
        }

        // Upload new PDF
        const uploadResult = await uploadToCloudinary(req.file.buffer, 'EventRecords', 'raw', true);

        updatedFields.fileUrl = uploadResult.secure_url;
        updatedFields.filePublicId = uploadResult.public_id;
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

      // Delete file from Cloudinary (if we have public id)
      if (record.filePublicId) {
        try {
          await cloudinary.uploader.destroy(record.filePublicId, { resource_type: 'raw' });
          console.log(`Deleted Cloudinary file ${record.filePublicId}`);
        } catch (err) {
          console.error('Failed to delete file from Cloudinary:', err);
        }
      }

      // Log deletion
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
      console.error(error);
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
