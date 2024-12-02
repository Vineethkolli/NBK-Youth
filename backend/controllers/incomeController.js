import Income from '../models/Income.js';
import IncomeLog from '../models/IncomeLog.js';

export const incomeController = {
  // Get all incomes with filters
  getIncomes: async (req, res) => {
    try {
      const { search, status, paymentMode, belongsTo, verifyLog } = req.query;
      let query = { isDeleted: false };

      if (search) {
        query.$or = [
          { incomeId: { $regex: search, $options: 'i' } },
          { name: { $regex: search, $options: 'i' } },
          { amount: !isNaN(search) ? Number(search) : undefined }
        ].filter(Boolean);
      }

      if (status) query.status = status;
      if (paymentMode) query.paymentMode = paymentMode;
      if (belongsTo) query.belongsTo = belongsTo;
      if (verifyLog) query.verifyLog = verifyLog;

      const incomes = await Income.find(query).sort({ createdAt: -1 });
      res.json(incomes);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch incomes' });
    }
  },

  // Get verification data
  getVerificationData: async (req, res) => {
    try {
      const { verifyLog } = req.query;
      const incomes = await Income.find({ verifyLog, isDeleted: false })
        .sort({ createdAt: -1 });
      res.json(incomes);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch verification data' });
    }
  },

  // Create new income
  createIncome: async (req, res) => {
    try {
      const income = await Income.create({
        ...req.body,
        verifyLog: 'not verified'
      });
      res.status(201).json(income);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create income' });
    }
  },

  // Update income
  updateIncome: async (req, res) => {
    try {
      const income = await Income.findById(req.params.id);
      if (!income) {
        return res.status(404).json({ message: 'Income not found' });
      }

      // Create log entry
      await IncomeLog.create({
        incomeId: income._id,
        registerId: req.body.registerId,
        originalData: income.toObject(),
        updatedData: req.body
      });

      // Update income and set verifyLog to 'not verified'
      const updatedIncome = await Income.findByIdAndUpdate(
        req.params.id,
        { ...req.body, verifyLog: 'not verified' },
        { new: true }
      );

      res.json(updatedIncome);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update income' });
    }
  },

  // Update verification status
  updateVerificationStatus: async (req, res) => {
    try {
      const { verifyLog, registerId } = req.body;
      const income = await Income.findById(req.params.id);

      if (!income) {
        return res.status(404).json({ message: 'Income not found' });
      }

      // If status is changing to rejected, move to recycle bin
      if (verifyLog === 'rejected') {
        income.isDeleted = true;
        income.deletedAt = new Date();
        income.deletedBy = registerId;
      }

      // Create log entry
      await IncomeLog.create({
        incomeId: income._id,
        registerId,
        originalData: income.toObject(),
        updatedData: { ...income.toObject(), verifyLog }
      });

      // Update verification status
      income.verifyLog = verifyLog;
      await income.save();

      res.json({ message: 'Verification status updated successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update verification status' });
    }
  },

  // Get modification logs
  getLogs: async (req, res) => {
    try {
      const { search } = req.query;
      let query = {};

      if (search) {
        query.$or = [
          { incomeId: { $regex: search, $options: 'i' } },
          { registerId: { $regex: search, $options: 'i' } },
          { 'originalData.name': { $regex: search, $options: 'i' } }
        ];
      }

      const logs = await IncomeLog.find(query).sort({ createdAt: -1 });
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch logs' });
    }
  },

  // Get modification logs
  getLogs: async (req, res) => {
    try {
      const { search } = req.query;
      let query = {};

      if (search) {
        query.$or = [
          { incomeId: { $regex: search, $options: 'i' } },
          { registerId: { $regex: search, $options: 'i' } },
          { 'originalData.name': { $regex: search, $options: 'i' } }
        ];
      }

      const logs = await IncomeLog.find(query).sort({ createdAt: -1 });
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch modification logs', error });
    }
  },

  // Soft delete income
  deleteIncome: async (req, res) => {
    try {
      const income = await Income.findById(req.params.id);
      if (!income) {
        return res.status(404).json({ message: 'Income not found' });
      }

      income.isDeleted = true;
      income.deletedAt = new Date();
      income.deletedBy = req.user.registerId; // Store the registerId of the user who deleted
      await income.save();

      res.json({ message: 'Income moved to recycle bin' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete income', error });
    }
  },

  // Get recycle bin items
  getRecycleBin: async (req, res) => {
    try {
      const deletedIncomes = await Income.find({ isDeleted: true }).sort({ updatedAt: -1 });
      res.json(deletedIncomes);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch deleted incomes', error });
    }
  },

  // Restore from recycle bin
  restoreIncome: async (req, res) => {
    try {
      const income = await Income.findById(req.params.id);
      if (!income) {
        return res.status(404).json({ message: 'Income not found' });
      }

      income.isDeleted = false;
      await income.save();

      res.json({ message: 'Income restored successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to restore income', error });
    }
  },

  // Permanently delete from recycle bin
  permanentDeleteIncome: async (req, res) => {
    try {
      await Income.findByIdAndDelete(req.params.id);
      res.json({ message: 'Income permanently deleted' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete income permanently', error });
    }
  }
};
