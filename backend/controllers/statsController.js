import Income from '../models/Income.js';
import Expense from '../models/Expense.js';
import User from '../models/User.js';
import Payment from '../models/Payment.js';
import PreviousYear from '../models/PreviousYear.js';
import { logActivity } from '../middleware/activityLogger.js';

export const statsController = {
  getStats: async (req, res) => {
    try {
      // Get all incomes
      const incomes = await Income.find({ isDeleted: false });
      const expenses = await Expense.find({ isDeleted: false });
      const users = await User.find();
      const successfulPayments = await Payment.find({ transactionStatus: 'successful' });
      const previousYear = await PreviousYear.findOne() || { amount: 0 };

      // Round numbers and remove decimals
      const roundNumber = (num) => Math.round(num);

      // Calculate budget stats
      const totalIncome = {
        count: incomes.length,
        amount: roundNumber(incomes.reduce((sum, income) => sum + income.amount, 0))
      };

      const paidIncomes = incomes.filter(income => income.status === 'paid');
      const amountReceived = {
        count: paidIncomes.length,
        amount: roundNumber(paidIncomes.reduce((sum, income) => sum + income.amount, 0))
      };

      const pendingIncomes = incomes.filter(income => income.status === 'not paid');
      const amountPending = {
        count: pendingIncomes.length,
        amount: roundNumber(pendingIncomes.reduce((sum, income) => sum + income.amount, 0))
      };

      // Calculate total expenses with online/offline breakdown
      const totalExpenses = {
        count: expenses.length,
        amount: roundNumber(expenses.reduce((sum, expense) => 
          sum + expense.subExpenses.reduce((subSum, sub) => subSum + sub.subAmount, 0), 0)),
        onlineAmount: roundNumber(expenses.filter(expense => expense.paymentMode === 'online')
          .reduce((sum, expense) => sum + expense.subExpenses.reduce((subSum, sub) => subSum + sub.subAmount, 0), 0)),
        cashAmount: roundNumber(expenses.filter(expense => expense.paymentMode === 'cash')
          .reduce((sum, expense) => sum + expense.subExpenses.reduce((subSum, sub) => subSum + sub.subAmount, 0), 0))
      };

      // Calculate online/offline amounts (only paid incomes)
      const onlinePayments = paidIncomes.filter(income => 
        ['online', 'web app'].includes(income.paymentMode.toLowerCase()));
      const online = {
        count: onlinePayments.length,
        amount: roundNumber(onlinePayments.reduce((sum, income) => sum + income.amount, 0))
      };

      const offlinePayments = paidIncomes.filter(income => 
        income.paymentMode.toLowerCase() === 'cash');
      const offline = {
        count: offlinePayments.length,
        amount: roundNumber(offlinePayments.reduce((sum, income) => sum + income.amount, 0))
      };

      // Calculate amount left with online/offline breakdown
      const amountLeft = {
        amount: roundNumber(amountReceived.amount - totalExpenses.amount),
        onlineAmount: roundNumber(online.amount - totalExpenses.onlineAmount),
        cashAmount: roundNumber(offline.amount - totalExpenses.cashAmount)
      };

      // Calculate villagers stats
      const calculateGroupStats = (belongsTo) => {
        const groupIncomes = incomes.filter(income => 
          income.belongsTo.toLowerCase() === belongsTo.toLowerCase());
        
        const paid = {
          cash: roundNumber(groupIncomes.filter(i => i.status === 'paid' && i.paymentMode === 'cash')
            .reduce((sum, i) => sum + i.amount, 0)),
          online: roundNumber(groupIncomes.filter(i => i.status === 'paid' && i.paymentMode === 'online')
            .reduce((sum, i) => sum + i.amount, 0)),
          webApp: roundNumber(groupIncomes.filter(i => i.status === 'paid' && i.paymentMode === 'web app')
            .reduce((sum, i) => sum + i.amount, 0))
        };
        paid.total = roundNumber(paid.cash + paid.online + paid.webApp);

        const pending = {
          cash: roundNumber(groupIncomes.filter(i => i.status === 'not paid' && i.paymentMode === 'cash')
            .reduce((sum, i) => sum + i.amount, 0)),
          online: roundNumber(groupIncomes.filter(i => i.status === 'not paid' && i.paymentMode === 'online')
            .reduce((sum, i) => sum + i.amount, 0)),
          webApp: roundNumber(groupIncomes.filter(i => i.status === 'not paid' && i.paymentMode === 'web app')
            .reduce((sum, i) => sum + i.amount, 0))
        };
        pending.total = roundNumber(pending.cash + pending.online + pending.webApp);

        // Add overall total for the group
        const total = roundNumber(paid.total + pending.total);

        return { paid, pending, total };
      };

      const stats = {
        budgetStats: {
          totalIncome,
          amountReceived,
          amountPending,
          totalExpenses,
          previousYearAmount: { amount: roundNumber(previousYear.amount) },
          amountLeft,
          online,
          offline
        },
        userStats: {
          totalUsers: users.length,
          successfulPayments: successfulPayments.length
        },
        villagers: calculateGroupStats('villagers'),
        youth: calculateGroupStats('youth')
      };

      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch stats' });
    }
  },

  updatePreviousYear: async (req, res) => {
    try {
      const { amount } = req.body;
      const currentData = await PreviousYear.findOne();
      const originalAmount = currentData ? currentData.amount : 0;

      await PreviousYear.findOneAndUpdate(
        {},
        { amount: Math.round(amount) },
        { upsert: true, new: true }
      );

      // Log previous year amount update
      await logActivity(
        req,
        'UPDATE',
        'PreviousYear',
        'previous-year-amount',
        { before: { amount: originalAmount }, after: { amount: Math.round(amount) } },
        `Previous year amount updated by ${req.user.name}`
      );

      res.json({ message: 'Previous year amount updated successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update previous year amount' });
    }
  }
};