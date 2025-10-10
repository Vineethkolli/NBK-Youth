import Income from '../models/Income.js';
import Expense from '../models/Expense.js';
import NotificationHistory from '../models/NotificationHistory.js';
import EstimatedIncome from '../models/EstimatedIncome.js';
import EstimatedExpense from '../models/EstimatedExpense.js';
import Game from '../models/Game.js';
import ActivityLog from '../models/ActivityLog.js';
import Event from '../models/Event.js';
import { logActivity } from '../middleware/activityLogger.js';
import User from '../models/User.js';
import Payment from '../models/Payment.js';
import cloudinary from '../config/cloudinary.js'; 
import Counter from '../models/Counter.js';
import PreviousYear from '../models/PreviousYear.js';
import EventLabel from '../models/EventLabel.js';

export const developerController = {
  clearData: async (req, res) => {
    const { type } = req.params;

    try {
      let description = '';
      let entity = 'DeveloperOptions';

      switch (type) {
        case 'income':
          await Income.deleteMany({});
          await Counter.findByIdAndDelete('incomeId');
          description = 'Cleared all income records';
          break;

        case 'expense':
          await Expense.deleteMany({});
          await Counter.findByIdAndDelete('expenseId');
          description = 'Cleared all expense records';

          // Delete all Cloudinary files in 'ExpenseBills' folder
          await deleteCloudinaryFolder('ExpenseBills');
          break;

        case 'notifications':
          await NotificationHistory.deleteMany({});
          description = 'Cleared all notification history';
          break;

        case 'estimatedIncome':
          await EstimatedIncome.deleteMany({});
          await Counter.findByIdAndDelete('estimatedIncomeId');
          description = 'Cleared all estimated income records';
          break;

        case 'estimatedExpense':
          await EstimatedExpense.deleteMany({});
          await Counter.findByIdAndDelete('estimatedExpenseId');
          description = 'Cleared all estimated expense records';
          break;

        case 'letsPlay':
          await Game.deleteMany({});
          description = 'Cleared all activities records';
          break;

        case 'activityLog': {
          // Support selective deletion for activity logs.
          // Accepts (from request body or query): entity (string, default 'All'), fromDate, toDate
          const payload = (req.body && Object.keys(req.body).length) ? req.body : (req.query || {});
          const entityFilter = payload.entity || 'All';
          const fromDateRaw = payload.fromDate;
          const toDateRaw = payload.toDate;

          const filter = {};
          if (entityFilter && entityFilter !== 'All') {
            filter.entityType = entityFilter;
          }

          // Parse and normalize dates
          let fromDateObj = null;
          let toDateObj = null;
          try {
            if (fromDateRaw) {
              fromDateObj = new Date(fromDateRaw);
              if (isNaN(fromDateObj.getTime())) throw new Error('Invalid fromDate');
            }
            if (toDateRaw) {
              toDateObj = new Date(toDateRaw);
              if (isNaN(toDateObj.getTime())) throw new Error('Invalid toDate');
              // If user provided only a date (e.g. '2025-10-10'), treat toDate as end of day to be inclusive
              if (/^\d{4}-\d{2}-\d{2}$/.test(String(toDateRaw))) {
                toDateObj.setHours(23, 59, 59, 999);
              }
            }
          } catch (err) {
            return res.status(400).json({ message: 'Invalid date provided' });
          }

          if (fromDateObj && toDateObj) {
            filter.createdAt = { $gte: fromDateObj, $lte: toDateObj };
          } else if (fromDateObj) {
            filter.createdAt = { $gte: fromDateObj };
          } else if (toDateObj) {
            filter.createdAt = { $lte: toDateObj };
          }

          const result = await ActivityLog.deleteMany(filter);
          description = `Cleared ${result.deletedCount || 0} activity logs`;
          if (entityFilter && entityFilter !== 'All') description += ` for entity '${entityFilter}'`;
          if (fromDateObj || toDateObj) {
            const fromStr = fromDateObj ? fromDateObj.toISOString() : 'earliest';
            const toStr = toDateObj ? toDateObj.toISOString() : 'now';
            description += ` in range [${fromStr} -> ${toStr}]`;
          }
        }
          break;

        case 'events':
          await Event.deleteMany({});
          description = 'Cleared all events records';
          break;
        
        case 'eventLabels':
          await EventLabel.deleteMany({});
          description = 'Cleared event label';
          break;

        case 'previousYear':
          await PreviousYear.deleteMany({});
          description = 'Cleared previous year amount in stats';
          break;

        case 'payment':
          await Payment.deleteMany({});
          await Counter.findByIdAndDelete('paymentId');
          description = 'Cleared all payment records';

          await deleteCloudinaryFolder('PaymentScreenshots');
          break;

        case 'resetRoles':
          const result = await User.updateMany(
            { role: { $ne: 'developer' } },
            { $set: { role: 'user' } }
          );
          description = `Reset roles of ${result.modifiedCount} users except developers to 'user'`;
          break;

        default:
          return res.status(400).json({ message: 'Invalid data type' });
      }

      await logActivity(
        req,
        'DELETE',
        entity,
        req.user?.registerId || 'SYSTEM',
        null,
        description
      );

      res.json({ message: `${type} action completed successfully` });
    } catch (error) {
      console.error('Clear data error:', error);
      res.status(500).json({ message: `Failed to process ${type} action` });
    }
  }
};

// Utility function to delete all files in a Cloudinary folder
const deleteCloudinaryFolder = async (folder) => {
  try {
    const { resources } = await cloudinary.api.resources({
      type: 'upload',
      prefix: `${folder}/`,
      max_results: 500,
    });

    const publicIds = resources.map((r) => r.public_id);
    if (publicIds.length > 0) {
      await cloudinary.api.delete_resources(publicIds);
      console.log(`Deleted ${publicIds.length} files from Cloudinary folder: ${folder}`);
    } else {
      console.log(`No files found in Cloudinary folder: ${folder}`);
    }
  } catch (error) {
    console.error(`Error deleting Cloudinary folder ${folder}:`, error);
  }
};
