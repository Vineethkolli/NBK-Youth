import Income from '../models/Income.js';
import { logActivity } from '../middleware/activityLogger.js';

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

      // Log income creation
      await logActivity(
        req,
        'CREATE',
        'Income',
        income.incomeId,
        { before: null, after: income.toObject() },
        `Income ${income.incomeId} created by ${req.user.name}`
      );

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

      const originalData = income.toObject();


      // Update income and set verifyLog to 'not verified'
      const updatedIncome = await Income.findByIdAndUpdate(
        req.params.id,
        { ...req.body, verifyLog: 'not verified' },
        { new: true }
      );

      // Log income update
      await logActivity(
        req,
        'UPDATE',
        'Income',
        income.incomeId,
        { before: originalData, after: updatedIncome.toObject() },
        `Income ${income.incomeId} updated by ${req.user.name}`
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

      const originalData = income.toObject();

      // If status is changing to rejected, move to recycle bin
      if (verifyLog === 'rejected') {
        income.isDeleted = true;
        income.deletedAt = new Date();
        income.deletedBy = registerId;
      }


      // Update verification status
      income.verifyLog = verifyLog;
      await income.save();

      // Log verification status change
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
      res.status(500).json({ message: 'Failed to update verification status' });
    }
  },


  // Soft delete income
  deleteIncome: async (req, res) => {
    try {
      const income = await Income.findById(req.params.id);
      if (!income) {
        return res.status(404).json({ message: 'Income not found' });
      }

      const originalData = income.toObject();

      income.isDeleted = true;
      income.deletedAt = new Date();
      income.deletedBy = req.user.registerId; 
      await income.save();

      // Log income deletion
      await logActivity(
        req,
        'DELETE',
        'Income',
        income.incomeId,
        { before: originalData, after: income.toObject() },
        `Income ${income.incomeId} moved to recycle bin by ${req.user.name}`
      );

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

      const originalData = income.toObject();

      income.isDeleted = false;
      await income.save();

      // Log income restoration
      await logActivity(
        req,
        'RESTORE',
        'Income',
        income.incomeId,
        { before: originalData, after: income.toObject() },
        `Income ${income.incomeId} restored from recycle bin by ${req.user.name}`
      );

      res.json({ message: 'Income restored successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to restore income', error });
    }
  },

  // Permanently delete from recycle bin
  permanentDeleteIncome: async (req, res) => {
    try {
      const income = await Income.findById(req.params.id);
      if (!income) {
        return res.status(404).json({ message: 'Income not found' });
      }

      const originalData = income.toObject();

      // Log permanent deletion
      await logActivity(
        req,
        'DELETE',
        'Income',
        income.incomeId,
        { before: originalData, after: null },
        `Income ${income.incomeId} permanently deleted by ${req.user.name}`
      );

      await Income.findByIdAndDelete(req.params.id);
      res.json({ message: 'Income permanently deleted' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete income permanently', error });
    }
  }
};
