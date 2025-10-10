import Income from '../models/Income.js';
import Expense from '../models/Expense.js';
import User from '../models/User.js';
import Payment from '../models/Payment.js';
import PreviousYear from '../models/PreviousYear.js';
import { logActivity } from '../middleware/activityLogger.js';

export const statsController = {
  getStats: async (req, res) => {
    try {

      const incomes = await Income.find({ isDeleted: false });
      const expenses = await Expense.find({ isDeleted: false });
      const users = await User.find();
      const successfulPayments = await Payment.find({ transactionStatus: 'successful' });
      const previousYear = await PreviousYear.findOne() || { amount: 0 };

      // Calculate date-wise stats
      const dateWiseStats = await calculateDateWiseStats(incomes, expenses);
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
        amount: roundNumber(expenses.reduce((sum, expense) => sum + expense.amount, 0)),
        onlineAmount: roundNumber(expenses.filter(expense => expense.paymentMode === 'online')
          .reduce((sum, expense) => sum + expense.amount, 0)),
        cashAmount: roundNumber(expenses.filter(expense => expense.paymentMode === 'cash')
          .reduce((sum, expense) => sum + expense.amount, 0))
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
        youth: calculateGroupStats('youth'),
        dateWiseStats
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
        { amount: Math.round(amount),
          registerId: req.user?.registerId },
        { upsert: true, new: true }
      );

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

// Helper function to calculate date-wise statistics
const calculateDateWiseStats = async (incomes, expenses) => {
  const dateMap = new Map();

  // Process incomes by entry date (createdAt)
  incomes.forEach(income => {
    const dateKey = new Date(income.createdAt).toDateString();
    if (!dateMap.has(dateKey)) {
      dateMap.set(dateKey, {
        date: dateKey,
        totalIncome: 0,
        totalIncomeEntries: 0,
        amountReceived: 0,
        amountReceivedEntries: 0,
        totalExpenses: 0,
        totalExpenseEntries: 0
      });
    }
    const dayStats = dateMap.get(dateKey);
    dayStats.totalIncome += income.amount;
    dayStats.totalIncomeEntries += 1;
    
    if (income.status === 'paid') {
      dayStats.amountReceived += income.amount;
      dayStats.amountReceivedEntries += 1;
    }
  });

  // Process expenses by entry date (createdAt)
  expenses.forEach(expense => {
    const dateKey = new Date(expense.createdAt).toDateString();
    if (!dateMap.has(dateKey)) {
      dateMap.set(dateKey, {
        date: dateKey,
        totalIncome: 0,
        totalIncomeEntries: 0,
        amountReceived: 0,
        amountReceivedEntries: 0,
        totalExpenses: 0,
        totalExpenseEntries: 0
      });
    }
    const dayStats = dateMap.get(dateKey);
    dayStats.totalExpenses += expense.amount;
    dayStats.totalExpenseEntries += 1;
  });

  // Convert to array and sort by date (newest first)
  return Array.from(dateMap.values())
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map(stat => ({
      ...stat,
      totalIncome: Math.round(stat.totalIncome),
      amountReceived: Math.round(stat.amountReceived),
      totalExpenses: Math.round(stat.totalExpenses)
    }));
};