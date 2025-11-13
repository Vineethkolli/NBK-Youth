import Expense from '../models/Expense.js';
import cloudinary from '../config/cloudinary.js';
import { logActivity } from '../middleware/activityLogger.js';

export const expenseController = {
  getExpenses: async (req, res) => {
    try {
      const { search, paymentMode, verifyLog, startDate, endDate } = req.query;
      let query = { isDeleted: false };

      if (search) {
        query.$or = [
          { expenseId: { $regex: search, $options: 'i' } },
          { name: { $regex: search, $options: 'i' } },
          { amount: !isNaN(search) ? Number(search) : undefined },
          { purpose: { $regex: search, $options: 'i' } }
        ].filter(Boolean);
      }

      if (paymentMode) query.paymentMode = paymentMode;
      if (verifyLog) query.verifyLog = verifyLog;

      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) {
          query.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
          query.createdAt.$lte = new Date(endDate);
        }
      }

      const expenses = await Expense.find(query).sort({ createdAt: -1 }).lean();
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch expenses' });
    }
  },


  getVerificationData: async (req, res) => {
    try {
      const { verifyLog } = req.query;
      const expenses = await Expense.find({ verifyLog, isDeleted: false })
        .sort({ createdAt: -1 })
        .lean();
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch verification data' });
    }
  },

 
  createExpense: async (req, res) => {
    try {
      const { billImage, billImagePublicId } = req.body;

      const expense = await Expense.create({
        ...req.body,
        billImage: billImage || null,
        billImagePublicId: billImagePublicId || null,
        verifyLog: 'not verified'
      });

      await logActivity(
        req,
        'CREATE',
        'Expense',
        expense.expenseId,
        { before: null, after: expense.toObject() },
        `Expense ${expense.expenseId} created by ${req.user.name}`
      );

      res.status(201).json(expense);
    } catch (error) {
      console.error('Create expense error:', error);
      res.status(500).json({ message: 'Failed to create expense' });
    }
  },


  updateExpense: async (req, res) => {
    try {
      const expense = await Expense.findById(req.params.id);
      if (!expense) {
        return res.status(404).json({ message: 'Expense not found' });
      }

      const originalData = expense.toObject();
      let billImageUrl = expense.billImage;

      // Handle bill image update via direct-upload metadata
      let billImagePublicId = expense.billImagePublicId;
      if (req.body.billImage && req.body.billImagePublicId) {
        // If new image provided, delete old and set new
        if (expense.billImagePublicId) {
          try {
            await cloudinary.uploader.destroy(expense.billImagePublicId, { resource_type: 'image' });
          } catch (err) {
            console.warn('Failed to delete old bill image from Cloudinary:', err);
          }
        }
        billImageUrl = req.body.billImage;
        billImagePublicId = req.body.billImagePublicId;
      }

      // If user requested bill image deletion (no new file, just delete)
      if (req.body.deleteBillImage === 'true' && expense.billImagePublicId) {
        try {
          await cloudinary.uploader.destroy(expense.billImagePublicId, { resource_type: 'image' });
          billImageUrl = null;
          billImagePublicId = null;
        } catch (err) {
          console.warn('Failed to delete bill image from Cloudinary:', err);
        }
      }

     
      const updatedExpense = await Expense.findByIdAndUpdate(
        req.params.id,
        {
          ...req.body,
          billImage: billImageUrl,
          billImagePublicId: billImagePublicId,
          verifyLog: 'not verified'
        },
        { new: true }
      );

      await logActivity(
        req,
        'UPDATE',
        'Expense',
        expense.expenseId,
        { before: originalData, after: updatedExpense.toObject() },
        `Expense ${expense.expenseId} updated by ${req.user.name}`
      );

      res.json(updatedExpense);
    } catch (error) {
      console.error('Update expense error:', error);
      res.status(500).json({ message: 'Failed to update expense' });
    }
  },


  updateVerificationStatus: async (req, res) => {
    try {
      const { verifyLog, registerId } = req.body;
      const expense = await Expense.findById(req.params.id);

      if (!expense) {
        return res.status(404).json({ message: 'Expense not found' });
      }

      const originalData = expense.toObject();

      // If status is changing to rejected, move to recycle bin
      if (verifyLog === 'rejected') {
        expense.isDeleted = true;
        expense.deletedAt = new Date();
        expense.deletedBy = registerId;
      }

      expense.verifyLog = verifyLog;
      await expense.save();

      await logActivity(
        req,
        'VERIFY',
        'Expense',
        expense.expenseId,
        { before: originalData, after: expense.toObject() },
        `Expense ${expense.expenseId} verification status changed to ${verifyLog} by ${registerId}`
      );

      res.json({ message: 'Verification status updated successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update verification status' });
    }
  },


  // Soft delete expense
  deleteExpense: async (req, res) => {
    try {
      const expense = await Expense.findById(req.params.id);
      if (!expense) {
        return res.status(404).json({ message: 'Expense not found' });
      }

      const originalData = expense.toObject();

      expense.isDeleted = true;
      expense.deletedAt = new Date();
      expense.deletedBy = req.user.registerId;
      await expense.save({ validateBeforeSave: false });

      await logActivity(
        req,
        'DELETE',
        'Expense',
        expense.expenseId,
        { before: originalData, after: expense.toObject() },
        `Expense ${expense.expenseId} moved to recycle bin by ${req.user.name}`
      );

      res.json({ message: 'Expense moved to recycle bin' });
    } catch (error) {
      console.error('Delete expense error:', error);
      res.status(500).json({ message: 'Failed to delete expense', error: error.message });
    }
  },


  getRecycleBin: async (req, res) => {
    try {
      const deletedExpenses = await Expense.find({ isDeleted: true })
        .sort({ deletedAt: -1 })
        .lean();
      res.json(deletedExpenses);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch deleted expenses' });
    }
  },


  restoreExpense: async (req, res) => {
    try {
      const expense = await Expense.findById(req.params.id);
      if (!expense) {
        return res.status(404).json({ message: 'Expense not found' });
      }

      const originalData = expense.toObject();

      expense.isDeleted = false;
      await expense.save({ validateBeforeSave: false });

      await logActivity(
        req,
        'RESTORE',
        'Expense',
        expense.expenseId,
        { before: originalData, after: expense.toObject() },
        `Expense ${expense.expenseId} restored from recycle bin by ${req.user.name}`
      );

      res.json({ message: 'Expense restored successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to restore expense' });
    }
  },


  permanentDeleteExpense: async (req, res) => {
    try {
      const expense = await Expense.findById(req.params.id);
      if (!expense) {
        return res.status(404).json({ message: 'Expense not found' });
      }

      const originalData = expense.toObject();

      // Delete bill image from Cloudinary (permanent delete)
      if (expense.billImage && expense.billImage.includes('cloudinary.com')) {
        try {
          const publicId = expense.billImage.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(`ExpenseBills/${publicId}`, { resource_type: 'image' });
        } catch (err) {
          console.warn('Failed to delete bill image from Cloudinary:', err);
        }
      }

      await logActivity(
        req,
        'DELETE',
        'Expense',
        expense.expenseId,
        { before: originalData, after: null },
        `Expense ${expense.expenseId} permanently deleted by ${req.user.name}`
      );

      await Expense.findByIdAndDelete(req.params.id);
      res.json({ message: 'Expense permanently deleted' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete expense permanently' });
    }
  }
};
