import Income from '../models/Income.js';
import { logActivity } from '../middleware/activityLogger.js';

export const incomeController = {
  getIncomes: async (req, res) => {
    try {
      const {
        search,
        status,
        paymentMode,
        belongsTo,
        verifyLog,
        startDate,
        endDate,
        dateFilter
      } = req.query;

      const query = { isDeleted: false };

      if (search) {
        const searchConditions = [
          { incomeId: { $regex: search, $options: 'i' } },
          { name: { $regex: search, $options: 'i' } }
        ];

        if (!isNaN(Number(search))) {
          searchConditions.push({ amount: Number(search) });
        }

        query.$or = searchConditions;
      }

      if (status) query.status = status;
      if (paymentMode) query.paymentMode = paymentMode;
      if (belongsTo) query.belongsTo = belongsTo;
      if (verifyLog) query.verifyLog = verifyLog;

      if (startDate || endDate) {
        const dateField = dateFilter === 'paidDate' ? 'paidDate' : 'createdAt';
        query[dateField] = {};

        if (startDate) query[dateField].$gte = new Date(startDate);
        if (endDate) query[dateField].$lte = new Date(endDate);
        if (dateFilter === 'paidDate') query.paidDate.$ne = null;
      }

      const incomes = await Income.find(query)
        .select(
          'incomeId name email phoneNumber amount status paymentMode belongsTo verifyLog paidDate createdAt registerId'
        )
        .sort({ createdAt: -1 })
        .lean();

      res.json(incomes);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch incomes', error: error.message });
    }
  },

  
  getVerificationData: async (req, res) => {
    try {
      const { verifyLog } = req.query;

      const incomes = await Income.find({
        verifyLog,
        isDeleted: false
      })
        .sort({ createdAt: -1 })
        .lean();

      res.json(incomes);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch verification data', error: error.message });
    }
  },

  
  createIncome: async (req, res) => {
    try {
      let { name, status } = req.body;

      const normalizedName = name.trim().replace(/\s+/g, ' ');

      const existingIncome = await Income.findOne({
        name: { $regex: `^${normalizedName}$`, $options: 'i' }
      }).lean();

      if (existingIncome) {
        return res.status(400).json({ message: 'Name already exists' });
      }

      const incomeData = {
        ...req.body,
        name: normalizedName,
        verifyLog: 'not verified'
      };

      if (status === 'paid') {
        incomeData.paidDate = new Date();
      }

      const income = await Income.create(incomeData);

      await logActivity(
        req,
        'CREATE',
        'Income',
        income.incomeId,
        { before: null, after: income.toObject() },
        `Income ${income.incomeId} created by ${req.user?.name}`
      );

      res.status(201).json(income);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create income', error: error.message });
    }
  },


  updateIncome: async (req, res) => {
    try {
      let { name, status } = req.body;

      const income = await Income.findById(req.params.id);
      if (!income) {
        return res.status(404).json({ message: 'Income not found' });
      }

      let normalizedName;
      if (name) {
        normalizedName = name.trim().replace(/\s+/g, ' ');

        const existingIncome = await Income.findOne({
          name: { $regex: `^${normalizedName}$`, $options: 'i' },
          _id: { $ne: req.params.id }
        }).lean();

        if (existingIncome) {
          return res.status(400).json({ message: 'Name already exists' });
        }
      }

      const originalData = income.toObject();

      let updateData = { ...req.body, verifyLog: 'not verified' };
      if (normalizedName) updateData.name = normalizedName;

      if (status === 'paid' && income.status !== 'paid') {
        updateData.paidDate = new Date();
      } else if (status === 'not paid' && income.status === 'paid') {
        updateData.paidDate = null;
      }

      const updatedIncome = await Income.findByIdAndUpdate(req.params.id, updateData, {
        new: true
      });

      await logActivity(
        req,
        'UPDATE',
        'Income',
        income.incomeId,
        { before: originalData, after: updatedIncome.toObject() },
        `Income ${income.incomeId} updated by ${req.user?.name}`
      );

      res.json(updatedIncome);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update income', error: error.message });
    }
  },


  updateVerificationStatus: async (req, res) => {
    try {
      const { verifyLog, registerId } = req.body;

      const income = await Income.findById(req.params.id);
      if (!income) {
        return res.status(404).json({ message: 'Income not found' });
      }

      const originalData = income.toObject();

      if (verifyLog === 'rejected') {
        income.isDeleted = true;
        income.deletedAt = new Date();
        income.deletedBy = registerId;
      }

      income.verifyLog = verifyLog;
      await income.save();

      await logActivity(
        req,
        'VERIFY',
        'Income',
        income.incomeId,
        { before: originalData, after: income.toObject() },
        `Income ${income.incomeId} verification status changed to ${verifyLog} by ${registerId}`
      );

      res.json({ message: 'Verification status updated successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update verification status', error: error.message });
    }
  },


  deleteIncome: async (req, res) => {
    try {
      const income = await Income.findById(req.params.id);
      if (!income) {
        return res.status(404).json({ message: 'Income not found' });
      }

      const originalData = income.toObject();

      income.isDeleted = true;
      income.deletedAt = new Date();
      income.deletedBy = req.user?.registerId;

      await income.save();

      await logActivity(
        req,
        'DELETE',
        'Income',
        income.incomeId,
        { before: originalData, after: income.toObject() },
        `Income ${income.incomeId} moved to recycle bin by ${req.user?.name}`
      );

      res.json({ message: 'Income moved to recycle bin' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete income', error: error.message });
    }
  },


  getRecycleBin: async (req, res) => {
    try {
      const deletedIncomes = await Income.find({ isDeleted: true })
        .sort({ updatedAt: -1 })
        .lean();

      res.json(deletedIncomes);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch deleted incomes', error: error.message });
    }
  },


  restoreIncome: async (req, res) => {
    try {
      const income = await Income.findById(req.params.id);
      if (!income) {
        return res.status(404).json({ message: 'Income not found' });
      }

      const originalData = income.toObject();

      income.isDeleted = false;
      await income.save();

      await logActivity(
        req,
        'RESTORE',
        'Income',
        income.incomeId,
        { before: originalData, after: income.toObject() },
        `Income ${income.incomeId} restored from recycle bin by ${req.user?.name}`
      );

      res.json({ message: 'Income restored successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to restore income', error: error.message });
    }
  },


  permanentDeleteIncome: async (req, res) => {
    try {
      const income = await Income.findById(req.params.id);
      if (!income) {
        return res.status(404).json({ message: 'Income not found' });
      }

      const originalData = income.toObject();

      await logActivity(
        req,
        'DELETE',
        'Income',
        income.incomeId,
        { before: originalData, after: null },
        `Income ${income.incomeId} permanently deleted by ${req.user?.name}`
      );

      await Income.findByIdAndDelete(req.params.id);

      res.json({ message: 'Income permanently deleted' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete income permanently', error: error.message });
    }
  }
};
