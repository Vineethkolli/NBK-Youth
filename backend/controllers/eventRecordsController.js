import EventRecord from '../models/EventRecord.js';
import { logActivity } from '../middleware/activityLogger.js';
import cloudinary from '../config/cloudinary.js';
import { redis } from '../utils/redis.js';

export const eventRecordsController = {
  getAllEventRecords: async (req, res) => {
    try {
      const cached = await redis.get('records:event-records');
      if (cached) {
        return res.json(JSON.parse(cached));
      }

      const records = await EventRecord.find().sort({ createdAt: -1 }).lean();
      await redis.set('records:event-records', JSON.stringify(records));
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

      // Require at least one language file english or telugu
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

      await redis.del('records:event-records');
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

      // If file is being replaced, delete old file from cloudinary
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

      if (req.body.filePublicIdTelugu || req.body.fileUrlTelugu) {
        if (originalRecord.filePublicIdTelugu) {
          try {
            await cloudinary.uploader.destroy(originalRecord.filePublicIdTelugu, { resource_type: 'raw' });
          } catch (err) {
            console.error('Failed to delete old Telugu Cloudinary file:', err);
          }
        }
      }

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

      await redis.del('records:event-records');
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
      await redis.del('records:event-records');
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
