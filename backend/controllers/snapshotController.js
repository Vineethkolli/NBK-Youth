import Snapshot from '../models/Snapshot.js';
import Income from '../models/Income.js';
import Expense from '../models/Expense.js';
import EstimatedIncome from '../models/EstimatedIncome.js';
import EstimatedExpense from '../models/EstimatedExpense.js';
import User from '../models/User.js';
import Payment from '../models/Payment.js';
import PreviousYear from '../models/PreviousYear.js';
import { logActivity } from '../middleware/activityLogger.js';

export const snapshotController = {
  // Get all snapshots
  getAllSnapshots: async (req, res) => {
    try {
      const snapshots = await Snapshot.find().sort({ year: -1, eventName: 1 });
      res.json(snapshots);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch snapshots' });
    }
  },

  // Create snapshot
  createSnapshot: async (req, res) => {
    try {
      const { eventName, year, selectedCollections } = req.body;

      // Check for duplicate eventName + year
      const existingSnapshot = await Snapshot.findOne({ eventName, year });
      if (existingSnapshot) {
        return res.status(400).json({ 
          message: `Snapshot for ${eventName} ${year} already exists` 
        });
      }

      // Fetch data for selected collections
      const collections = {};
      let stats = {};

      if (selectedCollections.includes('Income')) {
        collections.Income = await Income.find({ isDeleted: false });
      }
      if (selectedCollections.includes('Expense')) {
        collections.Expense = await Expense.find({ isDeleted: false });
      }
      if (selectedCollections.includes('EstimatedIncome')) {
        collections.EstimatedIncome = await EstimatedIncome.find();
      }
      if (selectedCollections.includes('EstimatedExpense')) {
        collections.EstimatedExpense = await EstimatedExpense.find();
      }

      // Generate stats if requested
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

      // Log snapshot creation
      await logActivity(
        req,
        'CREATE',
        'Snapshot',
        snapshot.snapshotId,
        { before: null, after: { eventName, year, collections: selectedCollections } },
        `Snapshot ${snapshot.snapshotId} created for ${eventName} ${year} by ${req.user.name}`
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

  // Update snapshot
  updateSnapshot: async (req, res) => {
    try {
      const { eventName, year } = req.body;
      
      const originalSnapshot = await Snapshot.findById(req.params.id);
      if (!originalSnapshot) {
        return res.status(404).json({ message: 'Snapshot not found' });
      }

      // Check for duplicate if eventName or year changed
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

      const snapshot = await Snapshot.findByIdAndUpdate(
        req.params.id,
        { eventName, year },
        { new: true }
      );

      // Log snapshot update
      await logActivity(
        req,
        'UPDATE',
        'Snapshot',
        snapshot.snapshotId,
        { before: originalData, after: snapshot.toObject() },
        `Snapshot ${snapshot.snapshotId} updated by ${req.user.name}`
      );

      res.json(snapshot);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update snapshot' });
    }
  },

  // Delete snapshot
  deleteSnapshot: async (req, res) => {
    try {
      const snapshot = await Snapshot.findById(req.params.id);
      if (!snapshot) {
        return res.status(404).json({ message: 'Snapshot not found' });
      }

      const originalData = snapshot.toObject();

      // Log snapshot deletion
      await logActivity(
        req,
        'DELETE',
        'Snapshot',
        snapshot.snapshotId,
        { before: originalData, after: null },
        `Snapshot ${snapshot.snapshotId} deleted by ${req.user.name}`
      );

      await Snapshot.findByIdAndDelete(req.params.id);

      // Reorder remaining snapshots
      const remainingSnapshots = await Snapshot.find().sort({ snapshotId: 1 });
      for (let i = 0; i < remainingSnapshots.length; i++) {
        const newId = `S${i + 1}`;
        if (remainingSnapshots[i].snapshotId !== newId) {
          remainingSnapshots[i].snapshotId = newId;
          await remainingSnapshots[i].save();
        }
      }

      res.json({ message: 'Snapshot deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete snapshot' });
    }
  }
};

// Helper function to generate stats
const generateStats = async () => {
  try {
    const incomes = await Income.find({ isDeleted: false });
    const expenses = await Expense.find({ isDeleted: false });
    const users = await User.find();
    const successfulPayments = await Payment.find({ transactionStatus: 'successful' });
    const previousYear = await PreviousYear.findOne() || { amount: 0 };

    // Calculate budget stats
    const totalIncome = {
      count: incomes.length,
      amount: Math.round(incomes.reduce((sum, income) => sum + income.amount, 0))
    };

    const paidIncomes = incomes.filter(income => income.status === 'paid');
    const amountReceived = {
      count: paidIncomes.length,
      amount: Math.round(paidIncomes.reduce((sum, income) => sum + income.amount, 0))
    };

    const pendingIncomes = incomes.filter(income => income.status === 'not paid');
    const amountPending = {
      count: pendingIncomes.length,
      amount: Math.round(pendingIncomes.reduce((sum, income) => sum + income.amount, 0))
    };

    const totalExpenses = {
      count: expenses.length,
      amount: Math.round(expenses.reduce((sum, expense) => sum + expense.amount, 0))
    };

    const onlinePayments = paidIncomes.filter(income => 
      ['online', 'web app'].includes(income.paymentMode.toLowerCase()));
    const online = {
      count: onlinePayments.length,
      amount: Math.round(onlinePayments.reduce((sum, income) => sum + income.amount, 0))
    };

    const offlinePayments = paidIncomes.filter(income => 
      income.paymentMode.toLowerCase() === 'cash');
    const offline = {
      count: offlinePayments.length,
      amount: Math.round(offlinePayments.reduce((sum, income) => sum + income.amount, 0))
    };

    const amountLeft = {
      amount: Math.round(amountReceived.amount - totalExpenses.amount)
    };

    return {
      budgetStats: {
        totalIncome,
        amountReceived,
        amountPending,
        totalExpenses,
        previousYearAmount: { amount: Math.round(previousYear.amount) },
        amountLeft,
        online,
        offline
      },
      userStats: {
        totalUsers: users.length,
        successfulPayments: successfulPayments.length
      }
    };
  } catch (error) {
    console.error('Error generating stats:', error);
    return {};
  }
};