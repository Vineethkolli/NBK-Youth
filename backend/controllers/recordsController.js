import FinancialRecord from '../models/FinancialRecord.js';
import EventRecord from '../models/EventRecord.js';
import { logActivity } from '../middleware/activityLogger.js';
import cloudinary from '../config/cloudinary.js';

export const recordsController = {
  getAllFinancialRecords: async (req, res) => {
    try {
      const records = await FinancialRecord.find().sort({ year: -1 }).lean();
      res.json(records);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch financial records' });
    }
  },


  getFinancialRecordsByEvent: async (req, res) => {
    try {
      const { eventName } = req.params;
      const records = await FinancialRecord.find({ eventName }).sort({ year: -1 }).lean();
      res.json(records);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch financial records by event' });
    }
  },


  createFinancialRecord: async (req, res) => {
    try {
      const {
        eventName,
        year,
        status,
        amountLeft,
        maturityAmount,
        fdStartDate,
        fdMaturityDate,
        fdAccount,
        remarks
      } = req.body;

      const existingRecord = await FinancialRecord.findOne({ eventName, year }).lean();
      if (existingRecord) {
        return res.status(400).json({ message: 'Financial record already exists for this event and year' });
      }

      const record = await FinancialRecord.create({
        eventName,
        year,
        status: status || "Conducted",
        amountLeft: amountLeft || 0,
        maturityAmount: maturityAmount || 0,
        fdStartDate,
        fdMaturityDate,
        fdAccount,
        remarks,
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
    const recordId = req.params.id;
    const originalRecord = await FinancialRecord.findById(recordId);
    if (!originalRecord) {
      return res.status(404).json({ message: 'Financial record not found' });
    }

    const { eventName, year } = req.body;

    // Check for duplicate (eventName + year)
    if (eventName && year) {
      const existing = await FinancialRecord.findOne({ eventName, year, _id: { $ne: recordId } }).lean();
      if (existing) {
        return res.status(400).json({
          message: 'Financial record already exists for this event and year'
        });
      }
    }

    const originalData = originalRecord.toObject();

    const record = await FinancialRecord.findByIdAndUpdate(recordId, req.body, { new: true });

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
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Financial record already exists for this event and year' });
    }
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


  getAllEventRecords: async (req, res) => {
    try {
      const records = await EventRecord.find().sort({ createdAt: -1 }).lean();
      res.json(records);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch event records' });
    }
  },


  createEventRecord: async (req, res) => {
    try {
      const { eventName, recordYear } = req.body;
      
      const fileUrlEnglish = req.body.fileUrlEnglish || req.body.fileUrl;
      const filePublicIdEnglish = req.body.filePublicIdEnglish || req.body.filePublicId;
      const fileUrlTelugu = req.body.fileUrlTelugu || null;
      const filePublicIdTelugu = req.body.filePublicIdTelugu || null;

      // Require at least one language file metadata (english or telugu)
      const hasEnglish = fileUrlEnglish && filePublicIdEnglish;
      const hasTelugu = fileUrlTelugu && filePublicIdTelugu;
      if (!hasEnglish && !hasTelugu) {
        return res.status(400).json({ message: 'Missing file metadata: please provide at least one English or Telugu file' });
      }

      // Check for duplicate (eventName + recordYear) before creating
      const existing = await EventRecord.findOne({ eventName, recordYear }).lean();
      if (existing) {
        return res.status(400).json({ message: 'Event record already exists for this event and year' });
      }

      const record = await EventRecord.create({
        eventName,
        recordYear,
        fileUrlEnglish,
        filePublicIdEnglish,
        fileUrlTelugu,
        filePublicIdTelugu,
        uploadedBy: req.user.registerId
      });

      await logActivity(
        req,
        'CREATE',
        'EventRecord',
        record._id,
        { before: null, after: record.toObject() },
        `Event record for ${eventName} ${recordYear} uploaded by ${req.user.name}`
      );

      res.status(201).json(record);
    } catch (error) {
      console.error('Upload error:', error);
      if (error.code === 11000) {
        return res.status(400).json({ message: 'Event record already exists for this event and year' });
      }
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

      // If english file is being replaced, delete old english file from cloudinary
      if ((req.body.fileUrlEnglish || req.body.fileUrl) && (req.body.filePublicIdEnglish || req.body.filePublicId)) {
        const existingEnglishPublicId = originalRecord.filePublicIdEnglish || originalRecord.filePublicId;
        if (existingEnglishPublicId) {
          try {
            await cloudinary.uploader.destroy(existingEnglishPublicId, { resource_type: 'raw' });
          } catch (err) {
            console.error('Failed to delete old English Cloudinary file:', err);
          }
        }
      }

      // If telugu file is being replaced, delete old telugu file
      if (req.body.filePublicIdTelugu || req.body.fileUrlTelugu) {
        if (originalRecord.filePublicIdTelugu) {
          try {
            await cloudinary.uploader.destroy(originalRecord.filePublicIdTelugu, { resource_type: 'raw' });
          } catch (err) {
            console.error('Failed to delete old Telugu Cloudinary file:', err);
          }
        }
      }

      // Normalize legacy keys to new keys for update
      const updatePayload = { ...req.body };
      if (req.body.fileUrl && !req.body.fileUrlEnglish) updatePayload.fileUrlEnglish = req.body.fileUrl;
      if (req.body.filePublicId && !req.body.filePublicIdEnglish) updatePayload.filePublicIdEnglish = req.body.filePublicId;

      // If eventName or recordYear are changing, check for duplicates
      const newEventName = updatePayload.eventName || originalRecord.eventName;
      const newRecordYear = updatePayload.recordYear || originalRecord.recordYear;
      if ((newEventName !== originalRecord.eventName) || (newRecordYear !== originalRecord.recordYear)) {
        const conflict = await EventRecord.findOne({ eventName: newEventName, recordYear: newRecordYear }).lean();
        if (conflict && String(conflict._id) !== String(originalRecord._id)) {
          return res.status(400).json({ message: 'Event record already exists for this event and year' });
        }
      }

      const record = await EventRecord.findByIdAndUpdate(req.params.id, updatePayload, { new: true });

      await logActivity(
        req,
        'UPDATE',
        'EventRecord',
        record._id,
        { before: originalData, after: record.toObject() },
        `Event record for ${record.eventName} ${record.recordYear} updated by ${req.user.name}`
      );

      res.json(record);
    } catch (error) {
      console.error(error);
      if (error.code === 11000) {
        return res.status(400).json({ message: 'Event record already exists for this event and year' });
      }
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

      // delete both english and telugu files if present
      const englishPublicId = record.filePublicIdEnglish || record.filePublicId;
      if (englishPublicId) {
        try {
          await cloudinary.uploader.destroy(englishPublicId, { resource_type: 'raw' });
        } catch (err) {
          console.error('Failed to delete English file from Cloudinary:', err);
        }
      }
      if (record.filePublicIdTelugu) {
        try {
          await cloudinary.uploader.destroy(record.filePublicIdTelugu, { resource_type: 'raw' });
        } catch (err) {
          console.error('Failed to delete Telugu file from Cloudinary:', err);
        }
      }

      await logActivity(
        req,
        'DELETE',
        'EventRecord',
        record._id,
        { before: originalData, after: null },
        `Event record for ${record.eventName} ${record.recordYear} deleted by ${req.user.name}`
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
  },


  // Check if an event record exists for a given eventName+recordYear
  checkEventRecord: async (req, res) => {
  try {
    const { eventName, recordYear, recordId } = req.body;

    if (!eventName || !recordYear) {
      return res.status(400).json({ message: 'Missing eventName or recordYear' });
    }

    const existing = await EventRecord.findOne({ eventName, recordYear }).lean();

    if (existing && (!recordId || String(existing._id) !== String(recordId))) {
      return res.status(400).json({ message: 'Event record already exists for this event and year' });
    }

    return res.json({ message: 'ok' });
  } catch (error) {
    console.error('checkEventRecord error:', error);
    res.status(500).json({ message: 'Failed to check event record' });
  }
}
};
