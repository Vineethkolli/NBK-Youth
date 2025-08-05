import MaintenanceMode from '../models/MaintenanceMode.js';
import { logActivity } from '../middleware/activityLogger.js';

export const maintenanceController = {
  getStatus: async (req, res) => {
    try {
      const status = await MaintenanceMode.findOne();
      res.json(status || { isEnabled: false });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch maintenance status' });
    }
  },

  toggleMode: async (req, res) => {
    try {
      const { isEnabled, expectedBackAt } = req.body;
      const registerId = req.user.registerId;

      const currentStatus = await MaintenanceMode.findOne();
      const originalData = currentStatus ? currentStatus.toObject() : null;

      await MaintenanceMode.findOneAndUpdate(
        {},
        { 
          isEnabled,
          enabledBy: registerId,
          enabledAt: new Date(),
          expectedBackAt: expectedBackAt ? new Date(expectedBackAt) : null
        },
        { upsert: true, new: true }
      );

      // Log maintenance mode toggle
      await logActivity(
        req,
        'UPDATE',
        'MaintenanceMode',
        'maintenance-mode',
        { before: originalData, after: { isEnabled, expectedBackAt } },
        `Maintenance mode ${isEnabled ? 'enabled' : 'disabled'} by ${req.user.name}`
      );

      res.json({ message: `Maintenance mode ${isEnabled ? 'enabled' : 'disabled'}` });
    } catch (error) {
      res.status(500).json({ message: 'Failed to toggle maintenance mode' });
    }
  }
};
