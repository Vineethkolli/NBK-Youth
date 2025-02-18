import MaintenanceMode from '../models/MaintenanceMode.js';

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

      res.json({ message: `Maintenance mode ${isEnabled ? 'enabled' : 'disabled'}` });
    } catch (error) {
      res.status(500).json({ message: 'Failed to toggle maintenance mode' });
    }
  }
};
