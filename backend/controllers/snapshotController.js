import Snapshot from '../models/Snapshot.js';
import Income from '../models/Income.js';
import Expense from '../models/Expense.js';
import { logActivity } from '../middleware/activityLogger.js';
import Event from '../models/Event.js';
import { computeBudgetStats } from '../utils/statsAggregator.js';

export const snapshotController = {
  getAllSnapshots: async (req, res) => {
    try {
      const snapshots = await Snapshot.find()
        .sort({ year: -1, eventName: 1 })
        .lean();

      res.json(snapshots);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch snapshots' });
    }
  },


  createSnapshot: async (req, res) => {
    try {
      const { eventName, year, selectedCollections } = req.body;

      const collections = {};
      let stats = {};

      const [existingSnapshot, incomeData, expenseData, eventData] = await Promise.all([
        Snapshot.findOne({ eventName, year }).lean(),
        selectedCollections.includes('Income')
          ? Income.find({ isDeleted: false }).lean()
          : Promise.resolve(null),
        selectedCollections.includes('Expense')
          ? Expense.find({ isDeleted: false }).lean()
          : Promise.resolve(null),
        selectedCollections.includes('Event')
          ? Event.find().lean()
          : Promise.resolve(null)
      ]);

      if (existingSnapshot) {
        return res.status(400).json({
          message: `Snapshot for ${eventName} ${year} already exists`
        });
      }

      if (incomeData) collections.Income = incomeData;
      if (expenseData) collections.Expense = expenseData;
      if (eventData) collections.Event = eventData;

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

      if (eventName !== originalSnapshot.eventName || year !== originalSnapshot.year) {
        const existingSnapshot = await Snapshot.findOne({
          eventName,
          year,
          _id: { $ne: req.params.id }
        }).lean();

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
const generateStats = async () => {
  try {
    return await computeBudgetStats();
  } catch (error) {
    console.error('Error generating stats:', error);
    return {};
  }
};
