import History from '../models/History.js';
import Snapshot from '../models/Snapshot.js';
import { logActivity } from '../middleware/activityLogger.js';

export const historyController = {
  // Get all histories
  getAllHistories: async (req, res) => {
    try {
      const histories = await History.find()
        .populate('snapshotId')
        .sort({ year: -1, eventName: 1 });

      res.json(histories);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch histories' });
    }
  },

  // Create history from snapshot
  createHistory: async (req, res) => {
    try {
      const { snapshotName, snapshotId, selectedCollections } = req.body;

      // Check for duplicate snapshotName
      const existingHistory = await History.findOne({ snapshotName });
      if (existingHistory) {
        return res.status(400).json({
          message: `History with name "${snapshotName}" already exists`
        });
      }

      // Get the snapshot data
      const snapshot = await Snapshot.findById(snapshotId);
      if (!snapshot) {
        return res.status(404).json({ message: 'Snapshot not found' });
      }

      // Extract only the selected collections from snapshot
      const filteredSnapshotData = {
        collections: {},
        stats: {}
      };

      selectedCollections.forEach(collection => {
        if (collection === 'Stats' && snapshot.stats) {
          filteredSnapshotData.stats = snapshot.stats;
        } else if (snapshot.collections && snapshot.collections[collection]) {
          filteredSnapshotData.collections[collection] = snapshot.collections[collection];
        }
      });

      const history = await History.create({
        snapshotName,
        snapshotId,
        selectedCollections,
        snapshotData: filteredSnapshotData,
        createdBy: req.user.registerId
      });

      // Log history creation
      await logActivity(
        req,
        'CREATE',
        'History',
        snapshotName,
        { before: null, after: { snapshotName, collections: selectedCollections } },
        `History "${snapshotName}" created by ${req.user.name}`
      );

      res.status(201).json(history);
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({
          message: 'History for this event and year already exists'
        });
      }
      res.status(500).json({ message: 'Failed to create history' });
    }
  },

  // Delete history
  deleteHistory: async (req, res) => {
    try {
      const history = await History.findById(req.params.id);
      if (!history) {
        return res.status(404).json({ message: 'History not found' });
      }

      const originalData = history.toObject();

      // Log history deletion
      await logActivity(
        req,
        'DELETE',
        'History',
        history.snapshotId,
        { before: originalData, after: null },
        `History "${history.snapshotId}" deleted by ${req.user.name}`
      );

      await History.findByIdAndDelete(req.params.id);
      res.json({ message: 'History deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete history' });
    }
  }
};