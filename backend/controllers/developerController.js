import User from '../models/User.js';
import Income from '../models/Income.js';
import Expense from '../models/Expense.js';
import IncomeLog from '../models/IncomeLog.js';
import ExpenseLog from '../models/ExpenseLog.js';

export const developerController = {
  clearData: async (req, res) => {
    const { type } = req.params;

    try {
      switch (type) {
        case 'users':
          // Delete all users except developer account
          await User.deleteMany({ email: { $ne: 'developer@gmail.com' } });
          break;

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

        default:
          return res.status(400).json({ message: 'Invalid data type' });
      }

      res.json({ message: `${type} data cleared successfully` });
    } catch (error) {
      res.status(500).json({ message: `Failed to clear ${type} data` });
    }
  }
};