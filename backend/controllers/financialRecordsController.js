import FinancialRecord from '../models/FinancialRecord.js';
import { logActivity } from '../middleware/activityLogger.js';
import { redis } from '../utils/redis.js';

export const financialRecordsController = {
  getAllFinancialRecords: async (req, res) => {
    try {
      const cached = await redis.get('records:financial-records');
      if (cached) {
        return res.json(JSON.parse(cached));
      }

      const records = await FinancialRecord.find().sort({ year: -1 }).lean();
      await redis.set('records:financial-records', JSON.stringify(records));
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

      await redis.del('records:financial-records');
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

    await redis.del('records:financial-records');
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
      await redis.del('records:financial-records');
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
  }
};
