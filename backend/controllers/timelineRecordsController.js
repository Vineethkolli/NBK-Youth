import TimelineRecord from '../models/TimelineRecord.js';
import { logActivity } from '../middleware/activityLogger.js';
import { redis } from '../utils/redis.js';

export const timelineRecordsController = {
  getAllTimelineRecords: async (req, res) => {
    try {

      const cached = await redis.get('records:timeline-records');
      if (cached) {
        return res.json(JSON.parse(cached));
      }

      const records = await TimelineRecord.find().sort({ year: -1 }).lean();
      await redis.set('records:timeline-records', JSON.stringify(records));
      res.json(records);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch timeline records' });
    }
  },


  getTimelineRecordsByEvent: async (req, res) => {
    try {
      const { eventName } = req.params;
      const records = await TimelineRecord.find({ eventName }).sort({ year: -1 }).lean();
      res.json(records);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch timeline records by event' });
    }
  },


  createTimelineRecord: async (req, res) => {
    try {
      const {
        eventName,
        year,
        status,
        amountCollected,
        amountSpent,
        previousAmount,
        additionalAmount,
        remarks,
        responsible
      } = req.body;

      if (previousAmount === undefined || previousAmount === null || previousAmount === '') {
        return res.status(400).json({ message: 'Previous amount is required' });
      }

      const existingRecord = await TimelineRecord.findOne({ eventName, year }).lean();
      if (existingRecord) {
        return res.status(400).json({ message: 'Timeline record already exists for this event and year' });
      }

      const record = await TimelineRecord.create({
        eventName,
        year,
        status: status || 'Conducted',
        amountCollected: amountCollected || 0,
        amountSpent: amountSpent || 0,
        previousAmount,
        additionalAmount: additionalAmount ?? 0,
        remarks,
        responsible,
        createdBy: req.user.registerId
      });

      await logActivity(
        req,
        'CREATE',
        'TimelineRecord',
        `${eventName}-${year}`,
        { before: null, after: record.toObject() },
        `Timeline record for ${eventName} ${year} created by ${req.user.name}`
      );

      await redis.del('records:timeline-records');
      res.status(201).json(record);
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({ message: 'Timeline record already exists for this event and year' });
      }
      res.status(500).json({ message: 'Failed to create timeline record' });
    }
  },


  updateTimelineRecord: async (req, res) => {
    try {
      const recordId = req.params.id;
      const originalRecord = await TimelineRecord.findById(recordId);
      if (!originalRecord) {
        return res.status(404).json({ message: 'Timeline record not found' });
      }

      const { eventName, year } = req.body;
      if (eventName && year) {
        const existing = await TimelineRecord.findOne({ eventName, year, _id: { $ne: recordId } }).lean();
        if (existing) {
          return res.status(400).json({ message: 'Timeline record already exists for this event and year' });
        }
      }

      const originalData = originalRecord.toObject();

      const updatePayload = {};
      if (Object.prototype.hasOwnProperty.call(req.body, 'eventName')) updatePayload.eventName = req.body.eventName;
      if (Object.prototype.hasOwnProperty.call(req.body, 'year')) updatePayload.year = req.body.year;
      if (Object.prototype.hasOwnProperty.call(req.body, 'status')) updatePayload.status = req.body.status;
      if (Object.prototype.hasOwnProperty.call(req.body, 'amountCollected')) updatePayload.amountCollected = req.body.amountCollected;
      if (Object.prototype.hasOwnProperty.call(req.body, 'amountSpent')) updatePayload.amountSpent = req.body.amountSpent;
      if (Object.prototype.hasOwnProperty.call(req.body, 'previousAmount')) {
        if (req.body.previousAmount === undefined || req.body.previousAmount === null || req.body.previousAmount === '') {
          return res.status(400).json({ message: 'Previous amount is required' });
        }
        updatePayload.previousAmount = req.body.previousAmount;
      }
      if (Object.prototype.hasOwnProperty.call(req.body, 'additionalAmount')) {
        updatePayload.additionalAmount = req.body.additionalAmount;
      }
      if (Object.prototype.hasOwnProperty.call(req.body, 'remarks')) updatePayload.remarks = req.body.remarks;
      if (Object.prototype.hasOwnProperty.call(req.body, 'responsible')) updatePayload.responsible = req.body.responsible;

      const record = await TimelineRecord.findByIdAndUpdate(recordId, updatePayload, { new: true });

      await logActivity(
        req,
        'UPDATE',
        'TimelineRecord',
        `${record.eventName}-${record.year}`,
        { before: originalData, after: record.toObject() },
        `Timeline record for ${record.eventName} ${record.year} updated by ${req.user.name}`
      );

      await redis.del('records:timeline-records');
      res.json(record);
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({ message: 'Timeline record already exists for this event and year' });
      }
      res.status(500).json({ message: 'Failed to update timeline record' });
    }
  },


  deleteTimelineRecord: async (req, res) => {
    try {
      const record = await TimelineRecord.findById(req.params.id);
      if (!record) {
        return res.status(404).json({ message: 'Timeline record not found' });
      }

      const originalData = record.toObject();

      await logActivity(
        req,
        'DELETE',
        'TimelineRecord',
        `${record.eventName}-${record.year}`,
        { before: originalData, after: null },
        `Timeline record for ${record.eventName} ${record.year} deleted by ${req.user.name}`
      );

      await TimelineRecord.findByIdAndDelete(req.params.id);
      await redis.del('records:timeline-records');
      res.json({ message: 'Timeline record deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete timeline record' });
    }
  },


  getUniqueTimelineEventNames: async (req, res) => {
    try {
      const eventNames = await TimelineRecord.distinct('eventName');
      res.json(eventNames);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch timeline event names' });
    }
  }
};
