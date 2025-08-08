import LockSettings from '../models/LockSettings.js';
import { logActivity } from '../middleware/activityLogger.js';

export const lockSettingsController = {
  // Get lock status
  getLockStatus: async (req, res) => {
    try {
      const lockSettings = await LockSettings.findOne();
      res.json(lockSettings || { isLocked: false });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch lock status' });
    }
  },

  // Toggle lock status
  toggleLockStatus: async (req, res) => {
    try {
      const { isLocked } = req.body;
      
      const currentSettings = await LockSettings.findOne();
      const originalData = currentSettings ? currentSettings.toObject() : null;

      const lockSettings = await LockSettings.findOneAndUpdate(
        {},
        { 
          isLocked,
          lockedBy: req.user.registerId
        },
        { upsert: true, new: true }
      );

      // Log lock status change
      await logActivity(
        req,
        'UPDATE',
        'LockSettings',
        'lock-settings',
        { before: originalData, after: lockSettings.toObject() },
        `Editing ${isLocked ? 'locked' : 'unlocked'} by ${req.user.name}`
      );

      res.json({ message: `Editing ${isLocked ? 'locked' : 'unlocked'}`, lockSettings });
    } catch (error) {
      res.status(500).json({ message: 'Failed to toggle lock status' });
    }
  }
};