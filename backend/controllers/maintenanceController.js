import MaintenanceMode from '../models/MaintenanceMode.js';
import { logActivity } from '../middleware/activityLogger.js';

export const maintenanceController = {
  getStatus: async (req, res) => {
    try {
      const status = await MaintenanceMode.findOne().lean();
      res.json(status || { isEnabled: false, maintenanceAccess: 'everyone' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch maintenance status' });
    }
  },

  
  toggleMode: async (req, res) => {
    try {
      const {
        isEnabled,
        expectedBackAt,
        maintenanceAccess = 'everyone'
      } = req.body;
      const validAccessLevels = [
        'everyone',
        'exceptFinanciers',
        'exceptAdminsFinanciers'
      ];

      if (
        typeof isEnabled !== 'boolean' ||
        !validAccessLevels.includes(maintenanceAccess)
      ) {
        return res.status(400).json({ message: 'Invalid maintenance settings' });
      }

      const registerId = req.user.registerId;

      const currentStatus = await MaintenanceMode.findOne();
      const originalData = currentStatus ? currentStatus.toObject() : null;

      await MaintenanceMode.findOneAndUpdate(
        {},
        { 
          isEnabled,
          maintenanceAccess,
          enabledBy: registerId,
          enabledAt: new Date(),
          expectedBackAt: expectedBackAt ? new Date(expectedBackAt) : null
        },
        { upsert: true, returnDocument: 'after'}
      );

      await logActivity(
        req,
        'UPDATE',
        'MaintenanceMode',
        'maintenance-mode',
        {
          before: originalData,
          after: { isEnabled, expectedBackAt, maintenanceAccess }
        },
        `Maintenance mode ${isEnabled ? 'enabled' : 'disabled'} by ${req.user.name}`
      );

      res.json({ message: `Maintenance mode ${isEnabled ? 'enabled' : 'disabled'}` });
    } catch (error) {
      res.status(500).json({ message: 'Failed to toggle maintenance mode' });
    }
  }
};
