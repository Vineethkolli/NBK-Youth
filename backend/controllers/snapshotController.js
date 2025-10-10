import Snapshot from '../models/Snapshot.js';
import Income from '../models/Income.js';
import Expense from '../models/Expense.js';
import User from '../models/User.js';
import Payment from '../models/Payment.js';
import PreviousYear from '../models/PreviousYear.js';
import { logActivity } from '../middleware/activityLogger.js';
import Event from '../models/Event.js';

export const snapshotController = {
  getAllSnapshots: async (req, res) => {
    try {
      const snapshots = await Snapshot.find().sort({ year: -1, eventName: 1 });
      res.json(snapshots);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch snapshots' });
    }
  },

  createSnapshot: async (req, res) => {
    try {
      const { eventName, year, selectedCollections } = req.body;

      // Prevent duplicates for same eventName + year
      const existingSnapshot = await Snapshot.findOne({ eventName, year });
      if (existingSnapshot) {
        return res.status(400).json({
          message: `Snapshot for ${eventName} ${year} already exists`
        });
      }

      const collections = {};
      let stats = {};

      if (selectedCollections.includes('Income')) {
        collections.Income = await Income.find({ isDeleted: false });
      }
      if (selectedCollections.includes('Expense')) {
        collections.Expense = await Expense.find({ isDeleted: false });
      }
      if (selectedCollections.includes('Event')) {
        collections.Event = await Event.find();
      }

      if (selectedCollections.includes('Stats')) {
        stats = await generateStats();
      }

      const snapshot = await Snapshot.create({
        eventName,
        year,
        collections,
        stats,
        addedBy: req.user.registerId
      });

      await logActivity(
        req,
        'CREATE',
        'Snapshot',
        snapshot._id,
        { before: null, after: { eventName, year, collections: selectedCollections } },
        `Snapshot created for ${eventName} ${year} by ${req.user.name}`
      );

      res.status(201).json(snapshot);
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({
          message: 'Snapshot for this event and year already exists'
        });
      }
      res.status(500).json({ message: 'Failed to create snapshot' });
    }
  },

  updateSnapshot: async (req, res) => {
    try {
      const { eventName, year } = req.body;
      const originalSnapshot = await Snapshot.findById(req.params.id);

      if (!originalSnapshot) {
        return res.status(404).json({ message: 'Snapshot not found' });
      }

      // Prevent duplicate if event/year changed
      if (eventName !== originalSnapshot.eventName || year !== originalSnapshot.year) {
        const existingSnapshot = await Snapshot.findOne({
          eventName,
          year,
          _id: { $ne: req.params.id }
        });
        if (existingSnapshot) {
          return res.status(400).json({
            message: `Snapshot for ${eventName} ${year} already exists`
          });
        }
      }

      const originalData = originalSnapshot.toObject();
      const updatedSnapshot = await Snapshot.findByIdAndUpdate(
        req.params.id,
        { eventName, year },
        { new: true }
      );

      await logActivity(
        req,
        'UPDATE',
        'Snapshot',
        updatedSnapshot._id,
        { before: originalData, after: updatedSnapshot.toObject() },
        `Snapshot updated by ${req.user.name}`
      );

      res.json(updatedSnapshot);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update snapshot' });
    }
  },

  deleteSnapshot: async (req, res) => {
    try {
      const snapshot = await Snapshot.findById(req.params.id);
      if (!snapshot) {
        return res.status(404).json({ message: 'Snapshot not found' });
      }

      const originalData = snapshot.toObject();

      await logActivity(
        req,
        'DELETE',
        'Snapshot',
        snapshot._id,
        { before: originalData, after: null },
        `Snapshot deleted by ${req.user.name}`
      );

      await Snapshot.findByIdAndDelete(req.params.id);
      res.json({ message: 'Snapshot deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete snapshot' });
    }
  }
};

// Helper Functions
const calculateDateWiseStats = async (incomes, expenses) => {
  const dateMap = new Map();

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

  return Array.from(dateMap.values())
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map(stat => ({
      ...stat,
      totalIncome: Math.round(stat.totalIncome),
      amountReceived: Math.round(stat.amountReceived),
      totalExpenses: Math.round(stat.totalExpenses)
    }));
};

const generateStats = async () => {
  try {
    const incomes = await Income.find({ isDeleted: false });
    const expenses = await Expense.find({ isDeleted: false });
    const users = await User.find();
    const successfulPayments = await Payment.find({ transactionStatus: 'successful' });
    const previousYear = await PreviousYear.findOne() || { amount: 0 };

    const round = num => Math.round(num);

    const totalIncome = {
      count: incomes.length,
      amount: round(incomes.reduce((sum, i) => sum + i.amount, 0))
    };
    const paidIncomes = incomes.filter(i => i.status === 'paid');
    const amountReceived = {
      count: paidIncomes.length,
      amount: round(paidIncomes.reduce((sum, i) => sum + i.amount, 0))
    };
    const pendingIncomes = incomes.filter(i => i.status === 'not paid');
    const amountPending = {
      count: pendingIncomes.length,
      amount: round(pendingIncomes.reduce((sum, i) => sum + i.amount, 0))
    };
    const totalExpenses = {
      count: expenses.length,
      amount: round(expenses.reduce((sum, e) => sum + e.amount, 0)),
      onlineAmount: round(expenses.filter(e => e.paymentMode === 'online').reduce((sum, e) => sum + e.amount, 0)),
      cashAmount: round(expenses.filter(e => e.paymentMode === 'cash').reduce((sum, e) => sum + e.amount, 0))
    };

    const onlinePayments = paidIncomes.filter(i => ['online', 'web app'].includes(i.paymentMode.toLowerCase()));
    const online = {
      count: onlinePayments.length,
      amount: round(onlinePayments.reduce((sum, i) => sum + i.amount, 0))
    };
    const offlinePayments = paidIncomes.filter(i => i.paymentMode.toLowerCase() === 'cash');
    const offline = {
      count: offlinePayments.length,
      amount: round(offlinePayments.reduce((sum, i) => sum + i.amount, 0))
    };

    const amountLeft = {
      amount: round(amountReceived.amount - totalExpenses.amount),
      onlineAmount: round(online.amount - totalExpenses.onlineAmount),
      cashAmount: round(offline.amount - totalExpenses.cashAmount)
    };

    const groupStats = belongsTo => {
      const groupIncomes = incomes.filter(i => i.belongsTo.toLowerCase() === belongsTo.toLowerCase());
      const paid = {
        cash: round(groupIncomes.filter(i => i.status === 'paid' && i.paymentMode === 'cash').reduce((s, i) => s + i.amount, 0)),
        online: round(groupIncomes.filter(i => i.status === 'paid' && i.paymentMode === 'online').reduce((s, i) => s + i.amount, 0)),
        webApp: round(groupIncomes.filter(i => i.status === 'paid' && i.paymentMode === 'web app').reduce((s, i) => s + i.amount, 0))
      };
      paid.total = paid.cash + paid.online + paid.webApp;

      const pending = {
        cash: round(groupIncomes.filter(i => i.status === 'not paid' && i.paymentMode === 'cash').reduce((s, i) => s + i.amount, 0)),
        online: round(groupIncomes.filter(i => i.status === 'not paid' && i.paymentMode === 'online').reduce((s, i) => s + i.amount, 0)),
        webApp: round(groupIncomes.filter(i => i.status === 'not paid' && i.paymentMode === 'web app').reduce((s, i) => s + i.amount, 0))
      };
      pending.total = pending.cash + pending.online + pending.webApp;

      const total = paid.total + pending.total;
      return { paid, pending, total };
    };

    return {
      budgetStats: {
        totalIncome,
        amountReceived,
        amountPending,
        totalExpenses,
        previousYearAmount: { amount: round(previousYear.amount) },
        amountLeft,
        online,
        offline
      },
      userStats: {
        totalUsers: users.length,
        successfulPayments: successfulPayments.length
      },
      villagers: groupStats('villagers'),
      youth: groupStats('youth'),
      dateWiseStats: await calculateDateWiseStats(incomes, expenses)
    };
  } catch (error) {
    console.error('Error generating stats:', error);
    return {};
  }
};
