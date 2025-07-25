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

export const developerController = {
  clearData: async (req, res) => {
    const { type } = req.params;

    try {
      let description = '';
      let entity = 'DeveloperOptions';

      switch (type) {
        case 'income':
          await Income.deleteMany({});
          description = 'Cleared all income records and logs';
          break;

        case 'expense':
          await Expense.deleteMany({});
          description = 'Cleared all expense records and logs';
          break;

        case 'notifications':
          await NotificationHistory.deleteMany({});
          description = 'Cleared all notification subscriptions and history';
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
          description = 'Cleared all game data (letsPlay)';
          break;

        case 'activityLog':
          await ActivityLog.deleteMany({});
          description = 'Cleared all activity logs';
          break;

        case 'events':
          await Event.deleteMany({});
          description = 'Cleared all events';
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