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
import cloudinary from '../config/cloudinary.js'; // ✅ Import cloudinary

export const developerController = {
  clearData: async (req, res) => {
    const { type } = req.params;

    try {
      let description = '';
      let entity = 'DeveloperOptions';

      switch (type) {
        case 'income':
          await Income.deleteMany({});
          description = 'Cleared all income records';
          break;

        case 'expense':
          await Expense.deleteMany({});
          description = 'Cleared all expense records';

          // ✅ Delete all Cloudinary files in 'ExpenseBills' folder
          await deleteCloudinaryFolder('ExpenseBills');
          break;

        case 'notifications':
          await NotificationHistory.deleteMany({});
          description = 'Cleared all notification history';
          break;

        case 'estimatedIncome':
          await EstimatedIncome.deleteMany({});
          description = 'Cleared all estimated income records';
          break;

        case 'estimatedExpense':
          await EstimatedExpense.deleteMany({});
          description = 'Cleared all estimated expense records';
          break;

        case 'letsPlay':
          await Game.deleteMany({});
          description = 'Cleared all activities records';
          break;

        case 'activityLog':
          await ActivityLog.deleteMany({});
          description = 'Cleared all activity logs';
          break;

        case 'events':
          await Event.deleteMany({});
          description = 'Cleared all events records';
          break;

        case 'payment':
          await Payment.deleteMany({});
          description = 'Cleared all payment records';

          // ✅ Delete all Cloudinary files in 'PaymentScreenshots' folder
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

      // Log the activity
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

// ✅ Utility function to delete all files in a Cloudinary folder
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
