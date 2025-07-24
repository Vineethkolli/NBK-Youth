import Income from '../models/Income.js';
import Expense from '../models/Expense.js';
import IncomeLog from '../models/IncomeLog.js';
import ExpenseLog from '../models/ExpenseLog.js';
import NotificationHistory from '../models/NotificationHistory.js';
import EstimatedIncome from '../models/EstimatedIncome.js';
import EstimatedExpense from '../models/EstimatedExpense.js';
import Game from '../models/Game.js';

export const developerController = {
  clearData: async (req, res) => {
    const { type } = req.params;

    try {
      switch (type) {

        case 'income':
          // Delete all income records and logs
          await Income.deleteMany({});
          await IncomeLog.deleteMany({});
          break;

        case 'expense':
          // Delete all expense records and logs
          await Expense.deleteMany({});
          await ExpenseLog.deleteMany({});
          break;

        case 'notifications':
          // Delete all notification subscriptions and history
          await NotificationHistory.deleteMany({});
          break;

        case 'estimatedIncome':
          // Delete all estimated income records
          await EstimatedIncome.deleteMany({});
          break;

        case 'estimatedExpense':
          // Delete all estimated expense records
          await EstimatedExpense.deleteMany({});
          break;

        case 'letsPlay':
          // Delete all games and players
          await Game.deleteMany({});
          break;

        default:
          return res.status(400).json({ message: 'Invalid data type' });
      }

      res.json({ message: `${type} data cleared successfully` });
    } catch (error) {
      res.status(500).json({ message: `Failed to clear ${type} data` });
    }
  }
};