import Income from '../models/Income.js';
import Expense from '../models/Expense.js';
import Payment from '../models/Payment.js'; 
import { logActivity } from '../middleware/activityLogger.js';

export const verificationController = {
  getVerificationData: async (req, res) => {
    try {
      const { type } = req.params;
      const { verifyLog } = req.query;

      let query = { verifyLog };
      let data;

      if (type === 'income') {
        data = await Income.find(query).sort({ createdAt: -1 }).lean();
      } else if (type === 'expense') {
        data = await Expense.find(query).sort({ createdAt: -1 }).lean();
      } else if (type === 'payment') { 
        data = await Payment.find(query).sort({ createdAt: -1 }).lean();
      } else {
        return res.status(400).json({ message: 'Invalid type specified' });
      }

      res.json(data);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch verification data' });
    }
  },


  updateVerificationStatus: async (req, res) => {
    try {
      const { type, id } = req.params;
      const { verifyLog, registerId } = req.body;

      let item;
      let Model;

      if (type === 'income') {
        Model = Income;
      } else if (type === 'expense') {
        Model = Expense;
      } else if (type === 'payment') { 
        Model = Payment;
      } else {
        return res.status(400).json({ message: 'Invalid type specified' });
      }

      item = await Model.findById(id);
      if (!item) {
        return res.status(404).json({ message: `${type} not found` });
      }

      const originalData = item.toObject();
      // If status is changing to rejected, move to recycle bin
      if (verifyLog === 'rejected') {
        item.isDeleted = true;
        item.deletedAt = new Date();
        item.deletedBy = registerId;
      }

      item.verifyLog = verifyLog;
      await item.save();

      const entityId = type === 'income' ? item.incomeId : 
                      type === 'expense' ? item.expenseId : 
                      item.paymentId;
      
      await logActivity(
        req,
        'VERIFY',
        type.charAt(0).toUpperCase() + type.slice(1),
        entityId,
        { before: originalData, after: item.toObject() },
        `${type.charAt(0).toUpperCase() + type.slice(1)} ${entityId} verification status changed to ${verifyLog} by ${req.user.name}`
      );
      res.json({ message: 'Verification status updated successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update verification status' });
    }
  }
};
