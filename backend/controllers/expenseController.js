import Expense from '../models/Expense.js';
import { uploadToCloudinary } from '../config/cloudinary.js';
import cloudinary from '../config/cloudinary.js';
import { logActivity } from '../middleware/activityLogger.js';

export const expenseController = {
  // Get all expenses with filters
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

      // Date range filter
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) {
          query.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
          query.createdAt.$lte = new Date(endDate);
        }
      }

      const expenses = await Expense.find(query).sort({ createdAt: -1 });
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch expenses' });
    }
  },

  // Get verification data
  getVerificationData: async (req, res) => {
    try {
      const { verifyLog } = req.query;
      const expenses = await Expense.find({ verifyLog, isDeleted: false })
        .sort({ createdAt: -1 });
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch verification data' });
    }
  },

  // Create new expense
  createExpense: async (req, res) => {
    try {
      const { subExpenses, ...expenseData } = req.body;
      // subExpenses is expected as JSON string if sent as multipart/form-data
      const parsedSubExpenses = typeof subExpenses === 'string' ? JSON.parse(subExpenses) : subExpenses;

      // Process and upload bill images for each sub-expense using tempId
      const processedSubExpenses = await Promise.all(
        parsedSubExpenses.map(async (subExpense) => {
          let billImageUrl = null;
          // billImage file should be uploaded as req.files[`billImage_${tempId}`][0]
          if (req.files && req.files[`billImage_${subExpense.tempId}`] && req.files[`billImage_${subExpense.tempId}`][0]) {
            try {
              billImageUrl = await uploadToCloudinary(req.files[`billImage_${subExpense.tempId}`][0].buffer, 'ExpenseBills', 'image');
            } catch (uploadError) {
              console.error('Failed to upload bill image:', uploadError);
            }
          }
          return {
            subPurpose: subExpense.subPurpose,
            subAmount: subExpense.subAmount,
            billImage: billImageUrl
          };
        })
      );

      const expense = await Expense.create({
        ...expenseData,
        subExpenses: processedSubExpenses,
        verifyLog: 'not verified'
      });

      // Log expense creation
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

  // Update expense
  updateExpense: async (req, res) => {
    try {
      const expense = await Expense.findById(req.params.id);
      if (!expense) {
        return res.status(404).json({ message: 'Expense not found' });
      }

      const originalData = expense.toObject();
      const { subExpenses, deletedSubExpenses, ...expenseData } = req.body;
      const parsedSubExpenses = typeof subExpenses === 'string' ? JSON.parse(subExpenses) : (subExpenses || []);
      const parsedDeletedSubExpenses = typeof deletedSubExpenses === 'string' ? JSON.parse(deletedSubExpenses) : (deletedSubExpenses || []);

      // Delete bill images for sub-expenses marked for deletion
      const oldSubExpenses = Array.isArray(expense.subExpenses) ? expense.subExpenses : [];
      for (const oldSubExpense of oldSubExpenses) {
        if (oldSubExpense && oldSubExpense._id && parsedDeletedSubExpenses.includes(String(oldSubExpense._id))) {
          if (oldSubExpense.billImage && typeof oldSubExpense.billImage === 'string' && oldSubExpense.billImage.includes('cloudinary.com')) {
            try {
              const publicId = oldSubExpense.billImage.split('/').pop().split('.')[0];
              await cloudinary.uploader.destroy(`ExpenseBills/${publicId}`, { resource_type: 'image' });
            } catch (err) {
              console.warn('Failed to delete bill image from Cloudinary:', err);
            }
          }
        }
      }

      // Process and upload new bill images using tempId mapping
      const processedSubExpenses = await Promise.all(
        parsedSubExpenses.map(async (subExpense) => {
          let billImageUrl = subExpense.billImage;
          
          // Check if there's a new file uploaded for this tempId
          if (req.files && req.files[`billImage_${subExpense.tempId}`] && req.files[`billImage_${subExpense.tempId}`][0]) {
            // If this sub-expense has an existing _id, find and delete its old image
            if (subExpense._id) {
              const existingSubExpense = oldSubExpenses.find(old => old._id && old._id.toString() === subExpense._id);
              if (existingSubExpense && existingSubExpense.billImage && existingSubExpense.billImage.includes('cloudinary.com')) {
                try {
                  const publicId = existingSubExpense.billImage.split('/').pop().split('.')[0];
                  await cloudinary.uploader.destroy(`ExpenseBills/${publicId}`, { resource_type: 'image' });
                } catch (err) {
                  console.warn('Failed to delete old bill image from Cloudinary:', err);
                }
              }
            }
            
            // Upload new image
            try {
              billImageUrl = await uploadToCloudinary(req.files[`billImage_${subExpense.tempId}`][0].buffer, 'ExpenseBills', 'image');
            } catch (uploadError) {
              console.error('Failed to upload bill image:', uploadError);
              billImageUrl = subExpense.billImage; // Keep existing if upload fails
            }
          } else if (subExpense._id) {
            // No new file uploaded, preserve existing image for existing sub-expenses
            const existingSubExpense = oldSubExpenses.find(old => old._id && old._id.toString() === subExpense._id);
            billImageUrl = existingSubExpense ? existingSubExpense.billImage : subExpense.billImage;
          }
          
          return {
            _id: subExpense._id,
            subPurpose: subExpense.subPurpose,
            subAmount: subExpense.subAmount,
            billImage: billImageUrl
          };
        })
      );

      // Update expense
      const updatedExpense = await Expense.findByIdAndUpdate(
        req.params.id,
        { 
          ...expenseData,
          subExpenses: processedSubExpenses,
          verifyLog: 'not verified'
        },
        { new: true }
      );

      // Log expense update
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

  // Update verification status
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


      // Update verification status
      expense.verifyLog = verifyLog;
      await expense.save();

      // Log verification status change
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

      // Don't delete images on soft delete - only delete on permanent delete

      expense.isDeleted = true;
      expense.deletedAt = new Date();
      expense.deletedBy = req.user.registerId;
      // Disable validation for soft delete
      await expense.save({ validateBeforeSave: false });

      // Log expense deletion
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

  // Get recycle bin items
  getRecycleBin: async (req, res) => {
    try {
      const deletedExpenses = await Expense.find({ isDeleted: true })
        .sort({ deletedAt: -1 });
      res.json(deletedExpenses);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch deleted expenses' });
    }
  },

  // Restore from recycle bin
  restoreExpense: async (req, res) => {
    try {
      const expense = await Expense.findById(req.params.id);
      if (!expense) {
        return res.status(404).json({ message: 'Expense not found' });
      }

      const originalData = expense.toObject();

      expense.isDeleted = false;
      await expense.save({ validateBeforeSave: false });

      // Log expense restoration
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

  // Permanently delete from recycle bin
  permanentDeleteExpense: async (req, res) => {
    try {
      const expense = await Expense.findById(req.params.id);
      if (!expense) {
        return res.status(404).json({ message: 'Expense not found' });
      }

      const originalData = expense.toObject();

      // Delete bill images from Cloudinary (permanent delete only)
      const subExpensesArr = Array.isArray(expense.subExpenses) ? expense.subExpenses : [];
      for (const subExpense of subExpensesArr) {
        if (
          subExpense &&
          typeof subExpense.billImage === 'string' &&
          subExpense.billImage.length > 0 &&
          subExpense.billImage.includes('cloudinary.com')
        ) {
          try {
            const publicId = subExpense.billImage.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(`ExpenseBills/${publicId}`, { resource_type: 'image' });
          } catch (err) {
            console.warn('Failed to delete bill image from Cloudinary:', err);
          }
        }
      }

      // Log permanent deletion
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