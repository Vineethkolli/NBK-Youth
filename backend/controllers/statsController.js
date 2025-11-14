import PreviousYear from '../models/PreviousYear.js';
import { logActivity } from '../middleware/activityLogger.js';
import { computeBudgetStats } from '../utils/statsAggregator.js';

export const statsController = {
  getStats: async (req, res) => {
    try {
      const stats = await computeBudgetStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch stats' });
    }
  },
  

  updatePreviousYear: async (req, res) => {
    try {
      const { amount } = req.body;

      const currentData = await PreviousYear.findOne().lean();
      const originalAmount = currentData ? currentData.amount : 0;

      await PreviousYear.findOneAndUpdate(
        {},
        {
          amount: Math.round(amount),
          registerId: req.user?.registerId
        },
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
